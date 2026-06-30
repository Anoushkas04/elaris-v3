function startPathfinder() {
  const container = $('sc-pathfinder');
  if (!container) return;

  const gameStart = Date.now();
  let currentStep = 0;
  let errors = 0;

  // Retrieve clues and steps dynamically based on what was collected
  const steps = getDeductionSteps();

  // Render Clue list on the left (only show collected clues)
  const clueListEl = $('pf-clue-list');
  if (clueListEl) {
    clueListEl.innerHTML = '';
    
    const clueConfigs = [
      { idx: 0, title: "Beach Recording" },
      { idx: 1, title: "Handwritten Note" },
      { idx: 2, title: "Decrypted Dossier" },
      { idx: 3, title: "Timeline Proof" },
      { idx: 4, title: "Baggage Blueprints" },
      { idx: 5, title: "Server Room Discovery" },
      { idx: 6, title: "Project Signatures" },
      { idx: 7, title: "CCTV Timeline" },
      { idx: 8, title: "Decrypted Audio" }
    ];

    clueConfigs.forEach(conf => {
      if (GS.fragments[conf.idx]) {
        const frag = getMemoryFragment(conf.idx);
        const card = document.createElement('div');
        card.style.cssText = `
          background: rgba(196,164,101,0.05);
          border: 1px solid rgba(196,164,101,0.2);
          border-radius: 6px;
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        `;
        card.onmouseover = () => {
          card.style.background = 'rgba(196,164,101,0.12)';
          card.style.borderColor = 'var(--gold)';
        };
        card.onmouseout = () => {
          card.style.background = 'rgba(196,164,101,0.05)';
          card.style.borderColor = 'rgba(196,164,101,0.2)';
        };
        card.onclick = () => {
          SFX.click();
          showClueModal(conf.title, frag.clue);
        };
        
        card.innerHTML = `
          <div style="font-family: var(--ff-t); color: var(--gold-l); font-size: 0.8rem; font-weight: bold; margin-bottom: 2px;">${conf.title}</div>
          <div style="font-family: var(--ff-m); font-size: 0.7rem; color: var(--text-d); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${frag.clue}
          </div>
        `;
        clueListEl.appendChild(card);
      }
    });
  }

  // Render Character icons on the right (exclude Narrator and Lighthouse Keeper)
  const suspectListEl = $('pf-suspect-circles-list');
  if (suspectListEl) {
    suspectListEl.innerHTML = '';
    
    const getDossierImgPath = (id) => {
      if (id === 'ceo') return 'assets/MARCUS-HALE.jpeg';
      if (id === 'doctor') return 'assets/AVERY-ROSS.jpeg';
      if (id === 'musician') return 'assets/LENA-BROOKS.jpeg';
      if (id === 'rachel') return 'assets/RACHEL.jpeg';
      if (id === 'comedian') return 'assets/ETHAN.jpeg';
      if (id === 'therapist') return 'assets/MAYA-SINGH.jpeg';
      if (id === 'detective') return 'assets/OLIVER-GRANT.jpeg';
      if (id === 'gamer') return 'assets/DANIEL-PRICE.jpeg';
      if (id === 'influencer') return 'assets/SARAH-BENNETT.jpeg';
      if (id === 'student') return 'assets/NOAH-MERCER.jpeg';
      return 'assets/NARRATOR.png';
    };

    const eligibleSuspects = [...IDENTITIES, ...NPCS_BASE].filter(c => 
      c.id !== 'rowan' && c.id !== 'keeper' && c.id !== 'narrator' && c.id !== 'kai'
    );

    eligibleSuspects.forEach(sus => {
      const row = document.createElement('div');
      row.className = 'suspect-row-item';
      row.dataset.id = sus.id;
      row.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        width: 100%;
        padding: 4px 6px;
        border-radius: 4px;
        transition: all 0.2s;
      `;

      row.innerHTML = `
        <div class="suspect-circle" style="width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(196,164,101,0.4); transition: all 0.2s;">
          <img src="${getDossierImgPath(sus.id)}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="suspect-name-label" style="font-family: var(--ff-t); color: var(--text-p); font-size: 0.8rem; transition: color 0.2s;">
          ${sus.name}
        </div>
      `;

      row.onclick = () => {
        if (!GS.gameActive) return;
        handleSuspectSelection(sus.id, row);
      };

      suspectListEl.appendChild(row);
    });
  }

  // Clear Case Summary
  const summaryListEl = $('pf-summary-list');
  if (summaryListEl) {
    summaryListEl.innerHTML = '<span style="color: var(--text-d); font-style: italic;">No links established yet.</span>';
  }

  // Render chains progress indicator
  updateProgressIndicator();

  // Function to update progress indicator at bottom
  function updateProgressIndicator() {
    const progressEl = $('pf-progress-indicator');
    if (progressEl) {
      progressEl.textContent = `${currentStep} / ${steps.length} Chains Completed`;
    }
  }

  // Handler for circular suspect row click on the right side
  function handleSuspectSelection(susId, rowEl) {
    if (currentStep >= steps.length) return;
    const step = steps[currentStep];

    if (step.targetType !== 'suspect') return;

    if (susId === step.correctId) {
      // Correct!
      SFX.success();
      
      // Visual feedback: Highlight circular icon row
      rowEl.classList.add('highlighted');
      const circle = rowEl.querySelector('.suspect-circle');
      if (circle) circle.style.borderColor = 'var(--teal)';

      // Render correct answer in chain target
      const targetEl = $('pf-chain-target');
      if (targetEl) {
        targetEl.textContent = step.correct;
        targetEl.style.borderStyle = 'solid';
        targetEl.style.color = '#fff';
      }

      // Add to case summary report
      if (summaryListEl) {
        if (currentStep === 0) summaryListEl.innerHTML = '';
        const summaryItem = document.createElement('div');
        summaryItem.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--teal);
          margin-bottom: 4px;
        `;
        summaryItem.innerHTML = `<span>✓</span> <span>${step.summary}</span>`;
        summaryListEl.appendChild(summaryItem);
      }

      // Update domains
      GS.domains.attention = Math.min(100, GS.domains.attention + 6);
      GS.domains.decisionMaking = Math.min(100, GS.domains.decisionMaking + 7);

      // Disable suspect rows temporarily
      if (suspectListEl) suspectListEl.style.pointerEvents = 'none';

      // Move next
      setTimeout(() => {
        if (suspectListEl) suspectListEl.style.pointerEvents = 'auto';
        rowEl.classList.remove('highlighted');
        if (circle) circle.style.borderColor = 'rgba(196,164,101,0.4)';
        currentStep++;
        updateProgressIndicator();
        renderChain();
      }, 1200);

    } else {
      // Incorrect suspect clicked!
      SFX.fail();
      errors++;
      
      // Visual error feedback on row
      rowEl.style.background = 'rgba(220,53,69,0.15)';
      setTimeout(() => rowEl.style.background = 'transparent', 400);

      GS.domains.attention = Math.max(0, GS.domains.attention - 3);
      GS.domains.errorMonitoring = Math.min(100, GS.domains.errorMonitoring + 6);
    }
  }

  // Function to show the current chain
  function renderChain() {
    if (currentStep >= steps.length) {
      // All steps completed!
      GS.gameActive = false;
      const activeScreen = document.querySelector('.screen.game-screen');
      if (activeScreen) activeScreen.style.pointerEvents = 'none';
      const rt = Date.now() - gameStart;
      onModuleComplete(Math.max(5, 20 - errors * 2), rt, true);
      return;
    }

    const step = steps[currentStep];

    // Render step header
    const stepHeader = $('pf-chain-step');
    if (stepHeader) stepHeader.textContent = `CHAIN ${currentStep + 1} OF ${steps.length}`;

    // Render chain elements
    const subjectEl = $('pf-chain-subject');
    if (subjectEl) {
      subjectEl.innerHTML = `<span style="margin-right: 6px;">${step.subjectIcon}</span>${step.subject}`;
    }

    const verbEl = $('pf-chain-verb');
    if (verbEl) verbEl.textContent = step.verb;

    const targetEl = $('pf-chain-target');
    if (targetEl) {
      targetEl.textContent = "?";
      targetEl.style.borderStyle = 'dashed';
      targetEl.style.color = 'var(--gold-l)';
    }

    // Render choices or instruct to click suspect list
    const choicesEl = $('pf-solver-choices');
    if (choicesEl) {
      choicesEl.innerHTML = '';
      
      if (step.targetType === 'suspect') {
        const info = document.createElement('div');
        info.style.cssText = `
          grid-column: 1 / -1;
          font-family: var(--ff-m);
          font-size: 0.8rem;
          color: var(--gold);
          text-align: center;
          padding: 8px;
          border: 1px dashed rgba(196,164,101,0.2);
          border-radius: 4px;
        `;
        info.textContent = "Select the correct suspect profile from the CHARACTERS list on the right.";
        choicesEl.appendChild(info);
      } else {
        // Shuffle options
        const shuffledOptions = [...step.options].sort(() => Math.random() - 0.5);

        shuffledOptions.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'btn-choice';
          btn.style.cssText = `
            font-family: var(--ff-b);
            font-size: 0.9rem;
            padding: 8px 12px;
            text-align: center;
            width: 100%;
          `;
          btn.textContent = opt;
          btn.onclick = () => {
            if (!GS.gameActive) return;

            if (opt === step.correct) {
              // Correct choice!
              SFX.success();
              btn.style.background = 'rgba(46,154,120,0.2)';
              btn.style.borderColor = 'var(--teal)';
              btn.style.color = '#fff';

              // Disable buttons
              choicesEl.querySelectorAll('button').forEach(b => b.style.pointerEvents = 'none');

              // Render correct target in chain
              if (targetEl) {
                targetEl.textContent = step.correct;
                targetEl.style.borderStyle = 'solid';
                targetEl.style.color = '#fff';
              }

              // Update Case Summary
              if (summaryListEl) {
                if (currentStep === 0) summaryListEl.innerHTML = '';
                const summaryItem = document.createElement('div');
                summaryItem.style.cssText = `
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  color: var(--teal);
                  margin-bottom: 4px;
                `;
                summaryItem.innerHTML = `<span>✓</span> <span>${step.summary}</span>`;
                summaryListEl.appendChild(summaryItem);
              }

              GS.domains.attention = Math.min(100, GS.domains.attention + 6);
              GS.domains.decisionMaking = Math.min(100, GS.domains.decisionMaking + 7);

              setTimeout(() => {
                currentStep++;
                updateProgressIndicator();
                renderChain();
              }, 1200);

            } else {
              // Incorrect choice!
              SFX.fail();
              errors++;
              btn.style.background = 'rgba(220,53,69,0.2)';
              btn.style.borderColor = '#dc3545';
              btn.style.color = '#fff';

              btn.style.animation = 'shake 0.3s';
              setTimeout(() => btn.style.animation = '', 300);

              GS.domains.attention = Math.max(0, GS.domains.attention - 3);
              GS.domains.errorMonitoring = Math.min(100, GS.domains.errorMonitoring + 6);
            }
          };

          choicesEl.appendChild(btn);
        });
      }
    }
  }

  // Start the first chain
  renderChain();
}

