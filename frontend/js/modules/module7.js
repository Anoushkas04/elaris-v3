function startEvidenceChallenge() {
  if (typeof initializeRandomAlibis === 'function') {
    initializeRandomAlibis();
  }

  const roundsConfig = [
    {
      cue: 'MA_A SI_GH — Spa Inventory: [GLITCH]',
      suspectName: 'Maya Singh',
      getCorrect: () => `8:30 PM - ${GS.randomAlibis.mayaInventoryText}`,
      getDistractors: () => ['7:30 PM - 9:00 PM', '9:30 PM - 11:00 PM', '8:00 PM - 9:30 PM']
    },
    {
      cue: 'RA_H_L QU_NN — Hired on 6-Month Contract: [GLITCH]',
      suspectName: 'Rachel Quinn',
      getCorrect: () => GS.randomAlibis.rachelContractText,
      getDistractors: () => ['April 12, 2026', 'June 12, 2026', 'May 22, 2026']
    },
    {
      cue: 'SA_AH BE_N_TT — Beach Photoshoot End: [GLITCH]',
      suspectName: 'Sarah Bennett',
      getCorrect: () => GS.randomAlibis.sarahPhotoshootText,
      getDistractors: () => ['8:30 PM', '9:30 PM', '10:30 PM']
    },
    {
      cue: 'NA_RA_OR — Closed Main Office: [GLITCH]',
      suspectName: 'Narrator',
      getCorrect: () => '9:30 PM',
      getDistractors: () => ['10:00 PM', '10:30 PM', '11:00 PM']
    },
    {
      cue: 'DR. AV_RY RO_S — Patient Log Audit: [GLITCH]',
      suspectName: 'Dr. Avery Ross',
      getCorrect: () => '8:45 PM - Midnight',
      getDistractors: () => ['8:00 PM - 9:30 PM', '9:15 PM - 10:45 PM', '10:30 PM - Midnight']
    },
    {
      cue: 'MA_CUS H_LE — Patrolled Perimeter: [GLITCH]',
      suspectName: 'Marcus Hale',
      getCorrect: () => '8:30 PM - 10:30 PM',
      getDistractors: () => ['7:30 PM - 8:30 PM', '9:00 PM - 10:45 PM', '10:45 PM onwards']
    },
    {
      cue: 'LE_A BR_OKS — Tide Pool Sampling: [GLITCH]',
      suspectName: 'Lena Brooks',
      getCorrect: () => '8:30 PM - 9:45 PM',
      getDistractors: () => ['8:00 PM - 9:00 PM', '9:00 PM - 10:15 PM', '9:30 PM - 10:45 PM']
    },
    {
      cue: 'NO_H ME_C_R — Reading in resort library: [GLITCH]',
      suspectName: 'Noah Mercer',
      getCorrect: () => '8:30 PM - 10:30 PM',
      getDistractors: () => ['7:30 PM - 8:30 PM', '9:00 PM - 11:00 PM', '10:45 PM onwards']
    },
    {
      cue: 'ET_AN CR_SS — Lounge Guest Interviews: [GLITCH]',
      suspectName: 'Ethan Cross',
      getCorrect: () => '8:45 PM - 10:30 PM',
      getDistractors: () => ['7:30 PM - 8:30 PM', '9:00 PM - 11:00 PM', '10:00 PM - Midnight']
    },
    {
      cue: 'OL_V_R GR_NT — Monitor Server Grids: [GLITCH]',
      suspectName: 'Oliver Grant',
      getCorrect: () => '8:15 PM - 10:00 PM',
      getDistractors: () => ['7:30 PM - 8:00 PM', '9:00 PM - 10:30 PM', '10:15 PM onwards']
    }
  ];

  // Pick a random round config
  const rConfig = roundsConfig[Math.floor(Math.random() * roundsConfig.length)];
  const correctText = rConfig.getCorrect();
  const distractors = rConfig.getDistractors();
  
  // Randomise options (shuffle them)
  const allOpts = [correctText, ...distractors];
  const shuffledOpts = [...allOpts].sort(() => Math.random() - 0.5);
  const correctIdx = shuffledOpts.indexOf(correctText);

  let attempt = 0; 
  window._testEvidenceCorrect = correctIdx;
  window._testEvidenceCorrectText = correctText;
  window._testEvidenceName = rConfig.suspectName;

  $('evi-attempt').textContent = 1; 
  $('evi-cue').textContent = 'Decrypt: ' + rConfig.cue;
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
  
  $('evi-opts').innerHTML = shuffledOpts.map((o,i) => `<button class="btn-secondary kara-opt" data-i="${i}" style="width:100%; text-align:left; padding:10px;">${o}</button>`).join('');
  
  $('evi-opts').querySelectorAll('.kara-opt').forEach(el => {
    el.onclick = () => {
      if (!GS.gameActive) return;
      const i = parseInt(el.dataset.i); SFX.click();
      if(i === correctIdx) { 
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
