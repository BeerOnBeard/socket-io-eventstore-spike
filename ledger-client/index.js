const port = 3000;

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', socket => {
  console.log(`User connected ${socket.client.id}`);
  socket.on('set-ledger', ledger =>{
    console.log(`User ${socket.client.id} set ledger to ${ledger}`);
    socket.leaveAll();
    socket.join(ledger);
  });
});

function emitToLedgerOne() {
  setTimeout(function() {
    io.to(1).emit('event');
    emitToLedgerOne();
  }, 1000);
}

function emitToLedgerTwo() {
  setTimeout(function() {
    io.to(2).emit('event');
    emitToLedgerTwo();
  }, 1000);
}

emitToLedgerOne();
emitToLedgerTwo();
http.listen(port, () => console.log(`Listening on ${port}...`));
