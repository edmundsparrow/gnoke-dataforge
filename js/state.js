/* js/state.js — single source of truth */

const State = (() => {
  let _mode      = 'json';
  let _filename  = 'New';
  let _colSchema = [];
  let _sqlModule = null;
  let _isDemoData = false;

  return {
    get mode()       { return _mode; },
    set mode(v)      { _mode = v; },

    get filename()   { return _filename; },
    set filename(v)  {
      _filename = v;
      const el = document.getElementById('filename-display');
      if (el) el.textContent = v || 'New';
    },

    get colSchema()  { return _colSchema; },
    set colSchema(v) { _colSchema = v; },

    get sqlModule()  { return _sqlModule; },
    set sqlModule(v) { _sqlModule = v; },

    get isDemoData() { return _isDemoData; },
    set isDemoData(v){ _isDemoData = v; },

    getSchema(idx) {
      if (!_colSchema[idx]) {
        _colSchema[idx] = { type: 'TEXT', pk: false, notnull: false, unique: false };
      }
      return _colSchema[idx];
    },

    setSchemaField(idx, field, value) {
      if (!_colSchema[idx]) this.getSchema(idx);
      _colSchema[idx][field] = value;
    },

    spliceSchema(idx) { _colSchema.splice(idx, 1); },
    pushSchema(def)   { _colSchema.push(def || { type: 'TEXT', pk: false, notnull: false, unique: false }); },
    resetSchema()     { _colSchema = []; },

    getTableName() {
      return (_filename && _filename !== 'New') ? _filename : 'table1';
    }
  };
})();
