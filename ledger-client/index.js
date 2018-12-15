const port = 3000;

const LedgerRepository = require('./LedgerRepository');
const ledgerRepository = new LedgerRepository('minikube', 1113, 'admin', 'changeit');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));
app.use(express.json());

app.post('/ledgers', async (req, res) => {
  let description = req.body.description;
  if (!description) {
    res.send(400, 'Description is required.');
    return;
  }

  let ledger = await ledgerRepository.get();
  ledger.create(description);
  await ledgerRepository.save(ledger);
  
  res
    .links({ increment: `/ledgers/${ledger.id}/increment`, decrement: `/ledgers/${ledger.id}/decrement` })
    .header('x-id', ledger.id)
    .sendStatus(201);
});

app.post('/ledgers/:ledgerId/increment', async (req, res) => {
  let value = req.body.value;
  if (!value) {
    res.send(400, 'Value is required');
  }

  let ledger = await ledgerRepository.get(req.params.ledgerId);
  ledger.increment(value);
  await ledgerRepository.save(ledger);
    
  res.sendStatus(200);
});

app.post('/ledgers/:ledgerId/decrement', async (req, res) => {
  let value = req.body.value;
  if (!value) {
    res.send(400, 'Value is required');
  }

  let ledger = await ledgerRepository.get(req.params.ledgerId);
  ledger.decrement(value);
  await ledgerRepository.save(ledger);

  res.sendStatus(200);
});

io.on('connection', socket => {
  console.log(`User connected ${socket.client.id}`);
  socket.on('set-ledger', ledger => {
    console.log(`User ${socket.client.id} set ledger to ${ledger}`);
    socket.leaveAll();
    socket.join(ledger);
  });
});

http.listen(port, () => console.log(`Listening on ${port}...`));
