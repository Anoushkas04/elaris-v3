function startLighthouse(){
  const colors = ['red', 'blue', 'green'];
  const sequence = [];
  for(let i=0; i<5; i++){
    sequence.push(colors[Math.floor(Math.random()*colors.length)]);
  }
  window._testLighthouseSequence = sequence;
  
  let playerSeq = [];
  let attempt = 0;
  let isPlayingSeq = false;
  const gameStart = Date.now();
  
  $('lh-total').textContent = 5;
  $('lh-step').textContent = 0;
  $('lh-attempt').textContent = 1;
  
  const bulb = $('lh-bulb');
  const inst = $('lh-inst');
  
  const colorMap = {
    red: '#cc3333',
    blue: '#4488ee',
    green: '#2e9a78'
  };
  
  function playSequence(){
    isPlayingSeq = true;
    playerSeq = [];
    $('lh-step').textContent = 0;
    inst.textContent = 'Watch the sequence...';
    inst.style.color = 'var(--gold-l)';
    
    let step = 0;
    const interval = setInterval(()=>{
      bulb.style.background = '#222';
      bulb.classList.remove('lit');
      bulb.style.color = 'transparent';
      
      setTimeout(()=>{
        if(step >= sequence.length){
          clearInterval(interval);
          isPlayingSeq = false;
          inst.textContent = 'Your turn — repeat the sequence!';
          inst.style.color = 'var(--text-d)';
          return;
        }
        const color = sequence[step];
        bulb.style.background = colorMap[color];
        bulb.style.color = colorMap[color];
        bulb.classList.add('lit');
        SFX.click();
        step++;
      }, 500); // 0.5s off time
    }, 1000); // 1.0s total cycle (0.5s on, 0.5s off)
  }
  
  const btns = document.querySelectorAll('.lb-btn');
  btns.forEach(btn => {
    btn.onclick = () => {
      if (!GS.gameActive) return;
      if(isPlayingSeq) return;
      const color = btn.dataset.c;
      SFX.click();
      
      bulb.style.background = colorMap[color];
      bulb.style.color = colorMap[color];
      bulb.classList.add('lit');
      setTimeout(()=>{
        bulb.style.background = '#222';
        bulb.classList.remove('lit');
      }, 250); // 0.25s button click flash duration
      
      playerSeq.push(color);
      $('lh-step').textContent = playerSeq.length;
      
      const currentIdx = playerSeq.length - 1;
      if(playerSeq[currentIdx] !== sequence[currentIdx]){
        isPlayingSeq = true; // Lock input immediately during transition
        SFX.fail();
        attempt++;
        $('lh-attempt').textContent = attempt + 1;
        if(attempt >= 2){
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(5, null, false);
        } else {
          inst.textContent = 'Wrong sequence! Watch again...';
          inst.style.color = 'var(--rust)';
          setTimeout(playSequence, 1200);
        }
        return;
      }
      
      if(playerSeq.length === sequence.length){
        isPlayingSeq = true; // Lock input immediately on success
        SFX.success();
        GS.domains.recognition = Math.min(100, GS.domains.recognition + 15);
        GS.domains.attention = Math.min(100, GS.domains.attention + 12);
        const rt = Date.now() - gameStart;
        GS.gameActive = false;
        const activeScreen = document.querySelector('.screen.game-screen');
        if (activeScreen) activeScreen.style.pointerEvents = 'none';
        setTimeout(()=>onModuleComplete(15, rt, true), 400);
      }
    };
  });
  
  playSequence();
}
