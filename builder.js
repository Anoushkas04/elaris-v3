const fs = require('fs');
let html = fs.readFileSync('frontend/game.html', 'utf8');

// 1. Replace startBeach
const beachStart = html.indexOf('function startBeach() {');
const beachEnd = html.indexOf('function finishBeach(t)');
if(beachStart > -1 && beachEnd > -1) {
  html = html.substring(0, beachStart) + `function startBeach() {
  const area = $('beach-area');
  area.innerHTML = \`
    <div style="position:relative;width:100%;height:480px;border-radius:4px;overflow:hidden;background:#111;">
      <div style="width:100%; height:100%; position:relative;" id="beach-scene">
        <img src="assets/beach.png" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.85;">
        <div id="beach-canvas-items" style="position:absolute; inset:0;"></div>
        <div id="beach-start-overlay" style="position:absolute;inset:0;background:rgba(5,5,8,0.85);display:flex;align-items:center;justify-content:center;z-index:10;backdrop-filter:blur(4px);">
          <button class="btn-main" id="btn-start-beach">Start Search</button>
        </div>
      </div>
    </div>
  \`;

  // CSS for the hover effect
  if(!$('beach-hover-style')) {
    const style = document.createElement('style');
    style.id = 'beach-hover-style';
    style.textContent = \`
      .beach-item {
        position: absolute;
        cursor: pointer;
        filter: brightness(0.75) sepia(0.2) drop-shadow(0 4px 6px rgba(0,0,0,0.8));
        transition: all 0.3s ease;
      }
      .beach-item:hover {
        filter: brightness(1.2) sepia(0) drop-shadow(0 0 10px rgba(196,164,101,0.9));
        transform: scale(1.15) translateY(-5px);
      }
    \`;
    document.head.appendChild(style);
  }

  const container = $('beach-canvas-items');
  let left = 5, attempts = 0; $('beach-left').textContent = left;
  
  const targets = [
    {id:'keycard', img:'assets/item_card.png', w:'40px'},
    {id:'footprint', img:'assets/item_foot.png', w:'55px'},
    {id:'match', img:'assets/item_match_v4.png', w:'40px'},
    {id:'locket', img:'assets/item_locket.png', w:'35px'},
    {id:'wine', img:'assets/item_wine.png', w:'30px'}
  ];
  const decoys = [
    {id:'bucket', img:'assets/item_bucket.png', w:'55px'},
    {id:'compass', img:'assets/item_compass.png', w:'45px'},
    {id:'shell', img:'assets/item_shell.png', w:'45px'},
    {id:'shovel', img:'assets/item_shovel.png', w:'65px'},
    {id:'cross', img:'assets/item_cross.png', w:'35px'}
  ];

  $('btn-start-beach').onclick = () => {
    $('beach-start-overlay').remove();
    const gameStart = Date.now();
    
    // Spawn all items
    const allItems = [...targets.map(t=>({...t, correct:true})), ...decoys.map(d=>({...d, correct:false}))];
    allItems.sort(() => Math.random() - 0.5);
    
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

    allItems.forEach(item => {
      const itemW = parseFloat(item.w);
      let x, y, tries = 0, pad = 12;
      do {
        if (tries > 100) pad = 8;
        if (tries > 200) pad = 4;
        if (tries > 250) pad = 0;
        
        // Restrict X to 8-80% to utilize wider sand space
        x = 8 + Math.random() * 72;
        // Flatter shoreline slope to provide much more vertical sand space on the right
        let minY = 45 + (x * 0.25);
        y = minY + Math.random() * (89 - minY);
        tries++;
      } while (isOverlap(x, y, itemW, pad) && tries < 500);
      
      const px = (x / 100) * W;
      const py = (y / 100) * H;
      placed.push({ px, py, w: itemW });

      const c = document.createElement('img');
      c.className = 'beach-item';
      c.src = item.img;
      c.style.width = item.w;
      c.style.left = x + '%';
      c.style.top = y + '%';
      c.style.transform = \`rotate(\${(Math.random()-0.5)*70}deg)\`;
      
      c.onclick = () => {
        if (!GS.gameActive) return;
        if(item.correct) {
          SFX.pickup();
          c.style.pointerEvents = 'none';
          c.style.transform = 'scale(1.5) rotate(10deg)';
          c.style.opacity = '0';
          setTimeout(() => c.remove(), 300);
          
          const chk = $('chk-' + item.id);
          if (chk) chk.checked = true;
          
          const rt = Date.now() - gameStart;
          GS.domains.attention = Math.min(100, GS.domains.attention + 11);
          GS.domains.processingSpeed = Math.min(100, GS.domains.processingSpeed + (rt<10000 ? 14 : 8));
          
          left--;
          $('beach-left').textContent = left;
          if(left <= 0) finishBeach(gameStart);
        } else {
          SFX.fail();
          attempts++;
          GS.domains.attention = Math.max(0, GS.domains.attention - 5);
          c.style.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) drop-shadow(0 0 10px red)';
          setTimeout(() => { c.style.filter = ''; }, 400);
        }
      };
      container.appendChild(c);
    });
  };
}
` + html.substring(beachEnd);
} else { console.log('startBeach not found'); }

