function startPathfinder(){
  const board=$('pf-board'); const pfc=$('pf-canvas');
  const W=Math.min(840,window.innerWidth*.84); const H=Math.min(460,window.innerHeight*.55);
  board.style.width=W+'px'; board.style.height=H+'px';
  pfc.width=W; pfc.height=H; pfc.style.width=W+'px'; pfc.style.height=H+'px';
  const ctx=pfc.getContext('2d');
  board.querySelectorAll('.pf-node').forEach(n=>n.remove());
  
  const startNum = Math.floor(1 + Math.random() * 5);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const startCharIdx = Math.floor(Math.random() * 16);
  const labels = [];
  for(let idx=0; idx<5; idx++) {
    labels.push((startNum + idx).toString());
    labels.push(alphabet[startCharIdx + idx]);
  }
  
  const generatedHint = "Tap the nodes in the exact alpha-numeric sequence: " + labels.join(", ") + ". Avoid errors to unlock the ignition sequence.";
  if (window.MODULES_DATA && window.MODULES_DATA[9]) {
    window.MODULES_DATA[9].hint = generatedHint;
  }
  const notesEl = document.querySelector('#sc-pathfinder .field-manual-sidebar p:last-of-type');
  if (notesEl) notesEl.innerHTML = generatedHint;

  const nodes=[]; let target=0,errors=0,attempt=0,lastPos=null;
  $('pf-errors').textContent=0; $('pf-next').textContent=labels[0]; $('pf-attempt').textContent=1;
  const gameStart=Date.now();

  labels.forEach((lbl,i)=>{
    let x,y,tries=0;
    do{ x=65+Math.random()*(W-130); y=65+Math.random()*(H-130); tries++; }
    while(tries<200&&nodes.some(n=>Math.hypot(n.x-x,n.y-y)<76));
    nodes.push({x,y});
    const el=document.createElement('div'); el.className='pf-node'; el.textContent=lbl;
    el.style.left=x+'px'; el.style.top=y+'px'; el.dataset.idx=i;
    el.onclick=()=>{
      if (!GS.gameActive) return;
      const rt=Date.now()-gameStart;
      if(i===target){
        SFX.click(); el.classList.add('done');
        if(lastPos){ ctx.beginPath(); ctx.moveTo(lastPos.x,lastPos.y); ctx.lineTo(x,y);
          const g=ctx.createLinearGradient(lastPos.x,lastPos.y,x,y);
          g.addColorStop(0,'rgba(196,164,101,.9)'); g.addColorStop(1,'rgba(196,164,101,.3)');
          ctx.strokeStyle=g; ctx.lineWidth=2; ctx.setLineDash([3,5]); ctx.stroke(); ctx.setLineDash([]);
        }
        lastPos={x,y}; target++; $('pf-next').textContent=target<labels.length?labels[target]:'✓';
        GS.domains.cognitiveFlexibility=Math.min(100,GS.domains.cognitiveFlexibility+7);
        GS.domains.decisionMaking=Math.min(100,GS.domains.decisionMaking+6);
        if(target>=labels.length) {
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(errors<=3?20:12,rt,true);
        }
      } else if(!el.classList.contains('done')){
        SFX.fail(); errors++; $('pf-errors').textContent=errors;
        el.classList.add('err'); attempt++;
        setTimeout(()=>el.classList.remove('err'),380);
        $('pf-attempt').textContent=attempt+1;
        GS.domains.errorMonitoring=Math.min(100,GS.domains.errorMonitoring+6);
        if(attempt>=10) {
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(target>=6?10:5,rt,false);
        }
      }
    };
    board.appendChild(el);
  });
}
