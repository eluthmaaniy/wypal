//
// storage.js
// - Saves last input and options in localStorage under 'wipa-state'
// - Loaded on startup by formatting.js
//

(function(){
  const KEY = 'wipa-state';

  function save(data) {
    try {
      const prev = load() || {};
      const merged = { ...prev, ...data };
      localStorage.setItem(KEY, JSON.stringify(merged));
    } catch {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  window.wipaStorage = { save, load };
})();