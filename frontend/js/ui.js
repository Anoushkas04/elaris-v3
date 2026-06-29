const $ = id => document.getElementById(id);

const SFX = (() => {
  let ctx = null;
  const init = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); };
  const tone = (freq, type='sine', dur=0.18, vol=0.22, delay=0) => {
    init();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    o.start(ctx.currentTime + delay);
    o.stop(ctx.currentTime + delay + dur + 0.05);
  };
  const noise = (dur=0.1, vol=0.15) => {
    init();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; s.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    s.start();
  };
  return {
    success: () => { tone(440,'sine',.1,.2); tone(660,'sine',.15,.18,.1); },
    fail:    () => { tone(200,'sawtooth',.25,.2); },
    click:   () => tone(800,'sine',.06,.1),
    pickup:  () => { tone(600,'sine',.08,.15); tone(900,'sine',.1,.12,.07); },
    unlock:  () => { tone(440,'sine',.1,.15); tone(554,'sine',.1,.15,.06); tone(659,'sine',.18,.12,.12); },
    horror:  () => { tone(80,'sawtooth',.8,.25); tone(60,'sawtooth',.9,.2,.1); },
    ambient: () => { for(let i=0;i<4;i++) tone(220+i*30,'sine',1.5,.04,i*.4); },
    scream:  () => { noise(.3,.3); tone(300,'sawtooth',.5,.2,.1); },
    fragment:() => { tone(523,'sine',.2,.15); tone(659,'sine',.25,.12,.15); tone(784,'sine',.3,.1,.3); },
    morse:   () => tone(800,'square',.08,.15),
    drag:    () => tone(400,'sine',.05,.08),
    alarm:   () => { tone(880,'square',.1,.2); tone(660,'square',.1,.2,.12); },
    gunshot: () => {
      const audio = new Audio('assets/gunshot.wav');
      audio.volume = 0.8;
      audio.play().catch(e => {
        console.warn("Failed to play gunshot audio, falling back to synth:", e);
        init();
        const dur = 1.0;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const s = ctx.createBufferSource(), g = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, ctx.currentTime);
        s.buffer = buf;
        s.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.8, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        s.start();
        
        const r = ctx.createOscillator(), rg = ctx.createGain();
        r.type = 'sawtooth';
        r.frequency.setValueAtTime(80, ctx.currentTime);
        r.connect(rg);
        rg.connect(ctx.destination);
        rg.gain.setValueAtTime(0.4, ctx.currentTime);
        rg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        r.start();
        r.stop(ctx.currentTime + 0.8);
      });
    }
  };
})();

const TTS = (() => {
  return {
    say: (text, pitch=1, rate=0.88) => { /* AI disabled per user request */ },
    stop: () => { /* AI disabled */ }
  };
})();

function flashScore(txt) {
  const el=$('score-flash'); el.textContent=txt; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),900);
}

