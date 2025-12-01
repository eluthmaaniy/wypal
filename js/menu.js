//
// menu.js
// - Mobile drawer open/close
// - Basic active link styling (handled mostly in HTML)
//

(function() {
  const drawer = document.getElementById('mobileDrawer');
  const openBtn = document.getElementById('menuToggle');
  const closeBtn = document.getElementById('menuClose');

  function open() { drawer && drawer.classList.remove('hidden'); }
  function close() { drawer && drawer.classList.add('hidden'); }

  openBtn && openBtn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  drawer && drawer.addEventListener('click', (e) => {
    if (e.target === drawer) close();
  });
})();