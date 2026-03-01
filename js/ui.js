/* js/ui.js — toast, modal helpers, status chip */

const UI = (() => {
  let toastTimer, statusTimer;

  function toast(msg, type = 'ok') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = ''; }, 3000);
  }

  function flashStatus(msg) {
    const chip = document.getElementById('status-chip');
    if (!chip) return;
    chip.textContent = msg;
    chip.classList.add('show');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => chip.classList.remove('show'), 2200);
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  }

  function initModalOverlayClose() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('show');
      });
    });
  }

  return { toast, flashStatus, openModal, closeModal, initModalOverlayClose };
})();
