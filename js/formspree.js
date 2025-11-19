(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const success = document.getElementById('formSuccess');
  const errorBox = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');
  const agree = document.getElementById('agree');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (agree && !agree.checked) {
      errorBox && (errorBox.classList.remove('hidden'), errorBox.querySelector('div:nth-child(2)').textContent = 'Please accept the Privacy Policy to continue.');
      return;
    }
    success && success.classList.add('hidden');
    errorBox && errorBox.classList.add('hidden');
    submitBtn && (submitBtn.disabled = true, submitBtn.textContent = 'Sending...');

    try {
      const fd = new FormData(form);
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      });
      if (res.ok) {
        success && success.classList.remove('hidden');
        form.reset();
      } else {
        errorBox && errorBox.classList.remove('hidden');
      }
    } catch {
      errorBox && errorBox.classList.remove('hidden');
    } finally {
      submitBtn && (submitBtn.disabled = false, submitBtn.textContent = 'Send Message');
    }
  });
})();