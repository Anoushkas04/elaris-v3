function startEvidenceChallenge() {
  const rounds = [
    {
      cue: 'MA_A SI_GH — Spa Inventory: [GLITCH]',
      opts: ['7:30 PM - 9:00 PM', '8:30 PM - 10:00 PM', '9:30 PM - 11:00 PM', '8:00 PM - 9:30 PM'],
      correct: 1,
      suspectName: 'Maya Singh'
    },
    {
      cue: 'RA_H_L QU_NN — Hired on 6-Month Contract: [GLITCH]',
      opts: ['April 12, 2026', 'June 12, 2026', 'May 12, 2026', 'May 22, 2026'],
      correct: 2,
      suspectName: 'Rachel Quinn'
    },
    {
      cue: 'SA_AH BE_N_TT — Beach Photoshoot End: [GLITCH]',
      opts: ['8:30 PM', '9:30 PM', '10:30 PM', '9:00 PM'],
      correct: 1,
      suspectName: 'Sarah Bennett'
    },
    {
      cue: 'R_W_N AS_F_RD — Closed Main Office: [GLITCH]',
      opts: ['9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'],
      correct: 1,
      suspectName: 'Rowan Ashford'
    },
    {
      cue: 'DR. AV_RY RO_S — Patient Log Audit: [GLITCH]',
      opts: ['8:00 PM - 9:30 PM', '8:45 PM - Midnight', '9:15 PM - 10:45 PM', '10:30 PM - Midnight'],
      correct: 1,
      suspectName: 'Dr. Avery Ross'
    },
    {
      cue: 'MA_CUS H_LE — Patrolled Perimeter: [GLITCH]',
      opts: ['7:30 PM - 8:30 PM', '8:30 PM - 10:30 PM', '9:00 PM - 10:45 PM', '10:45 PM onwards'],
      correct: 1,
      suspectName: 'Marcus Hale'
    },
    {
      cue: 'LE_A BR_OKS — Tide Pool Sampling: [GLITCH]',
      opts: ['8:00 PM - 9:00 PM', '8:30 PM - 9:45 PM', '9:00 PM - 10:15 PM', '9:30 PM - 10:45 PM'],
      correct: 1,
      suspectName: 'Lena Brooks'
    },
    {
      cue: 'NO_H ME_C_R — Reading in resort library: [GLITCH]',
      opts: ['7:30 PM - 8:30 PM', '8:30 PM - 10:30 PM', '9:00 PM - 11:00 PM', '10:45 PM onwards'],
      correct: 1,
      suspectName: 'Noah Mercer'
    },
    {
      cue: 'ET_AN CR_SS — Lounge Guest Interviews: [GLITCH]',
      opts: ['7:30 PM - 8:30 PM', '8:45 PM - 10:30 PM', '9:00 PM - 11:00 PM', '10:00 PM - Midnight'],
      correct: 1,
      suspectName: 'Ethan Cross'
    },
    {
      cue: 'OL_V_R GR_NT — Monitor Server Grids: [GLITCH]',
      opts: ['7:30 PM - 8:00 PM', '8:15 PM - 10:00 PM', '9:00 PM - 10:30 PM', '10:15 PM onwards'],
      correct: 1,
      suspectName: 'Oliver Grant'
    }
  ];
  const r = rounds[Math.floor(Math.random()*rounds.length)];
  let attempt = 0; window._testEvidenceCorrect = r.correct;
  window._testEvidenceCorrectText = r.opts[r.correct];
  window._testEvidenceName = r.suspectName;
  $('evi-attempt').textContent = 1; $('evi-cue').textContent = 'Decrypt: ' + r.cue;
  const gameStart = Date.now();
  
  const distArea = $('evi-distraction-area');
  distArea.innerHTML = '';
  
  const scan = document.createElement('div');
  scan.style.position = 'absolute';
  scan.style.width = '100%';
  scan.style.height = '2px';
  scan.style.background = 'rgba(255, 50, 50, 0.4)';
  scan.style.boxShadow = '0 0 8px rgba(255, 50, 50, 0.8)';
  scan.style.animation = 'eviScan 2s linear infinite';
  distArea.appendChild(scan);

  const words = ['[CORRUPT]', '01000101', 'ECHO_LOG', 'SYSTEM_ERR', 'FILE_UNREAD', '[OVERLOAD]'];
  for(let i=0; i<12; i++) {
    const d = document.createElement('div');
    d.style.position = 'absolute';
    d.style.color = Math.random() > 0.5 ? 'rgba(196,164,101,0.15)' : 'rgba(192,71,31,0.15)';
    d.style.fontFamily = 'var(--ff-m)';
    d.style.fontSize = '0.65rem';
    d.style.left = (Math.random()*85)+'%';
    d.style.top = (Math.random()*80)+'%';
    d.style.whiteSpace = 'nowrap';
    d.style.animation = `eviGlitch ${1 + Math.random()*2}s ease-in-out infinite alternate`;
    d.textContent = words[Math.floor(Math.random()*words.length)];
    distArea.appendChild(d);
  }
  
  $('evi-opts').innerHTML = r.opts.map((o,i) => `<button class="btn-secondary kara-opt" data-i="${i}" style="width:100%; text-align:left; padding:10px;">${o}</button>`).join('');
  
  $('evi-opts').querySelectorAll('.kara-opt').forEach(el => {
    el.onclick = () => {
      if (!GS.gameActive) return;
      const i = parseInt(el.dataset.i); SFX.click();
      if(i === r.correct) { 
        el.classList.add('correct'); 
        GS.domains.distractionResistance = Math.min(100, GS.domains.distractionResistance + 20); 
        GS.telemetry.targetFilterEfficiency += 10;
        GS.gameActive = false;
        const activeScreen = document.querySelector('.screen.game-screen');
        if (activeScreen) activeScreen.style.pointerEvents = 'none';
        onModuleComplete(15, Date.now()-gameStart, true); 
      }
      else { 
        el.classList.add('wrong'); SFX.fail(); attempt++; $('evi-attempt').textContent = attempt+1;
        setTimeout(() => el.classList.remove('wrong'), 500);
        if(attempt >= 2) {
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(5, null, false);
        }
      }
    };
  });
}
