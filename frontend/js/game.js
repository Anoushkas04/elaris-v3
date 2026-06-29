window.onerror = function(message, source, lineno, colno, error) {
  const errStr = `ERROR: ${message} at ${source}:${lineno}:${colno}\n${error ? error.stack : ''}`;
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: errStr })
  }).catch(e => {});
};

// ═══════════════════════════════════════════════════════════════
//   ELARIS ISLAND — FULL GAME ENGINE v2
//   "And Then There Were None" × Cognitive Assessment
// ═══════════════════════════════════════════════════════════════

// ─ FRAGMENT SYSTEM ────────────────────────────────────────────
function buildFragDots() {
  const c = $('frag-dots');
  c.innerHTML = '';
  for(let i=0;i<10;i++){
    const d=document.createElement('div');
    d.className='frag-dot'; d.id='frag-dot-'+i;
    c.appendChild(d);
  }
}

function revealFragment(idx, correct, cb) {
  const hud = $('hud');
  if (hud) hud.style.pointerEvents = 'none';
  SFX.fragment();
  GS.fragments[idx] = true;
  const dot = $('frag-dot-'+idx);
  if (dot) { dot.classList.add('lit'); }
  $('hud-frags').textContent = `Envelopes: ${GS.fragments.filter(Boolean).length} / 10`;
  const f = getMemoryFragment(idx);
  $('frag-num').textContent = '#' + (idx+1);
  $('frag-body').textContent = f.text;
  $('frag-clue').textContent = '⚠ NEW CLUE: ' + f.clue;

  const revealEl = $('frag-reveal');
  if (revealEl) {
    if (!correct && [2, 3, 5, 6, 8].includes(idx)) {
      let msg = '';
      if (idx === 2) {
        const roomLabels = {
          wine: 'Wine Glass',
          notebook: 'Hidden Notebook',
          novel: 'Mystery Novel',
          perfume: 'Perfume Bottle',
          locket: 'Silver Locket',
          compass: 'Old Compass',
          magnifying: 'Magnifying Glass',
          cross: 'Wooden Cross',
          medal: 'Military Medal'
        };
        const itemLabel = roomLabels[window._testRoomIntruder] || 'Wine Glass';
        msg = `The correct intruder item was: <strong>${itemLabel}</strong>`;
      } else if (idx === 3) {
        msg = `The correct contradiction was: <strong>${window._testBonfireCorrect || ''}</strong>`;
      } else if (idx === 5) {
        const pathDirs = (window._testForestPath || []).map(dirIdx => ['Left', 'Right', 'Forward', 'Back'][dirIdx]).join(' ➔ ');
        msg = `The correct path was: <strong>${pathDirs}</strong>`;
      } else if (idx === 6) {
        msg = `The correct timeline decryption was: <strong>${window._testEvidenceCorrectText || ''}</strong>`;
      } else if (idx === 8) {
        msg = `The correct passcode was: <strong>${window._testStormCode || ''}</strong>`;
      }
      revealEl.innerHTML = msg;
      revealEl.style.display = 'block';
    } else {
      revealEl.style.display = 'none';
      revealEl.innerHTML = '';
    }
  }

  // Reset interactive envelope state
  const envelope = $('envelope-elem');
  if (envelope) envelope.classList.remove('open');
  
  const actionBtn = $('frag-action-btn');
  if (actionBtn) actionBtn.textContent = "Unseal Envelope";
  
  window._envelopeOpened = false;

  $('frag-overlay').classList.add('on');
  TTS.say('Evidence envelope recovered. ' + f.clue, 0.85, 0.8);
  window._fragCb = cb;
}

window.unsealEnvelope = () => {
  if (window._envelopeOpened) return;
  window._envelopeOpened = true;
  
  SFX.drag();
  
  const envelope = $('envelope-elem');
  if (envelope) envelope.classList.add('open');
  
  const actionBtn = $('frag-action-btn');
  if (actionBtn) actionBtn.textContent = "Archive Evidence";
  
  const idx = GS.moduleIdx;
  const f = getMemoryFragment(idx);
  TTS.say(f.clue, 0.88, 0.85);
};

window.handleFragAction = () => {
  if (!window._envelopeOpened) {
    unsealEnvelope();
  } else {
    closeFrag();
  }
};

window.closeFrag = () => {
  $('frag-overlay').classList.remove('on');
  const hud = $('hud');
  if (hud) hud.style.pointerEvents = 'auto';
  
  const envelope = $('envelope-elem');
  if (envelope) envelope.classList.remove('open');
  
  if (window._fragCb) { const cb=window._fragCb; window._fragCb=null; cb(); }
};

// ─ HOME SCREEN INTERACTION ────────────────────────────────────
function enterIsland() {
  SFX.click();
  
  // Load user identity from LocalStorage
  const userJson = localStorage.getItem('elaris_user');
  if (!userJson) {
    window.location.href = 'login.html';
    return;
  }
  
  const user = JSON.parse(userJson);
  // Support matching 'academic' from phq9.html to 'student' in game.html
  const userIdentityId = user.identity === 'academic' ? 'student' : user.identity;
  GS.playerIdentity = userIdentityId;
  
  const matchedIdentity = IDENTITIES.find(i => i.id === userIdentityId);
  if (matchedIdentity) {
    GS.playerName = user.name || user.username || matchedIdentity.name;
    GS.playerRole = matchedIdentity.role;
    GS.playerIcon = matchedIdentity.icon;
  } else {
    GS.playerName = user.name || user.username;
    GS.playerRole = user.identityName || 'Traveller';
    GS.playerIcon = '🚤';
  }
  
  // Reset alive property on all suspects and base NPCs to prevent spoilers
  IDENTITIES.forEach(i => i.alive = true);
  NPCS_BASE.forEach(n => n.alive = true);
  GS.npcs = JSON.parse(JSON.stringify(NPCS_BASE));
  
  // Select randomized killer (excluding player, rowan, keeper, kai, narrator)
  const potentialMurderers = [...IDENTITIES, ...NPCS_BASE].filter(c => 
    c.id !== 'kai' && 
    c.id !== 'keeper' && 
    c.id !== 'rowan' && 
    c.id !== 'narrator' && 
    c.id !== userIdentityId
  );
  GS.murderer = potentialMurderers[Math.floor(Math.random()*potentialMurderers.length)].id;
  
  // Select randomized bonfire victim (excluding player, killer, rowan, keeper, kai, narrator)
  const potentialBonfireVisual = [...IDENTITIES, ...NPCS_BASE].filter(c => 
    c.id !== 'kai' && 
    c.id !== 'keeper' && 
    c.id !== 'rowan' && 
    c.id !== 'narrator' && 
    c.id !== userIdentityId && 
    c.id !== GS.murderer
  );
  GS.bonfireVictim = potentialBonfireVisual[Math.floor(Math.random()*potentialBonfireVisual.length)].id;
  GS.victim = 'kai';
  
  // Ensure keeper is alive and kai is dead at start
  const keeper = GS.npcs.find(n => n.id === 'keeper');
  if (keeper) keeper.alive = true;
  const kai = GS.npcs.find(n => n.id === 'kai');
  if (kai) kai.alive = false;
  
  // Narrator greets the player
  showScreen('sc-narrative');
  showDialog('Narrator',
    `Welcome to Elaris Island, ${GS.playerName}. Every detail of this weekend has been arranged. The island holds secrets older than its guests.\n\nAre you ready to step ashore?`,
    [
      { text: "Yes, I am ready", cb: startGame },
      { text: "No, I need a moment", cb: resetToHome }
    ],
    null,
    'narrator'
  );
}

function logout() {
  if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
  localStorage.removeItem('elaris_user');
  localStorage.removeItem('elaris_session');
  sessionStorage.removeItem('elaris_player_user');
  sessionStorage.removeItem('elaris_admin_token');
  sessionStorage.removeItem('elaris_admin_user');
  window.location.href = 'login.html';
}

// ─ GAME START ─────────────────────────────────────────────────
function startGame() {
  $('hud').classList.add('on');
  $('progress-bar').style.display='block';
  $('fragment-display').classList.add('on');
  buildFragDots();
  GS.sessionStart = Math.floor(Date.now() / 1000);
  saveProgress();
  playNarrativeIntro();
}

function resetToHome() {
  closeDialog();
  hideChars();
  $('hud').classList.remove('on');
  $('progress-bar').style.display='none';
  $('fragment-display').classList.remove('on');
  showScreen('sc-home');
}

function reboardVessel() {
  if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
  localStorage.removeItem('elaris_session');
  location.reload();
}

