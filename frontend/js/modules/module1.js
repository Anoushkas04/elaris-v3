// ─ PLACEHOLDER FUNCTIONS FOR BUILDER ──────────────────────────
function playTapeAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  
  try {
    const ctx = new AudioContextClass();
    
    // Tactile tape key mechanical click helper
    const playClickSound = (time) => {
      // Thump component (low frequency transient)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.08);
      
      oscGain.gain.setValueAtTime(0.25, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.08);

      // Noise component (mechanical scratch/snap)
      const clickBufferSize = ctx.sampleRate * 0.05;
      const clickBuffer = ctx.createBuffer(1, clickBufferSize, ctx.sampleRate);
      const clickData = clickBuffer.getChannelData(0);
      for (let i = 0; i < clickBufferSize; i++) {
        clickData[i] = (Math.random() * 2 - 1) * 0.15 * Math.exp(-i / (clickBufferSize / 4));
      }
      const clickNode = ctx.createBufferSource();
      clickNode.buffer = clickBuffer;
      
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.7, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      
      clickNode.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickNode.start(time);
    };
    
    // Play start click immediately
    playClickSound(ctx.currentTime);
    
    // Play constant hum (low frequency tape deck hum)
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = 'sine';
    hum.frequency.value = 60;
    hum.connect(humGain);
    humGain.connect(ctx.destination);
    humGain.gain.setValueAtTime(0.04, ctx.currentTime);
    hum.start();
    
    // Play constant static noise with pops/crackles
    const bufferSize = ctx.sampleRate * 2.5; // 2.5s loop
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Base white noise hiss
      let sample = (Math.random() * 2 - 1) * 0.012;
      
      // Random crackles / pops (average 10 per second)
      if (Math.random() < 0.0002) {
        const popLen = Math.floor(Math.random() * 250) + 40;
        const amp = (Math.random() * 2 - 1) * 0.18;
        for (let j = 0; j < popLen && i + j < bufferSize; j++) {
          output[i + j] += amp * Math.exp(-j / (popLen / 3.5));
        }
      }
      output[i] += sample;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.02, ctx.currentTime);
    whiteNoise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start();
    
    return {
      stop: () => {
        try {
          hum.stop();
          whiteNoise.stop();
          
          // Play stop click
          playClickSound(ctx.currentTime);
          
          setTimeout(() => ctx.close(), 150);
        } catch (e) {
          console.warn("Audio stop error:", e);
        }
      }
    };
  } catch (e) {
    console.warn("Failed to initialize Web Audio tape hum:", e);
    return null;
  }
}

