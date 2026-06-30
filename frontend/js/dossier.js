// DOSSIER FLIPPING BOOK & TABBED DASHBOARD
let currentDossierPage = 0;
let dossierList = [];

function openJournalModal(js1, js2, cb) {
  // Styles for the journal modal
  if (!$('journal-styles')) {
    const s = document.createElement('style');
    s.id = 'journal-styles';
    s.textContent = `
      .journal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 150000;
        backdrop-filter: blur(8px);
        animation: journalFadeIn 0.3s ease-out;
      }
      .journal-container {
        width: 95%;
        max-width: 820px;
        height: 80vh;
        background: #3a221d;
        border-radius: 8px;
        box-shadow: 0 30px 70px rgba(0,0,0,0.85), inset 0 0 40px rgba(0,0,0,0.7);
        padding: 16px;
        position: relative;
        display: flex;
        gap: 12px;
        border: 6px solid #23120f;
        box-sizing: border-box;
        transform: rotate(-0.5deg);
      }
      .journal-spine {
        position: absolute;
        top: 16px;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        width: 16px;
        background: linear-gradient(90deg, rgba(0,0,0,0.5), rgba(255,255,255,0.1) 30%, rgba(0,0,0,0.2) 50%, rgba(255,255,255,0.1) 70%, rgba(0,0,0,0.5));
        box-shadow: inset 0 0 8px rgba(0,0,0,0.8);
        z-index: 10;
        border-radius: 2px;
      }
      .journal-page {
        flex: 1;
        background: #f1e7cf;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        padding: 22px 20px;
        display: flex;
        flex-direction: column;
        border: 1px solid #dfd2b4;
        box-sizing: border-box;
        position: relative;
        overflow-y: auto;
      }
      .journal-page-left {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        border-right: 1px solid rgba(0,0,0,0.15);
      }
      .journal-page-right {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        border-left: 1px solid rgba(0,0,0,0.15);
        clip-path: polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%);
      }
      .journal-page-right::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 24px;
        height: 24px;
        background: #3a221d;
        box-shadow: -2px -2px 6px rgba(0,0,0,0.25);
        transform: rotate(0deg);
        pointer-events: none;
        z-index: 4;
      }
      .folded-page-corner {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 24px;
        height: 24px;
        background: #dfd2b4;
        border-top-left-radius: 4px;
        box-shadow: -3px -3px 8px rgba(0,0,0,0.15);
        z-index: 5;
        pointer-events: none;
      }
      .journal-content {
        font-family: 'Caveat', cursive, 'Courier New', sans-serif;
        font-size: 1.15rem;
        line-height: 1.5;
        color: #2c241c;
      }
      .journal-close-btn {
        position: absolute;
        top: -15px;
        right: -15px;
        width: 32px;
        height: 32px;
        background: #2b1a15;
        color: #f4ecd8;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-weight: bold;
        font-size: 1.1rem;
        border: 2px solid #dfd2b4;
        z-index: 1000;
        transition: all 0.2s ease;
      }
      .journal-close-btn:hover {
        background: var(--gold-l);
        color: #2b1a15;
        transform: scale(1.1);
      }
      @keyframes journalFadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(s);
  }

  // Load the fonts if they aren't loaded yet
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Special+Elite&display=swap';
    document.head.appendChild(l);
  }

  const overlay = document.createElement('div');
  overlay.className = 'journal-overlay';
  overlay.id = 'journal-modal';

  overlay.innerHTML = `
    <div class="journal-container">
      <div class="journal-close-btn" id="journal-close">×</div>
      <div class="journal-spine"></div>
      
      <!-- LEFT PAGE -->
      <div class="journal-page journal-page-left">
        <!-- Tiny margins watermark of symbol -->
        <div style="position:absolute; top:10px; right:15px; width:20px; height:20px; opacity:0.18; transform:rotate(-12deg);">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#a23a1f" stroke-width="4"/><path d="M20,50 L80,50 M50,20 L50,80" stroke="#a23a1f" stroke-width="5"/></svg>
        </div>

        <div class="journal-content">
          <!-- Coffee Stain Ring -->
          <div style="position:absolute; width:100px; height:100px; border-radius:50%; border: 3px solid rgba(110,80,50,0.08); filter: blur(1.5px); top: 120px; left: -20px; pointer-events:none; transform: rotate(15deg);"></div>
          <div style="position:absolute; width:80px; height:70px; background: rgba(130,90,60,0.04); filter: blur(5px); top: 130px; left: -10px; pointer-events:none;"></div>

          <div style="border-bottom: 1.5px solid rgba(139,125,107,0.25); padding-bottom: 4px; margin-bottom: 12px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-family:'Special Elite', monospace; font-size:0.68rem; color:#8c7e6b; letter-spacing:0.05em; text-transform:uppercase;">Kai's Journal // Page 1</span>
          </div>

          <div style="line-height: 1.95rem; background: repeating-linear-gradient(transparent, transparent 1.9rem, rgba(90,75,60,0.1) 1.9rem, rgba(90,75,60,0.1) 1.95rem); text-align: left; padding: 0 4px;">
            <p style="margin: 0; font-weight: bold; color: #a23a1f; font-size: 1.25rem;">Oct 24 - Groundwork</p>
            <p style="margin: 0;">Ferry ride was completely silent. The Narrator gave us a rehearsed pitch about recovery, but the old Echo footprint is still visible. <span style="text-decoration: line-through; opacity: 0.65; color: #6e5e4d; font-style: italic;">They think I came here to write a review.</span> I need to make sure my notes stay hidden.</p>
            
            <p style="margin: 0; font-weight: bold; color: #a23a1f; font-size: 1.25rem; margin-top: 1rem;">Oct 25 - The Caretaker</p>
            <p style="margin: 0;">The keeper knows something. He is terrified of the management team. He whispered that <span style="border-bottom: 2.5px solid rgba(162,58,31,0.75); padding-bottom:1px; font-weight: bold;">critical documents are locked inside the lighthouse panel</span>.</p>
            <p style="margin: 0;">Who is coordinating the cover-up? Is it <span style="border: 1.5px dashed #3c54aa; border-radius: 50% 45% 52% 48%; padding: 1px 5px; display: inline-block; transform: rotate(-2.5deg); margin: 0 1px; color:#21338a; font-weight:bold;">${js1.name}</span>? Or is <span style="border: 1.5px dashed #3c54aa; border-radius: 48% 50% 45% 52%; padding: 1px 5px; display: inline-block; transform: rotate(1.5deg); margin: 0 1px; color:#21338a; font-weight:bold;">${js2.name}</span> the main agent? Heard them arguing near the tidepools last night. They mentioned files going missing.</p>
          </div>
        </div>
      </div>

      <!-- RIGHT PAGE -->
      <div class="journal-page journal-page-right" style="position:relative;">
        <div class="folded-page-corner"></div>
        
        <!-- Tiny margins watermark of symbol -->
        <div style="position:absolute; bottom:15px; left:15px; width:25px; height:25px; opacity:0.15; transform:rotate(25deg);">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#a23a1f" stroke-width="4"/><path d="M20,50 L80,50 M50,20 L50,80" stroke="#a23a1f" stroke-width="5"/></svg>
        </div>

        <div class="journal-content">
          <div style="border-bottom: 1.5px solid rgba(139,125,107,0.25); padding-bottom: 4px; margin-bottom: 12px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-family:'Special Elite', monospace; font-size:0.68rem; color:#8c7e6b; letter-spacing:0.05em; text-transform:uppercase;">Kai's Journal // Page 2</span>
            <span style="font-family:'Special Elite', monospace; font-size:0.68rem; color:#a23a1f;">[CLASSIFIED]</span>
          </div>

          <div style="line-height: 1.95rem; background: repeating-linear-gradient(transparent, transparent 1.9rem, rgba(90,75,60,0.1) 1.9rem, rgba(90,75,60,0.1) 1.95rem); text-align: left; padding: 0 4px;">
            <p style="margin: 0; font-weight: bold; color: #a23a1f; font-size: 1.25rem;">Oct 26 - Warning</p>
            <p style="margin: 0;">Rowan asked about my archives. They are tracking my queries. <span style="text-decoration: line-through; opacity: 0.65; color: #6e5e4d; font-style: italic;">I'm running out of time.</span> The backup security panels are active. If they trigger a lockdown, check the timelines logs of the guests to extract the digit code. One guest left an item behind in the cabin that bridges the network.</p>

            <!-- Draw/Sketch section -->
            <div style="display:flex; justify-content: space-between; margin-top: 0.8rem; align-items: center; border-top: 1px dotted rgba(90,75,60,0.3); padding-top: 0.8rem; position:relative;">
              <div style="width: 50%; line-height: 1.35; font-size: 1.05rem;">
                <p style="margin: 0; font-style: italic; color: #5a4b3c;">The key leads to the control panels. Watch the sequence. Repeat. Don't fail.</p>
              </div>
              
              <!-- Sketches -->
              <div style="width: 45%; text-align: center; opacity: 0.9; transform: rotate(1deg); position:relative;">
                <!-- SVG Arrow connecting sketch to note -->
                <svg style="position:absolute; top:-25px; left:-35px; width:45px; height:45px; pointer-events:none; overflow:visible;">
                  <path d="M 40,5 C 20,20 5,30 2,40" fill="none" stroke="#3c54aa" stroke-width="1.5" stroke-dasharray="2 2" stroke-linecap="round"/>
                  <path d="M 2,40 L 8,36 M 2,40 L 4,46" fill="none" stroke="#3c54aa" stroke-width="1.5" stroke-linecap="round"/>
                </svg>

                <svg width="95" height="95" viewBox="0 0 100 100" style="filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.15)); background: rgba(0,0,0,0.02); border-radius: 4px; padding: 2px;">
                  <path d="M 35,80 L 42,35 L 48,35 L 55,80 Z" fill="none" stroke="#42352b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M 42,35 L 45,20 L 48,35" fill="none" stroke="#42352b" stroke-width="1.5" />
                  <line x1="38" y1="62" x2="52" y2="62" stroke="#42352b" stroke-width="1" />
                  <line x1="40" y1="48" x2="50" y2="48" stroke="#42352b" stroke-width="1" />
                  
                  <circle cx="45" cy="50" r="16" fill="none" stroke="#a23a1f" stroke-width="2" stroke-dasharray="1.5 2.5" />
                  <path d="M 32,50 L 58,50 M 45,37 L 45,63" fill="none" stroke="#a23a1f" stroke-width="2.5" stroke-linecap="round" />
                </svg>
                <div style="font-family:'Special Elite', monospace; font-size: 0.52rem; color: #a23a1f; margin-top: 1px; transform: rotate(-2deg);">SYMBOL IN THE ARCHIVE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#journal-close').onclick = () => {
    SFX.click();
    overlay.remove();
    if (cb) cb();
  };
}

