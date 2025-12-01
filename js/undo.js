//
// undo.js
// - Desktop + Mobile Undo/Redo buttons
// - Exposes a tiny history stack; formatting.js can push snapshots
//
(function(){
  const input = document.getElementById('inputText');
  const output = document.getElementById('outputText');

  // Buttons (mobile)
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  // Buttons (desktop)
  const undoBtnDesktop = document.getElementById('undoBtnDesktop');
  const redoBtnDesktop = document.getElementById('redoBtnDesktop');

  const stack = { past: [], future: [], current: '' };

  function setButtons() {
    const canUndo = stack.past.length > 0;
    const canRedo = stack.future.length > 0;
    [undoBtn, undoBtnDesktop].forEach(b => b && (b.disabled = !canUndo));
    [redoBtn, redoBtnDesktop].forEach(b => b && (b.disabled = !canRedo));
  }

  function applyText(t) {
    if (output) output.value = t;
    // If diff view is visible, let formatting re-render; otherwise just update stats
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('wipa:output-updated', { detail: { text: t } }));
    }
  }

  function pushSnapshot(t) {
    if (t === stack.current) return;
    if (stack.current) stack.past.push(stack.current);
    stack.current = t;
    stack.future = [];
    setButtons();
  }

  function onInputChange() {
    const val = input ? input.value : '';
    // Do not snapshot raw input changes here; formatting.js will snapshot cleaned output
    // This keeps history consistent with output.
  }

  function undo() {
    if (!stack.past.length) return;
    const prev = stack.past.pop();
    stack.future.unshift(stack.current);
    stack.current = prev;
    applyText(prev);
    setButtons();
  }

  function redo() {
    if (!stack.future.length) return;
    const next = stack.future.shift();
    stack.past.push(stack.current);
    stack.current = next;
    applyText(next);
    setButtons();
  }

  // Wire buttons (mobile + desktop)
  [undoBtn, undoBtnDesktop].forEach(b => b && b.addEventListener('click', undo));
  [redoBtn, redoBtnDesktop].forEach(b => b && b.addEventListener('click', redo));

  // Public API for formatting.js to push snapshots
  window.wipaUndo = {
    snapshot: pushSnapshot
  };

  // Initialize from existing output (if any)
  window.addEventListener('DOMContentLoaded', () => {
    if (output && output.value) {
      stack.current = output.value;
      setButtons();
    }
  });

  input && input.addEventListener('input', onInputChange);
})();