function playVoiceRecorderTape(onComplete) {
  // Create fullscreen zoom overlay
  const overlay = document.createElement('div');
  overlay.id = 'recorder-zoom-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.backgroundColor = 'rgba(10, 8, 5, 0.94)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.fontFamily = 'var(--ff-m)';
  
  if (!$('cassette-style')) {
    const style = document.createElement('style');
    style.id = 'cassette-style';
    style.textContent = `
      @keyframes spin-clockwise {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .spool-wheel {
        width: 48px;
        height: 48px;
        border: 4px dashed var(--gold-l);
        border-radius: 50%;
        animation: spin-clockwise 3s linear infinite;
        position: relative;
        background: #191410;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
      }
      .spool-wheel::after {
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        background: var(--gold);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      .eq-bar {
        width: 4px;
        height: 5px;
        background: var(--teal);
        transition: height 0.08s ease;
      }
    `;
    document.head.appendChild(style);
  }
  
  overlay.innerHTML = `
    <div style="background: linear-gradient(135deg, #2b241a, #15120e); border: 2px solid var(--gold-l); border-radius: 12px; width: 340px; padding: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); display:flex; flex-direction:column; align-items:center; gap: 15px; position: relative;">
      <div style="font-size: 0.65rem; color: var(--gold-l); letter-spacing: 0.1em; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">TAPE VOICE RECORDER // PLAYBACK</div>
      
      <!-- Cassette window view -->
      <div style="width: 100%; height: 90px; background: #0b0907; border: 1px solid rgba(196,164,101,0.25); border-radius: 6px; display:flex; align-items:center; justify-content:center; gap: 50px; position: relative; overflow: hidden; box-shadow: inset 0 0 15px #000;">
        <div class="spool-wheel" id="spool-left"></div>
        <div class="spool-wheel" id="spool-right"></div>
        <!-- Tape film connection visual -->
        <div style="position: absolute; bottom: 30px; left: 100px; right: 100px; height: 2px; background: rgba(196,164,101,0.3); z-index: 1;"></div>
      </div>
      
      <!-- Equalizer/LED wave and Counter -->
      <div style="display:flex; justify-content: space-between; width: 100%; align-items: center; padding: 0 5px;">
        <div id="eq-container" style="display:flex; gap: 3px; height: 20px; align-items: flex-end;">
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
        </div>
        <div id="tape-counter" style="font-family: monospace; color: var(--rust); font-size: 0.95rem; font-weight: bold; letter-spacing: 0.05em; text-shadow: 0 0 5px rgba(192,71,31,0.5);">00:00.0</div>
      </div>
    </div>
    
    <!-- Subtitle transcript view -->
    <div id="tape-subtitle" style="margin-top: 30px; width: 90%; max-width: 450px; min-height: 80px; text-align: center; color: #f5f0eb; font-size: 0.85rem; line-height: 1.6; border-top: 1px solid rgba(196,164,101,0.15); padding-top: 15px; font-style: italic; white-space: pre-wrap;">
      [ PLAYBACK STARTING... ]
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const audioHandle = playTapeAudio();
  
  const murdererNPC = [...IDENTITIES, ...NPCS_BASE].find(c => c.id === GS.murderer);
  const murdererName = murdererNPC ? murdererNPC.name : 'Marcus Hale';
  const fullText = `[ The tape deck clicks play. Heavy background static and crackling hum fills the audio. ]\n\n[ Two panicked, hushed voices are heard arguing. They mention that their agreement was only to collect data, that someone is dead, and that ${murdererName} was never supposed to find out. ]`;
  
  let charIdx = 0;
  const subtitleEl = $('tape-subtitle');
  subtitleEl.innerHTML = '';
  
  let counterSeconds = 0;
  const counterEl = $('tape-counter');
  const eqBars = document.querySelectorAll('.eq-bar');
  
  const animInterval = setInterval(() => {
    counterSeconds += 0.1;
    const wholeSecs = Math.floor(counterSeconds);
    const ms = Math.floor((counterSeconds % 1) * 10);
    counterEl.textContent = `00:${String(wholeSecs).padStart(2, '0')}.${ms}`;
    
    eqBars.forEach(bar => {
      const h = 3 + Math.random() * 15;
      bar.style.height = h + 'px';
    });
  }, 100);
  
  setTimeout(() => {
    const typeInterval = setInterval(() => {
      if (charIdx < fullText.length) {
        const char = fullText.charAt(charIdx);
        if (char === '\n') {
          subtitleEl.innerHTML += '<br>';
        } else {
          subtitleEl.innerHTML += char;
        }
        charIdx++;
      } else {
        clearInterval(typeInterval);
        clearInterval(animInterval);
        
        eqBars.forEach(bar => bar.style.height = '3px');
        if (audioHandle) audioHandle.stop();
        
        $('spool-left').style.animationPlayState = 'paused';
        $('spool-right').style.animationPlayState = 'paused';
        
        const contBtn = document.createElement('button');
        contBtn.className = 'btn-main';
        contBtn.style.marginTop = '25px';
        contBtn.style.padding = '8px 24px';
        contBtn.style.cursor = 'pointer';
        contBtn.textContent = 'Close Playback';
        contBtn.onclick = () => {
          overlay.remove();
          onComplete();
        };
        overlay.appendChild(contBtn);
      }
    }, 55);
  }, 800);
}

function startBeach() {
  const area = $('beach-area');
  
  area.innerHTML = `
<div style="position:relative;width:100%;height:480px;border-radius:4px;overflow:hidden;background:#111; border: 1px solid rgba(196,164,101,0.25);">
  <div style="width:100%; height:100%; position:relative;" id="beach-scene">
    <img src="assets/beach.png?v=${Date.now()}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.7;">
    <div id="beach-canvas-items" style="position:absolute; inset:0;"></div>
    <div id="beach-start-overlay" style="position:absolute;inset:0;background:rgba(5,5,8,0.85);display:flex;align-items:center;justify-content:center;z-index:10;backdrop-filter:blur(4px);">
      <button class="btn-main" id="btn-start-beach">Investigate Shoreline</button>
    </div>
  </div>
</div>
  `;

  if (!$('beach-hover-style')) {
    const style = document.createElement('style');
    style.id = 'beach-hover-style';
    style.textContent = `
      .beach-clue {
        position: absolute;
        cursor: pointer;
        /* Ambient beach night lighting integration: desaturated, slightly darker, perspective skew, soft dark drop-shadow */
        filter: brightness(0.85) contrast(1.02) saturate(0.9) drop-shadow(2px 6px 4px rgba(0,0,0,0.65));
        transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        transform-origin: bottom center;
      }
      .beach-clue:hover {
        filter: brightness(1.15) contrast(1.05) saturate(1.0) drop-shadow(0 0 10px var(--gold-l));
        transform: scale(1.1) translateY(-3px);
      }
    `;
    document.head.appendChild(style);
  }

  // Set header task title
  const hudHeader = document.querySelector('#sc-beach h3');
  if (hudHeader) hudHeader.textContent = 'Beach Crime Scene Investigation';

  let attempts = 0;
  let bloodyClothCollected = false;
  let recorderCollected = false;
  let footprintsCollected = false;
  let wineCollected = false;

  // Clues tracker for UI header panel
  const counterLabel = document.querySelector('#sc-beach p');
  if (counterLabel) {
    counterLabel.innerHTML = `Search the shoreline for critical evidence. All four items are required.`;
  }

  $('btn-start-beach').onclick = () => {
    $('beach-start-overlay').remove();
    const gameStart = Date.now();

    // Define 8 pre-set sandy slots to guarantee items stay on the shore and do not overlap
    const slots = [
      { left: '6%',  top: '55%' },
      { left: '18%', top: '78%' },
      { left: '30%', top: '60%' },
      { left: '44%', top: '82%' },
      { left: '57%', top: '56%' },
      { left: '70%', top: '78%' },
      { left: '82%', top: '60%' },
      { left: '91%', top: '74%' }
    ];

    // Simple Durstenfeld shuffle for the slots
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const objects = [
      { id: 'wine', img: `assets/item_wine.png?v=${Date.now()}`, w: '52px', rotation: -45, isDecoy: false, type: 'wine' },
      { id: 'cloth', img: `assets/item_cloth.png?v=${Date.now()}`, w: '62px', rotation: 12, isDecoy: false, type: 'cloth' },
      { id: 'recorder', img: `assets/item_card.png?v=${Date.now()}`, w: '35px', rotation: -18, isDecoy: false, type: 'recorder' },
      { id: 'footprint', img: `assets/item_foot.png?v=${Date.now()}`, w: '52px', rotation: 5, isDecoy: false, type: 'footprint' },
      { id: 'shell1', img: `assets/item_shell.png?v=${Date.now()}`, w: '38px', rotation: 25, isDecoy: true },
      { id: 'shell2', img: `assets/item_shell.png?v=${Date.now()}`, w: '36px', rotation: -10, isDecoy: true },
      { id: 'shovel', img: `assets/item_shovel.png?v=${Date.now()}`, w: '58px', rotation: 75, isDecoy: true },
      { id: 'bucket', img: `assets/item_bucket.png?v=${Date.now()}`, w: '50px', rotation: -5, isDecoy: true }
    ];

    // Assign shuffled slots to objects
    objects.forEach((obj, idx) => {
      obj.left = slots[idx].left;
      obj.top = slots[idx].top;
    });

    const container = $('beach-canvas-items');
    
    // Spawn clues
    objects.forEach(obj => {
      const el = document.createElement('img');
      el.className = 'beach-clue';
      el.src = obj.img;
      el.style.width = obj.w;
      el.style.left = obj.left;
      el.style.top = obj.top;
      // Combine random perspective transform and tilt to ground it
      el.style.transform = `rotate(${obj.rotation || 0}deg) skewX(5deg) scaleY(0.9)`;
      
      el.onclick = () => {
        if (!GS.gameActive) return;
        
        if (obj.isDecoy) {
          SFX.fail();
          attempts++;
          GS.domains.attention = Math.max(0, GS.domains.attention - 5);
          
          el.style.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) drop-shadow(0 0 10px red)';
          setTimeout(() => el.style.filter = '', 400);
          
          // Warnings if attempts > 4
          if (attempts === 5) {
            showDialog('Narrator', 
              "You are making too many errors. Focus on searching for all four items of interest.", 
              null, null, 'narrator'
            );
          }
          return;
        }
        
        // Handle actual objects
        if (obj.type === 'wine') {
          if (wineCollected) return;
          wineCollected = true;
          SFX.click();
          el.remove(); // Remove immediately from the beach scene
          
          const chk = $('chk-wine');
          if (chk) chk.checked = true;
          checkBeachCompletion(gameStart);
          
        } else if (obj.type === 'cloth') {
          if (bloodyClothCollected) return;
          bloodyClothCollected = true;
          SFX.pickup();
          el.remove(); // Remove immediately from the beach scene
          
          const chk = $('chk-keycard'); // Use original keycard checklist slot for cloth
          if (chk) {
            chk.checked = true;
            const labelSpan = chk.nextElementSibling;
            if (labelSpan) labelSpan.textContent = 'Bloody Cloth';
          }
          checkBeachCompletion(gameStart);
          
        } else if (obj.type === 'footprint') {
          if (footprintsCollected) return;
          footprintsCollected = true;
          SFX.pickup();
          el.remove(); // Remove immediately from the beach scene
          
          const chk = $('chk-footprint');
          if (chk) chk.checked = true;
          checkBeachCompletion(gameStart);
          
        } else if (obj.type === 'recorder') {
          if (recorderCollected) return;
          el.style.pointerEvents = 'none';
          
          // Zoom slightly into the recorder and play audio
          el.style.transform = 'scale(2) rotate(0deg)';
          el.style.zIndex = '99999';
          
          playVoiceRecorderTape(() => {
            recorderCollected = true;
            el.remove(); // Remove immediately from the beach scene upon completion
            
            const chk = $('chk-match'); // Use original match checklist slot for recorder
            if (chk) {
              chk.checked = true;
              const labelSpan = chk.nextElementSibling;
              if (labelSpan) labelSpan.textContent = 'Voice Recorder';
            }
            checkBeachCompletion(gameStart);
          });
        }
      };
      
      container.appendChild(el);
    });
  };

  function checkBeachCompletion(startTime) {
    if (bloodyClothCollected && recorderCollected && footprintsCollected && wineCollected) {
      // 1. Wine description
      showDialog('Narrator', "Just an empty wine bottle. Nothing useful.", null, () => {
        // 2. Cloth description
        showDialog('Narrator', "Blood... This confirms the victim didn't die naturally.", null, () => {
          // 3. Footprint description
          const killerHeight = [...IDENTITIES, ...GS.npcs].find(c => c.id === GS.murderer)?.height || 175;
          GS.footprintMinHeight = killerHeight - 5;
          GS.footprintMaxHeight = killerHeight + 5;
          GS.heightFilterUnlocked = true;
          
          showDialog('Narrator', 
            `These footprints reveal an approximate height range. It suggests the suspect is between ${GS.footprintMinHeight} cm and ${GS.footprintMaxHeight} cm tall. Height filter unlocked in Case Dossier FILES.`, 
            null, 
            () => {
              // 4. Recorder description + unlock suspects
              showDialog('Narrator', 
                "The recording reveals a conversation between two people shortly before the murder.", 
                null, 
                () => {
                  // Unlock first two suspects: killer and one random suspect
                  const playerId = GS.playerIdentity || (() => {
                    const user = JSON.parse(localStorage.getItem('elaris_user') || '{}');
                    return user.identity === 'academic' ? 'student' : user.identity;
                  })();
                  
                  const possible = [...IDENTITIES, ...GS.npcs].filter(c => 
                    c.id !== playerId && 
                    c.id !== 'narrator' && 
                    c.id !== 'keeper' && 
                    c.id !== 'kai' && 
                    c.id !== GS.murderer
                  );
                  
                  const suspect2 = possible[0]?.id;
                  
                  if (!GS.unlockedSuspects) GS.unlockedSuspects = [];
                  if (!GS.unlockedSuspects.includes(GS.murderer)) GS.unlockedSuspects.push(GS.murderer);
                  if (suspect2 && !GS.unlockedSuspects.includes(suspect2)) GS.unlockedSuspects.push(suspect2);
                  updateDossierList();
                  
                  showNotification("New suspects identified");
                  finishBeach(startTime);
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
  }
}

function finishBeach(t) {
  GS.gameActive = false;
  const activeScreen = document.querySelector('.screen.game-screen');
  if (activeScreen) activeScreen.style.pointerEvents = 'none';
  
  const rt = Date.now() - t;
  showNotification("Module Complete");
  flashScore("+15");
  
  showScreen('sc-narrative');
  
  // Select suspect3 (not the player, Rowan, or the first two unlocked suspects)
  const playerId = GS.playerIdentity || (() => {
    const user = JSON.parse(localStorage.getItem('elaris_user') || '{}');
    return user.identity === 'academic' ? 'student' : user.identity;
  })();
  
  const allSuspects = [...IDENTITIES, ...GS.npcs].filter(c => 
    c.id !== playerId && 
    c.id !== 'narrator' && 
    c.id !== 'keeper' && 
    c.id !== 'kai'
  );
  
  const suspect3Obj = allSuspects.find(c => !GS.unlockedSuspects.includes(c.id));
  const suspect3 = suspect3Obj ? suspect3Obj.id : null;
  
  showDialog('Narrator', "Something still doesn't add up...", null, () => {
    if (suspect3 && suspect3Obj) {
      GS.unlockedSuspects.push(suspect3);
      updateDossierList();
      
      const desc = suspect3Obj.role ? `the ${suspect3Obj.role}` : 'another guest';
      showDialog('Narrator', 
        `My logs reveal that ${suspect3Obj.name}, ${desc}, has also been seen near the shore earlier. Why is their name omitted from the logs? We must investigate them further.`, 
        null, 
        () => {
          showNotification(`New suspect unlocked: ${suspect3Obj.name}`);
          onModuleComplete(15, rt, true);
        }, 
        'narrator'
      );
    } else {
      onModuleComplete(15, rt, true);
    }
  }, 'narrator');
}