function updateDossierList() {
  const playerId = GS.playerIdentity || (() => {
    const user = JSON.parse(localStorage.getItem('elaris_user') || '{}');
    return user.identity === 'academic' ? 'student' : user.identity;
  })();
  
  if (!GS.unlockedSuspects) {
    GS.unlockedSuspects = [];
  }
  
  let allSuspects = [...IDENTITIES, ...NPCS_BASE].filter(c => 
    c.id !== 'rowan' && c.id !== 'narrator' && 
    c.id !== 'keeper' && 
    c.id !== 'kai'
  );
  
  // Filter by unlocked suspects
  allSuspects = allSuspects.filter(c => GS.unlockedSuspects.includes(c.id));
  
  // Filter by height if height filter is active
  if (GS.heightFilterActive && GS.footprintMinHeight && GS.footprintMaxHeight) {
    allSuspects = allSuspects.filter(c => {
      const h = c.height || 175;
      return h >= GS.footprintMinHeight && h <= GS.footprintMaxHeight;
    });
  }
  
  dossierList = allSuspects;
}

function isSecretUnlocked(npcId) {
  if (GS.fragments[7]) return true; // Unlock everyone's secret after Module 8
  if (npcId === 'ceo') return GS.fragments[0] || GS.fragments[7];
  if (npcId === 'gamer') return GS.fragments[1];
  if (npcId === 'doctor') return GS.fragments[2];
  if (npcId === 'musician') return GS.fragments[2];
  if (npcId === 'rachel') return GS.fragments[3];
  if (npcId === 'student') return GS.fragments[5];
  if (npcId === 'detective') return GS.fragments[6];
  if (npcId === 'comedian') return GS.fragments[7];
  if (npcId === 'therapist') return GS.fragments[8];
  if (npcId === 'influencer') return GS.fragments[9];
  return false;
}

