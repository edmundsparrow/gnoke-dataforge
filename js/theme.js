/* js/theme.js — theme switcher, light default */

const Theme = (() => {
  const KEY     = 'gnoke_dataforge_theme';
  const DEFAULT = 'light';

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(KEY, theme);
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || DEFAULT;
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    const saved = localStorage.getItem(KEY) || DEFAULT;
    apply(saved);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init, apply, toggle };
})();
