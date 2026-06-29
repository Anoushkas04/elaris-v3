function startBonfire(){
  const scenes = {
    ceo: {
      npc: 'Marcus Hale',
      dialogue: '"I kept watch over the island. I was patrolling the resort perimeter gates until 10:30 PM. I returned to my cabin straight after that."',
      correct: 'patrolling the resort perimeter gates until 10:30 PM',
      opts: [
        'kept watch over the island',
        'patrolling the resort perimeter gates until 10:30 PM',
        'returned to my cabin',
        'straight after that'
      ]
    },
    doctor: {
      npc: 'Dr. Avery Ross',
      dialogue: '"I stayed inside my room reviewing patient psychological logs in Cabin 3 until midnight. I wanted to complete my trial reviews before the storm hit."',
      correct: 'reviewing patient psychological logs in Cabin 3 until midnight',
      opts: [
        'stayed inside my room',
        'reviewing patient psychological logs in Cabin 3 until midnight',
        'complete my trial reviews',
        'before the storm hit'
      ]
    },
    student: {
      npc: 'Noah Mercer',
      dialogue: '"I needed quiet, so I was analyzing server activity logs in the Library until 10:30 PM. Then I walked back to Cabin 6 under the heavy rain."',
      correct: 'analyzing server activity logs in the Library until 10:30 PM',
      opts: [
        'needed quiet',
        'analyzing server activity logs in the Library until 10:30 PM',
        'walked back to Cabin 6',
        'under the heavy rain'
      ]
    },
    musician: {
      npc: 'Lena Brooks',
      dialogue: '"I was taking tide pool samples at South Cliffs until 9:45 PM. I wanted to record the baseline readings before the tidal surge ruined the data."',
      correct: 'taking tide pool samples at South Cliffs until 9:45 PM',
      opts: [
        'wanted to record baseline',
        'taking tide pool samples at South Cliffs until 9:45 PM',
        'before tidal surge ruined',
        'ruined the data'
      ]
    },
    rachel: {
      npc: 'Rachel Quinn',
      dialogue: '"I stayed busy drafting settlement agreements in the resort lobby until 10:15 PM. I needed a stable internet link to fetch the templates."',
      correct: 'drafting settlement agreements in the resort lobby until 10:15 PM',
      opts: [
        'stayed busy',
        'drafting settlement agreements in the resort lobby until 10:15 PM',
        'stable internet link',
        'fetch the templates'
      ]
    },
    comedian: {
      npc: 'Ethan Cross',
      dialogue: '"I spent the evening interviewing guests in the resort lounge until 10:30 PM. I gathered some good quotes about the pilot project background."',
      correct: 'interviewing guests in the resort lounge until 10:30 PM',
      opts: [
        'spent the evening',
        'interviewing guests in the resort lounge until 10:30 PM',
        'good quotes',
        'pilot project background'
      ]
    },
    therapist: {
      npc: 'Maya Singh',
      dialogue: '"I was organizing medical inventory in the Spa until midnight. The emergency supplies needed to be categorized in case the storm knocked out main power."',
      correct: 'organizing medical inventory in the Spa until midnight',
      opts: [
        'Spa until midnight',
        'organizing medical inventory in the Spa until midnight',
        'emergency supplies needed',
        'storm knocked out'
      ]
    },
    detective: {
      npc: 'Oliver Grant',
      dialogue: '"I sat in the office monitoring server power grids from the main office until 10:00 PM. The grid was showing minor spikes, but nothing critical."',
      correct: 'monitoring server power grids from the main office until 10:00 PM',
      opts: [
        'sat in the office',
        'monitoring server power grids from the main office until 10:00 PM',
        'minor spikes',
        'nothing critical'
      ]
    },
    gamer: {
      npc: 'Daniel Price',
      dialogue: '"I conducted audits down at the beach. I was auditing the escape vessel dock logs until 10:15 PM. The dock locks were functioning normally."',
      correct: 'auditing the escape vessel dock logs until 10:15 PM',
      opts: [
        'beach perimeter',
        'auditing the escape vessel dock logs until 10:15 PM',
        'dock locks',
        'functioning normally'
      ]
    },
    influencer: {
      npc: 'Sarah Bennett',
      dialogue: '"I had a photo shoot scheduled. I was attending the VIP beach photoshoot until 11:30 PM. The storm ruined most of the outdoor camera shots."',
      correct: 'attending the VIP beach photoshoot until 11:30 PM',
      opts: [
        'photo shoot scheduled',
        'attending the VIP beach photoshoot until 11:30 PM',
        'storm ruined most',
        'outdoor camera shots'
      ]
    }
  };
  const s = scenes[GS.murderer] || scenes.ceo;
  let attempt=0; window._testBonfireCorrect = s.correct;
  $('bonfire-attempt').textContent=1;
  $('bonfire-dialogue').innerHTML=s.dialogue; $('bonfire-npc').textContent=s.npc;
  const gameStart=Date.now();
  const shuffledOpts = [...s.opts].sort(() => Math.random() - 0.5);
  $('bonfire-opts').innerHTML=shuffledOpts.map(o=>`<div class="kara-opt" data-o="${o}">${o}</div>`).join('');
  $('bonfire-opts').querySelectorAll('.kara-opt').forEach(el=>{
    el.onclick=()=>{
      if (!GS.gameActive) return;
      const val=el.dataset.o; SFX.click();
      if(val===s.correct){ 
        el.classList.add('correct'); 
        GS.domains.cognitiveFlexibility=Math.min(100,GS.domains.cognitiveFlexibility+18); 
        GS.gameActive = false;
        const activeScreen = document.querySelector('.screen.game-screen');
        if (activeScreen) activeScreen.style.pointerEvents = 'none';
        onModuleComplete(15,Date.now()-gameStart,true); 
      }
      else { el.classList.add('wrong'); SFX.fail(); attempt++; $('bonfire-attempt').textContent=attempt+1;
        setTimeout(()=>el.classList.remove('wrong'),500);
        if(attempt>=2) {
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(5,null,false);
        }
      }
    };
  });
}
