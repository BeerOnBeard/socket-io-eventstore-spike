const port = 3000;

const eventstoreConfig = {
  stream: 'Ledger',
  host: 'minikube',
  port: 1113,
  credentials: {
    username: 'admin',
    password: 'changeit'
  }
};

const getStreamName = ledgerId => {
  return `${eventstoreConfig.stream}-${ledgerId}`;
};

const EventFactory = require('./EventFactory');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const EventStore = require('event-store-client');
const esConnection = new EventStore.Connection({ host: eventstoreConfig.host, port: eventstoreConfig.port });

app.use(express.static('public'));
app.use(express.json());

app.post('/ledgers', (req, res) => {
  let description = req.body.description;
  if (!description) {
    res.send(400, 'Description is required.');
    return;
  }

  let event = EventFactory.createLedger(description);
  let id = event.data.id; // EventStore client mutates the event object (lame). Get ID before it's mutated.
  esConnection.writeEvents(
    getStreamName(event.data.id),
    EventStore.ExpectedVersion.Any,
    false,
    [event],
    eventstoreConfig.credentials,
    ()=>{});
  
  res
    .links({ increment: `/ledgers/${id}/increment`, decrement: `/ledgers/${id}/decrement` })
    .header('x-id', id)
    .sendStatus(201);
});

app.post('/ledgers/:ledgerId/increment', (req, res) => {
  let value = req.body.value;
  if (!value) {
    res.send(400, 'Value is required');
  }

  let event = EventFactory.incrementLedger(req.params.ledgerId, value);
  esConnection.writeEvents(
    getStreamName(event.data.id),
    EventStore.ExpectedVersion.Any,
    false,
    [event],
    eventstoreConfig.credentials,
    ()=>{});
    
  res.sendStatus(200);
});

app.post('/ledgers/:ledgerId/decrement', (req, res) => {
  let value = req.body.value;
  if (!value) {
    res.send(400, 'Value is required');
  }

  let event = EventFactory.decrementLedger(req.params.ledgerId, value);
  esConnection.writeEvents(
    getStreamName(event.data.id),
    EventStore.ExpectedVersion.Any,
    false,
    [event],
    eventstoreConfig.credentials,
    ()=>{});
  
  res.sendStatus(200);
});

io.on('connection', socket => {
  console.log(`User connected ${socket.client.id}`);
  socket.on('set-ledger', ledger => {
    console.log(`User ${socket.client.id} set ledger to ${ledger}`);
    socket.leaveAll();
    socket.join(ledger);
  });
});

http.listen(port, () => console.log(`Listening on ${port}...`));
