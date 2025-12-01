//
// stats.js
// - Updates the stats bar numbers
// - Provides simple heuristic calculators for readability gain and AI confidence
//

(function(){
  const el = {
    removed: document.getElementById('charactersRemoved'),
    words: document.getElementById('wordsProcessed'),
    improve: document.getElementById('improvementPercent'),
    ai: document.getElementById('aiConfidence'),
    time: document.getElementById('processingTime')
  };

  function update({ charactersRemoved=0, wordsProcessed=0, improvementPercent=0, aiConfidence=0, processingTime=0 }) {
    if (el.removed) el.removed.textContent = `${charactersRemoved}`;
    if (el.words) el.words.textContent = `${wordsProcessed}`;
    if (el.improve) el.improve.textContent = `${Math.min(100, Math.max(0, Math.round(improvementPercent)))}%`;
    if (el.ai) el.ai.textContent = `${Math.min(100, Math.max(0, Math.round(aiConfidence)))}%`;
    if (el.time) el.time.textContent = `${processingTime}ms`;
  }

  function estimateReadabilityGain(before, after) {
    // Heuristic: reduction of markdown/AI tokens and special chars
    const clutterBefore = (before.match(/[#*_`>\[\]$$$$]/g)||[]).length;
    const clutterAfter = (after.match(/[#*_`>\[\]$$$$]/g)||[]).length;
    const diff = Math.max(0, clutterBefore - clutterAfter);
    const len = Math.max(1, before.length);
    return Math.min(100, (diff / len) * 12000); // scaled
  }

  function estimateAIConfidence(text) {
    // Heuristic: count of formulaic phrases
    const matches = (text.match(/\b(Furthermore|Moreover|Additionally|It's worth noting|Here('|’)s a|In conclusion)\b/gi)||[]).length;
    const len = Math.max(1, (text.match(/\b\w+\b/g)||[]).length);
    return Math.min(100, (matches / len) * 6000); // scaled
  }

  window.wipaStats = { update, estimateReadabilityGain, estimateAIConfidence };
})();