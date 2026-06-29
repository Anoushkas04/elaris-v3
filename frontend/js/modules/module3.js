function startRoom(){
  let attempt=0;
  window._cabinStartTime = Date.now();
  window._foundCabinJournal = false;
  window._foundCabinIntruder = false;
  window._cabinEvidenceLinked = false;
  window._dossierStartTime = null;
  window._dossierMistakes = 0;
  
  $('room-attempt').textContent=1;
  const grid=$('room-grid');
  
  if(!$('cabin-styles')) {
    const s=document.createElement('style');
    s.id='cabin-styles';
    s.textContent = `
      .room-item {
        position: absolute;
        cursor: pointer;
        filter: brightness(0.8) sepia(0.1) drop-shadow(0 3px 5px rgba(0,0,0,0.7));
        transition: all 0.25s ease;
      }
      .room-item:hover {
        filter: brightness(1.25) sepia(0) drop-shadow(0 0 12px rgba(196,164,101,0.95));
        transform: scale(1.18) translateY(-4px) !important;
      }
      .room-item.wrong {
        animation: shake 0.4s;
      }
      .room-item.right {
        filter: brightness(1.2) drop-shadow(0 0 15px #4ecda8) !important;
      }
    `;
    document.head.appendChild(s);
  }

  const items = [
    {id:'wine', img:'assets/wine_clean_v2.png', label:'Wine Glass', w:'22px'},
    {id:'notebook', img:'assets/notebook_clean_v2.png', label:'Hidden Notebook', w:'36px'},
    {id:'novel', img:'assets/novel_clean_v2.png', label:'Mystery Novel', w:'34px'},
    {id:'perfume', img:'assets/perfume_clean_v2.png', label:'Perfume Bottle', w:'25px'},
    {id:'locket', img:'assets/locket_clean_v2.png', label:'Silver Locket', w:'26px'},
    {id:'compass', img:'assets/compass_clean_v2.png', label:'Old Compass', w:'30px'},
    {id:'magnifying', img:'assets/magnifying_clean_v2.png', label:'Magnifying Glass', w:'32px'},
    {id:'cross', img:'assets/cross_clean_v2.png', label:'Wooden Cross', w:'25px'},
    {id:'medal', img:'assets/medal_clean_v2.png', label:'Military Medal', w:'28px'}
  ];
  
  // Select a random suspect (excluding player and Kai) as the intruder suspect for this playthrough
  const user = JSON.parse(localStorage.getItem('elaris_user') || '{}');
  const playerId = user.identity === 'academic' ? 'student' : user.identity;
  const candidates = ['doctor', 'ceo', 'musician', 'student', 'comedian', 'detective', 'influencer', 'therapist', 'rachel', 'gamer'].filter(id => id !== playerId);
  
  // Pick target suspect
  const targetSuspect = candidates[Math.floor(Math.random() * candidates.length)];
  window._cabinIntruderSuspect = targetSuspect;

  const killerIntruderMap = {
    doctor: 'locket',
    ceo: 'medal',
    musician: 'cross',
    student: 'magnifying',
    comedian: 'compass',
    detective: 'medal',
    rowan: 'wine',
    influencer: 'perfume',
    therapist: 'notebook',
    rachel: 'novel',
    gamer: 'notebook'
  };

  const targetId = killerIntruderMap[targetSuspect] || 'wine';
  const intruderIdx = items.findIndex(item => item.id === targetId);
  window._testRoomIntruder = items[intruderIdx].id;

  grid.className = '';
  grid.innerHTML = `
    <div style="position:relative;width:100%;height:480px;border-radius:4px;overflow:hidden;background:#111;box-shadow: 0 8px 32px rgba(0,0,0,0.5);border: 1px solid var(--glass-border);">
      <div style="width:100%; height:100%; position:relative;" id="room-scene">
        <img src="assets/cabin_bg_v3.png" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.85;">
        <div id="room-canvas-items" style="position:absolute; inset:0;"></div>
      </div>
    </div>
  `;

  const container = $('room-canvas-items');
  const W = container.getBoundingClientRect().width || container.clientWidth || 900;
  const H = container.getBoundingClientRect().height || container.clientHeight || 480;
  const placed = [];

  const isOverlap = (x, y, itemW, pad) => {
    const px = (x / 100) * W;
    const py = (y / 100) * H;
    const left1 = px - pad;
    const right1 = px + itemW + pad;
    const top1 = py - pad;
    const bottom1 = py + itemW + pad;
    return placed.some(p => {
      const left2 = p.px - pad;
      const right2 = p.px + p.w + pad;
      const top2 = p.py - pad;
      const bottom2 = p.py + p.w + pad;
      return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2);
    });
  };

  const zones = [
    { minX: 5,  maxX: 24, minY: 60, maxY: 75 },  // bed
    { minX: 20, maxX: 42, minY: 72, maxY: 88 },  // rug
    { minX: 34, maxX: 44, minY: 52, maxY: 58 },  // nightstand
    { minX: 49, maxX: 75, minY: 48, maxY: 54 },  // desk
    { minX: 38, maxX: 50, minY: 24, maxY: 26 },  // shelf
    { minX: 82, maxX: 98, minY: 52, maxY: 58 },  // dresser
    { minX: 52, maxX: 78, minY: 75, maxY: 88 }   // floor
  ];

  items.forEach((item, i) => {
    const itemW = parseFloat(item.w);
    let x, y, tries = 0, pad = 10;
    do {
      if (tries > 100) pad = 6;
      if (tries > 200) pad = 2;
      if (tries > 250) pad = 0;
      const zone = zones[Math.floor(Math.random() * zones.length)];
      x = zone.minX + Math.random() * (zone.maxX - zone.minX);
      y = zone.minY + Math.random() * (zone.maxY - zone.minY);
      tries++;
    } while (isOverlap(x, y, itemW, pad) && tries < 500);

    const px = (x / 100) * W;
    const py = (y / 100) * H;
    placed.push({ px, py, w: itemW });

    const c = document.createElement('img');
    c.className = 'room-item';
    c.src = item.img;
    c.style.width = item.w;
    c.style.left = x + '%';
    c.style.top = y + '%';
    c.style.transform = 'rotate(' + ((Math.random() - 0.5) * 30) + 'deg)';
    c.title = item.label;

    c.onclick = () => {
      if (!GS.gameActive) return;
      if (window._foundCabinIntruder) return;
      
      if (i === intruderIdx) { 
        SFX.success(); 
        c.classList.add('right'); 
        setTimeout(() => c.style.display = 'none', 400);
        window._foundCabinIntruder = true;
        checkCabinCompletion();
      } else {
        SFX.fail(); 
        c.classList.add('wrong'); 
        attempt++; 
        $('room-attempt').textContent = attempt + 1;
        GS.domains.recognition = Math.max(0, GS.domains.recognition - 5);
        c.style.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) drop-shadow(0 0 10px red)';
        setTimeout(() => {
          c.classList.remove('wrong');
          c.style.filter = '';
        }, 500);
      }
    };
    container.appendChild(c);
  });

  // Place Kai's Journal
  const journal = document.createElement('img');
  journal.className = 'room-item';
  journal.src = 'assets/notebook_clean_v2.png';
  journal.style.width = '35px';
  journal.style.left = '64%';
  journal.style.top = '48%';
  journal.style.transform = 'rotate(5deg)';
  journal.title = "Kai's Journal";
  journal.style.filter = 'drop-shadow(0 0 8px rgba(212,175,55,0.7))';
  
  journal.onclick = () => {
    if (!GS.gameActive) return;
    if (window._foundCabinJournal) return;
    SFX.pickup();
    journal.style.display = 'none';
    window._foundCabinJournal = true;
    
    const allSuspects = [...IDENTITIES, ...GS.npcs].filter(c => 
      c.id !== playerId && 
      c.id !== 'narrator' && 
      c.id !== 'keeper' && 
      c.id !== 'kai'
    );
    allSuspects.forEach(s => {
      if (!GS.unlockedSuspects.includes(s.id)) {
        GS.unlockedSuspects.push(s.id);
      }
    });
    updateDossierList();
    
    const journalCandidates = allSuspects.filter(s => s.id !== GS.murderer);
    const js1 = journalCandidates[0] || { name: 'Dr. Avery Ross' };
    const js2 = journalCandidates[1] || { name: 'Marcus Hale' };
    
    openJournalModal(js1, js2, () => {
      showNotification("Suspect Profiles Unlocked in Dossier");
      checkCabinCompletion();
    });
  };
  
  container.appendChild(journal);

  function checkCabinCompletion() {
    if (window._foundCabinJournal && window._foundCabinIntruder) {
      GS.gameActive = false;
      const activeScreen = document.querySelector('.screen.game-screen');
      if (activeScreen) activeScreen.style.pointerEvents = 'none';
      
      showDialog('Narrator', 
        'Whoever owns this... was here.', 
        null, 
        () => {
          showDialog('Narrator',
            'The identity remains unknown. Open the Case File Dossier to compare this object against the guests\' profiles.',
            null,
            () => {
              // Open the dossier modal automatically
              const cfBtn = $('cf-btn');
              if (cfBtn) cfBtn.click();
            },
            'narrator'
          );
        }, 
        'narrator'
      );
    }
  }
}
