function startForest(){
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
  
  board.innerHTML += `
    <div id="forest-ui" style="position:relative;width:100%;height:320px;border-radius:4px;overflow:hidden">
      <img id="forest-bg" src="${bgs[0]}" style="width:100%;height:100%;object-fit:cover;transition:opacity 0.4s">
      <div id="forest-btns" style="position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:10px;padding:10px"></div>
    </div>
  `;
  
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
