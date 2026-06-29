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
  const stepClues = [
    // Step 1: Signpost (North = Forward, West = Left, East = Right, South = Back)
    [
      "Step 1: The signpost has collapsed, pointing only toward the direction of the sunset.", // Left
      "Step 1: The signpost points toward the direction of the morning dawn.",  // Right
      "Step 1: A narrow, misty path beckons you straight ahead into the unknown.", // Forward
      "Step 1: An overwhelming sense of dread warns you to turn around and return." // Back
    ],
    // Step 2: Mossy Trunk (Moss = West/Left, Dry = East/Right, Straight = Forward, Retrace = Back)
    [
      "Step 2: Walk toward the damp side of the trunk where green moss thrives.", // Left
      "Step 2: Turn opposite the mossy side of the trunk, toward the dry bark.", // Right
      "Step 2: Keep the mossy trunk directly on your left and push straight ahead.", // Forward
      "Step 2: The trees close in; you must retrace your steps to find a way around." // Back
    ],
    // Step 3: Deep Roots
    [
      "Step 3: Walk along the stable, walkable roots on your left side.", // Left
      "Step 3: Avoid the left roots; pass through the clear opening on your right.", // Right
      "Step 3: A fallen log stretches straight over the roots. Cross it.", // Forward
      "Step 3: The deep roots are impassable; turn back from them." // Back
    ],
    // Step 4: Darkening Path
    [
      "Step 4: Faint light filters from the West; walk toward it to avoid the shadows.", // Left
      "Step 4: The wind whispers to follow the long shadows stretching to the East.", // Right
      "Step 4: The path is swallowed by darkness ahead; brave the fog and push forward.", // Forward
      "Step 4: You are walking in circles; turn around to break the loop." // Back
    ],
    // Step 5: Bright Clearing
    [
      "Step 5: A rustle in the leaves on your left reveals the clearing's exit.", // Left
      "Step 5: Follow the sound of the ocean waves on your right to escape the maze.", // Right
      "Step 5: A bright, warm clearing opens up straight ahead.", // Forward
      "Step 5: To find the exit, you must make a sudden retreat." // Back
    ]
  ];
  const hintParts = correctPath.map((dir, stepIdx) => stepClues[stepIdx][dir]);
  const generatedHint = `<strong>Decipher the navigation clues to find the path:</strong><br><br>` + 
                        hintParts.map(p => `• ${p}`).join("<br>");
  
  // Update the hint dynamically in MODULES_DATA and active sidebar notes
  if (window.MODULES_DATA && window.MODULES_DATA[5]) {
    window.MODULES_DATA[5].hint = generatedHint;
  }
  const sidebar = document.querySelector('#sc-forest .field-manual-sidebar');
  if (sidebar) {
    const ps = sidebar.querySelectorAll('p');
    if (ps.length >= 2) {
      ps[ps.length - 1].innerHTML = generatedHint;
    }
  }

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
