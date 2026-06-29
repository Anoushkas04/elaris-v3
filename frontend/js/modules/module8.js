function startCCTV(){
  const clips=[{emoji:'🎬',label:'7:45 PM Dinner',time:0},{emoji:'🚪',label:'9:12 PM Corridor',time:1},{emoji:'🏖️',label:'10:03 PM Beach',time:2},{emoji:'💡',label:'10:47 PM Blackout',time:3},{emoji:'🚨',label:'11:20 PM Alarm',time:4}];
  const sh=[...clips].sort(()=>Math.random()-.5);
  $('cctv-track').innerHTML=sh.map((c,i)=>`<div class="cctv-clip" draggable="true" id="ccl-${i}" data-time="${c.time}"><span>${c.emoji}</span><span>${c.label}</span></div>`).join('');
  $('cctv-slots').innerHTML=clips.map((_,i)=>`<div class="cctv-slot" id="ccs-${i}" ondragover="event.preventDefault()" ondrop="cctvDrop(event,${i})">Slot ${i+1}</div>`).join('');
  let drag=null;
  document.querySelectorAll('.cctv-clip').forEach(el=>{
    el.ondragstart=(e)=>{ 
      if (!GS.gameActive) { e.preventDefault(); return; }
      drag=e.target; e.target.classList.add('dragging'); SFX.drag(); 
      const st = $('cctv-status');
      if (st) st.style.display = 'none';
    };
    el.ondragend=(e)=>e.target.classList.remove('dragging');
  });
  window.cctvDrop=(e,si)=>{ const sl=$('ccs-'+si); if(sl&&drag) sl.appendChild(drag); };
  $('cctv-check').onclick=()=>{
    if (!GS.gameActive) return;
    
    let allFilled = true;
    for(let i=0;i<5;i++){
      const sl=$('ccs-'+i);
      const cl=sl?.querySelector('.cctv-clip');
      if(!cl) {
        allFilled = false;
        break;
      }
    }
    
    if(!allFilled) {
      SFX.fail();
      const st = $('cctv-status');
      if (st) {
        st.textContent = 'Please place all 5 clips onto the timeline slots first!';
        st.style.display = 'block';
      }
      return;
    }

    const st = $('cctv-status');
    if (st) st.style.display = 'none';

    let ok=0;
    for(let i=0;i<5;i++){
      const sl=$('ccs-'+i);
      const cl=sl?.querySelector('.cctv-clip');
      if(cl&&parseInt(cl.dataset.time)===i){
        cl.classList.add('placed');
        ok++;
      } else if(cl) {
        cl.classList.add('wrong');
      }
    }
    GS.domains.workingMemory=Math.min(100,GS.domains.workingMemory+ok*7);
    GS.gameActive = false;
    const activeScreen = document.querySelector('.screen.game-screen');
    if (activeScreen) activeScreen.style.pointerEvents = 'none';
    
    if (ok >= 4) {
      SFX.success();
      setTimeout(() => {
        onModuleComplete(15, null, true);
      }, 1000);
    } else {
      SFX.fail();
      setTimeout(() => {
        onModuleComplete(ok >= 2 ? 10 : 5, null, false);
      }, 1200);
    }
  };
}
