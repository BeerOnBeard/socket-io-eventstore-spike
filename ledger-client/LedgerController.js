const addLedgerHeaders = (res, ledgerId) => {
  return res
    .links({ increment: `/ledgers/${ledgerId}/increment`, decrement: `/ledgers/${ledgerId}/decrement` })
    .header('x-id', ledgerId);
};

class LedgerController {
  constructor(ledgerRepository) {
    this._ledgerRepository = ledgerRepository;
  }

  async create(req, res) {
    let description = req.body.description;
    if (!description) {
      res.send(400, 'Description is required.');
      return;
    }
  
    let ledger = await this._ledgerRepository.get();
    ledger.create(description);
    ledger = await this._ledgerRepository.save(ledger);
    
    addLedgerHeaders(res, ledger.id).status(201).json(ledger);
  }

  async get(req, res) {
    let ledger = await this._ledgerRepository.get(req.params.ledgerId);
    if (ledger.id === undefined) {
      res.sendStatus(404);
      return;
    }
  
    addLedgerHeaders(res, ledger.id).status(200).json(ledger);
  }

  async increment(req, res) {
    let value = req.body.value;
    if (!value) {
      res.send(400, 'Value is required');
    }
  
    let ledger = await this._ledgerRepository.get(req.params.ledgerId);
    ledger.increment(value);
    ledger = await this._ledgerRepository.save(ledger);
      
    addLedgerHeaders(res, ledger.id).sendStatus(200);
  }

  async decrement(req, res) {
    let value = req.body.value;
    if (!value) {
      res.send(400, 'Value is required');
    }
  
    let ledger = await this._ledgerRepository.get(req.params.ledgerId);
    ledger.decrement(value);
    ledger = await this._ledgerRepository.save(ledger);
  
    addLedgerHeaders(res, ledger.id).sendStatus(200);
  }
}

module.exports = LedgerController;
