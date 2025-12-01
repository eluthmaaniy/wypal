//
// files.js
// - Multi-file upload & batch processing
// - Reads .txt/.md directly
// - .docx: placeholder hook to integrate existing parser if present (window.parseDocx)
//   to preserve your original functionality.
// - Renders per-file results with download buttons
//

(function(){
  const input = document.getElementById('fileInput');
  const btn = document.getElementById('uploadBtn');
  const batchWrap = document.getElementById('batchResults');
  const batchList = document.getElementById('batchList');
  const downloadAll = document.getElementById('downloadAll');
  const clearBatch = document.getElementById('clearBatch');

  const mainInput = document.getElementById('inputText');
  const mainOutput = document.getElementById('outputText');

  const batchItems = []; // {name, input, output}

  btn && btn.addEventListener('click', () => input && input.click());

  input && input.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    batchItems.length = 0;
    batchList.innerHTML = '';
    batchWrap.classList.remove('hidden');

    for (const file of files) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      let textContent = '';
      try {
        if (ext === 'txt' || ext === 'md') {
          textContent = await file.text();
        } else if (ext === 'docx') {
          if (window.parseDocx) {
            textContent = await window.parseDocx(file);
          } else {
            // Fallback: let user know original docx pipeline can be reattached here
            textContent = `[[ DOCX file detected: ${file.name}. Integrate your existing DOCX parser via window.parseDocx(file) to preserve original behavior. ]]`;
          }
        } else {
          textContent = `[[ Unsupported file type: ${file.name} ]]`;
        }
      } catch (err) {
        textContent = `[[ Error reading file: ${file.name} — ${err?.message || err} ]]`;
      }

      // Process using current pipeline from formatting.js
      // Temporarily set main input, trigger cleaning, take main output
      const prev = mainInput.value;
      mainInput.value = textContent;
      mainInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(r => setTimeout(r, 50)); // allow pipeline to run

      const cleaned = mainOutput.value;

      // Restore previous input
      mainInput.value = prev;
      mainInput.dispatchEvent(new Event('input', { bubbles: true }));

      const item = { name: file.name.replace(/\.[^.]+$/, '') + '-cleaned.txt', input: textContent, output: cleaned };
      batchItems.push(item);
      appendBatchRow(item);
    }
  });

  function appendBatchRow(item) {
    const row = document.createElement('div');
    row.className = 'border border-border dark:border-[#2a2a2a] rounded-lg p-3 bg-white dark:bg-[#181818]';
    row.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold">${item.name}</div>
        <div class="flex items-center gap-2">
          <button class="px-2 py-1 rounded-md border border-border text-xs hover:bg-[#FFF3E0]" data-action="download">Download</button>
          <button class="px-2 py-1 rounded-md border border-border text-xs hover:bg-[#FFF3E0]" data-action="view">View</button>
        </div>
      </div>
    `;
    row.querySelector('[data-action="download"]').addEventListener('click', () => {
      const blob = new Blob([item.output], { type:'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = item.name;
      a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    });
    row.querySelector('[data-action="view"]').addEventListener('click', () => {
      // Show a small viewer
      const pre = document.createElement('pre');
      pre.className = 'mt-2 p-2 bg-[#FAFAFA] dark:bg-[#151515] border border-border dark:border-[#2a2a2a] rounded text-xs whitespace-pre-wrap';
      pre.textContent = item.output;
      row.appendChild(pre);
    });
    batchList.appendChild(row);
  }

  downloadAll && downloadAll.addEventListener('click', () => {
    // Trigger sequential downloads; if you prefer zip, integrate JSZip here.
    batchItems.forEach((it, idx) => {
      setTimeout(()=>{
        const blob = new Blob([it.output], { type:'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = it.name;
        a.click();
        setTimeout(()=>URL.revokeObjectURL(url), 1000);
      }, idx * 200);
    });
  });

  clearBatch && clearBatch.addEventListener('click', () => {
    batchItems.length = 0;
    batchList.innerHTML = '';
    batchWrap.classList.add('hidden');
  });
})();