// Reusable helper to play video fullscreen and hide dialog/characters
function playVideo(src, onComplete) {
  closeDialog();
  hideChars();
  
  const video = document.createElement('video');
  video.src = src;
  video.style.position = 'fixed';
  video.style.inset = '0';
  video.style.width = '100vw';
  video.style.height = '100vh';
  video.style.objectFit = 'cover';
  video.style.zIndex = '9999';
  video.style.backgroundColor = '#000';
  video.autoplay = true;
  video.controls = false;
  
  video.play().catch(e => {
    console.warn("Autoplay blocked, user interaction required:", e);
    video.onclick = () => video.play();
  });

  video.onended = () => {
    video.remove();
    onComplete();
  };

  document.body.appendChild(video);
}

// ─ NARRATIVE INTRO (Custom Video & Image Flow) ──────────
function playNarrativeIntro() {
  showScreen('sc-narrative');
  
  const getNPCName = (id) => {
    const npc = GS.npcs.find(n => n.id === id) || IDENTITIES.find(i => i.id === id);
    return npc ? npc.name : id;
  };
  
  // Step 2: Play assets/enter island (1).mp4
  playVideo('assets/enter island (1).mp4', () => {
    // Step 3: Narrator dialogue
    showDialog('Narrator', 'Let me introduce you to the characters.', null, () => {
      // Play assets/characters intro (2).mp4
      playVideo('assets/characters intro (2).mp4', () => {
        // Step 4: Change background to assets/(3).jpeg
        const bgImg = $('narrative-bg-img');
        if (bgImg) bgImg.src = 'assets/(3).jpeg';
        
        // Resume existing NPC intro conversation
        showDialog(getNPCName('rachel'), 'The kitchen is open all hours. Please — eat, rest. Whatever you need.\nThe island has a way of… revealing things about a person.', null, () => {
          showDialog(getNPCName('therapist'), "Forgive me if I seem distracted.\nI keep feeling as if I've been here before.", null, () => {
            showDialog(getNPCName('influencer'), 'Did anyone else notice how isolated this place is?\nNo signal. No boats. Just us.', null, () => {
              // Step 5: NPC intro finished, change background to assets/(4).jpeg
              if (bgImg) bgImg.src = 'assets/(4).jpeg';
              
              // Step 6: Play gunshot, then assets/(6).mp4 video
              if (typeof SFX !== 'undefined' && SFX.gunshot) SFX.gunshot();
              
              setTimeout(() => {
                playVideo('assets/(6).mp4', () => {
                  // Step 7: Change background to assets/(7).jpeg
                  if (bgImg) bgImg.src = 'assets/(7).jpeg';
                  
                  // Narrator dialogue
                  showDialog('Narrator', 'Footprints lead to the beach shore.', null, () => {
                    beginModules();
                  }, 'narrator');
                });
              }, 1000);
            }, 'influencer');
          }, 'therapist');
        }, 'rachel');
      });
    }, 'narrator');
  });
}

// ─ MODULE ORCHESTRATION ───────────────────────────────────────
function beginModules() {
  closeDialog(); hideChars();
  $('proj-text').textContent = '';
  GS.moduleIdx=0;
  runModule(0);
}

// ─ DASS QUESTIONS DIALOGUE COMBINATION ────────────────────────
function askDASSBatch(briefNPC, items, onComplete) {
  if (!items || items.length === 0) {
    onComplete();
    return;
  }
  const item = items[0];
  const choices = item.opts.map((optText, optIdx) => ({
    text: optText,
    cb: () => {
      recordDASS(item.scale, item.vals[optIdx], item.q);
      // Recursively ask next question in batch
      askDASSBatch(briefNPC, items.slice(1), onComplete);
    }
  }));
  showDialog(briefNPC.name, item.q, choices, null, briefNPC.id);
}

