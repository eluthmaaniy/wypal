//
// formatting.js
// - Live cleaning pipeline
// - Diff renders immediately on toggle
// - Options panel now collapsible (desktop) + modal (mobile)
// - Controls wrap on mobile to avoid horizontal overflow
//
(function(){
  const input = document.getElementById('inputText');
  const output = document.getElementById('outputText');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  const toggleDiff = document.getElementById('toggleDiff');
  const toggleDiffMobile = document.getElementById('toggleDiffMobile');
  const diffView = document.getElementById('diffView');
  const diffBefore = document.getElementById('diffBefore');
  const diffAfter = document.getElementById('diffAfter');

  const statsBar = document.getElementById('statsBar');
  const analysisPanel = document.getElementById('analysisPanel');
  const changesList = document.getElementById('changesList');
  const inputSmallStats = document.getElementById('inputSmallStats');
  const outputSmallStats = document.getElementById('outputSmallStats');

  const tryExample = document.getElementById('tryExample');
  const clearInput = document.getElementById('clearInput');

  // Options controls
  const openOptions = document.getElementById('openOptions');
  const toggleOptionsPanel = document.getElementById('toggleOptionsPanel');
  const optionsPanel = document.getElementById('optionsPanel');
  const optionsModal = document.getElementById('optionsModal');
  const closeOptions = document.getElementById('closeOptions');
  const applyOptionsMobile = document.getElementById('applyOptionsMobile');
  const resetOptions = document.getElementById('resetOptions');
  const resetOptionsMobile = document.getElementById('resetOptionsMobile');

  const emDashDesktop = document.getElementById('emDashStrategy');
  const emDashMobile = document.getElementById('emDashStrategyMobile');
  const emDashSuggestion = document.getElementById('emDashSuggestion');

  const mqlMd = window.matchMedia ? window.matchMedia('(min-width: 768px)') : { matches: true };

  const state = {
    options: {
      bold:true, italic:true, headers:true, lists:true,
      links:true, code:true, blockquotes:true, tables:true,
      smartQuotes:true, dashes:true, ellipsis:true, bullets:true,
      formulaic:true, transitions:true, hedging:true, parenthetical:true,
      spacing:true, breaks:true, separators:true,
      emDashStrategy:'auto'
    },
    showDiff:false,
    lastInput:'', lastOutput:''
  };

  // Presets
  const PRESETS = {
    common: { bold:true, italic:true, headers:true, lists:true, smartQuotes:true, dashes:true, spacing:true, breaks:true, separators:true },
    light: { bold:true, italic:true, headers:true, lists:true, links:true, smartQuotes:true, spacing:true },
    medium: { bold:true, italic:true, headers:true, lists:true, links:true, code:true, smartQuotes:true, dashes:true, ellipsis:true, spacing:true, breaks:true, separators:true },
    deep: { bold:true, italic:true, headers:true, lists:true, links:true, code:true, blockquotes:true, tables:true, smartQuotes:true, dashes:true, ellipsis:true, bullets:true, formulaic:true, transitions:true, hedging:true, parenthetical:true, spacing:true, breaks:true, separators:true },
    nuclear: { bold:true, italic:true, headers:true, lists:true, links:true, code:true, blockquotes:true, tables:true, smartQuotes:true, dashes:true, ellipsis:true, bullets:true, formulaic:true, transitions:true, hedging:true, parenthetical:true, spacing:true, breaks:true, separators:true }
  };
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      for (const k of Object.keys(state.options)) {
        if (k === 'emDashStrategy') continue;
        state.options[k] = !!p[k];
      }
      syncOptionInputs();
      processAndRender();
    })
  });

  function syncOptionInputs() {
    document.querySelectorAll('.opt').forEach(chk => {
      const key = chk.getAttribute('data-opt');
      if (key in state.options) chk.checked = !!state.options[key];
    });
    if (emDashDesktop) emDashDesktop.value = state.options.emDashStrategy || 'auto';
    if (emDashMobile) emDashMobile.value = state.options.emDashStrategy || 'auto';
  }

  // Options opening: desktop toggles panel; mobile opens modal
  function isDesktop() { return mqlMd.matches; }
  openOptions && openOptions.addEventListener('click', () => {
    if (isDesktop()) {
      optionsPanel && optionsPanel.classList.toggle('hidden');
      // Also update toggle button label if present
      if (toggleOptionsPanel) {
        const isOpen = !optionsPanel.classList.contains('hidden');
        toggleOptionsPanel.innerHTML = isOpen
          ? '<i class="ri-equalizer-line"></i> Hide Options'
          : '<i class="ri-equalizer-line"></i> Show Options';
      }
    } else {
      optionsModal && optionsModal.classList.remove('hidden');
    }
  });
  toggleOptionsPanel && toggleOptionsPanel.addEventListener('click', () => {
    optionsPanel && optionsPanel.classList.toggle('hidden');
    const isOpen = !optionsPanel.classList.contains('hidden');
    toggleOptionsPanel.innerHTML = isOpen
      ? '<i class="ri-equalizer-line"></i> Hide Options'
      : '<i class="ri-equalizer-line"></i> Show Options';
  });
  closeOptions && closeOptions.addEventListener('click', () => optionsModal.classList.add('hidden'));
  applyOptionsMobile && applyOptionsMobile.addEventListener('click', () => { optionsModal.classList.add('hidden'); processAndRender(); });

  // Reset options
  function resetAllOptions() {
    Object.assign(state.options, PRESETS.deep, { emDashStrategy: 'auto' });
    syncOptionInputs();
    persistState();
    processAndRender();
  }
  resetOptions && resetOptions.addEventListener('click', resetAllOptions);
  resetOptionsMobile && resetOptionsMobile.addEventListener('click', resetAllOptions);

  // Toggle options affect processing
  document.querySelectorAll('.opt').forEach(chk => {
    chk.addEventListener('change', () => {
      const key = chk.getAttribute('data-opt');
      state.options[key] = chk.checked;
      persistState();
      processAndRender();
    });
  });

  // Em dash strategy changes
  function setEmDashStrategy(val) {
    state.options.emDashStrategy = val;
    persistState();
    processAndRender();
  }
  emDashDesktop && emDashDesktop.addEventListener('change', e => setEmDashStrategy(e.target.value));
  emDashMobile && emDashMobile.addEventListener('change', e => setEmDashStrategy(e.target.value));

  // Example/Clear
  tryExample && tryExample.addEventListener('click', () => {
    input.value = `Here’s a comprehensive guide — to using Wípà:

## What you’ll get
- **Cleaner text**, fewer artifacts
> It’s worth noting that this is all local.

Furthermore, try toggling options to see live preview...`;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  clearInput && clearInput.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // Diff toggle (desktop + mobile)
  function setDiffVisible(on) {
    state.showDiff = on;
    if (on) {
      diffView.classList.remove('hidden');
      output.classList.add('hidden');
      processAndRender(); // render diff immediately
    } else {
      diffView.classList.add('hidden');
      output.classList.remove('hidden');
    }
  }
  toggleDiff && toggleDiff.addEventListener('click', () => setDiffVisible(!state.showDiff));
  toggleDiffMobile && toggleDiffMobile.addEventListener('click', () => setDiffVisible(!state.showDiff));

  // Copy/Download
  copyBtn && copyBtn.addEventListener('click', async () => {
    if (!output.value) return;
    await navigator.clipboard.writeText(output.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 1200);
  });
  downloadBtn && downloadBtn.addEventListener('click', () => {
    if (!output.value) return;
    const blob = new Blob([output.value], { type:'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wipa-cleaned.txt';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  });

  // Cleaning pipeline
  function cleanText(src, opts) {
    let text = src || '';
    const changes = [];
    const beforeLen = text.length;

    // Markdown/basic
    if (opts.bold) {
      const n = (text.match(/\*\*(.*?)\*\*/gs)||[]).length;
      text = text.replace(/\*\*(.*?)\*\*/gs, '$1');
      if (n) changes.push(`Removed ${n} bold segments`);
    }
    if (opts.italic) {
      const n = (text.match(/(^|[^\*])\*(?!\s)(.*?)(?<!\s)\*(?!\*)/gs)||[]).length;
      text = text.replace(/(^|[^\*])\*(?!\s)(.*?)(?<!\s)\*(?!\*)/gs, '$1$2');
      if (n) changes.push(`Removed ${n} italic segments`);
    }
    if (opts.headers) {
      const n = (text.match(/^(#{1,6})\s+/gm)||[]).length;
      text = text.replace(/^(#{1,6})\s+/gm, '');
      if (n) changes.push(`Removed ${n} markdown headers`);
    }
    if (opts.lists) {
      const n1 = (text.match(/^\s*[-*+]\s+/gm)||[]).length;
      const n2 = (text.match(/^\s*\d+\.\s+/gm)||[]).length;
      text = text.replace(/^\s*[-*+]\s+/gm, '').replace(/^\s*\d+\.\s+/gm, '');
      if (n1+n2) changes.push(`Removed ${n1+n2} list markers`);
    }
    if (opts.links) {
      const n = (text.match(/\[([^\]]+)\]$$([^)]+)$$/g)||[]).length;
      text = text.replace(/\[([^\]]+)\]$$([^)]+)$$/g, '$1');
      if (n) changes.push(`Stripped ${n} markdown links`);
    }
    if (opts.code) {
      const n1 = (text.match(/`([^`]+)`/g)||[]).length;
      text = text.replace(/`([^`]+)`/g, '$1');
      const n2 = (text.match(/```[\s\S]*?```/g)||[]).length;
      text = text.replace(/```([\s\S]*?)```/g, '$1');
      if (n1+n2) changes.push(`Normalized code formatting (${n1+n2})`);
    }
    if (opts.blockquotes) {
      const n = (text.match(/^\s*>\s+/gm)||[]).length;
      text = text.replace(/^\s*>\s+/gm, '');
      if (n) changes.push(`Removed ${n} blockquote symbols`);
    }
    if (opts.tables) {
      const n = (text.match(/^\|.*\|$/gm)||[]).length;
      text = text.replace(/^\|.*\|$/gm, (m)=> m.replace(/\|/g,' ').replace(/-+/g,'-'));
      if (n) changes.push(`Simplified ${n} table lines`);
    }

    // Typography
    if (opts.smartQuotes) {
      const q = (text.match(/[“”„‟]/g)||[]).length + (text.match(/[‘’‚‛]/g)||[]).length;
      text = text.replace(/[“”„‟]/g,'"').replace(/[‘’‚‛]/g,"'");
      if (q) changes.push(`Normalized ${q} smart quotes`);
    }
    if (opts.ellipsis) {
      const n = (text.match(/…/g)||[]).length;
      text = text.replace(/…/g,'...');
      if (n) changes.push(`Normalized ${n} ellipses`);
    }
    if (opts.bullets) {
      const n = (text.match(/[•◦▪]/g)||[]).length;
      text = text.replace(/[•◦▪]/g,'-');
      if (n) changes.push(`Replaced ${n} bullet characters`);
    }
    if (opts.dashes) {
      const dashMatches = text.match(/—/g) || [];
      if (dashMatches.length) {
        const suggestion = suggestEmDash(text);
        if (emDashSuggestion) { emDashSuggestion.textContent = `Suggested: ${suggestion.toUpperCase()}`; }
        const chosen = opts.emDashStrategy === 'auto' ? suggestion : opts.emDashStrategy;
        let repl = ', ';
        if (chosen === 'hyphen') repl = ' - ';
        else if (chosen === 'colon') repl = ': ';
        else if (chosen === 'period') repl = '. ';
        else if (chosen === 'remove') repl = ' ';
        text = text.replace(/—/g, repl);
        changes.push(`Replaced ${dashMatches.length} em dashes with "${chosen}"`);
      } else if (emDashSuggestion) {
        emDashSuggestion.textContent = '';
      }
      const enCount = (text.match(/–/g)||[]).length;
      if (enCount) {
        text = text.replace(/–/g,'-');
        changes.push(`Replaced ${enCount} en dashes with hyphen`);
      }
    }

    // AI patterns
    if (opts.formulaic) {
      const P = [/\bHere['’]?s a\b/gi, /\bIt['’]?s worth noting\b/gi, /\bIn conclusion\b/gi];
      let c=0;
      P.forEach(r => { if (r.test(text)) { c += (text.match(r)||[]).length; text = text.replace(r,'').replace(/\s{2,}/g,' ');} });
      if (c) changes.push(`Trimmed ${c} formulaic phrases`);
    }
    if (opts.transitions) {
      const r = /\b(Furthermore|Moreover|Additionally|Moving on|On the other hand),?\s+/gi;
      const n = (text.match(r)||[]).length;
      text = text.replace(r,'');
      if (n) changes.push(`Removed ${n} transition phrases`);
    }
    if (opts.hedging) {
      const H = /\b(it's (important to|worth) (note|remember)|perhaps|maybe|arguably|somewhat)\b[:,]?\s*/gi;
      const n = (text.match(H)||[]).length;
      text = text.replace(H,'');
      if (n) changes.push(`Reduced ${n} hedging patterns`);
    }
    if (opts.parenthetical) {
      const n = (text.match(/$$\s{2,}|,\s*$$/g)||[]).length;
      text = text.replace(/$$\s{2,}/g,'(').replace(/,\s*$$/g,')');
      if (n) changes.push(`Normalized ${n} parenthetical artifacts`);
    }

    // Structural
    if (opts.separators) {
      const n = (text.match(/^\s*([-_*]{3,})\s*$/gm)||[]).length;
      text = text.replace(/^\s*([-_*]{3,})\s*$/gm,'');
      if (n) changes.push(`Removed ${n} separators`);
    }
    if (opts.breaks) {
      const n = (text.match(/\n{3,}/g)||[]).length;
      text = text.replace(/\n{3,}/g, '\n\n');
      if (n) changes.push(`Normalized ${n} excessive line breaks`);
    }
    if (opts.spacing) {
      const n = (text.match(/ {2,}/g)||[]).length;
      text = text.replace(/ {2,}/g,' ');
      const m = (text.match(/[ \t]+$/gm)||[]).length;
      text = text.replace(/[ \t]+$/gm,'');
      if (n+m) changes.push(`Fixed spacing (${n+m} instances)`);
    }

    text = text.trim();

    const afterLen = text.length;
    return { text, changes, beforeLen, afterLen };
  }

  function suggestEmDash(text) {
    const pairs = (text.match(/[A-Za-z0-9]\s*—\s*[A-Za-z0-9]/g) || []).length;
    if (pairs > 0) return 'comma';
    const titleish = (text.match(/[:;]\s*—/g)||[]).length;
    if (titleish > 0) return 'colon';
    return 'comma';
  }

  function renderChanges(changes) {
    if (!changesList) return;
    changesList.innerHTML = '';
    if (!changes.length) { analysisPanel && analysisPanel.classList.add('hidden'); return; }
    analysisPanel && analysisPanel.classList.remove('hidden');
    changes.forEach(c => {
      const div = document.createElement('div');
      div.textContent = `• ${c}`;
      changesList.appendChild(div);
    });
  }

  function processAndRender() {
    const src = input.value || '';
    const t0 = performance.now();
    const { text, changes, beforeLen, afterLen } = cleanText(src, state.options);
    const dt = Math.max(0, Math.round(performance.now() - t0));

    output.value = text;
    state.lastInput = src;
    state.lastOutput = text;

    statsBar && statsBar.classList.toggle('hidden', !src.trim().length);

    if (inputSmallStats) {
      const words = (src.trim().match(/\b\w+\b/g)||[]).length;
      inputSmallStats.textContent = `${src.length} chars • ${words} words`;
    }
    if (outputSmallStats) {
      const words = (text.trim().match(/\b\w+\b/g)||[]).length;
      outputSmallStats.textContent = `${text.length} chars • ${words} words`;
    }

    if (window.wipaStats) {
      const inWords = (src.trim().match(/\b\w+\b/g)||[]).length;
      const outWords = (text.trim().match(/\b\w+\b/g)||[]).length;
      window.wipaStats.update({
        charactersRemoved: Math.max(0, beforeLen - afterLen),
        wordsProcessed: Math.max(inWords, outWords),
        improvementPercent: window.wipaStats.estimateReadabilityGain(src, text),
        aiConfidence: window.wipaStats.estimateAIConfidence(src),
        processingTime: dt
      });
    }

    if (state.showDiff && window.wipaDiff && diffBefore && diffAfter) {
      const { beforeHTML, afterHTML } = window.wipaDiff(src, text);
      diffBefore.innerHTML = beforeHTML;
      diffAfter.innerHTML = afterHTML;
    }

    renderChanges(changes);
    persistState();
    // Notify undo stack, if available
    if (window.wipaUndo && typeof window.wipaUndo.snapshot === 'function') {
      window.wipaUndo.snapshot(text);
    }
  }

  function persistState() {
    if (window.wipaStorage) {
      window.wipaStorage.save({ input: state.lastInput ?? input.value, options: state.options });
    }
  }

  let debounce;
  input && input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(processAndRender, 120);
  });

  window.addEventListener('DOMContentLoaded', () => {
    if (window.wipaStorage) {
      const saved = window.wipaStorage.load();
      if (saved) {
        if (typeof saved.input === 'string') input.value = saved.input;
        if (saved.options) Object.assign(state.options, saved.options);
        syncOptionInputs();
      } else {
        Object.assign(state.options, PRESETS.deep, { emDashStrategy: 'auto' });
        syncOptionInputs();
      }
    } else {
      Object.assign(state.options, PRESETS.deep, { emDashStrategy: 'auto' });
      syncOptionInputs();
    }
    processAndRender();
  });
})();