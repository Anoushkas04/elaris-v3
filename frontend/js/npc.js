// ─ CHARACTER RENDERING ────────────────────────────────────────
function makeSVGChar(npc, speaking=false) {
  if (npc.id === 'narrator') {
    return `<img class="char-svg" src="assets/NARRATOR.png" style="filter: drop-shadow(0 0 32px rgba(100,160,255,0.75)) drop-shadow(0 8px 16px rgba(0,0,0,0.5));" />`;
  }
  if (npc.id === 'ceo') {
    return `<img class="char-svg" src="assets/MARCUS-HALE-FIGURINE.png" />`;
  }
  if (npc.id === 'doctor') {
    return `<img class="char-svg" src="assets/AVERY-ROSS-FIGURINE.png" />`;
  }
  if (npc.id === 'musician') {
    return `<img class="char-svg" src="assets/LENA-BROOKS-FIGURINE.png" />`;
  }
  if (npc.id === 'rachel') {
    return `<img class="char-svg" src="assets/RACHEL-FIGURINE.png" />`;
  }
  if (npc.id === 'comedian') {
    return `<img class="char-svg" src="assets/ETHAN-FIGURINE.png" />`;
  }
  if (npc.id === 'therapist') {
    return `<img class="char-svg" src="assets/MAYA-SINGH-FIGURINE.png" />`;
  }
  if (npc.id === 'detective') {
    return `<img class="char-svg" src="assets/OLIVER-GRANT-FIGURINE.png" />`;
  }
  if (npc.id === 'gamer') {
    return `<img class="char-svg" src="assets/DANIEL-PRICE-FIGURINE.png" />`;
  }
  if (npc.id === 'influencer') {
    return `<img class="char-svg" src="assets/SARAH-BENNETT-FIGURINE.png" />`;
  }
  if (npc.id === 'kai') {
    return `<img class="char-svg" src="assets/KAI-NAKAMURA-FIGURINE.png" />`;
  }
  if (npc.id === 'student') {
    return `<img class="char-svg" src="assets/NOAH-MERCER-FIGURINE.png" />`;
  }

  const c = npc.color || '#c4a465';
  const lipAnim = speaking ? 'class="lip-anim"' : '';
  const stroke = '#2c221a';

  // Default values
  let hairColor1 = '#4a3520', hairColor2 = '#2a1e12';
  let clothColor1 = c, clothColor2 = '#2a1a0f';
  let legColor = '#2a2622', shoeColor = '#1a1816';
  
  let hair = '';
  let clothes = '';
  let extra = '';

  // Skin tone defaults
  const skinTones = {
    doctor:     { light: '#fbe3d6', dark: '#d59b80' },
    ceo:        { light: '#f5d0b9', dark: '#c38b6c' },
    musician:   { light: '#ecd2c1', dark: '#b5836a' },
    student:    { light: '#f3d0bc', dark: '#be886b' },
    rachel:     { light: '#fadcce', dark: '#c78f77' },
    comedian:   { light: '#f5d5be', dark: '#c08b6a' },
    therapist:  { light: '#e0a98c', dark: '#9e6b4e' },
    detective:  { light: '#eed2be', dark: '#ba886a' },
    gamer:      { light: '#fae6d9', dark: '#cca283' },
    influencer: { light: '#f9dfd0', dark: '#c59278' },
    rowan:      { light: '#fbe0d1', dark: '#cda087' },
    keeper:     { light: '#f5cbac', dark: '#c28e67' },
    kai:        { light: '#fcd6c0', dark: '#cfa183' }
  };
  const tone = skinTones[npc.id] || { light: '#fcd5b8', dark: '#e09f7a' };
  const skinLight = tone.light;
  const skinDark = tone.dark;

  if (npc.id === 'rowan') {
    hairColor1 = '#fcfcfc'; hairColor2 = '#a0a3ad';
    clothColor1 = '#285e3a'; clothColor2 = '#103019';
    legColor = '#3a3a40'; shoeColor = '#222120';
    hair = `<path d="M 24 50 Q 24 22 50 20 Q 76 22 76 50 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
            <path d="M 32 35 Q 50 25 68 35" fill="none" stroke="#cfd2d6" stroke-width="1.5"/>`;
    clothes = `<!-- White shirt -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="#ffffff" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Green Vest side panels -->
      <path d="M 30 81 L 43 81 L 46 122 L 28 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 70 81 L 57 81 L 54 122 L 72 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>`;
    extra = `<!-- Golden bowtie -->
      <path d="M 44 82 L 56 86 L 56 82 L 44 86 Z" fill="#d4af37" stroke="${stroke}" stroke-width="1"/>
      <circle cx="50" cy="84" r="2" fill="#b59020"/>`;
  } else if (npc.id === 'doctor') {
    hairColor1 = '#fae093'; hairColor2 = '#a88632';
    clothColor1 = '#9b1c31'; clothColor2 = '#490714';
    legColor = '#2a2023'; shoeColor = '#181013';
    hair = `<path d="M 20 54 Q 18 20 50 18 Q 82 20 80 54 Q 80 65 72 65 Q 65 32 50 32 Q 35 32 28 65 Q 20 65 20 54 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
            <path d="M 35 32 Q 50 24 65 32" fill="none" stroke="#eed182" stroke-width="2"/>`;
    clothes = `<!-- White shirt -->
      <path d="M 40 80 L 50 95 L 60 80 Z" fill="#ffffff" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Blazer body -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Lapels -->
      <path d="M 30 80 L 45 105 L 50 122 M 70 80 L 55 105 L 50 122" fill="none" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 30 80 L 40 92 M 70 80 L 60 92" fill="none" stroke="${stroke}" stroke-width="1.5"/>`;
    extra = `<ellipse cx="36" cy="56" rx="9" ry="8" fill="none" stroke="url(#metalSilverGrad_${npc.id})" stroke-width="1.5"/>
             <ellipse cx="64" cy="56" rx="9" ry="8" fill="none" stroke="url(#metalSilverGrad_${npc.id})" stroke-width="1.5"/>
             <line x1="45" y1="56" x2="55" y2="56" stroke="url(#metalSilverGrad_${npc.id})" stroke-width="1.5"/>`;
  } else if (npc.id === 'ceo') {
    hairColor1 = '#8a909a'; hairColor2 = '#4a505a';
    clothColor1 = '#2d3748'; clothColor2 = '#131924';
    legColor = '#1a1a1a'; shoeColor = '#111111';
    hair = `<path d="M 26 44 Q 30 22 50 20 Q 70 22 74 44 Q 50 36 26 44 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>`;
    clothes = `<!-- Grey shirt -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="#4a5568" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Tactical vest -->
      <path d="M 32 84 L 68 84 L 70 120 L 30 120 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Straps -->
      <rect x="35" y="80" width="7" height="15" fill="#1a202c" stroke="${stroke}" stroke-width="1.2"/>
      <rect x="58" y="80" width="7" height="15" fill="#1a202c" stroke="${stroke}" stroke-width="1.2"/>
      <!-- Pocket details -->
      <rect x="36" y="98" width="9" height="10" rx="1" fill="#1a202c" stroke="${stroke}" stroke-width="1"/>
      <rect x="55" y="98" width="9" height="10" rx="1" fill="#1a202c" stroke="${stroke}" stroke-width="1"/>`;
    extra = `<path d="M 37 87 L 42 85 L 47 87 L 45 93 L 42 96 L 39 93 Z" fill="url(#metalSilverGrad_${npc.id})" stroke="#1a202c" stroke-width="1"/>`;
  } else if (npc.id === 'musician') {
    hairColor1 = '#4a2c1b'; hairColor2 = '#23120a';
    clothColor1 = '#1e6865'; clothColor2 = '#0d3b39';
    legColor = '#70583b'; shoeColor = '#3a2b16';
    hair = `<path d="M 22 50 Q 18 15 50 15 Q 82 15 78 50 Q 84 75 75 92 Q 70 58 50 32 Q 30 58 25 92 Q 16 75 22 50 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
            <path d="M 28 50 C 24 60 26 75 28 85 M 72 50 C 76 60 74 75 72 85" fill="none" stroke="${stroke}" stroke-width="1"/>`;
    clothes = `<!-- Yellow undershirt -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="#ebaa42" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Teal field vest -->
      <path d="M 33 86 L 45 86 L 45 120 L 31 120 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 67 86 L 55 86 L 55 120 L 69 120 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Pockets -->
      <rect x="34" y="98" width="8" height="8" rx="1" fill="#0f3d38" stroke="${stroke}" stroke-width="1"/>
      <rect x="58" y="98" width="8" height="8" rx="1" fill="#0f3d38" stroke="${stroke}" stroke-width="1"/>`;
  } else if (npc.id === 'student') {
    hairColor1 = '#3d2516'; hairColor2 = '#1f1008';
    clothColor1 = '#4a4a4a'; clothColor2 = '#232323';
    legColor = '#2b446a'; shoeColor = '#1f2e46';
    hair = `<path d="M 24 48 Q 20 22 50 20 Q 80 22 76 48 Q 70 36 50 36 Q 30 36 24 48 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
            <path d="M 36 34 L 40 45 L 45 35 M 64 34 L 60 45 L 55 35" fill="none" stroke="${stroke}" stroke-width="1.2"/>`;
    clothes = `<!-- Hoodie body -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Hoodie pocket pouch -->
      <path d="M 36 104 L 64 104 L 67 121 L 33 121 Z" fill="#2d2d2d" stroke="${stroke}" stroke-width="1.2"/>
      <!-- Drawstrings -->
      <path d="M 46 88 L 46 104 M 54 88 L 54 104" stroke="#d6d6d6" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Hoodie collar wrap -->
      <path d="M 34 80 Q 50 92 66 80 Q 50 74 34 80" fill="#2d2d2d" stroke="${stroke}" stroke-width="1.5"/>`;
  } else if (npc.id === 'rachel') {
    hairColor1 = '#222222'; hairColor2 = '#0d0d0d';
    clothColor1 = '#262626'; clothColor2 = '#121212';
    legColor = '#1f1f1f'; shoeColor = '#111111';
    hair = `<!-- Bun on top -->
      <circle cx="50" cy="20" r="10" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 23 52 Q 22 25 50 25 Q 78 25 77 52 Q 72 40 50 40 Q 28 40 23 52 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>`;
    clothes = `<!-- White collared shirt -->
      <path d="M 38 80 L 50 98 L 62 80 Z" fill="#ffffff" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Red Tie -->
      <path d="M 48 85 L 52 85 L 53 105 L 50 112 L 47 105 Z" fill="#8c1c1c" stroke="${stroke}" stroke-width="1"/>
      <!-- Suit Jacket -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Lapels -->
      <path d="M 30 80 L 44 102 L 50 122 L 56 102 L 70 80" fill="none" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 30 80 L 40 92 L 38 80 M 70 80 L 60 92 L 62 80" fill="none" stroke="${stroke}" stroke-width="1.2"/>`;
  } else if (npc.id === 'comedian') {
    hairColor1 = '#e9c277'; hairColor2 = '#a27e3d';
    clothColor1 = '#315a80'; clothColor2 = '#19324c';
    legColor = '#3a3e47'; shoeColor = '#1e2025';
    hair = `<path d="M 24 46 Q 20 20 50 18 Q 80 20 76 46 Q 68 36 50 36 Q 32 36 24 46 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
            <!-- Spiky pieces -->
            <path d="M 28 26 L 24 16 L 34 22 L 42 12 L 48 20 L 58 10 L 62 20 L 72 14 L 70 26" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.2"/>`;
    clothes = `<!-- Light shirt -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="#e2e8f0" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Denim jacket open -->
      <path d="M 30 80 L 44 80 L 42 122 L 28 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 70 80 L 56 80 L 58 122 L 72 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Collar folds -->
      <path d="M 30 80 L 38 90 L 44 80" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.2"/>
      <path d="M 70 80 L 62 90 L 56 80" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.2"/>`;
  } else if (npc.id === 'therapist') {
    hairColor1 = '#3a271c'; hairColor2 = '#1a100a';
    clothColor1 = '#207e7b'; clothColor2 = '#0e4947';
    legColor = '#4a928e'; shoeColor = '#ffffff';
    hair = `<!-- Bun on top -->
      <circle cx="50" cy="22" r="9" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 24 50 Q 22 25 50 25 Q 78 25 76 50 Q 68 38 50 38 Q 32 38 24 50 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>`;
    clothes = `<!-- Scrubs base -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- V-neck skin showing -->
      <path d="M 38 80 L 50 93 L 62 80 Z" fill="url(#skinGrad_${npc.id})" stroke="none"/>
      <!-- V-neck lines -->
      <path d="M 36 80 L 50 95 L 64 80" fill="none" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Pocket with red cross -->
      <rect x="34" y="96" width="10" height="10" rx="1" fill="#155553" stroke="${stroke}" stroke-width="1"/>
      <line x1="39" y1="99" x2="39" y2="103" stroke="#e53e3e" stroke-width="1.2"/>
      <line x1="37" y1="101" x2="41" y2="101" stroke="#e53e3e" stroke-width="1.2"/>`;
  } else if (npc.id === 'detective') {
    hairColor1 = '#5c6068'; hairColor2 = '#303339';
    clothColor1 = '#4c2e68'; clothColor2 = '#231233';
    legColor = '#2c2b33'; shoeColor = '#18171c';
    hair = `<path d="M 24 46 Q 20 22 50 20 Q 80 22 76 46 Q 68 36 50 36 Q 32 36 24 46 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>`;
    clothes = `<path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 44 80 Q 50 86 56 80" fill="none" stroke="${stroke}" stroke-width="1.5"/>
      <line x1="50" y1="82" x2="50" y2="120" stroke="${stroke}" stroke-width="1" stroke-dasharray="3,3"/>`;
    extra = `<!-- Headphone band around neck -->
      <path d="M 38 74 Q 50 82 62 74" fill="none" stroke="#1a202c" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Ear cups resting on shoulders -->
      <rect x="34" y="68" width="6" height="12" rx="2" fill="#1a202c" stroke="${stroke}" stroke-width="1"/>
      <rect x="60" y="68" width="6" height="12" rx="2" fill="#1a202c" stroke="${stroke}" stroke-width="1"/>`;
  } else if (npc.id === 'gamer') {
    hairColor1 = '#4a3020'; hairColor2 = '#21130a';
    clothColor1 = '#f7f5f0'; clothColor2 = '#cbd5e0';
    legColor = '#25354e'; shoeColor = '#18202b';
    hair = `<path d="M 23 48 Q 20 24 50 22 Q 80 24 77 48 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
            <path d="M 26 38 Q 40 32 50 36 M 50 36 Q 60 32 74 38" fill="none" stroke="${stroke}" stroke-width="1.2"/>`;
    clothes = `<!-- Grey shirt -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="#4a5568" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Lab coat open -->
      <path d="M 30 80 L 44 80 L 40 122 L 28 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 70 80 L 56 80 L 60 122 L 72 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Flaps -->
      <rect x="31" y="102" width="7" height="9" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1"/>
      <rect x="62" y="102" width="7" height="9" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1"/>`;
    extra = `<path d="M 44 80 L 50 102 L 56 80" fill="none" stroke="#e53e3e" stroke-width="1.2"/>
      <rect x="47" y="102" width="6" height="8" rx="0.5" fill="#fcfcfc" stroke="${stroke}" stroke-width="0.5"/>
      <rect x="48" y="103" width="4" height="2" fill="#e53e3e"/>`;
  } else if (npc.id === 'influencer') {
    hairColor1 = '#ffd269'; hairColor2 = '#bc8b20';
    clothColor1 = '#e0537f'; clothColor2 = '#871a3d';
    legColor = '#e0537f'; shoeColor = '#ffd700';
    hair = `<path d="M 22 52 Q 18 15 50 15 Q 82 15 78 52 Q 84 75 75 88 Q 72 55 50 30 Q 28 55 25 88 Q 16 75 22 52 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
            <circle cx="21" cy="45" r="4.5" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1"/>
            <circle cx="23" cy="62" r="5" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1"/>
            <circle cx="79" cy="45" r="4.5" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1"/>
            <circle cx="77" cy="62" r="5" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1"/>`;
    clothes = `<!-- Rose pink dress base -->
      <path d="M 32 80 L 68 80 L 74 122 L 26 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Sweetheart neckline -->
      <path d="M 32 80 Q 40 88 50 85 Q 60 88 68 80" fill="none" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Dress inner skin area -->
      <path d="M 32 80 Q 40 88 50 85 Q 60 88 68 80 L 68 80 L 32 80 Z" fill="url(#skinGrad_${npc.id})" stroke="none"/>`;
    extra = `<!-- Gold necklace -->
      <path d="M 40 76 Q 50 86 60 76" fill="none" stroke="#d4af37" stroke-width="1.5"/>
      <circle cx="50" cy="86" r="2.5" fill="#e53e3e" stroke="#d4af37" stroke-width="0.5"/>`;
  } else if (npc.id === 'keeper') {
    hairColor1 = '#f7f7f7'; hairColor2 = '#b8bac2';
    clothColor1 = '#f7c325'; clothColor2 = '#a37905';
    legColor = '#3d2d23'; shoeColor = '#1d1510';
    hair = `<path d="M 28 42 Q 50 14 72 42 Z" fill="#cca421" stroke="${stroke}" stroke-width="1.5"/>
            <ellipse cx="50" cy="20" r="3.5" fill="#b0881b"/>`;
    clothes = `<!-- Yellow Rain Slicker -->
      <path d="M 28 80 Q 50 78 72 80 L 74 122 Q 50 125 26 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <line x1="50" y1="80" x2="50" y2="122" stroke="#5a460b" stroke-width="2"/>
      <rect x="46" y="90" width="8" height="2.5" rx="1" fill="#3d2c00" stroke="${stroke}" stroke-width="0.5"/>
      <rect x="46" y="102" width="8" height="2.5" rx="1" fill="#3d2c00" stroke="${stroke}" stroke-width="0.5"/>`;
    extra = `<!-- Beard -->
      <path d="M 28 62 Q 50 92 72 62 Q 50 75 28 62 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>`;
  } else if (npc.id === 'kai') {
    hairColor1 = '#3a2b22'; hairColor2 = '#1c130e';
    clothColor1 = '#e53e3e'; clothColor2 = '#741b1b';
    legColor = '#2a2622'; shoeColor = '#1a1816';
    hair = `<path d="M 24 50 Q 24 22 50 20 Q 76 22 76 50 Z" fill="url(#hairGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
            <!-- Headband -->
            <path d="M 22 38 Q 50 35 78 38 L 77 43 Q 50 40 23 43 Z" fill="#c53030" stroke="${stroke}" stroke-width="1"/>`;
    clothes = `<!-- Black undershirt -->
      <path d="M 30 80 Q 50 78 70 80 L 72 122 Q 50 125 28 122 Z" fill="#1a202c" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Red jacket open -->
      <path d="M 30 80 L 44 80 L 42 122 L 28 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M 70 80 L 56 80 L 58 122 L 72 122 Z" fill="url(#clothGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
      <line x1="50" y1="84" x2="50" y2="122" stroke="#d6d6d6" stroke-width="1.5"/>`;
    extra = `<!-- Camera Strap -->
      <path d="M 30 80 L 72 122" fill="none" stroke="#2d3748" stroke-width="3" stroke-linecap="round"/>
      <rect x="60" y="108" width="10" height="7" rx="1" fill="#1a202c" stroke="${stroke}" stroke-width="1" transform="rotate(15, 65, 111)"/>
      <circle cx="65" cy="111" r="2" fill="url(#metalSilverGrad_${npc.id})"/>`;
  }

  let mouth = `<path d="M 46 68 Q 50 71 54 68" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/>`;
  if (speaking) {
    mouth = `<ellipse cx="50" cy="69" rx="3.5" ry="2" fill="#802010" stroke="${stroke}" stroke-width="1"/>`;
  }

  return `<svg class="char-svg" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .lip-anim {
          animation: talk 0.22s infinite alternate ease-in-out;
          transform-origin: 50px 69px;
        }
        @keyframes talk {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.4); }
        }
      </style>
      <!-- Background shadow glow radial gradient -->
      <radialGradient id="bg${npc.id}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${c}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
      </radialGradient>
      
      <!-- Skin gradient -->
      <linearGradient id="skinGrad_${npc.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${skinLight}"/>
        <stop offset="100%" stop-color="${skinDark}"/>
      </linearGradient>
      
      <!-- Hair gradient -->
      <linearGradient id="hairGrad_${npc.id}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${hairColor1}"/>
        <stop offset="100%" stop-color="${hairColor2}"/>
      </linearGradient>
      
      <!-- Cloth gradient -->
      <linearGradient id="clothGrad_${npc.id}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${clothColor1}"/>
        <stop offset="100%" stop-color="${clothColor2}"/>
      </linearGradient>
      
      <!-- Pedestal Gold gradients -->
      <linearGradient id="pedestalBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#4a361a"/>
        <stop offset="25%" stop-color="#d4af37"/>
        <stop offset="50%" stop-color="#fff6cc"/>
        <stop offset="75%" stop-color="#aa8010"/>
        <stop offset="100%" stop-color="#4a361a"/>
      </linearGradient>
      
      <linearGradient id="pedestalTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffe875"/>
        <stop offset="100%" stop-color="#9a7200"/>
      </linearGradient>
      
      <radialGradient id="pedestalInnerGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#403010"/>
        <stop offset="100%" stop-color="#1c1404"/>
      </radialGradient>

      <!-- Metal Silver -->
      <linearGradient id="metalSilverGrad_${npc.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#a0a5ad"/>
        <stop offset="100%" stop-color="#404348"/>
      </linearGradient>
    </defs>
    
    <!-- Floor Shadow under base -->
    <ellipse cx="50" cy="151" rx="36" ry="8" fill="rgba(0,0,0,0.4)" />

    <!-- Pedestal Base (metallic/gold board game piece style) -->
    <path d="M 12 142 L 12 147 C 12 153, 88 153, 88 147 L 88 142 Z" fill="url(#pedestalBaseGrad)" stroke="#1a120a" stroke-width="1.5"/>
    <ellipse cx="50" cy="142" rx="38" ry="9" fill="url(#pedestalTopGrad)" stroke="#4a361a" stroke-width="1.2"/>
    <ellipse cx="50" cy="142" rx="34" ry="7" fill="url(#pedestalInnerGrad)"/>

    <!-- Legs -->
    <rect x="38" y="121" width="9" height="22" rx="2" fill="${legColor}" stroke="${stroke}" stroke-width="1.5"/>
    <rect x="53" y="121" width="9" height="22" rx="2" fill="${legColor}" stroke="${stroke}" stroke-width="1.5"/>
    <!-- Shoes -->
    <ellipse cx="42" cy="141" rx="7" ry="4" fill="${shoeColor}" stroke="${stroke}" stroke-width="1.5"/>
    <ellipse cx="58" cy="141" rx="7" ry="4" fill="${shoeColor}" stroke="${stroke}" stroke-width="1.5"/>

    <!-- Torso / Clothes base -->
    ${clothes}

    <!-- Arms Outline -->
    <path d="M 32 85 Q 18 100 24 120" fill="none" stroke="${stroke}" stroke-width="14" stroke-linecap="round"/>
    <path d="M 68 85 Q 82 100 76 120" fill="none" stroke="${stroke}" stroke-width="14" stroke-linecap="round"/>
    <!-- Arms Fill (styled with clothing gradient) -->
    <path d="M 32 85 Q 18 100 24 120" fill="none" stroke="url(#clothGrad_${npc.id})" stroke-width="10" stroke-linecap="round"/>
    <path d="M 68 85 Q 82 100 76 120" fill="none" stroke="url(#clothGrad_${npc.id})" stroke-width="10" stroke-linecap="round"/>

    <!-- Hands -->
    <circle cx="24" cy="120" r="7" fill="url(#skinGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
    <circle cx="76" cy="120" r="7" fill="url(#skinGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>

    <!-- Neck -->
    <rect x="44" y="72" width="12" height="15" fill="url(#skinGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
    <!-- Neck Shadow -->
    <rect x="44" y="72" width="12" height="6" fill="rgba(0,0,0,0.18)"/>

    <!-- Head Base -->
    <ellipse cx="50" cy="55" rx="30" ry="26" fill="url(#skinGrad_${npc.id})" stroke="${stroke}" stroke-width="1.5"/>
    
    <!-- Blush -->
    <ellipse cx="30" cy="62" rx="4.5" ry="2.5" fill="#ff7a7a" opacity="0.35"/>
    <ellipse cx="70" cy="62" rx="4.5" ry="2.5" fill="#ff7a7a" opacity="0.35"/>

    <!-- Eyes (Expressive Chibi Eyes) -->
    <ellipse cx="35" cy="56" rx="4.5" ry="6" fill="#1b1510"/>
    <ellipse cx="65" cy="56" rx="4.5" ry="6" fill="#1b1510"/>
    <circle cx="36" cy="54" r="1.5" fill="#ffffff"/>
    <circle cx="66" cy="54" r="1.5" fill="#ffffff"/>

    <!-- Mouth & Lip Sync Anim -->
    <g ${lipAnim}>
      ${mouth}
    </g>
    
    <!-- Extra decorations (badges, glasses, beards) -->
    ${extra}

    <!-- Hair Overlay -->
    ${hair}

    <!-- Plastic figurine glossy highlight highlights (Toy finish) -->
    <!-- Head shine -->
    <path d="M 28 42 A 20 20 0 0 1 50 32" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.15"/>
    <!-- Torso shine -->
    <path d="M 33 88 L 33 115" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.12"/>
  </svg>`;
}

