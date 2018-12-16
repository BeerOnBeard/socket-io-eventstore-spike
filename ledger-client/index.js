const port = 3000;
const eventStoreConfig = {
  host: process.env.EVENTSTORE_HOST || 'localhost',
  port: process.env.EVENTSTORE_PORT || 1113,
  credentials: {
    username: process.env.EVENTSTORE_USERNAME || 'admin',
    password: process.env.EVENTSTORE_PASSWORD || 'changeit'
  }
};

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const EventStore = require('event-store-client');
const LedgerRepository = require('./LedgerRepository');
const LedgerController = require('./LedgerController');

const eventStoreConnection = new EventStore.Connection({
  host: eventStoreConfig.host,
  port: eventStoreConfig.port,
  onClose: hadError => {
    console.log('Connection closed');
    if (hadError) {
      console.log('Error caused closure');
      process.exit(1);
    }
  }
});

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
  confirmation => {
    console.log('Subscription confirmation');
    console.log(confirmation);
  },
  dropped => {
    console.log('Subsription dropped');
    console.log(dropped);
    process.exit(1);
  },
  eventStoreConfig.credentials,
  notHandled => {
    console.log('Unhandled error in subscription');
    console.log(notHandled);
    process.exit(1);
  }
);

server.listen(port, () => console.log(`Listening on ${port}...`));