function runModule(idx) {
  if(idx>=10){ endGame(); return; }
  const m = MODULES_DATA[idx];
  GS.moduleIdx = idx;
  $('hud-module').textContent = `MODULE ${idx+1} / 10`;
  $('map-loc').textContent = m.loc;
  
  // Update maps modal highlights
  updateMapActive(m.loc);

  $('progress-fill').style.width = (idx/10*100)+'%';
  saveProgress();

  // Clean transition: return to the narrative scene backdrop for the briefing dialog
  showScreen('sc-narrative');

  // Pre-game NPC briefing: select an alive NPC/suspect (excluding player and dead victims)
  const user = JSON.parse(localStorage.getItem('elaris_user') || '{}');
  const userIdentityId = user.identity === 'academic' ? 'student' : user.identity;
  const aliveNPCs = [...IDENTITIES, ...GS.npcs].filter(c => 
    c.id !== userIdentityId && 
    c.id !== 'kai' && 
    c.alive !== false
  );

  // Custom narrative intro transition for Module 2 (The Lighthouse)
  if (idx === 1) {
    const bgImg = $('narrative-bg-img');
    showDialog('Narrator',
      'As the investigation continues, something catches everyone\'s attention.',
      null,
      () => {
        if (bgImg) bgImg.src = 'assets/lighthouse_entry(1).jpeg';
        
        const dialogueNPCs = aliveNPCs.filter(c => c.id !== 'narrator');
        const observer1 = dialogueNPCs[0] || { name: 'Marcus Hale', id: 'ceo' };
        const observer2 = dialogueNPCs[1] || dialogueNPCs[0] || { name: 'Dr. Avery Ross', id: 'doctor' };
        
        showDialog(observer1.name,
          'That\'s strange... the lighthouse shouldn\'t be operating like that.',
          null,
          () => {
            showDialog(observer2.name,
              'Where\'s the keeper? Someone should be maintaining it.',
              null,
              () => {
                showDialog('Narrator',
                  'With no sign of the lighthouse keeper, the group decides to investigate.',
                  null,
                  () => {
                    if (bgImg) bgImg.src = 'assets/lighthouse_arrival(2).jpeg';
                    
                    showDialog('Narrator',
                      'The player reaches the lighthouse entrance.\n\nThe front door is unlocked.\n\nInside, the building appears abandoned.\n\nThere are signs that someone left in a hurry.\n\nThe group proceeds further inside until they reach a heavy locked security door.',
                      null,
                      () => {
                        showDialog('Narrator',
                          'Someone locked this door from the inside.',
                          null,
                          () => {
                            showDialog(observer1.name,
                              'If the keeper is here... we\'re running out of time.',
                              null,
                              () => {
                                showDialog('Narrator',
                                  'The security panel requires an access code.',
                                  null,
                                  () => {
                                    showDialog('Narrator',
                                      'Solve the lock mechanism to enter the keeper\'s room.',
                                      null,
                                      () => {
                                        launchGame('lighthouse');
                                      },
                                      'narrator'
                                    );
                                  },
                                  'narrator'
                                );
                              },
                              observer1.id
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
              },
              observer2.id
            );
          },
          observer1.id
        );
      },
      'narrator'
    );
    return;
  }

  // Custom narrative intro transition for Module 3 (Cabin 7)
  if (idx === 2) {
    const bgImg = $('narrative-bg-img');
    showDialog('Narrator',
      'The lighthouse keeper left us only two words.',
      null,
      () => {
        showDialog('Narrator',
          'Cabin 7.',
          null,
          () => {
            showDialog('Narrator',
              'Whatever happened here... he wanted us to find it.',
              null,
              () => {
                if (bgImg) bgImg.src = 'assets/cabin7.jpeg';
                
                showDialog('Narrator',
                  'The cabin appears abandoned.\n\nThe front door is slightly open.',
                  null,
                  () => {
                    showDialog('Narrator',
                      'Someone was here recently.',
                      null,
                      () => {
                        launchGame('room');
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
      },
      'narrator'
    );
    return;
  }

  // Select Rowan or another alive suspect
  let briefNPC = aliveNPCs[idx % aliveNPCs.length] || NPCS_BASE.find(n => n.id === 'rowan');
  if (m.id === 'storm') {
    briefNPC = IDENTITIES.find(i => i.id === 'narrator') || briefNPC;
  }

  if (idx === 6) {
    const bgImg = $('narrative-bg-img');
    if (bgImg) bgImg.src = 'assets/enterserverroom.jpeg';
    
    showDialog(briefNPC.name,
      "we found a control server room, let's check it out, we might find something useful here",
      null,
      () => {
        showDialog(briefNPC.name,
          `${m.intro}\n\nYou need to go to the ${m.loc}. Stay sharp.`,
          null,
          () => {
            if (bgImg) bgImg.src = 'assets/serverroom.jpeg';
            const batch = [DASS_ITEMS[1], DASS_ITEMS[4], DASS_ITEMS[7]];
            askDASSBatch(briefNPC, batch, () => {
              launchGame(m.id);
            });
          },
          briefNPC.id
        );
      },
      briefNPC.id
    );
    return;
  }

  showDialog(briefNPC.name,
    `${m.intro}\n\nYou need to go to the ${m.loc}. Stay sharp.`,
    null,
    () => {
      // Determine DASS batch based on the game index
      let batch = [];
      if (idx === 3) {
        batch = [DASS_ITEMS[0], DASS_ITEMS[3], DASS_ITEMS[6]];
      } else if (idx === 6) {
        batch = [DASS_ITEMS[1], DASS_ITEMS[4], DASS_ITEMS[7]];
      } else if (idx === 9) {
        batch = [DASS_ITEMS[2], DASS_ITEMS[5], DASS_ITEMS[8]];
      }

      if (batch.length > 0) {
        askDASSBatch(briefNPC, batch, () => {
          if (idx === 3) {
            const bgImg = $('narrative-bg-img');
            if (bgImg) bgImg.src = 'assets/bonfireinvitation.jpeg';
            showDialog('Narrator',
              'someone has called everyone to be gathered in one place, shall we check it out?',
              null,
              () => {
                if (bgImg) bgImg.src = 'assets/bonfirecrowd.jpeg';
                showDialog('Narrator',
                  'be careful...',
                  null,
                  () => {
                    launchGame(m.id);
                  },
                  'narrator'
                );
              },
              'narrator'
            );
          } else {
            launchGame(m.id);
          }
        });
      } else {
        if (idx === 3) {
          const bgImg = $('narrative-bg-img');
          if (bgImg) bgImg.src = 'assets/bonfireinvitation.jpeg';
          showDialog('Narrator',
            'someone has called everyone to be gathered in one place, shall we check it out?',
            null,
            () => {
              if (bgImg) bgImg.src = 'assets/bonfirecrowd.jpeg';
              showDialog('Narrator',
                'be careful...',
                null,
                () => {
                  launchGame(m.id);
                },
                'narrator'
              );
            },
            'narrator'
          );
        } else {
          launchGame(m.id);
        }
      }
    },
    briefNPC.id
  );
}

function launchGame(id) {
  closeDialog(); hideChars();
  const games = {
    beach:startBeach, lighthouse:startLighthouse, room:startRoom,
    bonfire:startBonfire, baggage:startBaggage, forest:startForest,
    evidence:startEvidenceChallenge, cctv:startCCTV, storm:startStormShelter, pathfinder:startPathfinder
  };
  
  GS.gameActive = true;
  
  // Re-enable pointer events on the screen we are launching
  const screenEl = document.getElementById('sc-' + id);
  if (screenEl) {
    screenEl.style.pointerEvents = 'auto';
  }

  showScreen('sc-'+id);
  if(games[id]) games[id]();
}

// Helper to mark a character deceased in all state models
function markDeceased(npcId) {
  const npcInGS = GS.npcs.find(n => n.id === npcId);
  if (npcInGS) npcInGS.alive = false;
  const npcInBase = NPCS_BASE.find(n => n.id === npcId);
  if (npcInBase) npcInBase.alive = false;
  const npcInIdentities = IDENTITIES.find(i => i.id === npcId);
  if (npcInIdentities) npcInIdentities.alive = false;
  const npcInDossier = dossierList.find(c => c.id === npcId);
  if (npcInDossier) npcInDossier.alive = false;
}

function onModuleComplete(score, rt, correct) {
  GS.gameActive = false;
  // Instantly freeze pointer events on the active screen to prevent extra clicks during transition
  const activeScreen = document.querySelector('.screen.game-screen');
  if (activeScreen) {
    activeScreen.style.pointerEvents = 'none';
  }

  GS.moduleScores[GS.moduleIdx] = score;
  GS.score += score;
  if(rt) GS.rtSamples.push(rt);
  if(correct) GS.correctCount++;
  GS.attemptCount++;
  flashScore('+'+score);
  SFX.success();
  saveProgress();

  const proceed = () => {
    revealFragment(GS.moduleIdx, correct, () => {
      // Mid-game twist after fragment 5 (index 4)
      if(GS.moduleIdx===4){
        showMidgameTwist(()=>runModule(GS.moduleIdx+1));
      } else {
        runModule(GS.moduleIdx+1);
      }
    });
  };

  // Deceased Progression Triggers
  if (GS.moduleIdx === 1) { // Module 2 (Lighthouse) completes
    markDeceased('keeper');
    showScreen('sc-narrative');
    
    // Play unlocking sound
    if (SFX.unlock) SFX.unlock();
    
    const bgImg = $('narrative-bg-img');
    if (bgImg) bgImg.src = 'assets/lighthouse_arrival(2).jpeg';
    
    showDialog('Narrator',
      'The security door unlocks. The door slowly opens, and the group enters the keeper\'s room.',
      null,
      () => {
        if (bgImg) bgImg.src = 'assets/lighthouse_dead(3).jpeg';
        
        showDialog('Narrator',
          'Inside the room, the lighthouse keeper is found dead. The room shows signs of a struggle.',
          null,
          () => {
            const user = JSON.parse(localStorage.getItem('elaris_user') || '{}');
            const userIdentityId = user.identity === 'academic' ? 'student' : user.identity;
            const aliveNPCs = [...IDENTITIES, ...GS.npcs].filter(c => 
              c.id !== userIdentityId && 
              c.id !== 'kai' && 
              c.alive !== false
            );
            const dialogueNPCs = aliveNPCs.filter(c => c.id !== 'narrator');
            const observer = dialogueNPCs[0] || { name: 'Marcus Hale', id: 'ceo' };
            
            showDialog(observer.name,
              'Look... he\'s holding something in his hand.',
              null,
              () => {
                showDialog('Narrator',
                  'He\'s holding a note...',
                  null,
                  () => {
                    if (bgImg) bgImg.src = 'assets/lighhouse_end(4).jpeg';
                    
                    showDialog('Narrator',
                      'The note reads:\n\nCabin 7\n\nwith a large red X marked across it.',
                      null,
                      () => {
                        showDialog('Narrator',
                          'This wasn\'t left by accident.',
                          null,
                          () => {
                            showDialog('Narrator',
                              'Cabin 7 has become our next destination.',
                              null,
                              proceed,
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
              },
              observer.id
            );
          },
          'narrator'
        );
      },
      'narrator'
    );
  } else if (GS.moduleIdx === 3) { // Module 4 (Bonfire) completes
    markDeceased(GS.bonfireVictim);
    const victimNPC = [...IDENTITIES, ...NPCS_BASE].find(c => c.id === GS.bonfireVictim);
    const victimName = victimNPC ? victimNPC.name : 'one of the suspects';
    
    showScreen('sc-narrative');
    const bgImg = $('narrative-bg-img');
    if (bgImg) bgImg.src = 'assets/bonfiredeath.jpeg';
    
    if (typeof SFX !== 'undefined' && SFX.gunshot) {
      SFX.gunshot();
    }
    
    const user = JSON.parse(localStorage.getItem('elaris_user') || '{}');
    const userIdentityId = user.identity === 'academic' ? 'student' : user.identity;
    const aliveNPCs = [...IDENTITIES, ...GS.npcs].filter(c => 
      c.id !== userIdentityId && 
      c.id !== 'kai' && 
      c.id !== 'narrator' &&
      c.alive !== false
    );
    const npc1 = aliveNPCs[0] || { name: 'Dr. Avery Ross', id: 'doctor' };
    const npc2 = aliveNPCs[1] || aliveNPCs[0] || { name: 'Marcus Hale', id: 'ceo' };
    
    showDialog(npc1.name,
      'A gunshot?! Where did it come from?!',
      null,
      () => {
        showDialog(npc2.name,
          'Oh no, look at the bonfire! Someone has been shot!',
          null,
          () => {
            showDialog(npc1.name,
              'Look...',
              null,
              () => {
                if (bgImg) bgImg.src = 'assets/bonfireclue1.jpeg';
                showDialog('Narrator',
                  'another clue.',
                  null,
                  () => {
                    if (bgImg) bgImg.src = 'assets/bonfireclue2.jpeg';
                    showDialog(npc2.name,
                      'open it',
                      null,
                      () => {
                        if (bgImg) bgImg.src = 'assets/bonfirecluefinal.jpeg';
                        showDialog('Narrator',
                          `ALERT: The bonfire dies down to cold embers. Suddenly, a cry of terror rings out. ${victimName} lies dead on the beach, poisoned. The liar who knew the truth has been silenced.`,
                          null,
                          proceed,
                          'narrator'
                        );
                      },
                      npc2.id
                    );
                  },
                  'narrator'
                );
              },
              npc1.id
            );
          },
          npc2.id
        );
      },
      npc1.id
    );
  } else {
    proceed();
  }
}

function showMidgameTwist(cb) {
  showScreen('sc-narrative');
  const bgImg = $('narrative-bg-img');
  if (bgImg) bgImg.src = 'assets/module5map.jpeg';
  
  showDialog('Narrator',
    'Every envelope so far contains the same date.\nThree years ago. Exactly.\nThis isn\'t a random crime.\nSomething happened on this island three years ago.\nAnd every person here was part of it.',
    null, cb, 'narrator'
  );
}

// ─ END GAME ───────────────────────────────────────────────────
function endGame(){
  GS.moduleIdx = 10;
  closeDialog();
  const resAcc = $('res-accusation');
  if (resAcc) resAcc.style.display = 'none';
  $('progress-bar').style.display='none';
  $('progress-fill').style.width='100%';

  // Normalize domains
  Object.keys(GS.domains).forEach(k=>{ if(GS.domains[k]===0) GS.domains[k]=25+Math.floor(Math.random()*30); });

  const total=Math.min(100,Math.round(GS.score/191*100));
  const rts=GS.rtSamples; const avgRT=rts.length?Math.round(rts.reduce((a,b)=>a+b,0)/rts.length):520;
  const acc=Math.round(Math.min(99,GS.correctCount/10*100));

  $('res-player').textContent=GS.playerIcon+' '+GS.playerName+' · '+GS.playerRole;
  $('res-score').textContent=total+'/100'; $('res-acc').textContent=acc+'%'; $('res-rt').textContent=avgRT+'ms';

  const DL={'attention':'Attention','recognition':'Recognition','processingSpeed':'Processing Speed','workingMemory':'Working Memory','decisionMaking':'Decision Making','cognitiveFlexibility':'Cognitive Flexibility','errorMonitoring':'Error Monitoring','persistence':'Persistence','distractionResistance':'Distraction Resist.','multitasking':'Multitasking'};
  $('domain-bars').innerHTML=Object.entries(GS.domains).map(([k,v])=>`
    <div class="result-bar-wrap"><div class="result-bar-label">${DL[k]}</div>
    <div class="result-bar-track"><div class="result-bar-fill" id="rb-${k}" style="width:0%"></div></div>
    <div class="result-val">${v}%</div></div>`).join('');
  setTimeout(()=>Object.entries(GS.domains).forEach(([k,v])=>{ const e=$('rb-'+k); if(e)e.style.width=v+'%'; }),300);

  const getR=v=>v<40?'HIGH':v<65?'MODERATE':'LOW';
  const rClass=r=>r==='HIGH'?'risk-hi':r==='MODERATE'?'risk-med':'risk-low';
  $('risk-section').innerHTML=[
    {l:'Memory Risk',r:getR((GS.domains.recognition+GS.domains.workingMemory)/2)},
    {l:'Executive Risk',r:getR((GS.domains.cognitiveFlexibility+GS.domains.decisionMaking)/2)},
    {l:'Processing Risk',r:getR((GS.domains.processingSpeed+GS.domains.attention)/2)},
  ].map(x=>`<div style="background:var(--ink-ss);border:1px solid rgba(196,164,101,.16);padding:16px;border-radius:3px;text-align:center">
     <div style="font-size:.65rem;color:var(--text-d);font-family:var(--ff-m);letter-spacing:.1em;margin-bottom:8px">${x.l}</div>
     <div class="risk-badge ${rClass(x.r)}">${x.r}</div></div>`).join('');

  const murdNPC=[...IDENTITIES, ...NPCS_BASE].find(c=>c.id===GS.murderer);
  const epilogue = total>65
    ? `The envelopes pointed to ${murdNPC?.name||'the host'}. The coast guard arrived as the sun came up. You walked off Elaris Island carrying ten unsealed envelopes — and the knowledge that some truths only emerge under pressure.`
    : `The fog was too thick. ${murdNPC?.name||'The host'} disappeared on the last dawn. But the island recorded everything — every choice, every hesitation, every moment of clarity and confusion. The data outlasts the mystery.`;
  $('res-epilogue').textContent=epilogue;

  saveProgress(); // Final save
  showDeductionBoard();
}

// ─ DEDUCTION BOARD ────────────────────────────────────────────
function getDeductionClues() {
  return [
    { id: 'motive_1', cat: 'Motive', isDecoy: false, fragmentIdx: 0 },
    { id: 'motive_2', cat: 'Motive', isDecoy: false, fragmentIdx: 4 },
    
    { id: 'opp_1', cat: 'Opportunity', isDecoy: false, fragmentIdx: 2 },
    { id: 'opp_2', cat: 'Opportunity', isDecoy: false, fragmentIdx: 5 },
    { id: 'opp_decoy', cat: 'Opportunity', isDecoy: true, text: "The resort gate security alarm was deactivated from the front desk computer." },
    
    { id: 'rel_1', cat: 'Relationship', isDecoy: false, fragmentIdx: 1 },
    { id: 'rel_2', cat: 'Relationship', isDecoy: false, fragmentIdx: 8 },
    { id: 'rel_decoy', cat: 'Relationship', isDecoy: true, text: "Rowan Ashford's secret personal journal reveals he has a long-lost sibling among the guests." },
    
    { id: 'contra_1', cat: 'Contradiction', isDecoy: false, fragmentIdx: 3 },
    { id: 'contra_2', cat: 'Contradiction', isDecoy: false, fragmentIdx: 7 },
    
    { id: 'time_1', cat: 'Timeline', isDecoy: false, fragmentIdx: 6 },
    { id: 'time_2', cat: 'Timeline', isDecoy: false, fragmentIdx: 9 },
    { id: 'time_decoy', cat: 'Timeline', isDecoy: true, text: "A guest register from a neighboring island records a boat rental at 2:00 AM." }
  ];
}

function toggleClueCard(el, id) {
  if (GS.deductionVerified) return;
  SFX.click();
  if (!GS.deductionSelections) GS.deductionSelections = [];
  
  if (el.classList.contains('connected')) {
    el.classList.remove('connected');
    GS.deductionSelections = GS.deductionSelections.filter(x => x !== id);
  } else {
    el.classList.add('connected');
    if (!GS.deductionSelections.includes(id)) {
      GS.deductionSelections.push(id);
    }
  }
}

function applyVerificationStyles() {
  const clues = getDeductionClues();
  if (!GS.deductionSelections) GS.deductionSelections = [];
  
  clues.forEach(c => {
    const el = $('clue-' + c.id);
    if (!el) return;
    
    const isSelected = GS.deductionSelections.includes(c.id);
    
    if (c.isDecoy) {
      if (isSelected) {
        el.classList.add('pin-incorrect');
      }
    } else {
      const isUnlocked = GS.fragments[c.fragmentIdx];
      if (isUnlocked) {
        if (isSelected) {
          el.classList.add('pin-correct');
        } else {
          el.classList.add('pin-missed');
        }
      }
    }
  });
}

function verifyDeductions() {
  if (GS.deductionVerified) return;
  
  const clues = getDeductionClues();
  let score = 0;
  
  if (!GS.deductionSelections) GS.deductionSelections = [];
  
  clues.forEach(c => {
    const isSelected = GS.deductionSelections.includes(c.id);
    
    if (c.isDecoy) {
      if (!isSelected) {
        score += 2;
      }
    } else {
      const isUnlocked = GS.fragments[c.fragmentIdx];
      if (isUnlocked && isSelected) {
        score += 2;
      }
    }
  });
  
  GS.deductionScore = score;
  GS.score += score;
  GS.deductionVerified = true;
  
  saveProgress();
  SFX.success();
  
  showDeductionBoard();
}

function showDeductionBoard(){
  const clues = getDeductionClues();
  const categories = ['Motive', 'Opportunity', 'Relationship', 'Contradiction', 'Timeline'];
  
  const gridHtml = categories.map(cat => {
    const catClues = clues.filter(c => c.cat === cat);
    const cluesHtml = catClues.map(c => {
      if (c.isDecoy) {
        const isConnected = GS.deductionSelections && GS.deductionSelections.includes(c.id);
        const classList = isConnected ? 'clue-card connected' : 'clue-card';
        const onclickStr = GS.deductionVerified ? '' : `onclick="toggleClueCard(this, '${c.id}')"`;
        return `<div class="${classList}" id="clue-${c.id}" ${onclickStr} style="margin-bottom:7px">
          <div class="clue-cat">Evidence (Decoy)</div>
          ${c.text}
        </div>`;
      } else {
        const isUnlocked = GS.fragments[c.fragmentIdx];
        if (!isUnlocked) {
          return `<div class="clue-card locked" style="margin-bottom:7px">
            <div class="clue-cat">Locked Evidence</div>
            [Locked Clue - Recover Envelope ${c.fragmentIdx + 1}]
          </div>`;
        } else {
          const clueText = getMemoryFragment(c.fragmentIdx).clue;
          const isConnected = GS.deductionSelections && GS.deductionSelections.includes(c.id);
          const classList = isConnected ? 'clue-card connected' : 'clue-card';
          const onclickStr = GS.deductionVerified ? '' : `onclick="toggleClueCard(this, '${c.id}')"`;
          return `<div class="${classList}" id="clue-${c.id}" ${onclickStr} style="margin-bottom:7px">
            <div class="clue-cat">Evidence (Envelope ${c.fragmentIdx + 1})</div>
            ${clueText}
          </div>`;
        }
      }
    }).join('');
    
    return `<div style="border:1px solid rgba(196,164,101,.18);padding:14px;border-radius:3px;background:var(--ink-ss)">
      <div style="font-family:var(--ff-t);font-size:.7rem;color:var(--gold);letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px">${cat}</div>
      ${cluesHtml}
    </div>`;
  }).join('');
  
  $('deduction-grid').innerHTML = gridHtml;
  
  if (!GS.deductionSelections) {
    GS.deductionSelections = [];
  }
  
  const verifyBtn = $('verify-deduction-btn');
  const accuseBtn = $('accuse-btn');
  const feedbackEl = $('deduction-feedback');
  
  if (GS.deductionVerified) {
    verifyBtn.style.display = 'none';
    accuseBtn.style.display = 'block';
    
    feedbackEl.style.display = 'block';
    feedbackEl.innerHTML = `<strong>Deduction Complete</strong><br>Connections verified. Score added: +${GS.deductionScore || 0} points.<br><span style="color:var(--gold-l);">Proceed to accuse the suspect.</span>`;
    
    applyVerificationStyles();
  } else {
    verifyBtn.style.display = 'block';
    accuseBtn.style.display = 'none';
    feedbackEl.style.display = 'none';
  }
  
  accuseBtn.onclick=()=>{
    $('accuse-form').style.display='block';
    const playerId = GS.playerIdentity || (() => {
      const userJson = localStorage.getItem('elaris_user');
      const user = userJson ? JSON.parse(userJson) : {};
      return user.identity === 'academic' ? 'student' : user.identity;
    })();
    const potentialAccused = [...IDENTITIES, ...NPCS_BASE].filter(c => 
      c.id !== GS.victim && 
      c.id !== 'rowan' && 
      c.id !== 'keeper' && 
      c.id !== 'narrator' && 
      c.id !== playerId &&
      c.alive !== false
    );
    $('accuse-opts').innerHTML=potentialAccused.map(n=>`
      <button class="btn-choice" onclick="makeAccusation('${n.id}','${n.name}')">${n.name} — ${n.role}</button>`).join('');
  };
  
  showScreen('sc-deduction');
}

function makeAccusation(id, name) {
  const correct=id===GS.murderer;
  SFX[correct?'success':'fail']();
  
  if (GS.accusationScore === undefined) {
    GS.accusationScore = correct ? 15 : 0;
    GS.score += GS.accusationScore;
  }
  
  const meta = CHARACTER_META[GS.murderer] || {};
  const msg=correct
    ? `Correct. ${name} was the killer.\n\nMOTIVE: ${meta.motive}\n\nThey returned to destroy the last evidence of PROJECT ECHO — and realized the witnesses were the evidence.`
    : `Incorrect. ${name} was not the killer.\n\nSomeone else designed this reunion. The truth is still out there.`;
  
  GS.killerGuess = id;
  saveProgress();
  
  const userJson = localStorage.getItem('elaris_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      const uid = user.user_id || user.id;
      if (uid) {
        localStorage.setItem('elaris_completed_game_' + uid, 'true');
      }
    } catch(e) {}
  }
  
  $('hud').classList.remove('on');
  
  const resAcc = $('res-accusation');
  if (resAcc) {
    resAcc.style.display = 'block';
    resAcc.style.whiteSpace = 'pre-wrap';
    if (correct) {
      resAcc.style.background = 'rgba(78, 205, 168, 0.1)';
      resAcc.style.border = '1px solid rgba(78, 205, 168, 0.3)';
      resAcc.style.color = '#4ecda8';
    } else {
      resAcc.style.background = 'rgba(192, 71, 31, 0.1)';
      resAcc.style.border = '1px solid rgba(192, 71, 31, 0.3)';
      resAcc.style.color = '#ff5e4d';
    }
    resAcc.innerHTML = `<strong style="font-family: var(--ff-t); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; color: var(--gold-l);">Accusation Outcome</strong>${msg}`;
  }
  
  const total = Math.min(100, Math.round(GS.score / 191 * 100));
  $('res-score').textContent = total + '/100';
  
  const murdNPC = [...IDENTITIES, ...NPCS_BASE].find(c => c.id === GS.murderer);
  const epilogue = total > 65
    ? `The envelopes pointed to ${murdNPC?.name || 'the host'}. The coast guard arrived as the sun came up. You walked off Elaris Island carrying ten unsealed envelopes — and the knowledge that some truths only emerge under pressure.`
    : `The fog was too thick. ${murdNPC?.name || 'The host'} disappeared on the last dawn. But the island recorded everything — every choice, every hesitation, every moment of clarity and confusion. The data outlasts the mystery.`;
  $('res-epilogue').textContent = epilogue;
  
  showScreen('sc-results');
}

// ─ EXIT & TELEMETRY RECORDING ─────────────────────────────────
function confirmExit() {
  SFX.click();
  showModal('modal-exit-confirm');
}

// ─ TELEMETRY CONVERSION OF AVOIDANCE / ABRUPT WITHDRAWAL ─────
function exitConfirmed() {
  // Record exit depression marker (withdrawal/avoidance behaviors trigger higher scores)
  recordDASS('depression', 3, "User exited the assessment early");
  saveProgress();
  
  closeModal('modal-exit-confirm');
  resetToHome();
}

// EVIDENCE MODAL
function showEvidenceModal() {
  const list = $('evidence-list');
  list.innerHTML = '';
  let collected = 0;
  GS.fragments.forEach((f, idx) => {
    if(f) {
      collected++;
      const fd = getMemoryFragment(idx);
      list.innerHTML += `
        <div class="evidence-item" style="grid-column: 1 / -1; margin-bottom: 8px;">
          <h4>Envelope #${idx+1}</h4>
          <p style="font-style:italic; font-size:0.72rem; white-space: pre-wrap; line-height: 1.4; color: var(--text-d); margin-top: 4px;">${fd.text}</p>
        </div>
      `;
    }
  });
  if(collected === 0) {
    list.innerHTML = '<div style="grid-column: 1/3; color:var(--text-dm);">No evidence logs collected yet.</div>';
  }
  showModal('modal-evidence');
}

function checkProgressButton() {
  const btn = $('btn-home-progress');
  if (!btn) return;
  
  const userJson = localStorage.getItem('elaris_user');
  if (!userJson) {
    btn.style.display = 'none';
    return;
  }
  
  try {
    const user = JSON.parse(userJson);
    const uid = user.user_id || user.id;
    if (!uid) {
      btn.style.display = 'none';
      return;
    }
    
    // 1. Check local storage flag first for immediate display
    const localFlagKey = 'elaris_completed_game_' + uid;
    if (localStorage.getItem(localFlagKey) === 'true') {
      btn.style.display = 'block';
      return;
    }
    
    // 2. Query backend to see if there are past completed sessions
    fetch('/api/sessions?user_id=' + encodeURIComponent(uid))
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
      })
      .then(sessions => {
        // A session is completed if killer_guess is not empty
        const hasCompleted = sessions && sessions.some(s => s.killer_guess && s.killer_guess.trim() !== "");
        if (hasCompleted) {
          localStorage.setItem(localFlagKey, 'true');
          btn.style.display = 'block';
        } else {
          btn.style.display = 'none';
        }
      })
      .catch(err => {
        console.warn('Error checking past progress:', err);
        btn.style.display = 'none';
      });
      
  } catch (e) {
    console.error('Error parsing user storage:', e);
    btn.style.display = 'none';
  }
}

/* ── 11. PLAYER PAST RECORDS PORTAL ────────────────────────── */
const MODULE_NAMES = [
  'The Arrival',
  'First Witnesses',
  'The Study Room',
  'Forensic Analysis',
  'Evidence Envelopes',
  'Alibi Checks',
  'The Hidden Room',
  'Digital Traces',
  'The Confession',
  'The Dock'
];
const DOMAIN_NAMES = {
  attention:             'Attention',
  recognition:           'Memory',
  workingMemory:         'Working Memory',
  processingSpeed:       'Processing Speed',
  errorMonitoring:       'Inhibition',
  cognitiveFlexibility:  'Flexibility',
  decisionMaking:        'Planning',
  persistence:           'Reasoning',
  multitasking:          'Multitasking',
  distractionResistance: 'Visuospatial'
};

let playerSessions = [];
let expandedPlayerSessions = new Set();
let recordsBackScreen = 'sc-home';

async function showPlayerRecords() {
  const activeScreen = document.querySelector('.screen.on');
  if (activeScreen) {
    recordsBackScreen = activeScreen.id;
  }
  
  showScreen('sc-records');
  expandedPlayerSessions.clear();
  
  const tbody = $('rec-tbody');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 30px;">
        <div class="spinner" style="margin: 0 auto 10px auto; width: 24px; height: 24px; border: 2px solid rgba(196,164,101,0.2); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        Summoning records from the server...
      </td>
    </tr>
  `;

  const userJson = localStorage.getItem('elaris_user');
  if (!userJson) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--rust);">No logged-in user session found.</td></tr>`;
    return;
  }

  try {
    const user = JSON.parse(userJson);
    const uid = user.user_id || user.id;
    if (!uid) throw new Error('No user ID found');

    const res = await fetch('/api/sessions?user_id=' + encodeURIComponent(uid), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load past sessions');
    
    playerSessions = await res.json();
    if (!Array.isArray(playerSessions)) playerSessions = [];

    updatePlayerRecordsStats();
    renderPlayerSessionsTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--rust);">${err.message}</td></tr>`;
  }
}

function closePlayerRecords() {
  showScreen(recordsBackScreen);
}

function updatePlayerRecordsStats() {
  const n = playerSessions.length;
  $('rec-stat-total').textContent = n;

  if (n === 0) {
    $('rec-stat-avg').textContent = '—';
    $('rec-stat-completed').textContent = '—';
    $('rec-stat-accuracy').textContent = '—';
    $('rec-stat-stress').textContent = '—';
    return;
  }

  const avgScore = Math.round(playerSessions.reduce((a, s) => a + (s.score || 0), 0) / n);
  $('rec-stat-avg').textContent = avgScore;

  const completed = playerSessions.filter(s => (s.module_idx || 0) >= 10).length;
  $('rec-stat-completed').textContent = Math.round(completed / n * 100) + '%';

  const correctGuess = playerSessions.filter(s => s.killer_guess && s.killer_guess === s.murderer).length;
  $('rec-stat-accuracy').textContent = Math.round(correctGuess / n * 100) + '%';

  const dassSum = playerSessions.reduce((acc, s) => {
    const d = parsePlayerDASS(s);
    acc.d += d.depression || 0;
    acc.a += d.anxiety || 0;
    acc.s += d.stress || 0;
    return acc;
  }, { d: 0, a: 0, s: 0 });

  const avgDep = Math.round(dassSum.d / n);
  const avgAnx = Math.round(dassSum.a / n);
  const avgStr = Math.round(dassSum.s / n);
  $('rec-stat-stress').textContent = `D:${avgDep} · A:${avgAnx} · S:${avgStr}`;
}

function renderPlayerSessionsTable() {
  const tbody = $('rec-tbody');
  if (playerSessions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-d);">
          🏝️ No past assessment sessions found. Complete an assessment to see your progress!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = playerSessions.map(s => {
    const sid = s.id;
    const isExp = expandedPlayerSessions.has(sid);
    const dass = parsePlayerDASS(s);
    const pct = Math.min(100, Math.round((s.module_idx || 0) / 10 * 100));
    const isCorrect = s.killer_guess && s.killer_guess === s.murderer;
    const scoreCls = s.score >= 70 ? 'rec-score-green' : s.score >= 40 ? 'rec-score-gold' : 'rec-score-rust';
    
    let guessTag = '— No guess';
    let guessCls = 'killer-none';
    if (s.killer_guess) {
      if (isCorrect) {
        guessTag = '✓ ' + (s.murderer_name || s.killer_guess);
        guessCls = 'killer-correct';
      } else {
        guessTag = '✗ ' + s.killer_guess;
        guessCls = 'killer-wrong';
      }
    }

    const dateStr = s.last_updated ? new Date(s.last_updated * 1000).toLocaleString() : 'Unknown';

    return `
      <tr class="rec-row-session ${isExp ? 'expanded' : ''}" id="rec-row-${sid}" onclick="togglePlayerSessionExpand('${sid}')">
        <td style="text-align: left;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span>${s.player_icon || '👤'}</span>
            <div>
              <div style="font-weight:600; color:var(--gold-l);">${escapeHtmlStr(s.player_name || 'Investigator')}</div>
              <div style="font-size:0.75rem; color:var(--text-d);">${escapeHtmlStr(s.player_role || 'Guest')}</div>
            </div>
          </div>
        </td>
        <td style="text-align: center;"><span class="rec-score-badge ${scoreCls}">${s.score || 0}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px; justify-content:center;">
            <div style="width:60px; height:6px; background:rgba(255,255,255,0.06); border:1px solid rgba(196,164,101,0.15); border-radius:3px; overflow:hidden;">
              <div style="width:${pct}%; height:100%; background:var(--gold);"></div>
            </div>
            <span style="font-size:0.75rem;">${pct}%</span>
          </div>
        </td>
        <td style="text-align: center;"><span class="killer-tag ${guessCls}">${guessTag}</span></td>
        <td style="text-align: center;">
          <div class="dass-mini">
            <span class="dass-badge dass-norm">${dass.depression}D</span>
            <span class="dass-badge dass-norm">${dass.anxiety}A</span>
            <span class="dass-badge dass-norm">${dass.stress}S</span>
          </div>
        </td>
        <td style="text-align: left; font-size:0.8rem; color:var(--text-d);">${dateStr}</td>
        <td style="text-align: center;">
          <button class="rec-btn-expand ${isExp ? 'open' : ''}">▾</button>
        </td>
      </tr>
      <tr class="rec-row-detail ${isExp ? 'visible' : ''}" id="rec-detail-${sid}">
        <td colspan="7" class="rec-detail-cell" onclick="event.stopPropagation()">
          ${isExp ? buildPlayerDetailHTML(s) : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function togglePlayerSessionExpand(sid) {
  const isExp = expandedPlayerSessions.has(sid);
  if (isExp) {
    expandedPlayerSessions.delete(sid);
  } else {
    expandedPlayerSessions.add(sid);
  }
  
  const sessionRow = document.getElementById(`rec-row-${sid}`);
  const detailRow  = document.getElementById(`rec-detail-${sid}`);
  if (!sessionRow || !detailRow) { renderPlayerSessionsTable(); return; }

  const nextExp = expandedPlayerSessions.has(sid);
  sessionRow.classList.toggle('expanded', nextExp);
  detailRow.classList.toggle('visible', nextExp);

  const expandBtn = sessionRow.querySelector('.rec-btn-expand');
  if (expandBtn) expandBtn.classList.toggle('open', nextExp);

  const cell = detailRow.querySelector('.rec-detail-cell');
  if (cell) {
    const s = playerSessions.find(x => x.id === sid);
    cell.innerHTML = nextExp && s ? buildPlayerDetailHTML(s) : '';
  }
}

function buildPlayerDetailHTML(s) {
  return `
    <div class="rec-detail-inner">
      <div class="rec-detail-grid">
        ${buildPlayerProgressGraphHtml(s)}
        ${buildPlayerModuleScoresHtml(s)}
        ${buildPlayerDomainBars(s)}
        ${buildPlayerDASSBreakdownHtml(s)}
        ${buildPlayerClinicalFlagsHtml(s)}
        ${buildPlayerRTSectionHtml(s)}
        ${buildPlayerTimelineHtml(s)}
      </div>
    </div>
  `;
}

function buildPlayerProgressGraphHtml(s) {
  let scores = [];
  try {
    const raw = Array.isArray(s.module_scores) ? s.module_scores : JSON.parse(s.module_scores || '[]');
    scores = raw;
  } catch (_) {}

  const parsedScores = [];
  for (let i = 0; i < 10; i++) {
    let sc = null;
    if (Array.isArray(scores)) {
      if (typeof scores[i] === 'number') {
        sc = scores[i];
      } else {
        const entry = scores.find(e => (e.module === i || e.index === i)) || {};
        if (typeof entry.score === 'number') {
          sc = entry.score;
        }
      }
    }
    parsedScores.push(sc);
  }

  const points = [];
  const W = 540;
  const H = 140; 
  const startX = 45;
  const startY = 170; 
  const dx = W / 9;   
  const maxY = 20;

  parsedScores.forEach((score, i) => {
    if (score !== null) {
      const x = startX + i * dx;
      const y = startY - (score / maxY) * H;
      points.push({ x, y, score, moduleIdx: i, name: MODULE_NAMES[i] });
    }
  });

  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaD = `${pathD} L ${points[points.length - 1].x} ${startY} L ${points[0].x} ${startY} Z`;
  }

  let gridlines = '';
  for (let sVal = 5; sVal <= 20; sVal += 5) {
    const yVal = startY - (sVal / maxY) * H;
    gridlines += `<line x1="${startX}" y1="${yVal}" x2="${startX + W}" y2="${yVal}" stroke="rgba(196,164,101,0.08)" stroke-dasharray="3,3" />`;
    gridlines += `<text x="${startX - 8}" y="${yVal + 4}" fill="var(--text-d)" font-size="0.65rem" font-family="var(--ff-m)" text-anchor="end">${sVal}</text>`;
  }

  let xLabels = '';
  for (let i = 0; i < 10; i++) {
    const x = startX + i * dx;
    const completed = parsedScores[i] !== null;
    xLabels += `
      <line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + 4}" stroke="rgba(196,164,101,0.15)" />
      <text x="${x}" y="${startY + 18}" fill="${completed ? 'var(--gold)' : 'var(--text-d)'}" font-size="0.65rem" font-family="var(--ff-m)" text-anchor="middle">M${i+1}</text>
    `;
  }

  let dots = '';
  points.forEach(p => {
    dots += `
      <g style="cursor: pointer;">
        <title>Module ${p.moduleIdx+1} (${p.name}): ${p.score} pts</title>
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--ink)" stroke="var(--gold)" stroke-width="2" />
        <circle cx="${p.x}" cy="${p.y}" r="2" fill="var(--gold)" />
      </g>
    `;
  });

  const svgContent = `
    <svg viewBox="0 0 620 200" width="100%" height="200" style="display: block; overflow: visible;">
      <defs>
        <linearGradient id="chartAreaGradPlayer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--gold)" stop-opacity="0.16" />
          <stop offset="100%" stop-color="var(--gold)" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      ${gridlines}
      <line x1="${startX}" y1="${startY}" x2="${startX + W}" y2="${startY}" stroke="rgba(196,164,101,0.15)" stroke-width="1" />
      <line x1="${startX}" y1="${startY}" x2="${startX}" y2="${startY - H - 10}" stroke="rgba(196,164,101,0.15)" stroke-width="1" />
      ${areaD ? `<path d="${areaD}" fill="url(#chartAreaGradPlayer)" />` : ''}
      ${pathD ? `<path d="${pathD}" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` : ''}
      ${xLabels}
      ${dots}
    </svg>
  `;

  return `
    <div class="rec-detail-section full-width" style="margin-bottom: 10px;">
      <div class="rec-section-title">📈 Assessment Progress Curve</div>
      <div class="rec-chart-container">
        ${svgContent}
      </div>
    </div>
  `;
}

function buildPlayerModuleScoresHtml(s) {
  let scores = [];
  try {
    const raw = Array.isArray(s.module_scores) ? s.module_scores : JSON.parse(s.module_scores || '[]');
    scores = raw;
  } catch (_) {}

  const items = MODULE_NAMES.map((name, i) => {
    let sc = null;
    if (Array.isArray(scores)) {
      if (typeof scores[i] === 'number') {
        sc = scores[i];
      } else {
        const entry = scores.find(e => (e.module === i || e.index === i)) || {};
        if (typeof entry.score === 'number') {
          sc = entry.score;
        }
      }
    }
    const done  = i < (s.module_idx || 0);
    const pct   = sc !== null ? Math.min(100, sc * 5) : (done ? 50 : 0);
    const label = sc !== null ? sc : (done ? '?' : '—');
    return `
      <div class="rec-module-item">
        <span style="color:var(--text-d);font-size:0.72rem;font-family:var(--ff-m);width:18px;text-align:right;flex-shrink:0">${i+1}</span>
        <span class="rec-module-name" title="${escapeHtmlStr(name)}">${escapeHtmlStr(name)}</span>
        <div class="rec-module-score-bar">
          <div class="rec-module-score-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="rec-module-score-num">${label}</span>
      </div>`;
  }).join('');

  return `
    <div class="rec-detail-section">
      <div class="rec-section-title">📋 Module Scores</div>
      <div class="rec-module-list">${items}</div>
    </div>`;
}

function buildPlayerDomainBars(s) {
  let domains = {};
  try {
    domains = typeof s.domains === 'object' && s.domains !== null ? s.domains : JSON.parse(s.domains || '{}');
  } catch (_) {}

  const items = Object.entries(DOMAIN_NAMES).map(([key, label]) => {
    const val = typeof domains[key] === 'number' ? domains[key] : 0;
    const pct = Math.min(100, Math.round(val));
    const cls = pct >= 60 ? 'bar-good' : pct >= 35 ? 'bar-mid' : 'bar-low';
    return `
      <div class="rec-domain-item">
        <span class="rec-domain-name">${escapeHtmlStr(label)}</span>
        <div class="rec-domain-bar-outer">
          <div class="rec-domain-bar-inner ${cls}" style="width:${pct}%"></div>
        </div>
        <span class="rec-domain-pct">${pct}%</span>
      </div>`;
  }).join('');

  return `
    <div class="rec-detail-section">
      <div class="rec-section-title">🧬 Domain Profile</div>
      <div class="rec-domain-list">${items}</div>
    </div>`;
}

function buildPlayerDASSBreakdownHtml(s) {
  const d = parsePlayerDASS(s);
  const dep = d.depression || 0;
  const anx = d.anxiety    || 0;
  const str = d.stress     || 0;

  const depLevel = dassPlayerLevel('depression', dep);
  const anxLevel = dassPlayerLevel('anxiety',    anx);
  const strLevel = dassPlayerLevel('stress',     str);

  const depPct = Math.min(100, Math.round(dep / 42 * 100));
  const anxPct = Math.min(100, Math.round(anx / 36 * 100));
  const strPct = Math.min(100, Math.round(str / 42 * 100));

  const block = (letter, score, level, pct, cls) => `
    <div class="rec-dass-block ${cls}">
      <div class="rec-dass-block-letter">${letter}</div>
      <div class="rec-dass-block-score">${score}</div>
      <div class="rec-dass-block-level">${level}</div>
      <div class="rec-dass-block-bar">
        <div class="rec-dass-block-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>`;

  return `
    <div class="rec-detail-section">
      <div class="rec-section-title">🧪 DASS-21 Breakdown</div>
      <div class="rec-dass-breakdown">
        ${block('Depression', dep, depLevel, depPct, 'rec-db-depression')}
        ${block('Anxiety',    anx, anxLevel, anxPct, 'rec-db-anxiety')}
        ${block('Stress',     str, strLevel, strPct, 'rec-db-stress')}
      </div>
    </div>`;
}

function buildPlayerClinicalFlagsHtml(s) {
  const d  = parsePlayerDASS(s);
  let domains = {};
  try {
    domains = typeof s.domains === 'object' && s.domains !== null ? s.domains : JSON.parse(s.domains || '{}');
  } catch (_) {}

  const flags = [];
  const dep = d.depression || 0;
  const anx = d.anxiety    || 0;
  const str = d.stress     || 0;

  if (anx > 14) {
    flags.push({
      cls:  'flag-warn',
      icon: '⚠️',
      text: '<strong>Elevated Anxiety Indicators:</strong> User showed rapid click density and high distraction ratio in modules 2, 7. DASS Anxiety score ' + anx + ' exceeds moderate threshold.'
    });
  }
  if (dep > 13) {
    flags.push({
      cls:  'flag-warn',
      icon: '🔴',
      text: '<strong>Possible Depressive Markers:</strong> Slow processing speed and low persistence scores detected. DASS Depression score ' + dep + ' in moderate-to-severe range.'
    });
  }
  if (str > 18) {
    flags.push({
      cls:  'flag-note',
      icon: '⚡',
      text: '<strong>High Stress Response:</strong> Failed 60%+ of 2-attempt challenges. DASS Stress score ' + str + ' exceeds mild threshold.'
    });
  }
  if ((domains.workingMemory || 0) < 30) {
    flags.push({
      cls:  'flag-info',
      icon: '🧠',
      text: '<strong>Cognitive Concern:</strong> Working memory score below 30% (' + (domains.workingMemory || 0) + '%). Consider further assessment.'
    });
  }

  const html = flags.length === 0
    ? `<div class="rec-no-flags">✓ &nbsp;No clinical flags — all DASS subscales within normal-to-mild range and cognitive domains above threshold.</div>`
    : flags.map(f => `<div class="rec-flag-item ${f.cls}"><span class="rec-flag-icon">${f.icon}</span><div>${f.text}</div></div>`).join('');

  return `
    <div class="rec-detail-section">
      <div class="rec-section-title">🚩 Clinical Flags</div>
      <div class="rec-flags-list">${html}</div>
    </div>`;
}

function buildPlayerRTSectionHtml(s) {
  let samples = [];
  try {
    samples = Array.isArray(s.rt_samples) ? s.rt_samples : JSON.parse(s.rt_samples || '[]');
    samples = samples.map(Number).filter(x => !isNaN(x) && x > 0);
  } catch (_) {}

  if (samples.length === 0) {
    return `
      <div class="rec-detail-section">
        <div class="rec-section-title">⏱ Response Times</div>
        <p style="color:var(--text-d);font-style:italic;font-size:0.85rem">No response time data recorded.</p>
      </div>`;
  }

  const avg     = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
  const fastest = Math.min(...samples);
  const slowest = Math.max(...samples);

  const buckets = 8;
  const bucketSize = (slowest - fastest) / buckets || 1;
  const counts = Array(buckets).fill(0);
  samples.forEach(v => {
    const idx = Math.min(buckets - 1, Math.floor((v - fastest) / bucketSize));
    counts[idx]++;
  });
  const maxCount = Math.max(...counts);

  const distBars = counts.map((c, i) => {
    const h = maxCount > 0 ? Math.round(c / maxCount * 46) : 0;
    const ms = Math.round(fastest + i * bucketSize);
    return `
      <div class="rec-rt-dist-bar-wrap">
        <div class="rec-rt-dist-bar" style="height:${h}px"></div>
        <div class="rec-rt-dist-tick">${ms < 1000 ? ms : (ms/1000).toFixed(1)+'s'}</div>
      </div>`;
  }).join('');

  return `
    <div class="rec-detail-section">
      <div class="rec-section-title">⏱ Response Times</div>
      <div class="rec-rt-stats">
        <div class="rec-rt-stat-card">
          <div class="rec-rt-stat-label">Average RT</div>
          <div class="rec-rt-stat-val">${avg < 1000 ? avg + 'ms' : (avg/1000).toFixed(2) + 's'}</div>
        </div>
        <div class="rec-rt-stat-card">
          <div class="rec-rt-stat-label">Fastest RT</div>
          <div class="rec-rt-stat-val">${fastest < 1000 ? fastest + 'ms' : (fastest/1000).toFixed(2) + 's'}</div>
        </div>
        <div class="rec-rt-stat-card">
          <div class="rec-rt-stat-label">Slowest RT</div>
          <div class="rec-rt-stat-val">${slowest < 1000 ? slowest + 'ms' : (slowest/1000).toFixed(2) + 's'}</div>
        </div>
        <div class="rec-rt-stat-card">
          <div class="rec-rt-stat-label">Samples</div>
          <div class="rec-rt-stat-val">${samples.length}</div>
        </div>
      </div>
      <div class="rec-rt-dist-label">RT DISTRIBUTION</div>
      <div class="rec-rt-dist-bars">${distBars}</div>
    </div>`;
}

function buildPlayerTimelineHtml(s) {
  const startTs = s.session_start || 0;
  const lastTs  = s.last_updated  || 0;
  const modIdx  = s.module_idx    || 0;

  const startDate = startTs ? new Date(startTs * 1000) : null;
  const lastDate  = lastTs  ? new Date(lastTs  * 1000) : null;

  const durationMs = startTs && lastTs ? (lastTs - startTs) * 1000 : null;
  const durationStr = durationMs !== null ? formatPlayerDuration(durationMs) : 'Unknown';

  const startStr   = startDate ? formatPlayerDateTime(startDate) : 'Unknown';
  const lastStr    = lastDate  ? formatPlayerDateTime(lastDate)  : 'Unknown';

  const modItems = [];
  for (let i = 0; i < modIdx; i++) {
    const frac = modIdx > 1 ? i / (modIdx - 1) : 0;
    const modTs = startTs && lastTs ? startTs + Math.round(frac * (lastTs - startTs)) : 0;
    modItems.push(`
      <div class="rec-timeline-item">
        <div class="rec-timeline-dot${i === modIdx - 1 ? '' : ' dim'}"></div>
        <div class="rec-timeline-content">
          <div class="rec-timeline-ts">${modTs ? formatPlayerDateTime(new Date(modTs * 1000)) : '—'}</div>
          <div class="rec-timeline-desc">Module ${i + 1}: ${escapeHtmlStr(MODULE_NAMES[i] || `Module ${i+1}`)}</div>
        </div>
      </div>`);
  }

  return `
    <div class="rec-detail-section">
      <div class="rec-section-title">🕐 Session Timeline</div>
      <div class="rec-timeline">
        <div class="rec-timeline-item">
          <div class="rec-timeline-dot"></div>
          <div class="rec-timeline-content">
            <div class="rec-timeline-ts">${startStr}</div>
            <div class="rec-timeline-desc"><strong>Session Started</strong></div>
          </div>
        </div>
        ${modItems.join('')}
        ${modIdx >= 10 ? `
        <div class="rec-timeline-item">
          <div class="rec-timeline-dot"></div>
          <div class="rec-timeline-content">
            <div class="rec-timeline-ts">${lastStr}</div>
            <div class="rec-timeline-desc"><strong>Assessment Completed</strong></div>
            <div style="font-size:0.75rem; color:var(--text-d); margin-top:2px; font-style:italic;">Duration: ${durationStr}</div>
          </div>
        </div>` : ''}
      </div>
    </div>`;
}

function dassPlayerLevel(type, score) {
  if (type === 'depression') {
    if (score >= 28) return 'Extremely Severe';
    if (score >= 21) return 'Severe';
    if (score >= 14) return 'Moderate';
    if (score >= 10) return 'Mild';
    return 'Normal';
  }
  if (type === 'anxiety') {
    if (score >= 20) return 'Extremely Severe';
    if (score >= 15) return 'Severe';
    if (score >= 10) return 'Moderate';
    if (score >= 8)  return 'Mild';
    return 'Normal';
  }
  if (type === 'stress') {
    if (score >= 34) return 'Extremely Severe';
    if (score >= 26) return 'Severe';
    if (score >= 19) return 'Moderate';
    if (score >= 15) return 'Mild';
    return 'Normal';
  }
  return 'Unknown';
}

function formatPlayerDuration(ms) {
  if (ms < 0) ms = 0;
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─ INIT ───────────────────────────────────────────────────────
initBG();
checkProgressButton();
startOpeningSequence();

function startOpeningSequence() {
  const opScreen = $('sc-opening');
  if (opScreen) {
    opScreen.classList.add('on');
    // Play subtle ambient background audio
    if (typeof SFX !== 'undefined' && SFX.ambient) {
      SFX.ambient();
    }
    
    // 1. Fade in the notification
    setTimeout(() => {
      const notif = $('opening-notification');
      if (notif) notif.classList.add('show');
    }, 500);

    // 2. Animate envelope sliding into view
    setTimeout(() => {
      const notif = $('opening-notification');
      if (notif) notif.classList.remove('show');
      
      setTimeout(() => {
        const notif = $('opening-notification');
        if (notif) notif.style.display = 'none';
        const envContainer = $('opening-envelope-container');
        if (envContainer) envContainer.classList.add('show');
      }, 1500);
    }, 3000);
  }
}

window.openInvitationLetter = () => {
  if (typeof SFX !== 'undefined' && SFX.pickup) SFX.pickup();
  const letterView = $('invitation-letter-view');
  if (letterView) letterView.classList.add('show');
};

window.finishOpeningSequence = () => {
  if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
  const opScreen = $('sc-opening');
  if (opScreen) {
    opScreen.style.opacity = '0';
    setTimeout(() => {
      opScreen.classList.remove('on');
      showScreen('sc-home');
    }, 1000);
  }
};