function isVictimTruthUnlocked(victimId) {
  if (victimId === 'kai') return GS.fragments[0];
  if (victimId === 'keeper') return GS.fragments[1];
  if (victimId === 'bonfireVictim') return GS.fragments[3];
  return false;
}

function getSuspectBelongingName(id) {
  const map = {
    doctor: 'Silver Locket',
    ceo: 'Military Medal',
    musician: 'Wooden Cross',
    student: 'Magnifying Glass',
    comedian: 'Old Compass',
    detective: 'Military Medal',
    rowan: 'Wine Glass',
    influencer: 'Perfume Bottle',
    therapist: 'Hidden Notebook',
    rachel: 'Mystery Novel',
    gamer: 'Hidden Notebook'
  };
  return map[id] || 'Unknown Belonging';
}

function showDossierCard() {
  if (dossierList.length === 0) updateDossierList();
  
  if (dossierList.length === 0) {
    $('cf-book-card').innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-dm); font-family:var(--ff-m); font-size:0.85rem; padding: 40px; text-align: center; width: 100%;">
        <span style="font-size: 2.5rem; margin-bottom: 15px;">🔒</span>
        <div style="font-family:var(--ff-t); font-size:1.1rem; color:var(--gold-l); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">Dossiers Locked</div>
        No suspects identified yet.<br><br>Continue the investigation on the beach to unlock suspect case files.
      </div>
    `;
    $('cf-page-num').textContent = '0';
    $('cf-page-total').textContent = '0';
    return;
  }
  
  const profile = dossierList[currentDossierPage];
  if (!profile) return;
  
  const details = profile.details || 'No detailed records found.';
  const alibi = profile.alibi || 'No verified alibi.';
  
  $('cf-page-num').textContent = currentDossierPage + 1;
  $('cf-page-total').textContent = dossierList.length;

  // Determine File No
  let fileNo = 'EL-' + String(currentDossierPage + 101).padStart(4, '0');
  let status = 'SUSPECT';

  // Check progressive unredaction of secret in individual view
  const isUnlocked = isSecretUnlocked(profile.id);
  const secretHtml = isUnlocked 
    ? `<div style="margin-top: 12px; border-top: 1px dashed rgba(90,75,60,0.3); padding-top: 8px;">
         <h5 style="color:#c0471f; font-family:var(--ff-m); font-size:0.72rem; margin-bottom:4px; text-transform:uppercase;">UNCOVERED HIDDEN TRUTH</h5>
         <p style="font-family:var(--ff-m); font-size:0.72rem; color:#2b241a; line-height:1.4;">${profile.secret}</p>
       </div>`
    : `<div style="margin-top: 12px; border-top: 1px dashed rgba(90,75,60,0.3); padding-top: 8px;">
         <h5 style="color:#6e5e4d; font-family:var(--ff-m); font-size:0.72rem; margin-bottom:4px; text-transform:uppercase;">UNCOVERED HIDDEN TRUTH</h5>
         <span class="redacted-clue">[REDACTED - RECOVER MORE EVIDENCE]</span>
       </div>`;

  let linkBtnHtml = '';
  if (GS.moduleIdx === 2 && window._foundCabinIntruder && !window._cabinEvidenceLinked) {
    linkBtnHtml = `
      <div style="margin-top: 15px; border-top: 1px solid rgba(90,75,60,0.25); padding-top: 12px; text-align: center;">
        <button class="btn-main" onclick="linkCabinEvidence('${profile.id}')" style="width: 100%; font-size: 0.72rem; padding: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); cursor: pointer;">
          Link Discovered Object to ${profile.name}
        </button>
      </div>
    `;
  }

  $('cf-book-card').innerHTML = `
    <div class="case-stamp">CLASSIFIED</div>
    <div class="book-row">
      <div class="book-page-left">
        <div style="position: relative; display: inline-block; margin-top: 10px; width: 105px; height: 120px;">
          <div class="paperclip"></div>
          <div style="width: 100%; height: 100%; border: 1px solid #c2b59b; background: #faf6f0; box-shadow: 2px 4px 8px rgba(0,0,0,0.15); transform: rotate(-2deg); overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${profile.id === 'ceo' 
              ? `<img src="assets/MARCUS-HALE.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'doctor'
              ? `<img src="assets/AVERY-ROSS.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'musician'
              ? `<img src="assets/LENA-BROOKS.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'rachel'
              ? `<img src="assets/RACHEL.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'comedian'
              ? `<img src="assets/ETHAN.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'therapist'
              ? `<img src="assets/MAYA-SINGH.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'detective'
              ? `<img src="assets/OLIVER-GRANT.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'gamer'
              ? `<img src="assets/DANIEL-PRICE.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'influencer'
              ? `<img src="assets/SARAH-BENNETT.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'kai'
              ? `<img src="assets/KAI-NAKAMURA.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'student'
              ? `<img src="assets/NOAH-MERCER.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'keeper'
              ? `<img src="assets/LIGHTHOUSE-KEEPER.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : makeSVGChar(profile, false)}
          </div>
        </div>
        <h4 style="font-size:0.85rem; color:#2b241a; font-family:var(--ff-m); margin-bottom: 2px; border-bottom: 1px dashed #8c7e6b; padding-bottom: 2px; word-break: break-word; line-height: 1.2;">${profile.icon || ''} ${profile.name}</h4>
        <p style="font-size:0.62rem; color:#5a4b3c; font-family:var(--ff-m); margin-bottom: 8px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; line-height: 1.2;">${profile.role}</p>
        
        <div style="font-family: var(--ff-m); font-size: 0.65rem; color: #4a3b2c; border-top: 1px dotted #8c7e6b; width: 90%; padding-top: 8px; margin-top: 5px; text-align: left; line-height: 1.5;">
          <strong>FILE NO:</strong> ${fileNo}<br>
          <strong>STATUS:</strong> <span style="color: #8e5b15; font-weight: bold;">${status}</span><br>
          <strong>BELONGING:</strong> ${getSuspectBelongingName(profile.id)}
        </div>
      </div>
      <div class="book-page-right-wrapper" style="position: relative; height: 100%; display: flex; flex-direction: column; overflow: hidden; width: 100%;">
        <div class="book-page-right" id="cf-page-right" style="flex: 1; overflow-y: auto; padding-right: 5px; padding-bottom: 25px;">
          <h5 style="color:#8e5b15; font-family:var(--ff-m); font-size:0.72rem; margin-bottom:6px; text-transform:uppercase; border-bottom: 1px solid rgba(90,75,60,0.25); padding-bottom: 2px; letter-spacing: 0.05em;">SUBJECT BRIEF // DOSSIER LOG</h5>
          <p style="margin-bottom:14px; font-size:0.75rem; color:#2b241a; line-height: 1.45;">${details}</p>
          <h5 style="color:#a82e2e; font-family:var(--ff-m); font-size:0.72rem; margin-bottom:4px; text-transform:uppercase; border-bottom: 1px solid rgba(90,75,60,0.25); padding-bottom: 2px; letter-spacing: 0.05em;">CHRONOLOGICAL ALIBI TIMELINE</h5>
          <p style="font-style:italic; font-size:0.72rem; color:#4a3b2c; line-height: 1.4;">${alibi}</p>
          ${secretHtml}
          ${linkBtnHtml}
        </div>
        <div class="scroll-arrow-down" id="dossier-scroll-arrow" style="display: none;">▼</div>
      </div>
    </div>
  `;

  const pageRight = $('cf-page-right');
  const arrow = $('dossier-scroll-arrow');
  
  const updateArrow = () => {
    const maxScroll = pageRight.scrollHeight - pageRight.clientHeight;
    if (maxScroll > 1 && pageRight.scrollTop < maxScroll - 5) {
      arrow.style.display = 'flex';
    } else {
      arrow.style.display = 'none';
    }
  };

  setTimeout(updateArrow, 100);
  pageRight.onscroll = updateArrow;
  
  arrow.onclick = () => {
    pageRight.scrollBy({ top: 60, behavior: 'smooth' });
  };
}

window.linkCabinEvidence = function(suspectId) {
  if (suspectId === window._cabinIntruderSuspect) {
    showNotification('Evidence linked successfully.<br>New suspect connection established.');
    SFX.success();
    window._cabinEvidenceLinked = true;
    
    // Calculate and record DASS metrics based on player performance
    const elapsed = (Date.now() - (window._dossierStartTime || Date.now())) / 1000;
    const mistakes = window._dossierMistakes || 0;
    
    let stressVal = 0;
    if (elapsed > 45) stressVal = 3;
    else if (elapsed > 30) stressVal = 2;
    else if (elapsed > 15) stressVal = 1;
    
    let anxietyVal = 0;
    if (mistakes >= 3) anxietyVal = 3;
    else if (mistakes === 2) anxietyVal = 2;
    else if (mistakes === 1) anxietyVal = 1;
    
    recordDASS('stress', stressVal, 'Cabin 7 Evidence Linking speed');
    recordDASS('anxiety', anxietyVal, 'Cabin 7 Evidence Linking mistakes');
    
    // Remove the side bubble
    const bubble = document.getElementById('narrator-side-bubble');
    if (bubble) bubble.remove();
    
    finishModule3Narrative();
  } else {
    showNotification('The evidence doesn\'t match this suspect.<br>Try again.');
    SFX.fail();
    window._dossierMistakes = (window._dossierMistakes || 0) + 1;
  }
};

function finishModule3Narrative() {
  closeModal('modal-cf');
  showScreen('sc-narrative');
  const bgImg = $('narrative-bg-img');
  if (bgImg) bgImg.src = 'assets/cabin7.jpeg';
  
  showDialog('Narrator',
    'Kai wasn\'t collecting memories...',
    null,
    () => {
      showDialog('Narrator',
        'He was collecting evidence.',
        null,
        () => {
          showDialog('Narrator',
            'And someone wanted to make sure he never finished.',
            null,
            () => {
              showDialog('Narrator',
                'The group notices a mysterious symbol drawn inside the journal.\n\nNo explanation is given.\n\nThe symbol is automatically stored as evidence.',
                null,
                () => {
                  const rt = Date.now() - (window._cabinStartTime || Date.now());
                  onModuleComplete(15, rt, true);
                },
                'narrator'
              );
            },
            'narrator'
          );
        },
        'narrator'
      );
    },
    'narrator'
  );
}

function prevDossierPage() {
  SFX.click();
  if(currentDossierPage > 0) {
    currentDossierPage--;
    showDossierCard();
  }
}

function nextDossierPage() {
  SFX.click();
  if(currentDossierPage < dossierList.length - 1) {
    currentDossierPage++;
    showDossierCard();
  }
}

// Rendering functions for progressive unredaction tables
function renderSuspectsTable() {
  const body = $('manifest-table-body');
  body.innerHTML = '';
  
  if (dossierList.length === 0) {
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dm);padding:40px;font-family:var(--ff-m);font-size:0.85rem;">🔒 No suspects identified yet.</td></tr>';
    return;
  }
  
  dossierList.forEach(s => {
    const isUnlocked = isSecretUnlocked(s.id);
    const secretText = isUnlocked 
      ? `<div class="unredacted-clue">${s.secret}</div>` 
      : `<div class="redacted-clue">[REDACTED - RECOVER ENVELOPE]</div>`;
    
    body.innerHTML += `
      <tr>
        <td style="width: 50px; text-align: center;">
          <div style="width: 40px; height: 45px; border: 1px solid rgba(196, 164, 101, 0.3); border-radius: 2px; background: rgba(0,0,0,0.3); overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${s.id === 'ceo' 
              ? `<img src="assets/MARCUS-HALE.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'doctor'
              ? `<img src="assets/AVERY-ROSS.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'musician'
              ? `<img src="assets/LENA-BROOKS.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'rachel'
              ? `<img src="assets/RACHEL.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'comedian'
              ? `<img src="assets/ETHAN.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'therapist'
              ? `<img src="assets/MAYA-SINGH.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'detective'
              ? `<img src="assets/OLIVER-GRANT.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'gamer'
              ? `<img src="assets/DANIEL-PRICE.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'influencer'
              ? `<img src="assets/SARAH-BENNETT.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'kai'
              ? `<img src="assets/KAI-NAKAMURA.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'student'
              ? `<img src="assets/NOAH-MERCER.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'keeper'
              ? `<img src="assets/LIGHTHOUSE-KEEPER.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : makeSVGChar(s, false)}
          </div>
        </td>
        <td style="font-family: var(--ff-t); font-weight: bold; color: var(--gold-l);">${s.icon || ''} ${s.name}</td>
        <td>${s.role}</td>
        <td style="font-size: 0.72rem; color: var(--text-d); font-style: italic;">${s.trait}</td>
        <td>${secretText}</td>
      </tr>
    `;
  });
}

function renderVictimsTable() {
  const body = $('victims-table-body');
  body.innerHTML = '';
  
  const victims = [];
  
  // Kai Nakamura - always dead and announced in the intro, so visible from Module 1 (GS.moduleIdx >= 0)
  if (GS.moduleIdx >= 0) {
    const kaiNPC = GS.npcs.find(n => n.id === 'kai');
    if (kaiNPC && !kaiNPC.alive) {
      victims.push({ id: 'kai', name: 'Kai Nakamura', role: 'Investigative Journalist', tod: 'Start of Game', truth: 'Not completely innocent. He illegally accessed confidential files and leaked participant information while investigating Project Echo.' });
    }
  }
  
  // Lighthouse Keeper - announced after Module 2 completes (keeper is marked deceased)
  if (GS.moduleIdx >= 2) {
    const keeperNPC = GS.npcs.find(n => n.id === 'keeper');
    if (keeperNPC && !keeperNPC.alive) {
      victims.push({ id: 'keeper', name: 'Lighthouse Keeper', role: 'Former Caretaker', tod: 'End of Module 2', truth: 'Secretly maintained a hidden archive of Project Echo documents after the project shut down.' });
    }
  }
  
  // Bonfire Victim - announced after Module 4 completes (bonfireVictim is marked deceased)
  if (GS.moduleIdx >= 4 && GS.bonfireVictim && GS.bonfireVictim !== 'narrator') {
    const bonfireVictimNPC = [...IDENTITIES, ...GS.npcs].find(c => c.id === GS.bonfireVictim);
    if (bonfireVictimNPC && !bonfireVictimNPC.alive) {
      victims.push({ id: 'bonfireVictim', name: bonfireVictimNPC.name, role: bonfireVictimNPC.role, tod: 'End of Module 4', truth: 'Learns a crucial truth and lies about it during the bonfire, triggering their death.' });
    }
  }
  
  if (victims.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding: 25px 10px; color:var(--text-dm);">
          <div style="font-family:var(--ff-t); font-size:1.1rem; color:var(--gold-l); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">[CLASSIFIED]</div>
          Victim data unavailable. Continue the investigation to unlock this section.
        </td>
      </tr>
    `;
    return;
  }

  victims.forEach(v => {
    const isUnlocked = isVictimTruthUnlocked(v.id);
    const truthText = isUnlocked 
      ? `<div class="unredacted-clue">${v.truth}</div>` 
      : `<div class="redacted-clue">[REDACTED - RECOVER ENVELOPE]</div>`;
    const statusText = `<span style="color:#b22222; font-weight:bold;">DECEASED</span>`;
      
    body.innerHTML += `
      <tr>
        <td style="font-family: var(--ff-t); font-weight: bold; color: #ff5e4d;">💀 ${v.name}</td>
        <td>${v.role}</td>
        <td style="font-size:0.75rem;">${v.tod}<br>${statusText}</td>
        <td>${truthText}</td>
      </tr>
    `;
  });
}

