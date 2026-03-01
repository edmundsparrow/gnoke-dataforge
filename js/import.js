/* js/import.js — JSON, SQLite, CSV, paste-text import */

const Import = (() => {

  let _pendingDb       = null;
  let _pendingFilename = null;

  function _showStep(id) {
    ['import-step-format', 'import-step-tables', 'import-step-paste']
      .forEach(sid => {
        document.getElementById(sid).style.display = (sid === id) ? '' : 'none';
      });
  }

  function _close() {
    UI.closeModal('import-modal');
    setTimeout(() => {
      _showStep('import-step-format');
      document.getElementById('import-paste-input').value = '';
    }, 220);
  }

  function _finalise(rawFilename) {
    if (rawFilename) {
      State.filename  = rawFilename.replace(/\.(json|sqlite|db|csv)$/i, '');
      State.isDemoData = false;
      const banner = document.getElementById('demo-banner');
      if (banner) banner.style.display = 'none';
    }
    _close();
  }

  function showModal() {
    _showStep('import-step-format');
    document.getElementById('import-paste-input').value = '';

    const csvCard = document.getElementById('import-csv-card');
    if (csvCard) {
      const missing = (typeof CSV === 'undefined');
      csvCard.classList.toggle('import-opt-disabled', missing);
      csvCard.title = missing ? 'Add csv.js to enable CSV import' : '';
    }
    UI.openModal('import-modal');
  }

  function fromJSON() {
    _close();
    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json,application/json';

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const parsed = JSON.parse(e.target.result);
          const norm   = Normalizer.normalize(parsed);
          Table.render(norm.headers, norm.rows, norm.schema);
          _finalise(file.name);
          UI.toast('Imported: ' + file.name, 'ok');
        } catch (err) {
          UI.toast('JSON parse error: ' + err.message, 'err');
        }
      };
      reader.onerror = () => UI.toast('Could not read file', 'err');
      reader.readAsText(file);
    });
    input.click();
  }

  function fromSQLite() {
    if (!State.sqlModule) {
      UI.toast('sql.js not ready — try again in a moment', 'err');
      return;
    }
    _close();
    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.sqlite,.db,application/x-sqlite3';

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const db     = new State.sqlModule.Database(new Uint8Array(e.target.result));
          const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
          const tables = result.length ? result[0].values.map(r => r[0]) : [];

          if (!tables.length) { UI.toast('No tables found in this SQLite file', 'err'); return; }
          if (tables.length === 1) {
            _renderSQLiteTable(db, tables[0], file.name);
          } else {
            _showTablePicker(db, tables, file.name);
          }
        } catch (err) {
          UI.toast('SQLite error: ' + err.message, 'err');
        }
      };
      reader.onerror = () => UI.toast('Could not read file', 'err');
      reader.readAsArrayBuffer(file);
    });
    input.click();
  }

  function _renderSQLiteTable(db, tableName, filename) {
    try {
      const res     = db.exec(`SELECT * FROM "${tableName}"`);
      const headers = res.length ? res[0].columns : [tableName];
      const rows    = res.length
        ? res[0].values.map(r => r.map(v => (v === null ? '' : String(v))))
        : [];
      Table.render(headers, rows, null);
      const base = (filename || tableName).replace(/\.(sqlite|db)$/i, '');
      State.filename  = base;
      State.isDemoData = false;
      const banner = document.getElementById('demo-banner');
      if (banner) banner.style.display = 'none';
      UI.toast('Loaded "' + tableName + '" — ' + rows.length + ' rows', 'ok');
    } catch (err) {
      UI.toast('Table read error: ' + err.message, 'err');
    }
  }

  function _showTablePicker(db, tables, filename) {
    _pendingDb = db; _pendingFilename = filename;
    const list = document.getElementById('import-table-list');
    list.innerHTML = '';
    tables.forEach(name => {
      const li  = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.addEventListener('click', () => {
        _renderSQLiteTable(_pendingDb, name, _pendingFilename);
        _pendingDb = null;
        _close();
      });
      li.appendChild(btn); list.appendChild(li);
    });
    document.getElementById('import-step-tables-hint').textContent =
      tables.length + ' tables found — choose one to load:';
    UI.openModal('import-modal');
    _showStep('import-step-tables');
  }

  function fromCSV() {
    if (typeof CSV === 'undefined') { UI.toast('csv.js not loaded', 'err'); return; }
    _close();
    CSV.importFromFile();
  }

  function showPaste() {
    _showStep('import-step-paste');
    setTimeout(() => document.getElementById('import-paste-input').focus(), 60);
  }

  function commitPaste() {
    const raw = document.getElementById('import-paste-input').value.trim();
    if (!raw) { UI.toast('Nothing pasted yet', 'err'); return; }

    try {
      const parsed = JSON.parse(raw);
      const norm   = Normalizer.normalize(parsed);
      Table.render(norm.headers, norm.rows, norm.schema);
      _close();
      UI.toast('Imported JSON from paste', 'ok');
      return;
    } catch (_) { /* try CSV */ }

    if (typeof CSV !== 'undefined') {
      const result = CSV.importFromText(raw);
      if (result) { _close(); UI.toast('Imported CSV from paste', 'ok'); }
    } else {
      UI.toast('Not valid JSON and csv.js is not loaded', 'err');
    }
  }

  function _backToFormat() { _showStep('import-step-format'); }

  return { showModal, fromJSON, fromSQLite, fromCSV, showPaste, commitPaste, _backToFormat };
})();
