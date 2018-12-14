(function(){
  function main() {
    var socket = io();
    socket.on('event', function(){ console.log('Event occurred'); });
  
    document.getElementById('setLedger').addEventListener('click', function(){
      var ledgerId = document.getElementById('ledger').value;
      socket.emit('set-ledger', ledgerId);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){ main(); });
}());