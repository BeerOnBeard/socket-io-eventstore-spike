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
const io = require('socket.io')(server);
const EventStore = require('event-store-client');
const LedgerRepository = require('./LedgerRepository');
const LedgerController = require('./LedgerController');

const eventStoreConnection = new EventStore.Connection({ host: eventStoreConfig.host, port: eventStoreConfig.port });
const ledgerRepository = new LedgerRepository(eventStoreConnection, eventStoreConfig.credentials.username, eventStoreConfig.credentials.password);
const ledgerController = new LedgerController(ledgerRepository);

app.use(express.static('public'));
app.use(express.json());
app.post('/ledgers', (...arguments) => ledgerController.create(...arguments))
  .get('/ledgers/:ledgerId', (...arguments) => ledgerController.get(...arguments))
  .post('/ledgers/:ledgerId/increment', (...arguments) => ledgerController.increment(...arguments))
  .post('/ledgers/:ledgerId/decrement', (...arguments) => ledgerController.decrement(...arguments));

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
