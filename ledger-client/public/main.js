(function(){
  function parseLinkHeader(header) {
    if (header.length === 0) {
        throw new Error("input must not be of zero length");
    }

    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    for(var i=0; i<parts.length; i++) {
        var section = parts[i].split(';');
        if (section.length !== 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    }
    return links;
  }

  function init() {
    var socket = io();
    var links = undefined;

    socket.on('event', function(msg){ 
      var li = document.createElement('li');
      li.innerText = msg;
      document.getElementById('messages').append(li);
    });
  
    document.getElementById('setLedger').addEventListener('click', function(){
      var ledgerId = document.getElementById('ledger').value;
      socket.emit('set-ledger', ledgerId);
    });

    document.getElementById('newLedger').addEventListener('click', function(){
      var description = document.getElementById('description').value;
      fetch('/ledgers', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ description: description }) })
        .then(response => {
          links = parseLinkHeader(response.headers.get('Link'));
        });
    });

    document.getElementById('increment').addEventListener('click', function(){
      if (!links) { return; }
      fetch(links.increment, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ value: 1 })});
    });

    document.getElementById('decrement').addEventListener('click', function(){
      if (!links) { return; }
      fetch(links.decrement, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8'}, body: JSON.stringify({ value: 2 })});
    });
  }

  document.addEventListener('DOMContentLoaded', function(){ init(); });
}());