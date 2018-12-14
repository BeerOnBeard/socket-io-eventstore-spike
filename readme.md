# Socket.io and EventStore Dev Spike

The purpose of this repository is to investigate how Socket.io and EventStore integrate with each other.

## What to Prove

- EventStore can be written to using a JavaScript driver
- An aggregate stream can be listened to and exposed via Socket.io
- Multiple "rooms" can be set up in Socket.io and events from an instance of the aggregate, identified by a GUID, can be correctly routed to the specific subset of listeners

## High-Level Design

Spin up EventStore as a Docker container. Create a NodeJS application, hosted in a Docker container, that serves a single HTML page, exposes POST endpoints to manipulate an aggregate, and exposes a web socket via Socket.io where clients can receive events from the instance of the aggregate they are working on.

## Domain

A simple ledger where users can increment and decrement a total using two commands: `IncrementTotal` and `DecrementTotal`. Each aggregate will be identified by a GUID. The client can create a new ledger with the command `CreateLedger`.
