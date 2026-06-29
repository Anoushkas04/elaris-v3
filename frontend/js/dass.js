// ─ DASS RECORDING ─────────────────────────────────────────────
function recordDASS(scale, val, q) {
  GS.dassRaw.push({scale, val, q});
  let fullScale = scale;
  if (scale === 'D' || scale === 'depression') fullScale = 'depression';
  else if (scale === 'A' || scale === 'anxiety') fullScale = 'anxiety';
  else if (scale === 'S' || scale === 'stress') fullScale = 'stress';

  if (!GS.dass[fullScale]) GS.dass[fullScale] = [];
  GS.dass[fullScale].push(val);

  if (scale === 'D' || scale === 'A' || scale === 'S') {
    if (!GS.dass[scale]) GS.dass[scale] = [];
    GS.dass[scale].push(val);
  }
}

function parsePlayerDASS(s) {
  try {
    const raw = typeof s.dass === 'object' && s.dass !== null && !Array.isArray(s.dass)
      ? s.dass
      : JSON.parse(s.dass || '{}');
    return {
      depression: raw.depression || 0,
      anxiety:    raw.anxiety || 0,
      stress:     raw.stress || 0
    };
  } catch (_) {
    return { depression: 0, anxiety: 0, stress: 0 };
  }
}
