//
// theme.js
// - Applies theme immediately to avoid FOUC
// - Wires UI after DOMContentLoaded so the toggle works reliably on all pages
//
(function() {
  const STORAGE_KEY = 'wipa-theme'; // 'light' | 'dark' | 'system'
  const html = document.documentElement;

  function getSystemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(mode) {
    const effective = mode === 'system' ? (getSystemPrefersDark() ? 'dark' : 'light') : mode;
    html.classList.toggle('dark', effective === 'dark');
  }

  // Apply early to prevent flash
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || 'system';
    applyTheme(saved);
  } catch {
    applyTheme('system');
  }

  function setTheme(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
    applyTheme(mode);
    refreshThemeUI(mode);
  }

  function currentMode() {
    try { return localStorage.getItem(STORAGE_KEY) || 'system'; } catch { return 'system'; }
  }

  function refreshThemeUI(mode) {
    const m = mode || currentMode();
    const label = document.getElementById('themeLabel');
    if (label) label.textContent = m.charAt(0).toUpperCase() + m.slice(1);

    const iconLight = document.getElementById('iconLight');
    const iconDark = document.getElementById('iconDark');
    const iconSystem = document.getElementById('iconSystem');
    [iconLight, iconDark, iconSystem].forEach(el => el && el.classList.add('hidden'));
    if (m === 'light' && iconLight) iconLight.classList.remove('hidden');
    if (m === 'dark' && iconDark) iconDark.classList.remove('hidden');
    if (m === 'system' && iconSystem) iconSystem.classList.remove('hidden');
  }

  function wireUI() {
    const themeButton = document.getElementById('themeButton');
    const themeMenu = document.getElementById('themeMenu');

    if (themeButton && themeMenu) {
      themeButton.addEventListener('click', () => {
        themeMenu.classList.toggle('hidden');
      });

      themeMenu.querySelectorAll('button[data-theme]').forEach(btn => {
        btn.addEventListener('click', () => {
          setTheme(btn.getAttribute('data-theme'));
          themeMenu.classList.add('hidden');
        });
      });

      document.addEventListener('click', (e) => {
        if (!themeButton.contains(e.target) && !themeMenu.contains(e.target)) {
          themeMenu.classList.add('hidden');
        }
      });
    }

    const mobileToggle = document.getElementById('mobileTheme');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        const cur = currentMode();
        const next = cur === 'light' ? 'dark' : cur === 'dark' ? 'system' : 'light';
        setTheme(next);
      });
    }

    document.querySelectorAll('#mobileDrawer [data-theme]').forEach(btn => {
      btn.addEventListener('click', () => setTheme(btn.getAttribute('data-theme')));
    });

    // React to system changes when in 'system' mode
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener?.('change', () => {
        if (currentMode() === 'system') applyTheme('system');
      });
    }

    // Initialize label/icons to reflect saved mode
    refreshThemeUI(currentMode());
  }

  // Wire UI only after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireUI, { once: true });
  } else {
    wireUI();
  }
})();