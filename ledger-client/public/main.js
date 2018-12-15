(function(){
  function Ledger(ledgerJson) {
    var self = this;
    self.id = ledgerJson.id;
    self.total = ledgerJson.total;

    self.apply = event => {
      switch(event.eventType) {
        case 'LedgerIncremented':
          self.total += event.data.value;
          break;
        case 'LedgerDecremented':
          self.total -= event.data.value;
          break;
      }
    };
  }


  function init() {
    var socket = io();
    var links = undefined;
    var ledger = undefined;

    socket.on('event', function(msg){
      if (msg.data.id !== ledger.id) {
        console.log('Got event for another ledger. Ignoring.');
        return;
      }

      var li = document.createElement('li');
      li.innerText = JSON.stringify(msg);
      document.getElementById('messages').append(li);

      ledger.apply(msg);
      document.getElementById('total').value = ledger.total;
    });

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
  
    function buildJsonPostRequestInfo(body) {
      return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body)
      };
    }
  
    function handleLedgerResponse(response) {
      links = parseLinkHeader(response.headers.get('Link'));
      return response.json();
    }

    function handleLedgerJson(ledgerJson) {
      socket.emit('set-ledger', ledger.id);
      ledger = new Ledger(ledgerJson);
      document.getElementById('ledger').value = ledger.id;
    }

    document.getElementById('setLedger').addEventListener('click', function(){
      var ledgerId = document.getElementById('ledger').value;
      fetch(`/ledgers/${ledgerId}`)
        .then(handleLedgerResponse)
        .then(handleLedgerJson);
    });

    document.getElementById('newLedger').addEventListener('click', function(){
      var description = document.getElementById('description').value;
      fetch('/ledgers', buildJsonPostRequestInfo({ description: description }))
        .then(handleLedgerResponse)
        .then(handleLedgerJson);
    });

    document.getElementById('increment').addEventListener('click', function(){
      if (!links) { return; }
      fetch(links.increment, buildJsonPostRequestInfo({ value: 1 }));
    });

    document.getElementById('decrement').addEventListener('click', function(){
      if (!links) { return; }
      fetch(links.decrement, buildJsonPostRequestInfo({ value: 2 }));
    });
  }

  document.addEventListener('DOMContentLoaded', function(){ init(); });
}());
