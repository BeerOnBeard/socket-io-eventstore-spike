const EventStore = require('event-store-client');
const Ledger = require('./Ledger');

module.exports = function(host, port, username, password) {
  var self = this;
  self.connection = new EventStore.Connection({ host, port });
  self.credentials = { username, password };

  const buildStreamName = ledgerId => {
    return `Ledger-${ledgerId}`;
  }

  // returns a promise to get a Ledger by ID
  // if no ID is defined, a new Ledger will be provided
  self.get = id => {
    if (id === undefined) {
      return new Promise(resolve => resolve(new Ledger()));
    }

    return new Promise(resolve => {
      let ledger = new Ledger();
      self.connection.readStreamEventsForward(
        buildStreamName(id),
        0,
        1000,
        false,
        false,
        event => ledger.apply(event),
        self.credentials,
        () => resolve(ledger)
      );
    })
  };

  // returns a promise to save a Ledger
  // promise resolves with the saved Ledger
  self.save = ledger => {
    if (ledger.uncommittedEvents.length == 0) {
      return new Promise(resolve => resolve(ledger));
    }

    return new Promise(resolve => {
      let newLedger = ledger.copy();
      let uncommittedEvents = newLedger.uncommittedEvents.splice(0);
      self.connection.writeEvents(
        buildStreamName(newLedger.id),
        EventStore.ExpectedVersion.Any,
        false,
        uncommittedEvents,
        self.credentials,
        message => {
          newLedger.lastEventNumber = message.lastEventNumber; 
          resolve(newLedger);
        }
      );
    });
  };
};
