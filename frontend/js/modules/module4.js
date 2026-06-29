const CHARACTER_PORTRAITS = {
  ceo: 'assets/MARCUS-HALE.jpeg',
  doctor: 'assets/AVERY-ROSS.jpeg',
  musician: 'assets/LENA-BROOKS.jpeg',
  rachel: 'assets/RACHEL.jpeg',
  comedian: 'assets/ETHAN.jpeg',
  therapist: 'assets/MAYA-SINGH.jpeg',
  detective: 'assets/OLIVER-GRANT.jpeg',
  gamer: 'assets/DANIEL-PRICE.jpeg',
  influencer: 'assets/SARAH-BENNETT.jpeg',
  student: 'assets/NOAH-MERCER.jpeg'
};

const ALIBIS_DB = {
  ceo: {
    name: "Marcus Hale",
    truth: '"I patrolled the perimeter gates between 8:30 PM and 10:30 PM."',
    lie: '"I patrolled the perimeter gates until midnight."'
  },
  doctor: {
    name: "Dr. Avery Ross",
    truth: '"I was reviewing patient psychological logs in Cabin 3 until Midnight."',
    lie: '"I was reviewing patient psychological logs in Cabin 3 until 10:00 PM."'
  },
  musician: {
    name: "Lena Brooks",
    truth: '"I was collecting water samples near South Cliffs from 8:30 PM to 9:45 PM."',
    lie: '"I was collecting water samples near South Cliffs until 11:00 PM."'
  },
  student: {
    name: "Noah Mercer",
    truth: '"I was reading system logs in the Library from 8:30 PM to 10:30 PM."',
    lie: '"I was reading system logs in the Library until midnight."'
  },
  comedian: {
    name: "Ethan Cross",
    truth: '"I was interviewing guests in the lounge from 8:45 PM to 10:30 PM."',
    lie: '"I was interviewing guests in the lounge until midnight."'
  },
  detective: {
    name: "Oliver Grant",
    truth: '"I was monitoring server grids in the main office from 8:15 PM to 10:00 PM."',
    lie: '"I was monitoring server grids in the main office until 11:30 PM."'
  },
  therapist: {
    name: "Maya Singh",
    truth: '"I was managing first aid inventory in the Spa from 8:30 PM to 10:00 PM."',
    lie: '"I was managing first aid inventory in the Spa until midnight."'
  },
  gamer: {
    name: "Daniel Price",
    truth: '"I was auditing registries at the escape vessel dock from 9:00 PM to 10:15 PM."',
    lie: '"I was auditing registries at the escape vessel dock until midnight."'
  },
  influencer: {
    name: "Sarah Bennett",
    truth: '"I was attending the VIP beach photoshoot from 9:00 PM to 9:30 PM."',
    lie: '"I was attending the VIP beach photoshoot until 11:30 PM."'
  },
  rachel: {
    name: "Rachel Quinn",
    truth: '"I was drafting legal files in the resort lobby from 8:45 PM to 10:15 PM."',
    lie: '"I was drafting legal files in the resort lobby until midnight."'
  }
};

