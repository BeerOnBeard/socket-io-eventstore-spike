const EventFactory = require('./EventFactory');

function Ledger() {
  var self = this;

  // domain properties
  self.id = undefined;
  self.description = undefined;
  self.total = 0;

  // aggregate properties
  self.lastEventNumber = 0;
  self.uncommittedEvents = [];

  // internal method to apply event to model and add to uncommitted events
  const publish = event => {
    self.apply(event);
    self.uncommittedEvents.push(event);
  };
  
  // apply an event to this model
  self.apply = event => {
    self.lastEventNumber = event.eventNumber;
    switch(event.eventType) {
      case EventFactory.Types.created:
        created(event);
        break;
      case EventFactory.Types.incremented:
        incremented(event);
        break;
      case EventFactory.Types.decremented:
        decremented(event);
        break;
    }
  };

  // command methods
  self.create = description => {
    if (self.id !== undefined) {
      throw new Error('Cannot create a ledger that already exists.');
    }

    publish(EventFactory.ledgerCreated(description));
  };

  self.increment = value => {
    if (self.id === undefined) {
      throw new Error('Cannot increment a ledger that does not exist.');
    }

    publish(EventFactory.ledgerIncremented(self.id, value));
  };

  self.decrement = value => {
    if (self.id === undefined) {
      throw new Error('Cannot decrement a ledger that does not exist.');
    }

    publish(EventFactory.ledgerDecremented(self.id, value));
  };

  // internal methods to apply events to model
  const created = event => {
    self.id = event.data.id;
    self.description = event.data.description;
  };

  const incremented = event => {
    self.total += event.data.value;
  };

  const decremented = event => {
    self.total -= event.data.value;
  };
};

Ledger.prototype.copy = function() {
  let newLedger = new Ledger();
  newLedger.id = this.id;
  newLedger.description = this.description;
  newLedger.total = this.total;
  newLedger.lastEventNumber = this.lastEventNumber;
  newLedger.uncommittedEvents = this.uncommittedEvents;
  return newLedger;
};

module.exports = Ledger;
