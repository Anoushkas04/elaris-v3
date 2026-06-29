// ─ PROGRESS SAVE (localStorage → admin can read) ──────────────
function saveProgress(){
  const data={
    player:{ name:GS.playerName, role:GS.playerRole, icon:GS.playerIcon },
    score:GS.score, moduleIdx:GS.moduleIdx,
    moduleScores:GS.moduleScores,
    domains:GS.domains,
    fragments:GS.fragments,
    dass: {
      depression: Math.round(((GS.dass.depression || []).reduce((a, b) => a + b, 0)) * (14 / 3)),
      anxiety:    Math.round(((GS.dass.anxiety    || []).reduce((a, b) => a + b, 0)) * (14 / 3)),
      stress:     Math.round(((GS.dass.stress     || []).reduce((a, b) => a + b, 0)) * (14 / 3))
    },
    dassRaw: GS.dassRaw,
    rtSamples:GS.rtSamples,
    correctCount:GS.correctCount,
    attemptCount:GS.attemptCount,
    murderer:GS.murderer,
    killerGuess:GS.killerGuess || "",
    sessionStart:GS.sessionStart,
    lastUpdated:Math.floor(Date.now() / 1000)
  };
  localStorage.setItem('elaris_session', JSON.stringify(data));
  localStorage.setItem('elaris_session_ts', Date.now());
  
  // Update Go backend progress as well
  const userJson = localStorage.getItem('elaris_user');
  if (userJson) {
    const user = JSON.parse(userJson);
    fetch('/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.user_id || user.id,
        progress: data
      }),
      keepalive: true
    }).catch(err => console.warn('telemetry save error:', err));
  }
}

// Auto-save telemetry on midway exits (tab close, minimize, navigate away)
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveProgress();
  }
});
window.addEventListener('pagehide', saveProgress);
