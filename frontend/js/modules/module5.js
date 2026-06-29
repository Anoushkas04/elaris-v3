function startBaggage(){
  const masterPool = [
    { owner: 'Dr. Avery Ross', item: '🩺 Clinical Notepad' },
    { owner: 'Marcus Hale', item: '🔦 Tactical Flashlight' },
    { owner: 'Lena Brooks', item: '🧪 Water Sampler' },
    { owner: 'Noah Mercer', item: '💾 Encrypted USB' },
    { owner: 'Ethan Cross', item: '🎤 Voice Recorder' },
    { owner: 'Rachel Quinn', item: '💼 Legal Briefcase' },
    { owner: 'Maya Singh', item: '🩹 First Aid Kit' },
    { owner: 'Oliver Grant', item: '💻 Network Sniffer' },
    { owner: 'Daniel Price', item: '📊 Lab Logbook' },
    { owner: 'Sarah Bennett', item: '💍 Diamond Ring' }
  ];
  const pairs = [...masterPool].sort(() => Math.random() - 0.5).slice(0, 4);
  const shuffledOwners = [...pairs].sort(() => Math.random() - 0.5);
  const shuffledItems = [...pairs].sort(() => Math.random() - 0.5);
  const pMap = {}; pairs.forEach(p => pMap[p.owner] = p.item);
  let matched = 0, selOwner = null, selOwnerEl = null;
  const gameStart = Date.now();
  $('baggage-area').innerHTML = `
    <div class="bag-pair">
      <div><div class="bag-col-head">Owners</div>${shuffledOwners.map(p => `<div class="kara-opt" data-owner="${p.owner}" style="margin-bottom:8px">${p.owner}</div>`).join('')}</div>
      <div><div class="bag-col-head">Items</div>${shuffledItems.map(p => `<div class="kara-opt" data-item="${p.item}" style="margin-bottom:8px">${p.item}</div>`).join('')}</div>
    </div>`;
  $('baggage-area').querySelectorAll('[data-owner]').forEach(el=>{
    el.onclick=()=>{
      if (!GS.gameActive) return;
      SFX.click(); document.querySelectorAll('[data-owner]').forEach(b=>b.style.borderColor='rgba(196,164,101,.2)');
      el.style.borderColor='var(--gold)'; selOwner=el.dataset.owner; selOwnerEl=el;
      $('baggage-status').textContent='Now select their item →';
    };
  });
  $('baggage-area').querySelectorAll('[data-item]').forEach(el=>{
    el.onclick=()=>{
      if (!GS.gameActive) return;
      if(!selOwner){ $('baggage-status').textContent='Select an owner first!'; return; }
      SFX.click();
      if(pMap[selOwner]===el.dataset.item){
        selOwnerEl.classList.add('correct'); el.classList.add('correct');
        selOwnerEl.onclick=null; el.onclick=null;
        GS.domains.decisionMaking=Math.min(100,GS.domains.decisionMaking+16);
        matched++; selOwner=null; selOwnerEl=null;
        $('baggage-status').textContent=`Matched ${matched}/${pairs.length}`;
        if(matched>=pairs.length) {
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(15,Date.now()-gameStart,true);
        }
      } else {
        SFX.fail(); el.classList.add('wrong'); selOwnerEl.classList.add('wrong');
        setTimeout(()=>{ el.classList.remove('wrong'); if(selOwnerEl)selOwnerEl.classList.remove('wrong'); },500);
        selOwner=null; selOwnerEl=null;
        $('baggage-status').textContent='Wrong match — try again';
      }
    };
  });
}
