//
// diff.js
// - Minimal word-level diff for before/after display
// - Exports window.wipaDiff(textA, textB) -> { beforeHTML, afterHTML }
//   with spans .diff-removed / .diff-added for highlighting
//

(function(){
  function tokenize(str) {
    // Split by whitespace, but keep punctuation with words for simplicity
    return str.split(/(\s+)/).filter(Boolean);
  }

  // LCS-based diff for token arrays
  function diffTokens(a, b) {
    const n = a.length, m = b.length;
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        if (a[i] === b[j]) dp[i][j] = 1 + dp[i+1][j+1];
        else dp[i][j] = Math.max(dp[i+1][j], dp[i][j+1]);
      }
    }
    const res = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        res.push({ type:'same', value:a[i] });
        i++; j++;
      } else if (dp[i+1][j] >= dp[i][j+1]) {
        res.push({ type:'removed', value:a[i] });
        i++;
      } else {
        res.push({ type:'added', value:b[j] });
        j++;
      }
    }
    while (i < n) res.push({ type:'removed', value:a[i++] });
    while (j < m) res.push({ type:'added', value:b[j++] });
    return res;
  }

  function escapeHtml(s) {
    return s
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;');
  }

  function renderBefore(diff) {
    return diff.map(d => {
      if (d.type === 'added') return escapeHtml(d.value);
      if (d.type === 'removed') return `<span class="diff-removed">${escapeHtml(d.value)}</span>`;
      return escapeHtml(d.value);
    }).join('');
  }

  function renderAfter(diff) {
    return diff.map(d => {
      if (d.type === 'removed') return escapeHtml(d.value);
      if (d.type === 'added') return `<span class="diff-added">${escapeHtml(d.value)}</span>`;
      return escapeHtml(d.value);
    }).join('');
  }

  window.wipaDiff = function(a, b) {
    const A = tokenize(a || ''), B = tokenize(b || '');
    const D = diffTokens(A, B);
    return { beforeHTML: renderBefore(D), afterHTML: renderAfter(D) };
  };
})();