const generateGuid = require('uuid/v4');
const EventStore = require('event-store-client');

const createLedger = description => {
  return {
    eventId: EventStore.Connection.createGuid(),
    eventType: 'CreateLedger',
    data: {
      id: generateGuid(),
      description: description
    }
  };
};

const incrementLedger = (ledgerId, value) => {
  return {
    eventId: EventStore.Connection.createGuid(),
    eventType: 'IncrementLedger',
    data: {
      id: ledgerId,
      value: value
    }
  };
};

const decrementLedger = (ledgerId, value) => {
  return {
    eventId: EventStore.Connection.createGuid(),
    eventType: 'DecrementLedger',
    data: {
      id: ledgerId,
      value: value
    }
  };
};

module.exports = { createLedger, incrementLedger, decrementLedger };