window.switchDossierTab = (tabName) => {
  SFX.click();
  document.querySelectorAll('.cf-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
  });
  document.querySelectorAll('.cf-panel').forEach(panel => {
    panel.style.display = panel.id === 'cf-panel-' + tabName ? 'block' : 'none';
  });
  
  if (tabName === 'manifest') {
    renderSuspectsTable();
  } else if (tabName === 'victims') {
    renderVictimsTable();
  }
};

window.toggleHeightFilter = () => {
  SFX.click();
  const checkbox = $('filter-height-checkbox');
  GS.heightFilterActive = checkbox ? checkbox.checked : false;
  
  updateDossierList();
  currentDossierPage = 0;
  
  // Refresh current active view
  const activeTabBtn = document.querySelector('.cf-tab-btn.active');
  if (activeTabBtn) {
    const clickAttr = activeTabBtn.getAttribute('onclick');
    if (clickAttr.includes('manifest')) {
      renderSuspectsTable();
    } else if (clickAttr.includes('dossiers')) {
      showDossierCard();
    }
  }
};

// Hook Files dossiers button
$('cf-btn').onclick = () => {
  updateDossierList();
  
  if (GS.heightFilterUnlocked) {
    $('cf-filters').style.display = 'flex';
    $('filter-height-range').textContent = `${GS.footprintMinHeight} - ${GS.footprintMaxHeight}`;
    const cb = $('filter-height-checkbox');
    if (cb) cb.checked = GS.heightFilterActive;
  } else {
    $('cf-filters').style.display = 'none';
  }
  
  document.querySelectorAll('.cf-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector('.cf-tab-btn[onclick*="dossiers"]');
  if (activeBtn) activeBtn.classList.add('active');
  
  document.querySelectorAll('.cf-panel').forEach(p => p.style.display = 'none');
  $('cf-panel-dossiers').style.display = 'block';

  currentDossierPage = 0;
  showDossierCard();
  showModal('modal-cf');
  
  // Show side bubble if in Module 3 and evidence is not linked yet
  if (GS.moduleIdx === 2 && window._foundCabinIntruder && !window._cabinEvidenceLinked) {
    window.showNarratorSideBubble();
  }
};

// Hook Map button
$('map-btn').onclick = () => {
  showModal('modal-map');
};

window.showNarratorSideBubble = function() {
  const existing = document.getElementById('narrator-side-bubble');
  if (existing) existing.remove();

  if (!window._dossierStartTime) {
    window._dossierStartTime = Date.now();
    window._dossierMistakes = 0;
  }

  if (!document.getElementById('narrator-bubble-styles')) {
    const s = document.createElement('style');
    s.id = 'narrator-bubble-styles';
    s.textContent = `
      @keyframes fadeInBubble {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #narrator-side-bubble {
        position: fixed;
        z-index: 1000000;
        background: linear-gradient(135deg, #1c1917, #0c0a09);
        border: 1.5px solid #d4af37;
        border-radius: 8px;
        padding: 12px 16px;
        width: 280px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.6);
        color: #f5f0eb;
        font-family: var(--ff-m);
        font-size: 0.82rem;
        line-height: 1.45;
        animation: fadeInBubble 0.4s ease;
        right: 30px;
        top: 150px;
      }
      @media (max-width: 1140px) {
        #narrator-side-bubble {
          left: 20px;
          top: 20px;
          right: auto;
        }
      }
    `;
    document.head.appendChild(s);
  }
  
  const bubble = document.createElement('div');
  bubble.id = 'narrator-side-bubble';
  
  bubble.innerHTML = `
    <div style="font-weight: bold; color: #d4af37; margin-bottom: 4px; text-transform: uppercase; font-size: 0.72rem; display: flex; align-items: center; gap: 6px;">
      🔊 Narrator
    </div>
    <div>scroll down in all characters profile to check if the evidence found belongs to them</div>
    <div style="font-size: 0.68rem; color: #a29b94; margin-top: 6px; font-style: italic; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
      Mandatory Side Task
    </div>
  `;
  document.body.appendChild(bubble);
};
