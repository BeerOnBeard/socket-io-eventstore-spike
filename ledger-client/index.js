const port = 3000;
const eventstoreConfig = {
  host: 'minikube',
  port: 1113,
  credentials: {
    username: 'admin',
    password: 'changeit'
  }
};

const express = require('express');
const app = express();
const server = require('http').Server(app);

app.use(express.static('public'));
app.use(express.json());

const LedgerRepository = require('./LedgerRepository');
const ledgerRepository = new LedgerRepository(
  eventstoreConfig.host,
  eventstoreConfig.port,
  eventstoreConfig.credentials.username,
  eventstoreConfig.credentials.password);

const LedgerController = require('./LedgerController');
const ledgerController = new LedgerController(ledgerRepository);
app.post('/ledgers', (...arguments) => ledgerController.create(...arguments))
  .get('/ledgers/:ledgerId', (...arguments) => ledgerController.get(...arguments))
  .post('/ledgers/:ledgerId/increment', (...arguments) => ledgerController.increment(...arguments))
  .post('/ledgers/:ledgerId/decrement', (...arguments) => ledgerController.decrement(...arguments));

const io = require('socket.io')(server);
io.on('connection', socket => {
  socket.on('set-ledger', ledger => {
    socket.leaveAll();
    socket.join(ledger);
  });
});

const EventStore = require('event-store-client');
const esConnection = new EventStore.Connection({ host: eventstoreConfig.host, port: eventstoreConfig.port });

const buildEvent = esEvent => {
  return {
    eventType: esEvent.eventType,
    eventNumber: esEvent.eventNumber,
    data: esEvent.data
  };
};

esConnection.subscribeToStream(
  "$ce-Ledger",
  true,
  storedEvent => {
    let ledgerEvent = buildEvent(storedEvent);
    io.to(ledgerEvent.data.id).emit('event', ledgerEvent);
  },
  confirmation => console.log(confirmation),
  dropped => console.log(dropped),
  eventstoreConfig.credentials,
  notHandled => console.log(notHandled)
);

server.listen(port, () => console.log(`Listening on ${port}...`));
