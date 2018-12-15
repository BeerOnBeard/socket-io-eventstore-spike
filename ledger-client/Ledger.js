const EventFactory = require('./EventFactory');

module.exports = function() {
  var self = this;

  // domain properties
  self.id = undefined;
  self.total = 0;

  // aggregate properties
  self.uncommittedEvents = [];

  // internal method to apply event to model and add to uncommitted events
  const publish = event => {
    self.apply(event);
    self.uncommittedEvents.push(event);
  };
  
  // apply an event to this model
  self.apply = event => {
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
  };

  const incremented = event => {
    self.value += event.data.value;
  };

  const decremented = event => {
    self.value -= event.data.value;
  };
};
