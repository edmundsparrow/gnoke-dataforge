/* js/lock.js — view-only / edit-mode toggle
 *
 * Drop-in. Requires: UI (already loaded).
 * Injects its own <style> block — no new CSS file needed.
 * Wraps the four global edit functions so they refuse when locked.
 *
 * Public API:
 *   Lock.toggle()   — flip locked ↔ unlocked
 *   Lock.lock()     — force lock
 *   Lock.unlock()   — force unlock
 *   Lock.isLocked() — boolean
 */

const Lock = (() => {

  // ── Inject styles (uses real CSS vars from theme.css) ─────────────
  const _style = document.createElement('style');
  _style.textContent = `
    /* Lock button — matches #theme-toggle sizing in theme.css */
    #lock-btn {
      width: 34px; height: 34px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.07);
      color: var(--topbar-txt);
      cursor: pointer; font-size: 15px;
      display: flex; align-items: center; justify-content: center;
      transition: border-color var(--transition), background var(--transition);
      flex-shrink: 0;
    }
    #lock-btn:hover {
      border-color: var(--amber);
      background: rgba(194,114,42,0.15);
    }
    body.table-locked #lock-btn {
      background: var(--amber);
      border-color: var(--amber);
      color: #fff;
    }

    /* Banner between topbar and table */
    #lock-banner {
      display: none;
      align-items: center; justify-content: center; gap: 8px;
      padding: 6px 14px;
      background: var(--amber); color: #fff;
      font-family: var(--font-mono);
      font-size: 0.68rem; font-weight: 500;
      letter-spacing: 0.08em; text-transform: uppercase;
      cursor: pointer; user-select: none; flex-shrink: 0;
    }
    body.table-locked #lock-banner { display: flex; }

    /* Cells — no caret, no focus ring */
    body.table-locked tbody td {
      cursor: default !important;
      caret-color: transparent;
    }
    body.table-locked tbody td:focus {
      background: transparent !important;
      box-shadow: none !important;
    }
    body.table-locked thead tr#header-row th .th-name {
      cursor: default !important;
      caret-color: transparent;
      pointer-events: none;
    }

    /* Schema controls dimmed */
    body.table-locked .schema-cell select,
    body.table-locked .schema-cell input[type=checkbox] {
      opacity: 0.4;
      pointer-events: none;
    }

    /* Desktop Edit menu buttons dimmed */
    body.table-locked .menu-content button.edit-action {
      opacity: 0.38;
      cursor: not-allowed;
    }

    /* Drawer edit buttons dimmed */
    body.table-locked .drawer-btn.edit-action {
      opacity: 0.38;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(_style);

  // ── State ──────────────────────────────────────────────────────────
  let _locked = false;

  // Auto-lock on boot — waits for DOMContentLoaded so app.js has
  // already rendered the table before we flip contentEditable.
  document.addEventListener('DOMContentLoaded', () => lock());

  // ── Guard the four global edit functions ───────────────────────────
  const _orig = {
    addRow:       window.addRow,
    addColumn:    window.addColumn,
    removeRow:    window.removeRow,
    removeColumn: window.removeColumn,
  };

  function _guard(name) {
    window[name] = (...args) => {
      if (_locked) { UI.toast('Table is locked — unlock to edit', 'err'); return; }
      _orig[name](...args);
    };
  }
  ['addRow', 'addColumn', 'removeRow', 'removeColumn'].forEach(_guard);

  // ── Helpers ────────────────────────────────────────────────────────
  function _setCells(editable) {
    document.querySelectorAll('#tbody td, #header-row .th-name')
      .forEach(el => { el.contentEditable = editable ? 'true' : 'false'; });
  }

  function _syncUI() {
    const btn = document.getElementById('lock-btn');
    if (btn) {
      btn.title       = _locked ? 'Unlock table' : 'Lock table';
      btn.textContent = _locked ? '🔒' : '🔓';
    }
    const dbtn = document.getElementById('drawer-lock-btn');
    if (dbtn) dbtn.textContent = _locked ? '🔒  Locked — tap to unlock' : '🔓  Lock table';
    document.body.classList.toggle('table-locked', _locked);
  }

  // ── Public ─────────────────────────────────────────────────────────
  function lock()     { _locked = true;  _setCells(false); _syncUI(); UI.toast('Table locked — view only', 'ok'); }
  function unlock()   { _locked = false; _setCells(true);  _syncUI(); UI.toast('Table unlocked', 'ok'); }
  function toggle()   { _locked ? unlock() : lock(); }
  function isLocked() { return _locked; }

  return { toggle, lock, unlock, isLocked };
})();
