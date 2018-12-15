const EventFactory = require('./EventFactory');

class Ledger {
  // internal method to apply event to model and add to uncommitted events
  _publish(event) {
    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  // internal methods to apply events
  _created(event) {
    this.id = event.data.id;
    this.description = event.data.description;
  }

  _incremented(event) {
    this.total += event.data.value;
  }

  _decremented(event) {
    this.total -= event.data.value;
  }

  constructor() {
    // domain properties
    this.id = undefined;
    this.description = undefined;
    this.total = 0;

    // aggregate properties
    this.lastEventNumber = 0;
    this.uncommittedEvents = [];
  }

  // apply an event to this model
  apply(event) {
    this.lastEventNumber = event.eventNumber;
    switch(event.eventType) {
      case EventFactory.Types.created:
        this._created(event);
        break;
      case EventFactory.Types.incremented:
        this._incremented(event);
        break;
      case EventFactory.Types.decremented:
        this._decremented(event);
        break;
    }
  }

  // public methods to apply commands
  create(description) {
    if (this.id !== undefined) {
      throw new Error('Cannot create a ledger that already exists.');
    }

    this._publish(EventFactory.ledgerCreated(description));
  }

  increment(value) {
    if (this.id === undefined) {
      throw new Error('Cannot increment a ledger that does not exist.');
    }

    this._publish(EventFactory.ledgerIncremented(this.id, value));
  }

  decrement(value) {
    if (this.id === undefined) {
      throw new Error('Cannot decrement a ledger that does not exist.');
    }

    this._publish(EventFactory.ledgerDecremented(this.id, value));
  }

  // copy this ledger instance
  copy() {
    let newLedger = new Ledger();
    newLedger.id = this.id;
    newLedger.description = this.description;
    newLedger.total = this.total;
    newLedger.lastEventNumber = this.lastEventNumber;
    newLedger.uncommittedEvents = this.uncommittedEvents;
    return newLedger;
  }
}

module.exports = Ledger;
