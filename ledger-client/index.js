const port = 3000;
const eventStoreConfig = {
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

const EventStore = require('event-store-client');
const eventStoreConnection = new EventStore.Connection({ host: eventStoreConfig.host, port: eventStoreConfig.port });

const LedgerRepository = require('./LedgerRepository');
const ledgerRepository = new LedgerRepository(
  eventStoreConnection,
  eventStoreConfig.credentials.username,
  eventStoreConfig.credentials.password);

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

eventStoreConnection.subscribeToStream(
  "$ce-Ledger",
  true,
  storedEvent => {
    let ledgerEvent = {
      eventType: storedEvent.eventType,
      eventNumber: storedEvent.eventNumber,
      data: storedEvent.data
    };

    io.to(ledgerEvent.data.id).emit('event', ledgerEvent);
  },
  confirmation => console.log(confirmation),
  dropped => console.log(dropped),
  eventStoreConfig.credentials,
  notHandled => console.log(notHandled)
);

server.listen(port, () => console.log(`Listening on ${port}...`));
