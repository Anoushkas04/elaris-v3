function startStormShelter() {
  if (typeof initializeRandomAlibis === 'function') {
    initializeRandomAlibis();
  }

  const clues = [
    { q: "HR log: Month and Day Rachel Quinn signed her contract (MMDD).", a: GS.randomAlibis.rachelContractCode, suspectName: "Rachel Quinn" },
    { q: "Security log: Maya Singh's RFID spa exit time (HHMM).", a: GS.randomAlibis.mayaExitCode, suspectName: "Maya Singh" },
    { q: "Device log: Sarah Bennett's beach photoshoot end time (HHMM).", a: GS.randomAlibis.sarahPhotoshootCode, suspectName: "Sarah Bennett" },
    { q: "Reservation log: Maya Singh's Spa inventory management end time (HHMM).", a: GS.randomAlibis.mayaInventoryCode, suspectName: "Maya Singh" },
    { q: "Lobby router log: Rachel Quinn's laptop disconnect time (HHMM).", a: GS.randomAlibis.rachelLaptopCode, suspectName: "Rachel Quinn" },
    { q: "Dock log: Daniel Price's escape vessel registry audit end time (HHMM).", a: GS.randomAlibis.danielDockCode, suspectName: "Daniel Price" }
  ];
  const activeClue = clues[Math.floor(Math.random()*clues.length)];
  const code = activeClue.a;
  let input = ''; let attempt = 0;
  window._testStormCode = code;
  window._testStormName = activeClue.suspectName;
  $('storm-clue').textContent = `Decode: ${activeClue.q}`;
  $('storm-display').textContent = '----';
  $('storm-attempt').textContent = 1;
  const gameStart = Date.now();
  
  const keypad = $('storm-keypad');
  keypad.innerHTML = '';
  [1,2,3,4,5,6,7,8,9,'C',0,'E'].forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'btn-secondary';
    btn.style.padding = '15px';
    btn.style.fontSize = '1.2rem';
    btn.textContent = k;
    btn.onclick = () => {
      if (!GS.gameActive) return;
      SFX.click();
      if(k === 'C') { input = ''; }
      else if(k === 'E') {
        if(input === code) {
          GS.domains.multitasking = Math.min(100, GS.domains.multitasking + 15);
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(15, Date.now()-gameStart, true);
        } else {
          SFX.fail();
          input = '';
          attempt++;
          GS.telemetry.matchErrorRate++;
          if(attempt < 2) {
            $('storm-attempt').textContent = attempt + 1;
          } else {
            GS.gameActive = false;
            const activeScreen = document.querySelector('.screen.game-screen');
            if (activeScreen) activeScreen.style.pointerEvents = 'none';
            onModuleComplete(5, null, false);
          }
        }
      } else {
        if(input.length < 4) input += k;
      }
      $('storm-display').textContent = input.padEnd(4, '-');
    };
    keypad.appendChild(btn);
  });
}
