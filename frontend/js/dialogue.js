// ─ DIALOG ENGINE ─────────────────────────────────────────────
let dialogQueue = [], dialogCallback = null, dialogTyping = false, dialogFull = '';
let typewriteInterval = null;
let dialogCooldown = false;

function typewrite(text, speed=28, cb) {
  if (typewriteInterval) {
    clearInterval(typewriteInterval);
    typewriteInterval = null;
  }
  const el = $('dialog-text');
  $('dialog-cursor').style.display = 'inline-block';
  dialogFull = text; dialogTyping = true;
  let i=0; el.textContent='';
  typewriteInterval = setInterval(()=>{
    if(!dialogTyping){
      clearInterval(typewriteInterval);
      typewriteInterval = null;
      el.textContent=text;
      $('dialog-cursor').style.display='none';
      if(cb) cb();
      return;
    }
    el.textContent += text[i++];
    if(i>=text.length){
      clearInterval(typewriteInterval);
      typewriteInterval = null;
      $('dialog-cursor').style.display='none';
      dialogTyping=false;
      if(cb) cb();
    }
  }, speed);
}

function showDialog(speakerName, text, choices, cb, npcId=null) {
  const hud = $('hud');
  if (hud) hud.style.pointerEvents = 'auto';
  document.querySelectorAll('.screen').forEach(s => s.style.pointerEvents = 'none');

  dialogCooldown = true;
  setTimeout(() => { dialogCooldown = false; }, 300);

  $('dialog-box').classList.add('on');
  $('dialog-speaker').textContent = speakerName.toUpperCase();
  $('dialog-next').style.display = choices && choices.length ? 'none' : 'block';
  $('dialog-choices').innerHTML = '';
  dialogCallback = cb;
  if (npcId) showChar(npcId, null, false); // show char without bubble
  typewrite(text, 26, ()=>{
    if (choices && choices.length) {
      choices.forEach((ch, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn-choice';
        btn.textContent = ch.text;
        btn.onclick = () => {
          SFX.click();
          document.querySelectorAll('.btn-choice').forEach(b=>b.style.pointerEvents='none');
          btn.classList.add('picked');
          if (ch.dass) recordDASS(ch.dass.scale, ch.dass.val, ch.dass.q);
          setTimeout(()=>{ closeDialog(); if(ch.cb) ch.cb(); else if(cb) cb(i, ch); }, 500);
        };
        $('dialog-choices').appendChild(btn);
      });
    }
  });
  if (npcId) TTS.say(text, GS.npcs.find(n=>n.id===npcId)?.speak_pitch||1, GS.npcs.find(n=>n.id===npcId)?.speak_rate||.88);
}

function closeDialog() {
  $('dialog-box').classList.remove('on');
  $('dialog-next').style.display='none';
  hideChars();
  TTS.stop();

  dialogTyping = false;
  dialogCooldown = false;
  if (typewriteInterval) {
    clearInterval(typewriteInterval);
    typewriteInterval = null;
  }

  const hud = $('hud');
  if (hud) hud.style.pointerEvents = 'auto';
  document.querySelectorAll('.screen').forEach(s => s.style.pointerEvents = 'auto');
}

window.dialogNext = () => {
  if (dialogCooldown) return;
  if (dialogTyping) { dialogTyping=false; $('dialog-text').textContent=dialogFull; return; }
  if (dialogCallback) { const cb=dialogCallback; dialogCallback=null; closeDialog(); cb(); }
  else closeDialog();
};