// 2. Replace startRoom
const roomStart = html.indexOf('function startRoom(){');
const roomEnd = html.indexOf('// ─ GAME 4: BONFIRE ────────────────────────────────────────────');
if(roomStart > -1 && roomEnd > -1) {
  html = html.substring(0, roomStart) + `function startRoom(){
  let attempt=0;
  \$('room-attempt').textContent=1;
  const gameStart=Date.now();
  const grid=\$('room-grid');
  
  if(!\$('cabin-styles')) {
    const s=document.createElement('style');
    s.id='cabin-styles';
    s.textContent = \`
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
    \`;
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
  
  const killerIntruderMap = {
    rowan: 'wine',
    mia: 'perfume',
    james: 'notebook',
    kai: 'compass',
    sofia: 'novel'
  };
  const targetId = killerIntruderMap[GS.murderer] || 'wine';
  const intruderIdx = items.findIndex(item => item.id === targetId);
  window._testRoomIntruder = items[intruderIdx].id;

  grid.className = '';
  grid.innerHTML = \`
    <div style="position:relative;width:100%;height:480px;border-radius:4px;overflow:hidden;background:#111;box-shadow: 0 8px 32px rgba(0,0,0,0.5);border: 1px solid var(--glass-border);">
      <div style="width:100%; height:100%; position:relative;" id="room-scene">
        <img src="assets/cabin_bg_v3.png" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.85;">
        <div id="room-canvas-items" style="position:absolute; inset:0;"></div>
      </div>
    </div>
  \`;

  const container = \$('room-canvas-items');
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

      // Select a random zone
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
      if(i === intruderIdx){ 
        SFX.success(); 
        c.classList.add('right'); 
        GS.gameActive = false;
        const activeScreen = document.querySelector('.screen.game-screen');
        if (activeScreen) activeScreen.style.pointerEvents = 'none';
        setTimeout(()=>onModuleComplete(15,Date.now()-gameStart,true), 600);
      } else {
        SFX.fail(); 
        c.classList.add('wrong'); 
        attempt++; 
        \$('room-attempt').textContent=attempt+1;
        GS.domains.recognition=Math.max(0,GS.domains.recognition-10);
        
        c.style.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) drop-shadow(0 0 10px red)';
        setTimeout(()=>{
          c.classList.remove('wrong');
          c.style.filter = '';
        }, 500);
        
        if(attempt>=2) {
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          setTimeout(()=>onModuleComplete(5,null,false), 500);
        }
      }
    };
    container.appendChild(c);
  });
}
` + html.substring(roomEnd);
} else { console.log('startRoom not found'); }

