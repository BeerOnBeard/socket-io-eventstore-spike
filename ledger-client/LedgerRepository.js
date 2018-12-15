const EventStore = require('event-store-client');
const Ledger = require('./Ledger');

class LedgerRepository {
  _buildStreamName(ledgerId) {
    return `Ledger-${ledgerId}`;
  }

  constructor(connection, username, password) {
    this._connection = connection
    this._credentials = { username, password };
  }

  // returns a promise to get a Ledger by ID
  // if no ID is defined, a new Ledger will be provided
  get(id) {
    if (id === undefined) {
      return new Promise(resolve => resolve(new Ledger()));
    }

    return new Promise(resolve => {
      let ledger = new Ledger();
      this._connection.readStreamEventsForward(
        this._buildStreamName(id),
        0,
        1000,
        false,
        false,
        event => ledger.apply(event),
        this._credentials,
        () => resolve(ledger)
      );
    });
  }

  // returns a promise to save a Ledger
  // promise resolves with the saved Ledger
  save(ledger) {
    if (ledger.uncommittedEvents.length == 0) {
      return new Promise(resolve => resolve(ledger));
    }

    return new Promise(resolve => {
      let newLedger = ledger.copy();
      let uncommittedEvents = newLedger.uncommittedEvents.splice(0);
      this._connection.writeEvents(
        this._buildStreamName(newLedger.id),
        EventStore.ExpectedVersion.Any,
        false,
        uncommittedEvents,
        this._credentials,
        message => {
          newLedger.lastEventNumber = message.lastEventNumber; 
          resolve(newLedger);
        }
      );
    });
  }
}

module.exports = LedgerRepository;
