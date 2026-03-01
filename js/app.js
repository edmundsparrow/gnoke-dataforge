/* js/app.js — bootstrap, demo data, page routing, global handlers */

// ── Demo data (4 cols, 3 rows — vibe dev scenario) ─────────────────
const DEMO = {
  headers: ['id', 'name', 'type', 'description'],
  rows: [
    ['1', 'users',    'table',  'Registered accounts with auth info'],
    ['2', 'products', 'table',  'Catalogue items with pricing & stock'],
    ['3', 'orders',   'table',  'Purchase records linking users to products'],
  ]
};

// ── Boot ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // Apply theme
  Theme.init();

  // Modal overlay click-to-close
  UI.initModalOverlayClose();

  // Init sql.js
  try {
    const mod = await initSqlJs({
      locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`
    });
    State.sqlModule = mod;
    DBCore.setSQLModule(mod);
    console.log('[App] sql.js ready');
  } catch (e) {
    console.warn('[App] sql.js failed:', e);
    UI.toast('sql.js unavailable — .sqlite export disabled', 'err');
  }

  // Load demo data on first launch
  _loadDemo();

  // Save modal: Enter key
  document.getElementById('save-name-input')
    .addEventListener('keydown', e => { if (e.key === 'Enter') Storage.doSave(); });

  // Render about tech table
  _renderAboutTech();
});

function _loadDemo() {
  Table.render(DEMO.headers, DEMO.rows, null);
  State.isDemoData = true;
  State.filename   = 'demo';
  document.getElementById('filename-display').textContent = 'demo';
}

function _renderAboutTech() {
  const tbody = document.getElementById('about-tech-table');
  if (!tbody) return;
  const rows = [
    ['Engine',       'SQLite via sql.js (WebAssembly)'],
    ['Persistence',  'IndexedDB (browser-native)'],
    ['Fonts',        'DM Mono · DM Sans · Playfair Display'],
    ['Frontend',     'HTML · CSS · Vanilla JS'],
    ['Suite',        'Gnoke Suite v1.0'],
  ];
  tbody.innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
}

// ── Page Routing ────────────────────────────────────────────────────
function loadPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
}

// ── Global handlers (called from HTML) ─────────────────────────────
function setMode(mode)       { Table.setMode(mode); }
function addRow()            { Table.addRow(); }
function addColumn()         { Table.addColumn(); }
function removeRow()         { Table.removeRow(); }
function removeColumn()      { Table.removeColumn(); }

function newTable() {
  if (!confirm('Start a new table? Unsaved changes will be lost.')) return;
  Table.render([], [], null);
  Table.addColumn(); Table.addRow();
  State.filename   = 'New';
  State.isDemoData = false;
  document.getElementById('filename-display').textContent = 'New';
  const banner = document.getElementById('demo-banner');
  if (banner) banner.style.display = 'none';
}

function showOpenModal()     { Storage.showOpenModal(); }
function showSaveModal()     { Storage.showSaveModal(); }
function doSave()            { Storage.doSave(); }
function showDeleteConfirm() { Storage.showDeleteConfirm(); }
function doDelete()          { Storage.doDelete(); }

function showExportModal()   { UI.openModal('export-modal'); }
function closeModal(id)      { UI.closeModal(id); }

function exportJSON()        { Exporter.exportJSON();       UI.closeModal('export-modal'); }
function exportEntityJSON()  { Exporter.exportEntityJSON(); UI.closeModal('export-modal'); }
function exportSQL()         { Exporter.exportSQL();        UI.closeModal('export-modal'); }
function exportSQLite()      { Exporter.exportSQLite();     UI.closeModal('export-modal'); }
function exportCSV()         { CSV.exportCSV();             UI.closeModal('export-modal'); }