// 3. Replace startForest
const forestStart = html.indexOf('function startForest(){');
const forestEnd = html.indexOf('// ─ GAME 7: KARAOKE ────────────────────────────────────────────');
if(forestStart > -1 && forestEnd > -1) {
  html = html.substring(0, forestStart) + `function startForest(){
  const board = $('maze-canvas').parentElement;
  $('maze-canvas').style.display = 'none'; // hide old canvas
  
  const bgs = ['assets/path_start.png', 'assets/path_moss.png', 'assets/path_roots.png', 'assets/path_tree.png'];
  const labels = ['Left','Right','Forward','Back'];
  
  // Randomize the correct path (5 steps) with no consecutive duplicates
  const correctPath = [];
  let lastDir = -1;
  for (let i = 0; i < 5; i++) {
    let dir;
    do {
      dir = Math.floor(Math.random() * 4);
    } while (dir === lastDir);
    correctPath.push(dir);
    lastDir = dir;
  }
  window._testForestPath = correctPath;

  // Generate dynamic hint
  const stepPhrases = [
    [
      "turn left to enter the trail",
      "turn right to enter the trail",
      "walk forward to start the trail",
      "go back from the signpost"
    ],
    [
      "head left past the mossy trunk",
      "turn right at the mossy trunk",
      "push forward past the mossy trunk",
      "go back near the mossy trunk"
    ],
    [
      "veer left past the deep roots",
      "go right around the deep roots",
      "climb forward over the deep roots",
      "head back from the deep roots"
    ],
    [
      "slide left where the path darkens",
      "steer right as the path darkens",
      "press forward when the path darkens",
      "head back where the path darkens"
    ],
    [
      "make a final left turn to reach the clearing",
      "take a final right turn to reach the clearing",
      "push forward into the bright clearing",
      "turn back one last time to reach the clearing"
    ]
  ];
  const hintParts = correctPath.map((dir, stepIdx) => stepPhrases[stepIdx][dir]);
  const generatedHint = "To escape the looping trees, follow the path: " + hintParts.join(", ") + ".";
  
  // Update the hint dynamically in MODULES_DATA and active sidebar notes
  if (window.MODULES_DATA && window.MODULES_DATA[5]) {
    window.MODULES_DATA[5].hint = generatedHint;
  }
  const notesEl = document.querySelector('#sc-forest .field-manual-sidebar p:last-of-type');
  if (notesEl) notesEl.innerHTML = generatedHint;

  let step=0, attempt=0;
  $('maze-step').textContent='0'; $('forest-attempt').textContent=1;
  const gameStart=Date.now();
  
  // Clean up if restarting
  if($('forest-ui')) $('forest-ui').remove();
  
  board.innerHTML += \`
    <div id="forest-ui" style="position:relative;width:100%;height:320px;border-radius:4px;overflow:hidden">
      <img id="forest-bg" src="\${bgs[0]}" style="width:100%;height:100%;object-fit:cover;transition:opacity 0.4s">
      <div id="forest-btns" style="position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:10px;padding:10px"></div>
    </div>
  \`;
  
  const draw = () => {
    $('forest-bg').style.opacity = '0';
    setTimeout(() => {
      $('forest-bg').src = bgs[step % bgs.length];
      $('forest-bg').style.opacity = '1';
    }, 200);
    
    $('maze-step').textContent = step+'/5';
    const btns = $('forest-btns');
    btns.innerHTML = '';
    labels.forEach((lbl, i) => {
      const btn = document.createElement('button');
      btn.className = 'btn-secondary';
      btn.textContent = lbl;
      btn.style.background = 'rgba(10,20,30,0.85)';
      btn.style.borderColor = 'var(--gold)';
      btn.onclick = () => {
        if (!GS.gameActive) return;
        if(i === correctPath[step]) {
          SFX.click(); GS.domains.persistence = Math.min(100, GS.domains.persistence+13);
          step++;
          if(step >= correctPath.length) { 
            GS.gameActive = false;
            const activeScreen = document.querySelector('.screen.game-screen');
            if (activeScreen) activeScreen.style.pointerEvents = 'none';
            setTimeout(()=>onModuleComplete(15,Date.now()-gameStart,true), 400); 
          }
          else draw();
        } else {
          SFX.fail(); attempt++; $('forest-attempt').textContent=attempt+1;
          $('forest-bg').style.filter = 'sepia(1) hue-rotate(-50deg) saturate(3)';
          setTimeout(() => $('forest-bg').style.filter = 'none', 300);
          if(attempt >= 2) {
            GS.gameActive = false;
            const activeScreen = document.querySelector('.screen.game-screen');
            if (activeScreen) activeScreen.style.pointerEvents = 'none';
            setTimeout(()=>onModuleComplete(5,null,false), 400);
          }
        }
      };
      btns.appendChild(btn);
    });
  };
  draw();
}
` + html.substring(forestEnd);
} else { console.log('startForest not found'); }

fs.writeFileSync('frontend/game.html', html);
console.log('Game rebuilt perfectly.');