function showClueModal(title, text) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 10000000;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    opacity: 0;
    transition: opacity 0.25s ease;
  `;
  
  const content = document.createElement('div');
  content.className = 'glass-panel';
  content.style.cssText = `
    max-width: 480px;
    width: 90%;
    padding: 24px;
    background: var(--ink-ss);
    border: 1px solid var(--gold);
    border-radius: var(--radius);
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    transform: scale(0.9);
    transition: transform 0.25s ease;
    text-align: center;
  `;
  
  content.innerHTML = `
    <h4 style="font-family: var(--ff-t); color: var(--gold-l); font-size: 1.2rem; margin-bottom: 12px; border-bottom: 1px solid rgba(196,164,101,0.25); padding-bottom: 8px;">${title}</h4>
    <p style="font-family: var(--ff-m); font-size: 0.95rem; color: var(--text-p); line-height: 1.5; margin-bottom: 20px; white-space: pre-line;">${text}</p>
    <button class="btn-main" style="width: 100%; font-size: 0.85rem; padding: 10px;" id="pf-clue-close-btn">Close File</button>
  `;
  
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.style.opacity = '1';
    content.style.transform = 'scale(1)';
  }, 10);
  
  const close = () => {
    overlay.style.opacity = '0';
    content.style.transform = 'scale(0.9)';
    setTimeout(() => overlay.remove(), 250);
  };
  
  content.querySelector('#pf-clue-close-btn').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
}

function getDeductionSteps() {
  const killerMeta = CHARACTER_META[GS.murderer] || CHARACTER_META.ceo;
  
  const allSecrets = Object.values(CHARACTER_META)
    .filter(m => m.id !== GS.murderer)
    .map(m => m.secret);
  const shuffledSecrets = allSecrets.sort(() => Math.random() - 0.5);
  const distractors5 = shuffledSecrets.slice(0, 3);

  const rawSteps = [
    {
      id: "chain_marcus",
      fragIdx: 6,
      subject: "Marcus Hale",
      subjectIcon: "👮",
      verb: "Covered up complaints for",
      correct: "Dr. Avery Ross",
      targetType: "suspect",
      correctId: "doctor",
      summary: "Marcus Hale covered up complaints for Dr. Avery Ross."
    },
    {
      id: "chain_oliver",
      fragIdx: 5,
      subject: "Oliver Grant",
      subjectIcon: "💻",
      verb: "Built a hidden",
      correct: "Monitoring System",
      targetType: "options",
      options: ["Monitoring System", "Research Files", "Escape Boat", "Medical Lab"],
      summary: "Oliver Grant built a hidden Monitoring System."
    },
    {
      id: "chain_maya",
      fragIdx: 8,
      subject: "Maya Singh",
      subjectIcon: "🩺",
      verb: "Witnessed participant harm to",
      correct: "Noah Mercer",
      targetType: "suspect",
      correctId: "student",
      summary: "Maya Singh witnessed participant harm to Noah Mercer."
    },
    {
      id: "chain_sarah",
      fragIdx: 2,
      subject: "Sarah Bennett",
      subjectIcon: "💰",
      verb: "Funded Project Echo for",
      correct: "Marcus Hale",
      targetType: "suspect",
      correctId: "ceo",
      summary: "Sarah Bennett funded Project Echo for Marcus Hale."
    },
    {
      id: "chain_killer",
      fragIdx: 0,
      subject: killerMeta.name,
      subjectIcon: "👤",
      verb: "Killed Kai Nakamura to hide:",
      correct: killerMeta.secret,
      targetType: "options",
      options: [killerMeta.secret, ...distractors5],
      summary: `${killerMeta.name} killed Kai Nakamura to hide: ${killerMeta.secret}`
    }
  ];

  return rawSteps.filter(step => GS.fragments[step.fragIdx]);
}
