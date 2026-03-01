/*
 * Gnoke DataForge — db-core.js
 * Persistence engine: sql.js (SQLite in WASM) + IndexedDB.
 * Each named file is a separate SQLite DB stored as a binary blob.
 */

const DBCore = (() => {

  const IDB_NAME    = 'gnoke_dataforge_store';
  const IDB_VERSION = 1;
  const IDB_STORE   = 'tables';

  let _SQL = null;   // sql.js module (set externally via DBCore.setSQLModule)

  // ── IndexedDB helpers ─────────────────────────────────────────────

  function _openIDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  async function _idbGet(key) {
    const idb = await _openIDB();
    return new Promise((resolve, reject) => {
      const req = idb.transaction(IDB_STORE, 'readonly')
                     .objectStore(IDB_STORE).get(key);
      req.onsuccess = e => resolve(e.target.result || null);
      req.onerror   = e => reject(e.target.error);
    });
  }

  async function _idbSet(key, value) {
    const idb = await _openIDB();
    return new Promise((resolve, reject) => {
      const req = idb.transaction(IDB_STORE, 'readwrite')
                     .objectStore(IDB_STORE).put(value, key);
      req.onsuccess = () => resolve();
      req.onerror   = e => reject(e.target.error);
    });
  }

  async function _idbDelete(key) {
    const idb = await _openIDB();
    return new Promise((resolve, reject) => {
      const req = idb.transaction(IDB_STORE, 'readwrite')
                     .objectStore(IDB_STORE).delete(key);
      req.onsuccess = () => resolve();
      req.onerror   = e => reject(e.target.error);
    });
  }

  async function _idbKeys() {
    const idb = await _openIDB();
    return new Promise((resolve, reject) => {
      const req = idb.transaction(IDB_STORE, 'readonly')
                     .objectStore(IDB_STORE).getAllKeys();
      req.onsuccess = e => resolve(e.target.result || []);
      req.onerror   = e => reject(e.target.error);
    });
  }

  // ── Public API ────────────────────────────────────────────────────

  function setSQLModule(mod) {
    _SQL = mod;
  }

  // Save a table (headers + rows + schema) as a SQLite DB blob in IDB
  async function saveTable(name, headers, rows, schema) {
    if (!_SQL) throw new Error('sql.js not ready');

    const db = new _SQL.Database();

    // Build column definitions
    const colDefs = headers.map((h, i) => {
      const s = schema?.[i] || { type: 'TEXT', pk: false, notnull: false, unique: false };
      let def = `"${_esc(h)}" ${s.type || 'TEXT'}`;
      if (s.pk)              def += ' PRIMARY KEY';
      if (s.notnull && !s.pk) def += ' NOT NULL';
      if (s.unique  && !s.pk) def += ' UNIQUE';
      return def;
    }).join(', ');

    db.run(`CREATE TABLE "${_esc(name)}" (${colDefs})`);

    const placeholders = headers.map(() => '?').join(', ');
    rows.forEach(row => {
      db.run(`INSERT INTO "${_esc(name)}" VALUES (${placeholders})`, row);
    });

    const binary = db.export();
    db.close();

    await _idbSet(name, binary);
  }

  // Load a table by name → { headers, rows, schema }
  async function loadTable(name) {
    if (!_SQL) throw new Error('sql.js not ready');

    const binary = await _idbGet(name);
    if (!binary) throw new Error('File not found: ' + name);

    const db = new _SQL.Database(new Uint8Array(binary));

    // Find the table (first non-system table)
    const tableRes = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    if (!tableRes.length || !tableRes[0].values.length) {
      db.close();
      throw new Error('No tables found in: ' + name);
    }

    const tableName = tableRes[0].values[0][0];
    const dataRes   = db.exec(`SELECT * FROM "${tableName}"`);

    const headers = dataRes.length ? dataRes[0].columns : [];
    const rows    = dataRes.length
      ? dataRes[0].values.map(r => r.map(v => (v === null ? '' : String(v))))
      : [];

    // Reconstruct schema from PRAGMA
    const pragmaRes = db.exec(`PRAGMA table_info("${tableName}")`);
    const schema = pragmaRes.length
      ? pragmaRes[0].values.map(r => ({
          type:    r[2] || 'TEXT',
          pk:      r[5] === 1,
          notnull: r[3] === 1,
          unique:  false
        }))
      : headers.map(() => ({ type: 'TEXT', pk: false, notnull: false, unique: false }));

    db.close();
    return { headers, rows, schema };
  }

  // Delete a saved table
  async function deleteTable(name) {
    await _idbDelete(name);
  }

  // List all saved table names
  async function listTables() {
    return _idbKeys();
  }

  // ── Helper ────────────────────────────────────────────────────────
  function _esc(s) { return String(s).replace(/"/g, '""'); }

  return { setSQLModule, saveTable, loadTable, deleteTable, listTables };

})();