function initBG() {
  const c = $('bg-canvas'), ctx = c.getContext('2d');
  let W, H, stars=[], frame=0;
  const resize = () => {
    W=c.width=window.innerWidth; H=c.height=window.innerHeight;
    stars = Array.from({length:140}, () => ({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.6+.2, a:Math.random(), s:Math.random()*.4+.05}));
  };
  window.addEventListener('resize', resize); resize();
  (function loop(){
    ctx.fillStyle='#050508'; ctx.fillRect(0,0,W,H);
    const g=ctx.createLinearGradient(0,H*.55,0,H); g.addColorStop(0,'transparent'); g.addColorStop(1,'rgba(15,25,50,.55)');
    ctx.fillStyle=g; ctx.fillRect(0,H*.55,W,H);
    for(let i=0;i<3;i++){
      ctx.beginPath();
      for(let x=0;x<=W;x++){const y=H*.78+Math.sin((x+frame*(i+1)*.35)*.013)*(7+i*5)+i*14; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.strokeStyle=`rgba(58,111,191,${0.07-i*.015})`; ctx.lineWidth=1.5; ctx.stroke();
    }
    stars.forEach(s=>{s.a+=s.s*.01; const a=(Math.sin(s.a)+1)/2; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle=`rgba(240,226,184,${a*.65})`; ctx.fill();});
    frame++; requestAnimationFrame(loop);
  })();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>{
    s.classList.remove('on');
    s.classList.remove('game-screen');
    s.style.pointerEvents = 'auto';
  });
  document.querySelectorAll('.game-panel').forEach(s=>s.classList.remove('on'));
  const el = $(id);
  if (el) {
    el.classList.add('on');
    el.style.pointerEvents = 'auto';
    const gp = el.querySelector('.game-panel');
    if (gp) gp.classList.add('on');

    const GAME_SCREENS = ['sc-beach', 'sc-lighthouse', 'sc-room', 'sc-bonfire', 'sc-baggage', 'sc-forest', 'sc-evidence', 'sc-cctv', 'sc-storm', 'sc-pathfinder'];
    if (GAME_SCREENS.includes(id)) {
      el.classList.add('game-screen');
      // Inject/update field manual sidebar
      let sidebar = el.querySelector('.field-manual-sidebar');
      if (!sidebar) {
        sidebar = document.createElement('div');
        sidebar.className = 'field-manual-sidebar';
        el.insertBefore(sidebar, el.firstChild);
      }
      const m = MODULES_DATA[GS.moduleIdx];
      if (id === 'sc-beach') {
        sidebar.innerHTML = `
          <h3>Field Manual</h3>
          <div class="section-title">${m.title}</div>
          <div class="section-title">Objective</div>
          <p style="font-weight: 700; color: #1a150e;">${m.task}</p>
          <div class="section-title">Evidence Checklist</div>
          <div id="beach-checklist" style="display: flex; flex-direction: column; gap: 8px; margin: 4px 0;">
            <label style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" id="chk-keycard" disabled style="width: auto; margin: 0;" />
              <span>Bloody Cloth</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" id="chk-match" disabled style="width: auto; margin: 0;" />
              <span>Voice Recorder</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" id="chk-footprint" disabled style="width: auto; margin: 0;" />
              <span>Footprints</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" id="chk-wine" disabled style="width: auto; margin: 0;" />
              <span>Wine Bottle</span>
            </label>
          </div>
          <div class="section-title">Manual Notes</div>
          <p>${m.hint}</p>
        `;
      } else {
        let hintText = m.hint;
        if (id === 'sc-room') {
          hintText = "Conduct a complete search of Cabin 7. Secure Kai's journal and recover any suspicious belongings found within the room by tapping on the objects in the room. Leave no evidence behind!";
        }
        sidebar.innerHTML = `
          <h3>Field Manual</h3>
          <div class="section-title">${m.title}</div>
          <div class="section-title">Objective</div>
          <p style="font-weight: 700; color: #1a150e;">${m.task}</p>
          <div class="section-title">Manual Notes</div>
          <p>${hintText}</p>
        `;
      }
    }
  }
  if (id === 'sc-home') {
    checkProgressButton();
  }
}

function showModal(id) {
  SFX.click();
  $(id).classList.add('on');
}

function closeModal(id) {
  SFX.click();
  $(id).classList.remove('on');
}

function updateMapActive(currentLoc) {
  document.querySelectorAll('.map-node').forEach(el => el.classList.remove('active'));
  const activeNode = $('mn-' + currentLoc);
  if (activeNode) { activeNode.classList.add('active'); }
}

function mapClick(loc) {
  SFX.click();
  alert(`Current destination node: ${loc}. Complete current module tasks to navigate.`);
}

function formatPlayerDateTime(d) {
  const pad = n => String(n).padStart(2, '0');
  const yr = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const dy = pad(d.getDate());
  const hr = pad(d.getHours());
  const mn = pad(d.getMinutes());
  return `${yr}-${mo}-${dy} ${hr}:${mn}`;
}

function escapeHtmlStr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showNotification(msg) {
  let container = $('game-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'game-toast-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '100000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.style.background = 'rgba(15, 10, 5, 0.95)';
  toast.style.border = '1px solid var(--gold-l)';
  toast.style.borderRadius = '4px';
  toast.style.padding = '12px 20px';
  toast.style.color = '#fff';
  toast.style.fontFamily = 'var(--ff-m)';
  toast.style.fontSize = '0.72rem';
  toast.style.letterSpacing = '0.08em';
  toast.style.textTransform = 'uppercase';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
  toast.style.backdropFilter = 'blur(10px)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.transition = 'all 0.35s cubic-bezier(0.19, 1, 0.22, 1)';
  toast.style.transform = 'translateX(100px)';
  toast.style.opacity = '0';
  
  toast.innerHTML = `<span style="color:var(--gold-l); font-size: 1rem; text-shadow: 0 0 5px var(--gold);">✦</span> <span>${msg}</span>`;
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });
  
  // Fade out
  setTimeout(() => {
    toast.style.transform = 'translateX(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
