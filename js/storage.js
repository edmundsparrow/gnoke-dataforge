/* js/storage.js — save, open, delete via DBCore (sql.js + IndexedDB) */

const Storage = (() => {

  // ── OPEN MODAL ──────────────────────────────────────────────────
  async function showOpenModal() {
    try {
      const keys = await DBCore.listTables();
      const list = document.getElementById('open-file-list');
      list.innerHTML = '';

      if (!keys.length) {
        list.innerHTML = '<li style="color:var(--muted);padding:10px 0;font-size:0.82rem;font-family:var(--font-mono)">No saved tables yet.</li>';
      } else {
        keys.forEach(key => {
          const li  = document.createElement('li');
          const btn = document.createElement('button');
          btn.textContent = key;
          btn.addEventListener('click', () => {
            load(key);
            UI.closeModal('open-modal');
          });
          li.appendChild(btn);
          list.appendChild(li);
        });
      }
      UI.openModal('open-modal');
    } catch (e) {
      UI.toast('Could not list files: ' + e.message, 'err');
    }
  }

  // ── LOAD ─────────────────────────────────────────────────────────
  async function load(name) {
    try {
      const { headers, rows, schema } = await DBCore.loadTable(name);
      Table.render(headers, rows, schema);
      State.filename  = name;
      State.isDemoData = false;
      // hide demo banner
      const banner = document.getElementById('demo-banner');
      if (banner) banner.style.display = 'none';
      UI.toast('Loaded: ' + name, 'ok');
    } catch (e) {
      UI.toast('Load error: ' + e.message, 'err');
    }
  }

  // ── SAVE MODAL ───────────────────────────────────────────────────
  function showSaveModal() {
    const inp = document.getElementById('save-name-input');
    inp.value = (State.filename !== 'New') ? State.filename : '';
    UI.openModal('save-modal');
    setTimeout(() => inp.focus(), 80);
  }

  // ── DO SAVE ──────────────────────────────────────────────────────
  async function doSave() {
    const name = document.getElementById('save-name-input').value.trim();
    if (!name) { UI.toast('Please enter a name.', 'err'); return; }

    try {
      await DBCore.saveTable(name, Table.getHeaders(), Table.getRows(), State.colSchema);
      State.filename   = name;
      State.isDemoData = false;
      const banner = document.getElementById('demo-banner');
      if (banner) banner.style.display = 'none';
      UI.closeModal('save-modal');
      UI.flashStatus('saved');
      UI.toast('Saved: ' + name, 'ok');
    } catch (e) {
      UI.toast('Save error: ' + e.message, 'err');
    }
  }

  // ── DELETE CONFIRM ───────────────────────────────────────────────
  function showDeleteConfirm() {
    if (State.filename === 'New' || State.isDemoData) {
      UI.toast('No saved file to delete.', 'err');
      return;
    }
    document.getElementById('confirm-filename').textContent = State.filename;
    UI.openModal('confirm-modal');
  }

  async function doDelete() {
    try {
      await DBCore.deleteTable(State.filename);
      UI.closeModal('confirm-modal');
      UI.toast('Deleted: ' + State.filename, 'ok');
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      UI.toast('Delete error: ' + e.message, 'err');
    }
  }

  return { showOpenModal, showSaveModal, doSave, showDeleteConfirm, doDelete };
})();