let activeChars = {};
function showChar(npcId, message, speak=true) {
  const npc = GS.npcs.find(n=>n.id===npcId) || NPCS_BASE.find(n=>n.id===npcId) || IDENTITIES.find(i=>i.id===npcId);
  if (!npc) return;
  const stage = $('char-stage');
  stage.classList.add('on');

  // Check if there is already a wrap for this character in the stage
  let wrap = stage.querySelector('.char-wrap-' + npcId);
  
  // Remove other active characters
  Object.entries(activeChars).forEach(([id, el]) => {
    if (id !== npcId) {
      el.classList.remove('enter');
      if (el.removeTimeoutId) clearTimeout(el.removeTimeoutId);
      el.removeTimeoutId = setTimeout(() => {
        if (el.parentElement) el.remove();
      }, 600);
      delete activeChars[id];
    }
  });

  const bubble = message ? `<div class="char-bubble"><span class="char-name">${npc.name}</span>${message}</div>` : '';
  const innerContent = bubble + makeSVGChar(npc, speak);

  if (wrap) {
    // Cancel any pending removal timeout
    if (wrap.removeTimeoutId) {
      clearTimeout(wrap.removeTimeoutId);
      wrap.removeTimeoutId = null;
    }
    // Update content (like dialogue bubble)
    wrap.innerHTML = innerContent;
    wrap.classList.add('enter');
    activeChars[npcId] = wrap;
  } else {
    // Create new
    wrap = document.createElement('div');
    wrap.className = `char-wrap char-wrap-${npcId}`;
    wrap.innerHTML = innerContent;
    stage.appendChild(wrap);
    activeChars[npcId] = wrap;
    
    requestAnimationFrame(() => {
      wrap.classList.add('enter');
    });
  }

  if (speak && message) {
    const plain = message.replace(/<[^>]+>/g,'');
    TTS.say(plain, npc.speak_pitch || 1, npc.speak_rate || .88);
  }
  return wrap;
}

function hideChars() {
  const stage = $('char-stage');
  const keys = Object.keys(activeChars);
  if (keys.length === 0) {
    // Clean up any stray wraps still in the stage that might be in fade-out
    const elements = stage.querySelectorAll('.char-wrap');
    if (elements.length === 0) {
      if (stage) stage.classList.remove('on');
    }
  } else {
    let count = 0;
    Object.entries(activeChars).forEach(([npcId, el]) => {
      el.classList.remove('enter');
      if (el.removeTimeoutId) clearTimeout(el.removeTimeoutId);
      el.removeTimeoutId = setTimeout(() => {
        if (el.parentElement) el.remove();
        count++;
        if (count === keys.length) {
          // Only turn off stage if no characters remain
          if (!stage.querySelector('.char-wrap')) {
            if (stage) stage.classList.remove('on');
          }
        }
      }, 600);
    });
  }
  activeChars = {};
  TTS.stop();
}
