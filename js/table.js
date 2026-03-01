/* js/table.js — table build, render, schema row, add/remove ops */

const Table = (() => {
  const TYPES = ['TEXT', 'INTEGER', 'REAL', 'BLOB', 'NUMERIC'];

  const headerRow = () => document.getElementById('header-row');
  const tbody     = () => document.getElementById('tbody');
  const schemaRow = () => document.getElementById('schema-row');

  function buildHeaderTH(name = '') {
    const th    = document.createElement('th');
    const inner = document.createElement('div');
    inner.className = 'th-inner';

    const nameEl = document.createElement('span');
    nameEl.className = 'th-name';
    nameEl.contentEditable = 'true';
    nameEl.textContent = name;
    nameEl.setAttribute('spellcheck', 'false');

    const badge = document.createElement('span');
    badge.className = 'pk-badge hidden';
    badge.textContent = 'PK';

    inner.appendChild(nameEl);
    inner.appendChild(badge);
    th.appendChild(inner);
    return th;
  }

  function buildSchemaTH(colIdx) {
    const schema = State.getSchema(colIdx);
    const th   = document.createElement('th');
    const wrap = document.createElement('div');
    wrap.className = 'schema-cell';

    const sel = document.createElement('select');
    TYPES.forEach(t => {
      const o = document.createElement('option');
      o.value = t; o.textContent = t;
      if (t === schema.type) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => State.setSchemaField(colIdx, 'type', sel.value));

    const cRow = document.createElement('div');
    cRow.className = 'constraint-row';
    [['pk', 'PK'], ['notnull', 'NN'], ['unique', 'UQ']].forEach(([key, label]) => {
      const lbl = document.createElement('label');
      const cb  = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = schema[key];
      cb.addEventListener('change', () => {
        State.setSchemaField(colIdx, key, cb.checked);
        if (key === 'pk') updatePKBadges();
      });
      const sp = document.createElement('span');
      sp.textContent = label;
      lbl.appendChild(cb); lbl.appendChild(sp);
      cRow.appendChild(lbl);
    });

    wrap.appendChild(sel); wrap.appendChild(cRow);
    th.appendChild(wrap);
    return th;
  }

  function syncSchemaRow() {
    const sr = schemaRow();
    const colCount = headerRow().children.length;
    sr.innerHTML = '';
    for (let i = 0; i < colCount; i++) sr.appendChild(buildSchemaTH(i));
  }

  function updatePKBadges() {
    const ths = headerRow().children;
    for (let i = 0; i < ths.length; i++) {
      const badge = ths[i].querySelector('.pk-badge');
      if (badge) badge.classList.toggle('hidden', !State.colSchema[i]?.pk);
    }
  }

  function addColumn(name = '') {
    const colIdx = headerRow().children.length;
    State.pushSchema();
    headerRow().appendChild(buildHeaderTH(name));
    Array.from(tbody().children).forEach(row => {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      row.appendChild(td);
    });
    if (State.mode === 'sqlite') syncSchemaRow();
  }

  function addRow() {
    const colCount = headerRow().children.length;
    const tr = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      tr.appendChild(td);
    }
    tbody().appendChild(tr);
  }

  function removeRow() {
    if (tbody().lastElementChild) tbody().removeChild(tbody().lastElementChild);
  }

  function removeColumn() {
    const colCount = headerRow().children.length;
    if (colCount === 0) return;
    headerRow().removeChild(headerRow().lastElementChild);
    State.spliceSchema(colCount - 1);
    Array.from(tbody().children).forEach(row => {
      if (row.lastElementChild) row.removeChild(row.lastElementChild);
    });
    if (State.mode === 'sqlite') syncSchemaRow();
  }

  function render(headers, rows, schemaArr) {
    headerRow().innerHTML = '';
    tbody().innerHTML = '';
    State.resetSchema();

    headers.forEach((h, i) => {
      State.pushSchema(schemaArr?.[i] || null);
      headerRow().appendChild(buildHeaderTH(h));
    });

    rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.contentEditable = 'true';
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody().appendChild(tr);
    });

    if (State.mode === 'sqlite') syncSchemaRow();
    updatePKBadges();
  }

  function getHeaders() {
    return Array.from(headerRow().children).map(th => {
      const el = th.querySelector('.th-name');
      return el ? el.textContent.trim() : th.textContent.trim();
    });
  }

  function getRows() {
    return Array.from(tbody().children).map(tr =>
      Array.from(tr.children).map(td => td.textContent.trim())
    );
  }

  function setMode(mode) {
    State.mode = mode;
    document.body.classList.toggle('sqlite-mode', mode === 'sqlite');
    document.getElementById('btn-json-mode')?.classList.toggle('active', mode === 'json');
    document.getElementById('btn-sql-mode')?.classList.toggle('active', mode === 'sqlite');
    if (mode === 'sqlite') syncSchemaRow();
  }

  return {
    addColumn, addRow, removeRow, removeColumn,
    render, getHeaders, getRows,
    setMode, syncSchemaRow, updatePKBadges
  };
})();