function startBonfire() {
  let attempt = 0;
  $('bonfire-attempt').textContent = 1;
  const gameStart = Date.now();

  if (!$('bonfire-styles')) {
    const s = document.createElement('style');
    s.id = 'bonfire-styles';
    s.textContent = `
      .bonfire-card {
        display: flex;
        align-items: center;
        gap: 15px;
        background: rgba(28, 25, 23, 0.6);
        border: 1.5px solid rgba(196, 164, 101, 0.2);
        border-radius: 8px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.19, 1, 0.22, 1);
      }
      .bonfire-card:hover {
        background: rgba(196, 164, 101, 0.08);
        border-color: rgba(196, 164, 101, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      .bonfire-card.correct {
        background: rgba(16, 185, 129, 0.15);
        border-color: #10b981;
        box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
      }
      .bonfire-card.wrong {
        background: rgba(239, 68, 68, 0.15);
        border-color: #ef4444;
        animation: shake 0.4s;
      }
    `;
    document.head.appendChild(s);
  }

  // Identify the liar
  const liarId = GS.bonfireVictim;
  const liarData = ALIBIS_DB[liarId] || ALIBIS_DB.ceo;
  const liarStatement = liarData.lie;
  window._testBonfireCorrect = liarData.name;

  // Get current player identity to avoid showing player alibi
  const user = JSON.parse(localStorage.getItem('elaris_user') || '{}');
  const playerId = user.identity === 'academic' ? 'student' : user.identity;

  // Select two other alive truth-telling suspects
  const eligibleTruthTellers = [...IDENTITIES, ...GS.npcs].filter(c => 
    c.id !== playerId && 
    c.id !== 'kai' && 
    c.id !== 'keeper' && 
    c.id !== 'narrator' && 
    c.id !== liarId &&
    c.alive !== false
  );

  // Shuffle and pick 2
  const shuffledTruth = [...eligibleTruthTellers].sort(() => Math.random() - 0.5);
  const truth1Id = shuffledTruth[0].id;
  const truth2Id = shuffledTruth[1].id;
  window._bonfireTruthTellers = [truth1Id, truth2Id];

  const truth1Data = ALIBIS_DB[truth1Id] || ALIBIS_DB.doctor;
  const truth2Data = ALIBIS_DB[truth2Id] || ALIBIS_DB.musician;

  // Build the list of suspects to display
  const displaySuspects = [
    { id: liarId, name: liarData.name, img: CHARACTER_PORTRAITS[liarId] || 'assets/avatar_default.png', statement: liarStatement, isLiar: true },
    { id: truth1Id, name: truth1Data.name, img: CHARACTER_PORTRAITS[truth1Id] || 'assets/avatar_default.png', statement: truth1Data.truth, isLiar: false },
    { id: truth2Id, name: truth2Data.name, img: CHARACTER_PORTRAITS[truth2Id] || 'assets/avatar_default.png', statement: truth2Data.truth, isLiar: false }
  ];

  // Shuffle display suspects
  const shuffledDisplay = displaySuspects.sort(() => Math.random() - 0.5);

  const container = $('bonfire-cards');
  container.innerHTML = shuffledDisplay.map(s => `
    <div class="bonfire-card" data-id="${s.id}" data-liar="${s.isLiar}">
      <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; border: 1.5px solid var(--gold-l); background: #111; flex-shrink: 0;">
        <img src="${s.img}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div style="flex: 1; text-align: left;">
        <div style="font-weight: bold; color: var(--gold-l); font-size: 0.9rem; margin-bottom: 4px;">${s.name}</div>
        <div style="font-style: italic; color: #f5f0eb; font-size: 0.8rem; line-height: 1.4;">${s.statement}</div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.bonfire-card').forEach(card => {
    card.onclick = () => {
      if (!GS.gameActive) return;
      const isLiar = card.dataset.liar === 'true';
      SFX.click();

      if (isLiar) {
        card.classList.add('correct');
        SFX.success();
        GS.domains.cognitiveFlexibility = Math.min(100, GS.domains.cognitiveFlexibility + 18);
        GS.gameActive = false;
        
        // Freeze active screen clicks
        const activeScreen = document.querySelector('.screen.game-screen');
        if (activeScreen) activeScreen.style.pointerEvents = 'none';

        // Unlock the truth-tellers as suspects in the dossier (and preserve previous suspects)
        if (!GS.unlockedSuspects) GS.unlockedSuspects = [];
        if (!GS.unlockedSuspects.includes(truth1Id)) GS.unlockedSuspects.push(truth1Id);
        if (!GS.unlockedSuspects.includes(truth2Id)) GS.unlockedSuspects.push(truth2Id);
        updateDossierList();

        setTimeout(() => {
          onModuleComplete(15, Date.now() - gameStart, true);
        }, 500);
      } else {
        card.classList.add('wrong');
        SFX.fail();
        attempt++;
        $('bonfire-attempt').textContent = attempt + 1;
        setTimeout(() => card.classList.remove('wrong'), 500);
      }
    };
  });
}
