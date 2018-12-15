const port = 3000;

const eventstoreConfig = {
  host: 'minikube',
  port: 1113,
  credentials: {
    username: 'admin',
    password: 'changeit'
  }
};

const LedgerRepository = require('./LedgerRepository');
const ledgerRepository = new LedgerRepository(
  eventstoreConfig.host,
  eventstoreConfig.port,
  eventstoreConfig.credentials.username,
  eventstoreConfig.credentials.password);

const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));
app.use(express.json());

const addLedgerHeaders = (res, ledgerId) => {
  return res
    .links({ increment: `/ledgers/${ledgerId}/increment`, decrement: `/ledgers/${ledgerId}/decrement` })
    .header('x-id', ledgerId);
};

app.post('/ledgers', async (req, res) => {
  let description = req.body.description;
  if (!description) {
    res.send(400, 'Description is required.');
    return;
  }

  let ledger = await ledgerRepository.get();
  ledger.create(description);
  await ledgerRepository.save(ledger);
  
  addLedgerHeaders(res, ledger.id).status(201).json(ledger);
});

app.get('/ledgers/:ledgerId', async (req, res) => {
  let ledger = await ledgerRepository.get(req.params.ledgerId);
  if (ledger.id === undefined) {
    res.sendStatus(404);
    return;
  }

  addLedgerHeaders(res, ledger.id).status(200).json(ledger);
})

app.post('/ledgers/:ledgerId/increment', async (req, res) => {
  let value = req.body.value;
  if (!value) {
    res.send(400, 'Value is required');
  }

  let ledger = await ledgerRepository.get(req.params.ledgerId);
  ledger.increment(value);
  await ledgerRepository.save(ledger);
    
  addLedgerHeaders(res, ledger.id).sendStatus(200);
});

app.post('/ledgers/:ledgerId/decrement', async (req, res) => {
  let value = req.body.value;
  if (!value) {
    res.send(400, 'Value is required');
  }

  let ledger = await ledgerRepository.get(req.params.ledgerId);
  ledger.decrement(value);
  await ledgerRepository.save(ledger);

  addLedgerHeaders(res, ledger.id).sendStatus(200);
});

io.on('connection', socket => {
  console.log(`User connected ${socket.client.id}`);
  socket.on('set-ledger', ledger => {
    console.log(`User ${socket.client.id} set ledger to ${ledger}`);
    socket.leaveAll();
    socket.join(ledger);
  });
});

const EventStore = require('event-store-client');
let esConnection = new EventStore.Connection({ host: eventstoreConfig.host, port: eventstoreConfig.port });

let buildEvent = esEvent => {
  return {
    eventType: esEvent.eventType,
    data: esEvent.data
  };
}
esConnection.subscribeToStream(
  "$ce-Ledger",
  true,
  storedEvent => {
    let ledgerEvent = buildEvent(storedEvent);
    console.log(ledgerEvent);
    io.to(ledgerEvent.data.id).emit('event', ledgerEvent);
  },
  confirmation => console.log(confirmation),
  dropped => console.log(dropped),
  eventstoreConfig.credentials,
  notHandled => console.log(notHandled)
);

server.listen(port, () => console.log(`Listening on ${port}...`));
