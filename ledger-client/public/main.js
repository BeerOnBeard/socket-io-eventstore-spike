(function(){
  function main() {
    var socket = io();
    socket.on('event', function(msg){ 
      var li = document.createElement('li');
      li.innerText = msg;
      document.getElementById('messages').append(li);
    });
  
    document.getElementById('setLedger').addEventListener('click', function(){
      var ledgerId = document.getElementById('ledger').value;
      socket.emit('set-ledger', ledgerId);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){ main(); });
}());