const generateGuid = require('uuid/v4');
const EventStore = require('event-store-client');

const Types = {
  created: 'CreateLedger',
  incremented: 'IncrementLedger',
  decremented: 'DecrementLedger'
};

const ledgerCreated = description => {
  return {
    eventId: EventStore.Connection.createGuid(),
    eventType: Types.created,
    data: {
      id: generateGuid(),
      description: description
    }
  };
};

const ledgerIncremented = (ledgerId, value) => {
  return {
    eventId: EventStore.Connection.createGuid(),
    eventType: Types.incremented,
    data: {
      id: ledgerId,
      value: value
    }
  };
};

const ledgerDecremented = (ledgerId, value) => {
  return {
    eventId: EventStore.Connection.createGuid(),
    eventType: Types.decremented,
    data: {
      id: ledgerId,
      value: value
    }
  };
};

module.exports = { ledgerCreated, ledgerIncremented, ledgerDecremented, Types };
