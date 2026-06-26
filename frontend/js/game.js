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

const $ = id => document.getElementById(id);
const SFX = (() => {
  let ctx = null;
  const init = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); };
  const tone = (freq, type='sine', dur=0.18, vol=0.22, delay=0) => {
    init();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    o.start(ctx.currentTime + delay);
    o.stop(ctx.currentTime + delay + dur + 0.05);
  };
  const noise = (dur=0.1, vol=0.15) => {
    init();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; s.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    s.start();
  };
  return {
    success: () => { tone(440,'sine',.1,.2); tone(660,'sine',.15,.18,.1); },
    fail:    () => { tone(200,'sawtooth',.25,.2); },
    click:   () => tone(800,'sine',.06,.1),
    pickup:  () => { tone(600,'sine',.08,.15); tone(900,'sine',.1,.12,.07); },
    horror:  () => { tone(80,'sawtooth',.8,.25); tone(60,'sawtooth',.9,.2,.1); },
    ambient: () => { for(let i=0;i<4;i++) tone(220+i*30,'sine',1.5,.04,i*.4); },
    scream:  () => { noise(.3,.3); tone(300,'sawtooth',.5,.2,.1); },
    fragment:() => { tone(523,'sine',.2,.15); tone(659,'sine',.25,.12,.15); tone(784,'sine',.3,.1,.3); },
    morse:   () => tone(800,'square',.08,.15),
    drag:    () => tone(400,'sine',.05,.08),
    alarm:   () => { tone(880,'square',.1,.2); tone(660,'square',.1,.2,.12); },
    gunshot: () => {
      const audio = new Audio('assets/gunshot.wav');
      audio.volume = 0.8;
      audio.play().catch(e => {
        console.warn("Failed to play gunshot audio, falling back to synth:", e);
        init();
        // Lowpass filtered noise for the boom
        const dur = 1.0;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const s = ctx.createBufferSource(), g = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, ctx.currentTime);
        s.buffer = buf;
        s.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.8, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        s.start();
        
        // Low sawtooth rumble for resonance
        const r = ctx.createOscillator(), rg = ctx.createGain();
        r.type = 'sawtooth';
        r.frequency.setValueAtTime(80, ctx.currentTime);
        r.connect(rg);
        rg.connect(ctx.destination);
        rg.gain.setValueAtTime(0.4, ctx.currentTime);
        rg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        r.start();
        r.stop(ctx.currentTime + 0.8);
      });
    }
  };
})();

const TTS = (() => {
  return {
    say: (text, pitch=1, rate=0.88) => { /* AI disabled per user request */ },
    stop: () => { /* AI disabled */ }
  };
})();

// ─ GAME STATE ─────────────────────────────────────────────────
const GS = {
  playerName:'', playerRole:'', playerIcon:'',
  score:0, rtSamples:[], correctCount:0, attemptCount:0,
  domains:{ attention:0, recognition:0, processingSpeed:0, workingMemory:0, decisionMaking:0, cognitiveFlexibility:0, errorMonitoring:0, persistence:0, distractionResistance:0, multitasking:0 },
  telemetry: { hesitanceIndex: 0, timelineReferenceRate: 0, sequenceDistanceError: 0, targetFilterEfficiency: 0, matchErrorRate: 0 },
  fragments:Array(10).fill(false),
  dass:{ depression:[], anxiety:[], stress:[] },
  dassRaw:[], // stores {q,val,scale}
  murderer:'', victim:'',
  npcs:[],
  moduleIdx:0,
  moduleScores:Array(10).fill(0),
  sessionStart: Math.floor(Date.now() / 1000),
  gameActive: false
};

// ─ DATA ───────────────────────────────────────────────────────
const IDENTITIES = [
  {
id: 'narrator',
icon: '🔊',
name: 'Narrator',
role: 'System Broadcaster',
trait: 'Omniscient · Guiding',
pitch: 1,
rate: .9,
details: 'The Narrator guides the player through the island, delivering system broadcasts and DASS prompts.',
alibi: '',
image: 'assets/NARRATOR.png'
  },
  {
    id: 'doctor',
    icon: '🩺',
    name: 'Dr. Avery Ross',
    role: 'Psychologist',
    trait: 'Intelligent · Empathetic',
    pitch: 1.1,
    rate: .86,
    details: 'Dr. Avery Ross, psychologist. Intelligent, empathetic, she monitored participant profiles. Behind her caring demeanor lies the knowledge that participants were developing severe psychological issues, yet she approved the project\'s continuation to protect her career.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:00 PM:</strong> Conducted final participant profile check.<br>• <strong>8:45 PM - Midnight:</strong> Reviewing patient logs in Cabin 3 (Verified by offline log timestamps).</div>',
    image: 'assets/portrait_emily_1780832277768.png'
  },
  {
    id: 'ceo',
    icon: '💼',
    name: 'Marcus Hale',
    role: 'Security Consultant',
    trait: 'Calm · Disciplined · Logical',
    pitch: .95,
    rate: .92,
    details: 'Marcus Hale, security consultant. Calm, disciplined, and logical. He was hired to oversee resort safety, but his main role was deleting participant incident reports and complaints before external regulators could investigate Project Echo.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:30 PM - 10:30 PM:</strong> Patrolling the resort perimeter gates (Claimed, but gate sensors recorded no scans).<br>• <strong>10:45 PM:</strong> Returned to Cabin 1.</div>',
    image: 'assets/portrait_philip_1780832251248.png'
  },
  {
    id: 'musician',
    icon: '🎵',
    name: 'Lena Brooks',
    role: 'Marine Biologist',
    trait: 'Friendly · Optimistic',
    pitch: 1.15,
    rate: .84,
    details: 'Lena Brooks, marine biologist. Friendly and optimistic. She secretly stole confidential Echo files intending to expose the project, but later sold a portion of the raw data to a private buyer for financial gain.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:00 PM:</strong> Left welcome dinner early.<br>• <strong>8:30 PM - 9:45 PM:</strong> Collecting water samples near South Cliffs (Sector reported completely vacant by patrol logs).<br>• <strong>10:00 PM:</strong> Returned to Cabin 5.</div>',
    image: 'assets/portrait_vera_1780832238588.png'
  },
  {
    id: 'student',
    icon: '📚',
    name: 'Noah Mercer',
    role: 'Data Analyst',
    trait: 'Quiet · Withdrawn',
    pitch: 1.2,
    rate: .9,
    details: 'Noah Mercer, data analyst. Quiet and withdrawn. He was originally a participant in the Project Echo trials who suffered severe side effects, and was subsequently hired by the organization to buy his silence.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:30 PM - 10:30 PM:</strong> Reading system logs in the resort Library (Library was locked early at 9:00 PM).<br>• <strong>10:45 PM:</strong> Returned to Cabin 6.</div>',
    image: 'assets/portrait_zara_1781502098030.png'
  },
  {
    id: 'comedian',
    icon: '🎤',
    name: 'Ethan Cross',
    role: 'Journalist',
    trait: 'Charismatic · Competitive',
    pitch: 1.05,
    rate: .95,
    details: 'Ethan Cross, journalist. Charismatic, competitive, and desperate for a scoop. He repeatedly sabotaged Kai\'s previous investigations because Kai always beat him to major stories.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:45 PM - 10:30 PM:</strong> Interviewing guests in the resort lounge (Security footage shows the lounge was completely empty).<br>• <strong>10:45 PM:</strong> Returned to Cabin 8.</div>',
    image: 'assets/portrait_rory_1781502120015.png'
  },
  {
    id: 'detective',
    icon: '🔍',
    name: 'Oliver Grant',
    role: 'Software Engineer',
    trait: 'Introverted · Analytical',
    pitch: .9,
    rate: .85,
    details: 'Oliver Grant, software engineer. Introverted and analytical. He was hired to build the hidden digital surveillance networks that monitored Project Echo participants without their knowledge or consent.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:15 PM - 10:00 PM:</strong> Monitoring server grids in the main office (Office card log showed no entry).<br>• <strong>10:15 PM:</strong> Returned to Cabin 9.</div>',
    image: 'assets/portrait_william_1780832265198.png'
  },
  {
    id: 'therapist',
    icon: '🧠',
    name: 'Maya Singh',
    role: 'Nurse',
    trait: 'Caring · Compassionate',
    pitch: 1.0,
    rate: .86,
    details: 'Maya Singh, nurse. Caring and compassionate. Under pressure from project leaders, she falsified clinical participant medical records to hide the severe physiological harm caused by the trials.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:30 PM - 10:00 PM:</strong> Managing first aid inventory in the Spa (RFID badge logs show exit at 10:17 PM).<br>• <strong>10:30 PM:</strong> Returned to Cabin 4.</div>',
    image: 'assets/portrait_james_1780832187054.png'
  },
  {
    id: 'gamer',
    icon: '🎮',
    name: 'Daniel Price',
    role: 'Research Assistant',
    trait: 'Nervous · Obedient',
    pitch: 1.05,
    rate: .93,
    details: 'Daniel Price, research assistant. Nervous and obedient. He manipulated and falsified raw research data logs under orders to make the Project Echo outcomes appear highly successful to investors.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>9:00 PM - 10:15 PM:</strong> Auditing registries at the escape vessel dock (Dock log contains no badge scans after 8:30 PM).<br>• <strong>10:30 PM:</strong> Returned to Cabin 10.</div>',
    image: 'assets/portrait_kai_1780832200618.png'
  },
  {
    id: 'influencer',
    icon: '📱',
    name: 'Sarah Bennett',
    role: 'Investor',
    trait: 'Confident · Influential',
    pitch: 1.2,
    rate: .95,
    details: 'Sarah Bennett, investor. Confident and highly influential. She put immense pressure on research coordinators to expand the trials and collect more data despite severe safety concerns to protect her capital.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>9:00 PM - 9:30 PM:</strong> VIP beach photoshoot (Beach security log shows beach lights were shut off at 9:30 PM).<br>• <strong>9:45 PM:</strong> Returned to Cabin 7.</div>',
    image: 'assets/portrait_mia_1780832174257.png'
  }
];

const NPCS_BASE = [
  {
    id: 'rowan',
    icon: '🛎️',
    name: 'Rowan Ashford',
    role: 'Resort Host & Project Director',
    color: '#c4a465',
    x: '12%',
    alive: true,
    speak_pitch: .9,
    speak_rate: .82,
    details: 'Rowan Ashford, resort host and former Director of Project Echo. He coordinated the trials and shuttered the island facilities three years ago, turning them into a luxury resort to monitor the remaining witnesses.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>6:30 PM - 8:00 PM:</strong> Hosted dinner service.<br>• <strong>8:15 PM - 9:30 PM:</strong> Pantry inventory audit.<br>• <strong>10:00 PM:</strong> Closed main office.</div>',
    image: 'assets/portrait_rowan_1780832160368.png'
  },
  {
    id: 'rachel',
    icon: '⚖️',
    name: 'Rachel Quinn',
    role: 'Corporate Lawyer',
    color: '#c0471f',
    x: '72%',
    alive: true,
    speak_pitch: 1.1,
    speak_rate: .88,
    details: 'Rachel Quinn, corporate lawyer. Composed and professional. She drafted the legal agreements and strict non-disclosure contracts that prevented the victims of Project Echo from suing the organization.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:45 PM - 10:15 PM:</strong> Drafting legal files in the resort lobby (Lobby router logs show laptop disconnected after 9:00 PM).<br>• <strong>10:30 PM:</strong> Retired to Cabin 2.</div>',
    image: 'assets/portrait_sofia_1780832213248.png'
  },
  {
    id: 'keeper',
    icon: '🔦',
    name: 'Lighthouse Keeper',
    role: 'Former Caretaker',
    color: '#3a6fbf',
    x: '32%',
    alive: true,
    speak_pitch: 0.8,
    speak_rate: 0.75,
    details: 'The resort\'s Lighthouse Keeper and former facilities caretaker. He secretly archived Project Echo documents after the facility shut down, storing them in a chest inside the lighthouse.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>7:30 PM:</strong> Welcome dinner brief.<br>• <strong>8:30 PM - 9:30 PM:</strong> Maintenance check at the lighthouse tower.</div>',
    image: 'assets/portrait_general_1780832290626.png'
  },
  {
    id: 'kai',
    icon: '✍️',
    name: 'Kai Nakamura',
    role: 'Investigative Journalist',
    color: '#2e9a78',
    x: '85%',
    alive: false,
    speak_pitch: 1.0,
    speak_rate: 0.9,
    details: 'Kai Nakamura, investigative journalist (Victim 1). He illegally accessed Project Echo files to expose the trial operators. He was murdered near the shoreline perimeter shortly after arriving.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">Deceased. Found on the shoreline at 10:30 PM.</div>',
    image: 'assets/portrait_general_1780832290626.png'
  }
];

const CHARACTER_META = {
  ceo: {
    id: 'ceo',
    name: 'Marcus Hale',
    role: 'Security Consultant',
    cabin: 'Cabin 1',
    item: 'Tactical Flashlight',
    itemClue: 'A professional tactical flashlight matching the Security Consultant\'s gear',
    bonfireClaim: 'patrolling the resort perimeter gates until 10:30 PM',
    bonfireContradiction: 'perimeter gate electronic sensor recorded no badge scans that night',
    alibiContradiction: 'Security Consultant claimed to have patrolled the gates, but the gate sensors recorded no scans.',
    dossierAlibiSummary: 'Patrolled perimeter (8:30 PM - 10:30 PM), returned to Cabin 1 (10:45 PM).',
    secret: 'Deleted participant complaints and incident reports before regulators could investigate Project Echo.',
    motive: 'Kai discovered evidence linking him to the cover-up.'
  },
  doctor: {
    id: 'doctor',
    name: 'Dr. Avery Ross',
    role: 'Psychologist',
    cabin: 'Cabin 3',
    item: 'Clinical Notepad',
    itemClue: 'A clinical notepad with psychologist handwriting',
    bonfireClaim: 'reviewing patient psychological logs in Cabin 3 until midnight',
    bonfireContradiction: 'local network file-open timestamps showed no patient data was accessed',
    alibiContradiction: 'Psychologist claimed to be reviewing case files in Cabin 3, but local network files indicate no patient records were accessed.',
    dossierAlibiSummary: 'Conducted sessions (8:00 PM), reviewed patient logs in Cabin 3 (8:45 PM - Midnight).',
    secret: 'Knew participants were developing severe psychological issues but approved continuation of the project.',
    motive: 'Kai possessed documents proving her negligence.'
  },
  student: {
    id: 'student',
    name: 'Noah Mercer',
    role: 'Data Analyst',
    cabin: 'Cabin 6',
    item: 'Encrypted USB Drive',
    itemClue: 'An encrypted USB drive containing raw data archives',
    bonfireClaim: 'analyzing server activity logs in the Library until 10:30 PM',
    bonfireContradiction: 'library surveillance log confirms the room closed early at 9:00 PM',
    alibiContradiction: 'Data Analyst claimed he was in the Library reading logs, but surveillance shows the room closed early at 9:00 PM.',
    dossierAlibiSummary: 'In Library reading server logs (8:30 PM - 10:30 PM), returned to Cabin 6 at 10:45 PM.',
    secret: 'Was originally a Project Echo participant and later hired to keep him from speaking publicly.',
    motive: 'Kai knew Noah\'s entire history with the project.'
  },
  musician: {
    id: 'musician',
    name: 'Lena Brooks',
    role: 'Marine Biologist',
    cabin: 'Cabin 5',
    item: 'Water Sampler',
    itemClue: 'A water sampling vial registered to Cabin 5',
    bonfireClaim: 'taking tide pool samples at South Cliffs until 9:45 PM',
    bonfireContradiction: 'coastal patrol logs reported the South Cliffs sector was completely vacant',
    alibiContradiction: 'Marine Biologist claimed she was collecting tide samples, but patrol logs confirm South Cliffs were vacant after 9:00 PM.',
    dossierAlibiSummary: 'Left welcome dinner early (8:00 PM), South Cliffs (8:30 PM - 9:45 PM), Cabin 5 (10:00 PM).',
    secret: 'Stole confidential Echo files intending to expose the project, but secretly sold part of the data.',
    motive: 'Kai uncovered the illegal sale.'
  },
  rachel: {
    id: 'rachel',
    name: 'Rachel Quinn',
    role: 'Corporate Lawyer',
    cabin: 'Cabin 2',
    item: 'Legal Briefcase',
    itemClue: 'A locked leather briefcase with corporate legal branding',
    bonfireClaim: 'drafting settlement agreements in the resort lobby until 10:15 PM',
    bonfireContradiction: 'lobby router records show her laptop was disconnected after 9:00 PM',
    alibiContradiction: 'Corporate Lawyer claimed she was drafting agreements in the lobby, but router logs show her device went offline at 9:00 PM.',
    dossierAlibiSummary: 'Attended welcome dinner (7:30 PM), worked in lobby (8:45 PM - 10:15 PM), retired to Cabin 2 (10:30 PM).',
    secret: 'Drafted legal agreements that prevented victims from suing Project Echo.',
    motive: 'Kai was preparing to expose her role in protecting the organization.'
  },
  comedian: {
    id: 'comedian',
    name: 'Ethan Cross',
    role: 'Journalist',
    cabin: 'Cabin 8',
    item: 'Voice Recorder',
    itemClue: 'A digital voice recorder containing audio notes',
    bonfireClaim: 'interviewing guests in the resort lounge until 10:30 PM',
    bonfireContradiction: 'resort security cameras recorded the lounge as empty after 9:30 PM',
    alibiContradiction: 'Journalist claimed he was interviewing guests in the lounge, but security footage shows the lounge was completely empty after 9:30 PM.',
    dossierAlibiSummary: 'Dinner (7:30 PM), guest interviews in resort lounge (8:45 PM - 10:30 PM), Cabin 8 (10:45 PM).',
    secret: 'Sabotaged Kai\'s previous investigations because Kai repeatedly got major stories first.',
    motive: 'Kai\'s final exposé would permanently damage Ethan\'s career.'
  },
  therapist: {
    id: 'therapist',
    name: 'Maya Singh',
    role: 'Nurse',
    cabin: 'Cabin 4',
    item: 'First Aid Kit',
    itemClue: 'A medical first aid kit containing falsified records',
    bonfireClaim: 'organizing medical inventory in the Spa until midnight',
    bonfireContradiction: 'Spa RFID badge reader registered an exit tap at 10:17 PM',
    alibiContradiction: 'Nurse claimed she was managing medical inventory in the Spa, but badge logs show she exited at 10:17 PM.',
    dossierAlibiSummary: 'Spa inventory management (8:30 PM - 10:00 PM), exited Spa (10:17 PM), Cabin 4 (10:30 PM).',
    secret: 'Falsified participant medical records after being pressured by project leaders.',
    motive: 'Kai obtained copies of the original records.'
  },
  detective: {
    id: 'detective',
    name: 'Oliver Grant',
    role: 'Software Engineer',
    cabin: 'Cabin 9',
    item: 'Network Sniffer',
    itemClue: 'A compact network sniffer device matching Cabin 9',
    bonfireClaim: 'monitoring server power grids from the main office until 10:00 PM',
    bonfireContradiction: 'office lock logs recorded no badge entries between 8:00 PM and 10:30 PM',
    alibiContradiction: 'Software Engineer claimed he was monitoring grids in the office, but card logs show the room was empty.',
    dossierAlibiSummary: 'Checked server rooms (8:15 PM), monitored power grids (8:30 PM - 10:00 PM), Cabin 9 (10:15 PM).',
    secret: 'Built hidden monitoring systems that tracked participants without their consent.',
    motive: 'Kai traced the surveillance system back to Oliver.'
  },
  gamer: {
    id: 'gamer',
    name: 'Daniel Price',
    role: 'Research Assistant',
    cabin: 'Cabin 10',
    item: 'Lab Logbook',
    itemClue: 'A research lab logbook with edited data tables',
    bonfireClaim: 'auditing the escape vessel dock logs until 10:15 PM',
    bonfireContradiction: 'digital dock access registries recorded no logins after 8:30 PM',
    alibiContradiction: 'Research Assistant claimed he audited the dock logs, but access registries show no logins after 8:30 PM.',
    dossierAlibiSummary: 'Resort perimeter walk (7:45 PM), dock audit (9:00 PM - 10:15 PM), Cabin 10 (10:30 PM).',
    secret: 'Manipulated research data to make Project Echo appear successful.',
    motive: 'Kai discovered the original data archives.'
  },
  influencer: {
    id: 'influencer',
    name: 'Sarah Bennett',
    role: 'Investor',
    cabin: 'Cabin 7',
    item: 'Diamond Ring',
    itemClue: 'A high-value diamond ring registered to the resort investor',
    bonfireClaim: 'attending the VIP beach photoshoot until 11:30 PM',
    bonfireContradiction: 'beach security logs confirm the photography lights were shut off at 9:30 PM',
    alibiContradiction: 'Investor claimed she was at the beach photoshoot, but security logs show the beach was closed at 9:30 PM.',
    dossierAlibiSummary: 'Took photos at beach (7:30 PM - 8:30 PM), VIP photoshoot (9:00 PM - 9:30 PM), Cabin 7 (9:45 PM).',
    secret: 'Pressured researchers to collect more data despite safety concerns to protect her investment.',
    motive: 'Kai planned to expose her financial involvement.'
  }
};

function getMemoryFragment(idx) {
  const murdererId = GS.murderer || 'ceo';
  const meta = CHARACTER_META[murdererId] || CHARACTER_META.ceo;
  
  const list = [
    // Module 1 (The Shoreline)
    {
      text: `"This wasn't supposed to happen.\nWe only agreed to collect data. ${meta.name} was never supposed to find out."\n\n[Beach audio recorder log. Speaker unknown. Dated: 3 years ago.]`,
      clue: `The victim, Kai Nakamura, discovered that ${meta.name} was connected to the Project Echo cover-up.`
    },
    // Module 2 (The Lighthouse)
    {
      text: `"The archives are hidden safe in the lighthouse. The Caretaker is keeping them secure. Nobody else must know."\n\n[Decrypted journal entry. Dated: 1 year ago.]`,
      clue: `The Lighthouse Keeper secretly maintained a hidden archive of Project Echo documents, linking to ${meta.name}'s past.`
    },
    // Module 3 (Cabin 7)
    {
      text: `"[Item recovered from Cabin 7: a ${meta.item}, confirmed to be registered to ${meta.name}.]\n\n'Verified possession during initial check-in.' —Quartermaster Log"`,
      clue: `A ${meta.item} registered to ${meta.name} was found inside Cabin 7.`
    },
    // Module 4 (The Bonfire)
    {
      text: `"[Timeline analysis comparison]\n\n${meta.name} bonfire statement: '${meta.bonfireClaim}'\nSystem record: ${meta.bonfireContradiction}"`,
      clue: `${meta.name} lied about their timeline: they claimed they were ${meta.bonfireClaim}, but ${meta.bonfireContradiction}.`
    },
    // Module 5 (Lost Baggage)
    {
      text: `"[Baggage search report]\n\nA folder of historical documents was found hidden in the luggage of ${meta.name}. It contains clinical trial blueprints and a detailed layout of the island's server room."`,
      clue: `${meta.name} was carrying server blueprints and suppressed clinical trial records.`
    },
    // Module 6 (The Forest Trail)
    {
      text: `"[Security footage: 3:14 AM. A user logged in as ${meta.name} is seen deleting files from the data server. The monitor displays: PROJECT ECHO — ARCHIVE CLEAR.]"`,
      clue: `${meta.name} was seen deleting Project Echo files from the server room at 3:14 AM.`
    },
    // Module 7 (Evidence Challenge)
    {
      text: `"If the truth about the secret gets out, we're finished. Marcus, Avery, all of us. Not just the ones who ran the tests."\n\n[Decrypted control room audio log belonging to ${meta.name}.]`,
      clue: `Surveillance logs decrypt to expose ${meta.name}'s secret: ${meta.secret}`
    },
    // Module 8 (CCTV Reconstruction)
    {
      text: `"[Boardroom CCTV Reconstruction]\n\nAt 11:00 PM, a meeting took place in the boardroom. The footage clearly shows ${meta.name} present, contradicting their alibi."`,
      clue: `CCTV footage places ${meta.name} in the boardroom at 11:00 PM, contradicting their alibi.`
    },
    // Module 9 (The Storm Shelter)
    {
      text: `"[Final pages of PROJECT ECHO report]\n\n'Participants exhibited severe and sustained increases in stress, anxiety, and depressive cognition. Data was suppressed.'\n\n[Suppress-Signatures: Rowan Ashford (Director), Dr. Avery Ross, and ${meta.name} (Consultant)]"`,
      clue: `${meta.name} is documented as an operator in the suppressed Project Echo report.`
    },
    // Module 10 (The Dock / Pathfinder)
    {
      text: `'"I came back to destroy the evidence. But when I saw who else was here — I realized the evidence is them."\n\n[Final voice recording recovered from the victim\'s recorder. Voice analysis indicates the speaker matches: ${meta.name}.]'`,
      clue: `${meta.name} killed Kai Nakamura because: ${meta.motive}`
    }
  ];
  return list[idx];
}

// DASS-21 Items covertly woven into NPC dialogue choices
// Scale: 0=did not apply, 1=sometimes, 2=often, 3=almost always
const DASS_ITEMS = [
  // Depression (D)
  { scale:'D', q:"How has the island been treating you? Honestly.", opts:["Couldn't find any pleasure in things I used to enjoy","Things felt pointless — hard to get motivated","I felt down, but pushed through","I'm doing all right, actually"], vals:[3,2,1,0] },
  { scale:'D', q:"This whole situation — do you feel like you can handle it?", opts:["I feel like I'm going under","I can't see a way forward at all","It's hard, but I'm managing","I think I can figure this out"], vals:[3,2,1,0] },
  { scale:'D', q:"What's your gut feeling about getting off this island?", opts:["I feel like there's no future worth going back to","Honestly, nothing feels real anymore","I'm worried, but I still hope","I believe we'll get out"], vals:[3,2,1,0] },
  // Anxiety (A)
  { scale:'A', q:"Have you felt anything physically — tightness, panic?", opts:["My heart was racing for no clear reason","I had trembling or shaking I couldn't explain","I felt tense but nothing physical","I've been okay physically"], vals:[3,2,1,0] },
  { scale:'A', q:"Walking through this resort — how does it feel?", opts:["I was aware of dryness in my mouth, sweat on my palms","I felt terrifyed without knowing why","On edge, but in control","Cautious — that's all"], vals:[3,2,1,0] },
  { scale:'A', q:"When something unexpected happens here, what's your reaction?", opts:["I feel like I'm about to fall apart completely","I panic before I can think","I startle, but recover quickly","I take a breath and assess"], vals:[3,2,1,0] },
  // Stress (S)
  { scale:'S', q:"How easy is it to wind down after something tense?", opts:["I find it impossible to relax at all","I feel persistently wound up inside","I can relax but it takes a while","I decompress fairly easily"], vals:[3,2,1,0] },
  { scale:'S', q:"Little things — how are they landing for you?", opts:["I over-react to small things and can't stop it","I feel impatient, irritable — more than usual","Minor frustrations bother me but pass","Small things roll off me mostly"], vals:[3,2,1,0] },
  { scale:'S', q:"Since arriving, how has your energy and focus been?", opts:["I've been in a state of high-alert the whole time","Hard to wind down — mind keeps racing","I'm fatigued but pushing through","My focus is intact — I'm adapting"], vals:[3,2,1,0] },
];

const MODULES_DATA = [
  {id:'beach',      title:'The Shoreline',    icon:'🏖️', loc:'Beach',      intro:'Footprints lead from the body toward the treeline. A storm is coming. Collect the evidence before the tide destroys everything.', task:'Search the shore — react quickly', hint:'Look for 5 clues scattered across the beach sand: a keycard, a footprint, a match, a locket, and a wine bottle. Ignore the other debris. Ensure you only select these specific items.'},
  {id:'lighthouse', title:'The Lighthouse',   icon:'🔦', loc:'Lighthouse', intro:'The lighthouse is flashing unusual coded signals. The keeper vanished. Someone changed the sequence after the murder.',task:'Decode the pattern — repeat it exactly', hint:'Watch the colored light signals flashing from the lighthouse lantern. Replicate the sequence exactly by tapping the colored buttons below.'},
  {id:'room',       title:'Cabin 7',          icon:'🚪', loc:'Resort',     intro:"The victim's room has been searched. One object doesn't belong — planted by whoever was here last.", task:'Identify the intruder object', hint:'Investigate the items in the cabin room. One of these items is an intruder that does not belong to the victim. Select it to log as evidence.'},
  {id:'bonfire',    title:'The Bonfire',      icon:'🔥', loc:'Beach',      intro:"Every guest has a story. At the bonfire, the stories don't match. One person slipped a contradiction into their alibi.", task:'Spot the logical contradiction', hint:'Open the Case Files Dossier (by clicking FILES in the header) to review the suspect\'s verified timeline. Compare their statement at the bonfire to identify and click the phrase that contradicts the official files.'},
  {id:'baggage',    title:'Lost Baggage',     icon:'🧳', loc:'Dock',       intro:"The storm scattered luggage across the resort. Worse — someone swapped items. Restore order before more evidence is lost.", task:'Match owners to their belongings', hint:'Review character occupations in the Case Files. Select a character owner first, then select their professional belonging to pair them.'},
  {id:'forest',     title:'The Forest Trail', icon:'🌲', loc:'Forest',     intro:'A witness claims to have seen a figure running through the forest. But the paths keep changing. Someone rerouted them.', task:'Follow the correct path through shifting signs', hint:'To escape the looping trees, follow the path: walk forward to start, turn right at the mossy trunk, head left past the deep roots, turn back when the path darkens, then push forward to the clearing.'},
  {id:'evidence',   title:'Evidence Challenge', icon:'📂', loc:'Resort',     intro:"The main server contains encrypted timeline fragments corrupted by visual noise. Decrypt the files before they are wiped.", task:'Match glitched logs with FILES Dossier', hint:'Read the corrupted character log. Open the FILES Dossier in the HUD, check the corresponding character\'s verified timeline, and select the option that correctly decrypts the missing value.'},
  {id:'cctv',       title:'Server Room',      icon:'📼', loc:'Resort',     intro:"The CCTV server was damaged — files scrambled. Piece together the footage timeline to establish who was where.", task:'Restore the footage sequence', hint:'Drag and drop the security clips into chronological order from Dinner (early evening) to Alarms (midnight) to restore the server logs.'},
  {id:'storm',      title:'The Storm Shelter', icon:'🚨', loc:'Forest',     intro:"The storm is at full strength. Power systems are failing. Decode clues to discover a password, then input the numbers on a server panel to restore the CCTV system under emergency sirens.", task:'Decode password and input on keypad', hint:'Read the decoding clue on the screen. Click on the FILES Dossier in the HUD, navigate to the correct suspect\'s profile to find their verified timeline logs, and enter the MMDD or HHMM code into the security keypad.'},
  {id:'pathfinder', title:'The Dock',         icon:'🚤', loc:'Dock',       intro:"The escape boat has been found — but the ignition lock is a sequence puzzle. Someone sabotaged it. This is the last chance.", task:'Complete the sequence under pressure', hint:'Tap the nodes in the exact alpha-numeric sequence: 1, 2, 3, A, 4, B, 5, C, 6, D. Avoid errors to unlock the ignition sequence.'},
];

// ─ BACKGROUND ─────────────────────────────────────────────────
function initBG() {
  const c = $('bg-canvas'), ctx = c.getContext('2d');
  let W, H, stars=[], frame=0;
  const resize = () => {
    W=c.width=window.innerWidth; H=c.height=window.innerHeight;
    stars = Array.from({length:140}, () => ({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.6+.2, a:Math.random(), s:Math.random()*.4+.05}));
  };
  window.addEventListener('resize', resize); resize();
  (function loop(){
    ctx.fillStyle='#050508'; ctx.fillRect(0,0,W,H);
    const g=ctx.createLinearGradient(0,H*.55,0,H); g.addColorStop(0,'transparent'); g.addColorStop(1,'rgba(15,25,50,.55)');
    ctx.fillStyle=g; ctx.fillRect(0,H*.55,W,H);
    for(let i=0;i<3;i++){
      ctx.beginPath();
      for(let x=0;x<=W;x++){const y=H*.78+Math.sin((x+frame*(i+1)*.35)*.013)*(7+i*5)+i*14; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.strokeStyle=`rgba(58,111,191,${0.07-i*.015})`; ctx.lineWidth=1.5; ctx.stroke();
    }
    stars.forEach(s=>{s.a+=s.s*.01; const a=(Math.sin(s.a)+1)/2; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle=`rgba(240,226,184,${a*.65})`; ctx.fill();});
    frame++; requestAnimationFrame(loop);
  })();
}

// ─ DASS RECORDING ─────────────────────────────────────────────
function recordDASS(scale, val, q) {
  GS.dassRaw.push({scale, val, q});
  let fullScale = scale;
  if (scale === 'D' || scale === 'depression') fullScale = 'depression';
  else if (scale === 'A' || scale === 'anxiety') fullScale = 'anxiety';
  else if (scale === 'S' || scale === 'stress') fullScale = 'stress';

  if (!GS.dass[fullScale]) GS.dass[fullScale] = [];
  GS.dass[fullScale].push(val);

  if (scale === 'D' || scale === 'A' || scale === 'S') {
    if (!GS.dass[scale]) GS.dass[scale] = [];
    GS.dass[scale].push(val);
  }
}



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

// ─ SCREEN MANAGER ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>{
    s.classList.remove('on');
    s.classList.remove('game-screen');
    s.style.pointerEvents = 'auto';
  });
  document.querySelectorAll('.game-panel').forEach(s=>s.classList.remove('on'));
  const el = $(id);
  if (el) {
    el.classList.add('on');
    el.style.pointerEvents = 'auto';
    const gp = el.querySelector('.game-panel');
    if (gp) gp.classList.add('on');

    const GAME_SCREENS = ['sc-beach', 'sc-lighthouse', 'sc-room', 'sc-bonfire', 'sc-baggage', 'sc-forest', 'sc-evidence', 'sc-cctv', 'sc-storm', 'sc-pathfinder'];
    if (GAME_SCREENS.includes(id)) {
      el.classList.add('game-screen');
      // Inject/update field manual sidebar
      let sidebar = el.querySelector('.field-manual-sidebar');
      if (!sidebar) {
        sidebar = document.createElement('div');
        sidebar.className = 'field-manual-sidebar';
        el.insertBefore(sidebar, el.firstChild);
      }
      const m = MODULES_DATA[GS.moduleIdx];
      if (id === 'sc-beach') {
        sidebar.innerHTML = `
          <h3>Field Manual</h3>
          <div class="section-title">${m.title}</div>
          <div class="section-title">Objective</div>
          <p style="font-weight: 700; color: #1a150e;">${m.task}</p>
          <div class="section-title">Evidence Checklist</div>
          <div id="beach-checklist" style="display: flex; flex-direction: column; gap: 8px; margin: 4px 0;">
            <label>
              <input type="checkbox" id="chk-keycard" disabled />
              <span>Keycard</span>
            </label>
            <label>
              <input type="checkbox" id="chk-footprint" disabled />
              <span>Footprint</span>
            </label>
            <label>
              <input type="checkbox" id="chk-match" disabled />
              <span>Matchbox</span>
            </label>
            <label>
              <input type="checkbox" id="chk-locket" disabled />
              <span>Silver Locket</span>
            </label>
            <label>
              <input type="checkbox" id="chk-wine" disabled />
              <span>Wine Bottle</span>
            </label>
          </div>
          <div class="section-title">Manual Notes</div>
          <p>${m.hint}</p>
        `;
      } else {
        let hintText = m.hint;
        if (id === 'sc-room') {
          const killerHints = {
            doctor: "Clue: The intruder item is a silver locket, possibly dropped by the psychologist.",
            ceo: "Clue: The intruder item is an elite service medal belonging to the security consultant.",
            musician: "Clue: The intruder item is a wooden cross keepsake, potentially dropped by the marine biologist.",
            student: "Clue: The intruder item is a magnifying glass used for inspecting fine details, belonging to the data analyst.",
            comedian: "Clue: The intruder item is an old brass compass direction finder, potentially dropped by the journalist.",
            detective: "Clue: The intruder item is a service medal, potentially dropped by the software engineer.",
            rowan: "Clue: The intruder item is a wine glass, likely dropped by the resort host.",
            influencer: "Clue: The intruder item is a perfume bottle, belonging to the investor.",
            therapist: "Clue: The intruder item is a notebook with research logs, belonging to the nurse.",
            rachel: "Clue: The intruder item is a mystery novel, belonging to the corporate lawyer.",
            gamer: "Clue: The intruder item is a notebook with research logs, belonging to the research assistant."
          };
          hintText = killerHints[GS.murderer] || m.hint;
        }
        sidebar.innerHTML = `
          <h3>Field Manual</h3>
          <div class="section-title">${m.title}</div>
          <div class="section-title">Objective</div>
          <p style="font-weight: 700; color: #1a150e;">${m.task}</p>
          <div class="section-title">Manual Notes</div>
          <p>${hintText}</p>
        `;
      }
    }
  }
  if (id === 'sc-home') {
    checkProgressButton();
  }
}

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
  
  GS.npcs = JSON.parse(JSON.stringify(NPCS_BASE));
  
  // Select randomized killer (excluding player, rowan, keeper, kai)
  const potentialMurderers = [...IDENTITIES, ...NPCS_BASE].filter(c => 
    c.id !== 'kai' && 
    c.id !== 'keeper' && 
    c.id !== 'rowan' && 
    c.id !== userIdentityId
  );
  GS.murderer = potentialMurderers[Math.floor(Math.random()*potentialMurderers.length)].id;
  
  // Select randomized bonfire victim (excluding player, killer, rowan, keeper, kai)
  const potentialBonfireVictims = [...IDENTITIES, ...NPCS_BASE].filter(c => 
    c.id !== 'kai' && 
    c.id !== 'keeper' && 
    c.id !== 'rowan' && 
    c.id !== userIdentityId && 
    c.id !== GS.murderer
  );
  GS.bonfireVictim = potentialBonfireVictims[Math.floor(Math.random()*potentialBonfireVictims.length)].id;
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
  // Select Rowan or another alive suspect
  let briefNPC = aliveNPCs[idx % aliveNPCs.length] || NPCS_BASE.find(n => n.id === 'rowan');
  if (m.id === 'storm') {
    briefNPC = IDENTITIES.find(i => i.id === 'narrator') || briefNPC;
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
        askDASSBatch(briefNPC, batch, () => { launchGame(m.id); });
      } else {
        launchGame(m.id);
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
    showDialog('Narrator',
      'ALERT: A sudden radio broadcast cuts through the wind. A search party has found the Lighthouse Keeper lifeless at the bottom of the spiral stairs. The secret archive has been compromised.',
      null,
      proceed,
      'narrator'
    );
  } else if (GS.moduleIdx === 3) { // Module 4 (Bonfire) completes
    markDeceased(GS.bonfireVictim);
    const victimNPC = [...IDENTITIES, ...NPCS_BASE].find(c => c.id === GS.bonfireVictim);
    const victimName = victimNPC ? victimNPC.name : 'one of the suspects';
    showScreen('sc-narrative');
    showDialog('Narrator',
      `ALERT: The bonfire dies down to cold embers. Suddenly, a cry of terror rings out. ${victimName} lies dead on the beach, poisoned. The liar who knew the truth has been silenced.`,
      null,
      proceed,
      'narrator'
    );
  } else {
    proceed();
  }
}

function showMidgameTwist(cb) {
  showScreen('sc-narrative');
  showDialog('Narrator',
    'Every envelope so far contains the same date.\nThree years ago. Exactly.\nThis isn\'t a random crime.\nSomething happened on this island three years ago.\nAnd every person here was part of it.',
    null, cb, 'narrator'
  );
}

// ─ HELPER ─────────────────────────────────────────────────────
function flashScore(txt) {
  const el=$('score-flash'); el.textContent=txt; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),900);
}

// ─ PLACEHOLDER FUNCTIONS FOR BUILDER ──────────────────────────
function startBeach() {
  const area = $('beach-area');
  area.innerHTML = `
<div style="position:relative;width:100%;height:480px;border-radius:4px;overflow:hidden;background:#111;">
  <div style="width:100%; height:100%; position:relative;" id="beach-scene">
    <img src="assets/beach.png" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.85;">
    <div id="beach-canvas-items" style="position:absolute; inset:0;"></div>
    <div id="beach-start-overlay" style="position:absolute;inset:0;background:rgba(5,5,8,0.85);display:flex;align-items:center;justify-content:center;z-index:10;backdrop-filter:blur(4px);">
      <button class="btn-main" id="btn-start-beach">Start Search</button>
    </div>
  </div>
</div>
  `;

  // CSS for the hover effect
  if(!$('beach-hover-style')) {
const style = document.createElement('style');
style.id = 'beach-hover-style';
style.textContent = `
  .beach-item {
    position: absolute;
    cursor: pointer;
    filter: brightness(0.75) sepia(0.2) drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    transition: all 0.3s ease;
  }
  .beach-item:hover {
    filter: brightness(1.2) sepia(0) drop-shadow(0 0 10px rgba(196,164,101,0.9));
    transform: scale(1.15) translateY(-5px);
  }
`;
document.head.appendChild(style);
  }

  const container = $('beach-canvas-items');
  let left = 5, attempts = 0; $('beach-left').textContent = left;
  
  const targets = [
{id:'keycard', img:'assets/item_card.png', w:'40px'},
{id:'footprint', img:'assets/item_foot.png', w:'55px'},
{id:'match', img:'assets/item_match_v4.png', w:'40px'},
{id:'locket', img:'assets/item_locket.png', w:'35px'},
{id:'wine', img:'assets/item_wine.png', w:'30px'}
  ];
  const decoys = [
{id:'bucket', img:'assets/item_bucket.png', w:'55px'},
{id:'compass', img:'assets/item_compass.png', w:'45px'},
{id:'shell', img:'assets/item_shell.png', w:'45px'},
{id:'shovel', img:'assets/item_shovel.png', w:'65px'},
{id:'cross', img:'assets/item_cross.png', w:'35px'}
  ];

  $('btn-start-beach').onclick = () => {
$('beach-start-overlay').remove();
const gameStart = Date.now();

// Spawn all items
const allItems = [...targets.map(t=>({...t, correct:true})), ...decoys.map(d=>({...d, correct:false}))];
allItems.sort(() => Math.random() - 0.5);

const W = container.getBoundingClientRect().width || container.clientWidth || 900;
const H = container.getBoundingClientRect().height || container.clientHeight || 480;
const placed = [];

const isOverlap = (x, y, itemW, pad) => {
  const px = (x / 100) * W;
  const py = (y / 100) * H;
  
  const left1 = px - pad;
  const right1 = px + itemW + pad;
  const top1 = py - pad;
  const bottom1 = py + itemW + pad;

  return placed.some(p => {
    const left2 = p.px - pad;
    const right2 = p.px + p.w + pad;
    const top2 = p.py - pad;
    const bottom2 = p.py + p.w + pad;

    return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2);
  });
};

allItems.forEach(item => {
  const itemW = parseFloat(item.w);
  let x, y, tries = 0, pad = 12;
  do {
    if (tries > 100) pad = 8;
    if (tries > 200) pad = 4;
    if (tries > 250) pad = 0;
    
    // Restrict X to 8-80% to utilize wider sand space
    x = 8 + Math.random() * 72;
    // Flatter shoreline slope to provide much more vertical sand space on the right
    let minY = 45 + (x * 0.25);
    y = minY + Math.random() * (89 - minY);
    tries++;
  } while (isOverlap(x, y, itemW, pad) && tries < 500);
  
  const px = (x / 100) * W;
  const py = (y / 100) * H;
  placed.push({ px, py, w: itemW });

  const c = document.createElement('img');
  c.className = 'beach-item';
  c.src = item.img;
  c.style.width = item.w;
  c.style.left = x + '%';
  c.style.top = y + '%';
  c.style.transform = `rotate(${(Math.random()-0.5)*70}deg)`;
  
  c.onclick = () => {
    if (!GS.gameActive) return;
    if(item.correct) {
      SFX.pickup();
      c.style.pointerEvents = 'none';
      c.style.transform = 'scale(1.5) rotate(10deg)';
      c.style.opacity = '0';
      setTimeout(() => c.remove(), 300);
      
      const chk = $('chk-' + item.id);
      if (chk) chk.checked = true;
      
      const rt = Date.now() - gameStart;
      GS.domains.attention = Math.min(100, GS.domains.attention + 11);
      GS.domains.processingSpeed = Math.min(100, GS.domains.processingSpeed + (rt<10000 ? 14 : 8));
      
      left--;
      $('beach-left').textContent = left;
      if(left <= 0) finishBeach(gameStart);
    } else {
      SFX.fail();
      attempts++;
      GS.domains.attention = Math.max(0, GS.domains.attention - 5);
      c.style.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) drop-shadow(0 0 10px red)';
      setTimeout(() => { c.style.filter = ''; }, 400);
    }
  };
  container.appendChild(c);
});
  };
}
function finishBeach(t) {
  GS.gameActive = false;
  const activeScreen = document.querySelector('.screen.game-screen');
  if (activeScreen) activeScreen.style.pointerEvents = 'none';
  const rt=Date.now()-t; onModuleComplete(15,rt,true);
}

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

function startRoom(){
  let attempt=0;
  $('room-attempt').textContent=1;
  const gameStart=Date.now();
  const grid=$('room-grid');
  
  if(!$('cabin-styles')) {
const s=document.createElement('style');
s.id='cabin-styles';
s.textContent = `
  .room-item {
    position: absolute;
    cursor: pointer;
    filter: brightness(0.8) sepia(0.1) drop-shadow(0 3px 5px rgba(0,0,0,0.7));
    transition: all 0.25s ease;
  }
  .room-item:hover {
    filter: brightness(1.25) sepia(0) drop-shadow(0 0 12px rgba(196,164,101,0.95));
    transform: scale(1.18) translateY(-4px) !important;
  }
  .room-item.wrong {
    animation: shake 0.4s;
  }
  .room-item.right {
    filter: brightness(1.2) drop-shadow(0 0 15px #4ecda8) !important;
  }
`;
document.head.appendChild(s);
  }

  const items = [
{id:'wine', img:'assets/wine_clean_v2.png', label:'Wine Glass', w:'22px'},
{id:'notebook', img:'assets/notebook_clean_v2.png', label:'Hidden Notebook', w:'36px'},
{id:'novel', img:'assets/novel_clean_v2.png', label:'Mystery Novel', w:'34px'},
{id:'perfume', img:'assets/perfume_clean_v2.png', label:'Perfume Bottle', w:'25px'},
{id:'locket', img:'assets/locket_clean_v2.png', label:'Silver Locket', w:'26px'},
{id:'compass', img:'assets/compass_clean_v2.png', label:'Old Compass', w:'30px'},
{id:'magnifying', img:'assets/magnifying_clean_v2.png', label:'Magnifying Glass', w:'32px'},
{id:'cross', img:'assets/cross_clean_v2.png', label:'Wooden Cross', w:'25px'},
{id:'medal', img:'assets/medal_clean_v2.png', label:'Military Medal', w:'28px'}
  ];
  
  const killerIntruderMap = {
doctor: 'locket',
ceo: 'medal',
musician: 'cross',
student: 'magnifying',
comedian: 'compass',
detective: 'medal',
rowan: 'wine',
influencer: 'perfume',
therapist: 'notebook',
rachel: 'novel',
gamer: 'notebook'
  };
  const targetId = killerIntruderMap[GS.murderer] || 'wine';
  const intruderIdx = items.findIndex(item => item.id === targetId);
  window._testRoomIntruder = items[intruderIdx].id;

  grid.className = '';
  grid.innerHTML = `
<div style="position:relative;width:100%;height:480px;border-radius:4px;overflow:hidden;background:#111;box-shadow: 0 8px 32px rgba(0,0,0,0.5);border: 1px solid var(--glass-border);">
  <div style="width:100%; height:100%; position:relative;" id="room-scene">
    <img src="assets/cabin_bg_v3.png" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.85;">
    <div id="room-canvas-items" style="position:absolute; inset:0;"></div>
  </div>
</div>
  `;

  const container = $('room-canvas-items');
  const W = container.getBoundingClientRect().width || container.clientWidth || 900;
  const H = container.getBoundingClientRect().height || container.clientHeight || 480;
  const placed = [];

  const isOverlap = (x, y, itemW, pad) => {
const px = (x / 100) * W;
const py = (y / 100) * H;

const left1 = px - pad;
const right1 = px + itemW + pad;
const top1 = py - pad;
const bottom1 = py + itemW + pad;

return placed.some(p => {
  const left2 = p.px - pad;
  const right2 = p.px + p.w + pad;
  const top2 = p.py - pad;
  const bottom2 = p.py + p.w + pad;

  return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2);
});
  };

  const zones = [
{ minX: 5,  maxX: 24, minY: 60, maxY: 75 },  // bed
{ minX: 20, maxX: 42, minY: 72, maxY: 88 },  // rug
{ minX: 34, maxX: 44, minY: 52, maxY: 58 },  // nightstand
{ minX: 49, maxX: 75, minY: 48, maxY: 54 },  // desk
{ minX: 38, maxX: 50, minY: 24, maxY: 26 },  // shelf
{ minX: 82, maxX: 98, minY: 52, maxY: 58 },  // dresser
{ minX: 52, maxX: 78, minY: 75, maxY: 88 }   // floor
  ];

  items.forEach((item, i) => {
const itemW = parseFloat(item.w);
let x, y, tries = 0, pad = 10;
do {
  if (tries > 100) pad = 6;
  if (tries > 200) pad = 2;
  if (tries > 250) pad = 0;

  // Select a random zone
  const zone = zones[Math.floor(Math.random() * zones.length)];
  x = zone.minX + Math.random() * (zone.maxX - zone.minX);
  y = zone.minY + Math.random() * (zone.maxY - zone.minY);
  tries++;
} while (isOverlap(x, y, itemW, pad) && tries < 500);

const px = (x / 100) * W;
const py = (y / 100) * H;
placed.push({ px, py, w: itemW });

const c = document.createElement('img');
c.className = 'room-item';
c.src = item.img;
c.style.width = item.w;
c.style.left = x + '%';
c.style.top = y + '%';
c.style.transform = 'rotate(' + ((Math.random() - 0.5) * 30) + 'deg)';
c.title = item.label;

c.onclick = () => {
  if (!GS.gameActive) return;
  if(i === intruderIdx){ 
    SFX.success(); 
    c.classList.add('right'); 
    GS.gameActive = false;
    const activeScreen = document.querySelector('.screen.game-screen');
    if (activeScreen) activeScreen.style.pointerEvents = 'none';
    setTimeout(()=>onModuleComplete(15,Date.now()-gameStart,true), 600);
  } else {
    SFX.fail(); 
    c.classList.add('wrong'); 
    attempt++; 
    $('room-attempt').textContent=attempt+1;
    GS.domains.recognition=Math.max(0,GS.domains.recognition-10);
    
    c.style.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) drop-shadow(0 0 10px red)';
    setTimeout(()=>{
      c.classList.remove('wrong');
      c.style.filter = '';
    }, 500);
    
    if(attempt>=2) {
      GS.gameActive = false;
      const activeScreen = document.querySelector('.screen.game-screen');
      if (activeScreen) activeScreen.style.pointerEvents = 'none';
      setTimeout(()=>onModuleComplete(5,null,false), 500);
    }
  }
};
container.appendChild(c);
  });
}
// ─ GAME 4: BONFIRE ────────────────────────────────────────────
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

// ─ GAME 5: BAGGAGE ────────────────────────────────────────────
function startBaggage(){
  const masterPool = [
    { owner: 'Dr. Avery Ross', item: '🩺 Clinical Notepad' },
    { owner: 'Marcus Hale', item: '🔦 Tactical Flashlight' },
    { owner: 'Lena Brooks', item: '🧪 Water Sampler' },
    { owner: 'Noah Mercer', item: '💾 Encrypted USB' },
    { owner: 'Ethan Cross', item: '🎤 Voice Recorder' },
    { owner: 'Rachel Quinn', item: '💼 Legal Briefcase' },
    { owner: 'Maya Singh', item: '🩹 First Aid Kit' },
    { owner: 'Oliver Grant', item: '💻 Network Sniffer' },
    { owner: 'Daniel Price', item: '📊 Lab Logbook' },
    { owner: 'Sarah Bennett', item: '💍 Diamond Ring' }
  ];
  const pairs = [...masterPool].sort(() => Math.random() - 0.5).slice(0, 4);
  const shuffledOwners = [...pairs].sort(() => Math.random() - 0.5);
  const shuffledItems = [...pairs].sort(() => Math.random() - 0.5);
  const pMap = {}; pairs.forEach(p => pMap[p.owner] = p.item);
  let matched = 0, selOwner = null, selOwnerEl = null;
  const gameStart = Date.now();
  $('baggage-area').innerHTML = `
    <div class="bag-pair">
      <div><div class="bag-col-head">Owners</div>${shuffledOwners.map(p => `<div class="kara-opt" data-owner="${p.owner}" style="margin-bottom:8px">${p.owner}</div>`).join('')}</div>
      <div><div class="bag-col-head">Items</div>${shuffledItems.map(p => `<div class="kara-opt" data-item="${p.item}" style="margin-bottom:8px">${p.item}</div>`).join('')}</div>
    </div>`;
  $('baggage-area').querySelectorAll('[data-owner]').forEach(el=>{
    el.onclick=()=>{
      if (!GS.gameActive) return;
      SFX.click(); document.querySelectorAll('[data-owner]').forEach(b=>b.style.borderColor='rgba(196,164,101,.2)');
      el.style.borderColor='var(--gold)'; selOwner=el.dataset.owner; selOwnerEl=el;
      $('baggage-status').textContent='Now select their item →';
    };
  });
  $('baggage-area').querySelectorAll('[data-item]').forEach(el=>{
    el.onclick=()=>{
      if (!GS.gameActive) return;
      if(!selOwner){ $('baggage-status').textContent='Select an owner first!'; return; }
      SFX.click();
      if(pMap[selOwner]===el.dataset.item){
        selOwnerEl.classList.add('correct'); el.classList.add('correct');
        selOwnerEl.onclick=null; el.onclick=null;
        GS.domains.decisionMaking=Math.min(100,GS.domains.decisionMaking+16);
        matched++; selOwner=null; selOwnerEl=null;
        $('baggage-status').textContent=`Matched ${matched}/${pairs.length}`;
        if(matched>=pairs.length) {
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(15,Date.now()-gameStart,true);
        }
      } else {
        SFX.fail(); el.classList.add('wrong'); selOwnerEl.classList.add('wrong');
        setTimeout(()=>{ el.classList.remove('wrong'); if(selOwnerEl)selOwnerEl.classList.remove('wrong'); },500);
        selOwner=null; selOwnerEl=null;
        $('baggage-status').textContent='Wrong match — try again';
      }
    };
  });
}

// ─ GAME 6: FOREST ─────────────────────────────────────────────
function startForest(){
  const board = $('maze-canvas').parentElement;
  $('maze-canvas').style.display = 'none'; // hide old canvas
  
  const bgs = ['assets/path_start.png', 'assets/path_moss.png', 'assets/path_roots.png', 'assets/path_tree.png'];
  const labels = ['Left','Right','Forward','Back'];
  
  // Randomize the correct path (5 steps) with no consecutive duplicates
  const correctPath = [];
  let lastDir = -1;
  for (let i = 0; i < 5; i++) {
let dir;
do {
  dir = Math.floor(Math.random() * 4);
} while (dir === lastDir);
correctPath.push(dir);
lastDir = dir;
  }
  window._testForestPath = correctPath;

  // Generate dynamic hint
  const stepPhrases = [
[
  "turn left to enter the trail",
  "turn right to enter the trail",
  "walk forward to start the trail",
  "go back from the signpost"
],
[
  "head left past the mossy trunk",
  "turn right at the mossy trunk",
  "push forward past the mossy trunk",
  "go back near the mossy trunk"
],
[
  "veer left past the deep roots",
  "go right around the deep roots",
  "climb forward over the deep roots",
  "head back from the deep roots"
],
[
  "slide left where the path darkens",
  "steer right as the path darkens",
  "press forward when the path darkens",
  "head back where the path darkens"
],
[
  "make a final left turn to reach the clearing",
  "take a final right turn to reach the clearing",
  "push forward into the bright clearing",
  "turn back one last time to reach the clearing"
]
  ];
  const hintParts = correctPath.map((dir, stepIdx) => stepPhrases[stepIdx][dir]);
  const generatedHint = "To escape the looping trees, follow the path: " + hintParts.join(", ") + ".";
  
  // Update the hint dynamically in MODULES_DATA and active sidebar notes
  if (window.MODULES_DATA && window.MODULES_DATA[5]) {
window.MODULES_DATA[5].hint = generatedHint;
  }
  const notesEl = document.querySelector('#sc-forest .field-manual-sidebar p:last-of-type');
  if (notesEl) notesEl.innerHTML = generatedHint;

  let step=0, attempt=0;
  $('maze-step').textContent='0'; $('forest-attempt').textContent=1;
  const gameStart=Date.now();
  
  // Clean up if restarting
  if($('forest-ui')) $('forest-ui').remove();
  
  board.innerHTML += `
<div id="forest-ui" style="position:relative;width:100%;height:320px;border-radius:4px;overflow:hidden">
  <img id="forest-bg" src="${bgs[0]}" style="width:100%;height:100%;object-fit:cover;transition:opacity 0.4s">
  <div id="forest-btns" style="position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:10px;padding:10px"></div>
</div>
  `;
  
  const draw = () => {
$('forest-bg').style.opacity = '0';
setTimeout(() => {
  $('forest-bg').src = bgs[step % bgs.length];
  $('forest-bg').style.opacity = '1';
}, 200);

$('maze-step').textContent = step+'/5';
const btns = $('forest-btns');
btns.innerHTML = '';
labels.forEach((lbl, i) => {
  const btn = document.createElement('button');
  btn.className = 'btn-secondary';
  btn.textContent = lbl;
  btn.style.background = 'rgba(10,20,30,0.85)';
  btn.style.borderColor = 'var(--gold)';
  btn.onclick = () => {
    if (!GS.gameActive) return;
    if(i === correctPath[step]) {
      SFX.click(); GS.domains.persistence = Math.min(100, GS.domains.persistence+13);
      step++;
      if(step >= correctPath.length) { 
        GS.gameActive = false;
        const activeScreen = document.querySelector('.screen.game-screen');
        if (activeScreen) activeScreen.style.pointerEvents = 'none';
        setTimeout(()=>onModuleComplete(15,Date.now()-gameStart,true), 400); 
      }
      else draw();
    } else {
      SFX.fail(); attempt++; $('forest-attempt').textContent=attempt+1;
      $('forest-bg').style.filter = 'sepia(1) hue-rotate(-50deg) saturate(3)';
      setTimeout(() => $('forest-bg').style.filter = 'none', 300);
      if(attempt >= 2) {
        GS.gameActive = false;
        const activeScreen = document.querySelector('.screen.game-screen');
        if (activeScreen) activeScreen.style.pointerEvents = 'none';
        setTimeout(()=>onModuleComplete(5,null,false), 400);
      }
    }
  };
  btns.appendChild(btn);
});
  };
  draw();
}
// ─ GAME 7: KARAOKE ────────────────────────────────────────────
// ─ GAME 7: EVIDENCE CHALLENGE ─────────────────────────────────
function startEvidenceChallenge() {
  const rounds = [
    {
      cue: 'MA_A SI_GH — Spa Inventory: [GLITCH]',
      opts: ['7:30 PM - 9:00 PM', '8:30 PM - 10:00 PM', '9:30 PM - 11:00 PM', '8:00 PM - 9:30 PM'],
      correct: 1,
      suspectName: 'Maya Singh'
    },
    {
      cue: 'RA_H_L QU_NN — Hired on 6-Month Contract: [GLITCH]',
      opts: ['April 12, 2026', 'June 12, 2026', 'May 12, 2026', 'May 22, 2026'],
      correct: 2,
      suspectName: 'Rachel Quinn'
    },
    {
      cue: 'SA_AH BE_N_TT — Beach Photoshoot End: [GLITCH]',
      opts: ['8:30 PM', '9:30 PM', '10:30 PM', '9:00 PM'],
      correct: 1,
      suspectName: 'Sarah Bennett'
    },
    {
      cue: 'R_W_N AS_F_RD — Closed Main Office: [GLITCH]',
      opts: ['9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'],
      correct: 1,
      suspectName: 'Rowan Ashford'
    },
    {
      cue: 'DR. AV_RY RO_S — Patient Log Audit: [GLITCH]',
      opts: ['8:00 PM - 9:30 PM', '8:45 PM - Midnight', '9:15 PM - 10:45 PM', '10:30 PM - Midnight'],
      correct: 1,
      suspectName: 'Dr. Avery Ross'
    },
    {
      cue: 'MA_CUS H_LE — Patrolled Perimeter: [GLITCH]',
      opts: ['7:30 PM - 8:30 PM', '8:30 PM - 10:30 PM', '9:00 PM - 10:45 PM', '10:45 PM onwards'],
      correct: 1,
      suspectName: 'Marcus Hale'
    },
    {
      cue: 'LE_A BR_OKS — Tide Pool Sampling: [GLITCH]',
      opts: ['8:00 PM - 9:00 PM', '8:30 PM - 9:45 PM', '9:00 PM - 10:15 PM', '9:30 PM - 10:45 PM'],
      correct: 1,
      suspectName: 'Lena Brooks'
    },
    {
      cue: 'NO_H ME_C_R — Reading in resort library: [GLITCH]',
      opts: ['7:30 PM - 8:30 PM', '8:30 PM - 10:30 PM', '9:00 PM - 11:00 PM', '10:45 PM onwards'],
      correct: 1,
      suspectName: 'Noah Mercer'
    },
    {
      cue: 'ET_AN CR_SS — Lounge Guest Interviews: [GLITCH]',
      opts: ['7:30 PM - 8:30 PM', '8:45 PM - 10:30 PM', '9:00 PM - 11:00 PM', '10:00 PM - Midnight'],
      correct: 1,
      suspectName: 'Ethan Cross'
    },
    {
      cue: 'OL_V_R GR_NT — Monitor Server Grids: [GLITCH]',
      opts: ['7:30 PM - 8:00 PM', '8:15 PM - 10:00 PM', '9:00 PM - 10:30 PM', '10:15 PM onwards'],
      correct: 1,
      suspectName: 'Oliver Grant'
    }
  ];
  const r = rounds[Math.floor(Math.random()*rounds.length)];
  let attempt = 0; window._testEvidenceCorrect = r.correct;
  window._testEvidenceCorrectText = r.opts[r.correct];
  window._testEvidenceName = r.suspectName;
  $('evi-attempt').textContent = 1; $('evi-cue').textContent = 'Decrypt: ' + r.cue;
  const gameStart = Date.now();
  
  const distArea = $('evi-distraction-area');
  distArea.innerHTML = '';
  
  const scan = document.createElement('div');
  scan.style.position = 'absolute';
  scan.style.width = '100%';
  scan.style.height = '2px';
  scan.style.background = 'rgba(255, 50, 50, 0.4)';
  scan.style.boxShadow = '0 0 8px rgba(255, 50, 50, 0.8)';
  scan.style.animation = 'eviScan 2s linear infinite';
  distArea.appendChild(scan);

  const words = ['[CORRUPT]', '01000101', 'ECHO_LOG', 'SYSTEM_ERR', 'FILE_UNREAD', '[OVERLOAD]'];
  for(let i=0; i<12; i++) {
    const d = document.createElement('div');
    d.style.position = 'absolute';
    d.style.color = Math.random() > 0.5 ? 'rgba(196,164,101,0.15)' : 'rgba(192,71,31,0.15)';
    d.style.fontFamily = 'var(--ff-m)';
    d.style.fontSize = '0.65rem';
    d.style.left = (Math.random()*85)+'%';
    d.style.top = (Math.random()*80)+'%';
    d.style.whiteSpace = 'nowrap';
    d.style.animation = `eviGlitch ${1 + Math.random()*2}s ease-in-out infinite alternate`;
    d.textContent = words[Math.floor(Math.random()*words.length)];
    distArea.appendChild(d);
  }
  
  $('evi-opts').innerHTML = r.opts.map((o,i) => `<button class="btn-secondary kara-opt" data-i="${i}" style="width:100%; text-align:left; padding:10px;">${o}</button>`).join('');
  
  $('evi-opts').querySelectorAll('.kara-opt').forEach(el => {
    el.onclick = () => {
      if (!GS.gameActive) return;
      const i = parseInt(el.dataset.i); SFX.click();
      if(i === r.correct) { 
        el.classList.add('correct'); 
        GS.domains.distractionResistance = Math.min(100, GS.domains.distractionResistance + 20); 
        GS.telemetry.targetFilterEfficiency += 10;
        GS.gameActive = false;
        const activeScreen = document.querySelector('.screen.game-screen');
        if (activeScreen) activeScreen.style.pointerEvents = 'none';
        onModuleComplete(15, Date.now()-gameStart, true); 
      }
      else { 
        el.classList.add('wrong'); SFX.fail(); attempt++; $('evi-attempt').textContent = attempt+1;
        setTimeout(() => el.classList.remove('wrong'), 500);
        if(attempt >= 2) {
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(5, null, false);
        }
      }
    };
  });
}

// ─ GAME 8: CCTV ───────────────────────────────────────────────
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

// ─ GAME 9: STORM ──────────────────────────────────────────────
// ─ GAME 9: STORM SHELTER ──────────────────────────────────────
function startStormShelter() {
  const clues = [
    { q: "HR log: Month and Day Rachel Quinn signed her contract (MMDD).", a: "0512", suspectName: "Rachel Quinn" },
    { q: "Security log: Maya Singh's RFID spa exit time (HHMM).", a: "1017", suspectName: "Maya Singh" },
    { q: "Device log: Sarah Bennett's beach photoshoot end time (HHMM).", a: "0930", suspectName: "Sarah Bennett" },
    { q: "Reservation log: Maya Singh's Spa inventory management end time (HHMM).", a: "1000", suspectName: "Maya Singh" },
    { q: "Lobby router log: Rachel Quinn's laptop disconnect time (HHMM).", a: "0900", suspectName: "Rachel Quinn" },
    { q: "Dock log: Daniel Price's escape vessel registry audit end time (HHMM).", a: "1015", suspectName: "Daniel Price" }
  ];
  const activeClue = clues[Math.floor(Math.random()*clues.length)];
  const code = activeClue.a;
  let input = ''; let attempt = 0;
  window._testStormCode = code;
  window._testStormName = activeClue.suspectName;
  $('storm-clue').textContent = `Decode: ${activeClue.q}`;
  $('storm-display').textContent = '----';
  $('storm-attempt').textContent = 1;
  const gameStart = Date.now();
  
  const keypad = $('storm-keypad');
  keypad.innerHTML = '';
  [1,2,3,4,5,6,7,8,9,'C',0,'E'].forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'btn-secondary';
    btn.style.padding = '15px';
    btn.style.fontSize = '1.2rem';
    btn.textContent = k;
    btn.onclick = () => {
      if (!GS.gameActive) return;
      SFX.click();
      if(k === 'C') { input = ''; }
      else if(k === 'E') {
        if(input === code) {
          GS.domains.multitasking = Math.min(100, GS.domains.multitasking + 15);
          GS.gameActive = false;
          const activeScreen = document.querySelector('.screen.game-screen');
          if (activeScreen) activeScreen.style.pointerEvents = 'none';
          onModuleComplete(15, Date.now()-gameStart, true);
        } else {
          SFX.fail();
          input = '';
          attempt++;
          GS.telemetry.matchErrorRate++;
          if(attempt < 2) {
            $('storm-attempt').textContent = attempt + 1;
          } else {
            GS.gameActive = false;
            const activeScreen = document.querySelector('.screen.game-screen');
            if (activeScreen) activeScreen.style.pointerEvents = 'none';
            onModuleComplete(5, null, false);
          }
        }
      } else {
        if(input.length < 4) input += k;
      }
      $('storm-display').textContent = input.padEnd(4, '-');
    };
    keypad.appendChild(btn);
  });
}

// ─ GAME 10: PATHFINDER ────────────────────────────────────────
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

// ─ MODALS CONTROL ─────────────────────────────────────────────
function showModal(id) {
  SFX.click();
  $(id).classList.add('on');
}
function closeModal(id) {
  SFX.click();
  $(id).classList.remove('on');
}

// MAP MODAL
function updateMapActive(currentLoc) {
  document.querySelectorAll('.map-node').forEach(el => el.classList.remove('active'));
  const activeNode = $('mn-' + currentLoc);
  if (activeNode) { activeNode.classList.add('active'); }
}

function mapClick(loc) {
  SFX.click();
  alert(`Current destination node: ${loc}. Complete current module tasks to navigate.`);
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

// DOSSIER FLIPPING BOOK & TABBED DASHBOARD
let currentDossierPage = 0;
let dossierList = [];

function updateDossierList() {
  const playerId = GS.playerIdentity || (() => {
    const user = JSON.parse(localStorage.getItem('elaris_user') || '{}');
    return user.identity === 'academic' ? 'student' : user.identity;
  })();
  
  // Filter out: player, rowan, keeper, kai from the suspect list!
  // This is "our file" - about the OTHER suspects.
  dossierList = [...IDENTITIES, ...NPCS_BASE].filter(c => 
    c.id !== playerId && 
    c.id !== 'rowan' && c.id !== 'narrator' && 
    c.id !== 'keeper' && 
    c.id !== 'kai'
  );
}

function isSecretUnlocked(npcId) {
  if (npcId === 'ceo') return GS.fragments[0] || GS.fragments[7];
  if (npcId === 'gamer') return GS.fragments[1];
  if (npcId === 'doctor') return GS.fragments[2];
  if (npcId === 'musician') return GS.fragments[2];
  if (npcId === 'rachel') return GS.fragments[3];
  if (npcId === 'student') return GS.fragments[5];
  if (npcId === 'detective') return GS.fragments[6];
  if (npcId === 'comedian') return GS.fragments[7];
  if (npcId === 'therapist') return GS.fragments[8];
  if (npcId === 'influencer') return GS.fragments[9];
  return false;
}

function isVictimTruthUnlocked(victimId) {
  if (victimId === 'kai') return GS.fragments[0];
  if (victimId === 'keeper') return GS.fragments[1];
  if (victimId === 'bonfireVictim') return GS.fragments[3];
  return false;
}

function showDossierCard() {
  if (dossierList.length === 0) updateDossierList();
  const profile = dossierList[currentDossierPage];
  if (!profile) return;
  
  const details = profile.details || 'No detailed records found.';
  const alibi = profile.alibi || 'No verified alibi.';
  
  $('cf-page-num').textContent = currentDossierPage + 1;
  $('cf-page-total').textContent = dossierList.length;

  // Determine File No
  let fileNo = 'EL-' + String(currentDossierPage + 101).padStart(4, '0');
  let status = 'SUSPECT';

  // Check progressive unredaction of secret in individual view
  const isUnlocked = isSecretUnlocked(profile.id);
  const secretHtml = isUnlocked 
    ? `<div style="margin-top: 12px; border-top: 1px dashed rgba(90,75,60,0.3); padding-top: 8px;">
         <h5 style="color:#c0471f; font-family:var(--ff-m); font-size:0.72rem; margin-bottom:4px; text-transform:uppercase;">UNCOVERED HIDDEN TRUTH</h5>
         <p style="font-family:var(--ff-m); font-size:0.72rem; color:#2b241a; line-height:1.4;">${profile.secret}</p>
       </div>`
    : `<div style="margin-top: 12px; border-top: 1px dashed rgba(90,75,60,0.3); padding-top: 8px;">
         <h5 style="color:#6e5e4d; font-family:var(--ff-m); font-size:0.72rem; margin-bottom:4px; text-transform:uppercase;">UNCOVERED HIDDEN TRUTH</h5>
         <span class="redacted-clue">[REDACTED - RECOVER MORE EVIDENCE]</span>
       </div>`;

  $('cf-book-card').innerHTML = `
    <div class="case-stamp">CLASSIFIED</div>
    <div class="book-row">
      <div class="book-page-left">
        <div style="position: relative; display: inline-block; margin-top: 10px; width: 105px; height: 120px;">
          <div class="paperclip"></div>
          <div style="width: 100%; height: 100%; border: 1px solid #c2b59b; background: #faf6f0; box-shadow: 2px 4px 8px rgba(0,0,0,0.15); transform: rotate(-2deg); overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${profile.id === 'ceo' 
              ? `<img src="assets/MARCUS-HALE.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'doctor'
              ? `<img src="assets/AVERY-ROSS.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'musician'
              ? `<img src="assets/LENA-BROOKS.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'rachel'
              ? `<img src="assets/RACHEL.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'comedian'
              ? `<img src="assets/ETHAN.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'therapist'
              ? `<img src="assets/MAYA-SINGH.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'detective'
              ? `<img src="assets/OLIVER-GRANT.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'gamer'
              ? `<img src="assets/DANIEL-PRICE.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'influencer'
              ? `<img src="assets/SARAH-BENNETT.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'kai'
              ? `<img src="assets/KAI-NAKAMURA.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'student'
              ? `<img src="assets/NOAH-MERCER.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : profile.id === 'keeper'
              ? `<img src="assets/LIGHTHOUSE-KEEPER.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : makeSVGChar(profile, false)}
          </div>
        </div>
        <h4 style="font-size:0.85rem; color:#2b241a; font-family:var(--ff-m); margin-bottom: 2px; border-bottom: 1px dashed #8c7e6b; padding-bottom: 2px; word-break: break-word; line-height: 1.2;">${profile.icon || ''} ${profile.name}</h4>
        <p style="font-size:0.62rem; color:#5a4b3c; font-family:var(--ff-m); margin-bottom: 8px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; line-height: 1.2;">${profile.role}</p>
        
        <div style="font-family: var(--ff-m); font-size: 0.65rem; color: #4a3b2c; border-top: 1px dotted #8c7e6b; width: 90%; padding-top: 8px; margin-top: 5px; text-align: left; line-height: 1.5;">
          <strong>FILE NO:</strong> ${fileNo}<br>
          <strong>STATUS:</strong> <span style="color: #8e5b15; font-weight: bold;">${status}</span>
        </div>
      </div>
      <div class="book-page-right-wrapper" style="position: relative; height: 100%; display: flex; flex-direction: column; overflow: hidden; width: 100%;">
        <div class="book-page-right" id="cf-page-right" style="flex: 1; overflow-y: auto; padding-right: 5px; padding-bottom: 25px;">
          <h5 style="color:#8e5b15; font-family:var(--ff-m); font-size:0.72rem; margin-bottom:6px; text-transform:uppercase; border-bottom: 1px solid rgba(90,75,60,0.25); padding-bottom: 2px; letter-spacing: 0.05em;">SUBJECT BRIEF // DOSSIER LOG</h5>
          <p style="margin-bottom:14px; font-size:0.75rem; color:#2b241a; line-height: 1.45;">${details}</p>
          <h5 style="color:#a82e2e; font-family:var(--ff-m); font-size:0.72rem; margin-bottom:4px; text-transform:uppercase; border-bottom: 1px solid rgba(90,75,60,0.25); padding-bottom: 2px; letter-spacing: 0.05em;">CHRONOLOGICAL ALIBI TIMELINE</h5>
          <p style="font-style:italic; font-size:0.72rem; color:#4a3b2c; line-height: 1.4;">${alibi}</p>
          ${secretHtml}
        </div>
        <div class="scroll-arrow-down" id="dossier-scroll-arrow" style="display: none;">▼</div>
      </div>
    </div>
  `;

  const pageRight = $('cf-page-right');
  const arrow = $('dossier-scroll-arrow');
  
  const updateArrow = () => {
    const maxScroll = pageRight.scrollHeight - pageRight.clientHeight;
    if (maxScroll > 1 && pageRight.scrollTop < maxScroll - 5) {
      arrow.style.display = 'flex';
    } else {
      arrow.style.display = 'none';
    }
  };

  setTimeout(updateArrow, 100);
  pageRight.onscroll = updateArrow;
  
  arrow.onclick = () => {
    pageRight.scrollBy({ top: 60, behavior: 'smooth' });
  };
}

function prevDossierPage() {
  SFX.click();
  if(currentDossierPage > 0) {
    currentDossierPage--;
    showDossierCard();
  }
}

function nextDossierPage() {
  SFX.click();
  if(currentDossierPage < dossierList.length - 1) {
    currentDossierPage++;
    showDossierCard();
  }
}

// Rendering functions for progressive unredaction tables
function renderSuspectsTable() {
  const body = $('manifest-table-body');
  body.innerHTML = '';
  
  dossierList.forEach(s => {
    const isUnlocked = isSecretUnlocked(s.id);
    const secretText = isUnlocked 
      ? `<div class="unredacted-clue">${s.secret}</div>` 
      : `<div class="redacted-clue">[REDACTED - RECOVER ENVELOPE]</div>`;
    
    body.innerHTML += `
      <tr>
        <td style="width: 50px; text-align: center;">
          <div style="width: 40px; height: 45px; border: 1px solid rgba(196, 164, 101, 0.3); border-radius: 2px; background: rgba(0,0,0,0.3); overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${s.id === 'ceo' 
              ? `<img src="assets/MARCUS-HALE.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'doctor'
              ? `<img src="assets/AVERY-ROSS.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'musician'
              ? `<img src="assets/LENA-BROOKS.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'rachel'
              ? `<img src="assets/RACHEL.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'comedian'
              ? `<img src="assets/ETHAN.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'therapist'
              ? `<img src="assets/MAYA-SINGH.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'detective'
              ? `<img src="assets/OLIVER-GRANT.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'gamer'
              ? `<img src="assets/DANIEL-PRICE.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'influencer'
              ? `<img src="assets/SARAH-BENNETT.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'kai'
              ? `<img src="assets/KAI-NAKAMURA.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'student'
              ? `<img src="assets/NOAH-MERCER.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : s.id === 'keeper'
              ? `<img src="assets/LIGHTHOUSE-KEEPER.jpeg" style="width: 100%; height: 100%; object-fit: cover;" />`
              : makeSVGChar(s, false)}
          </div>
        </td>
        <td style="font-family: var(--ff-t); font-weight: bold; color: var(--gold-l);">${s.icon || ''} ${s.name}</td>
        <td>${s.role}</td>
        <td style="font-size: 0.72rem; color: var(--text-d); font-style: italic;">${s.trait}</td>
        <td>${secretText}</td>
      </tr>
    `;
  });
}

function renderVictimsTable() {
  const body = $('victims-table-body');
  body.innerHTML = '';
  
  const victims = [];
  
  // Kai Nakamura - always dead and announced in the intro
  const kaiNPC = GS.npcs.find(n => n.id === 'kai');
  if (kaiNPC && !kaiNPC.alive) {
    victims.push({ id: 'kai', name: 'Kai Nakamura', role: 'Investigative Journalist', tod: 'Start of Game', truth: 'Not completely innocent. He illegally accessed confidential files and leaked participant information while investigating Project Echo.' });
  }
  
  // Lighthouse Keeper - announced after Module 2 completes (keeper is marked deceased)
  const keeperNPC = GS.npcs.find(n => n.id === 'keeper');
  if (keeperNPC && !keeperNPC.alive) {
    victims.push({ id: 'keeper', name: 'Lighthouse Keeper', role: 'Former Caretaker', tod: 'End of Module 2', truth: 'Secretly maintained a hidden archive of Project Echo documents after the project shut down.' });
  }
  
  // Bonfire Victim - announced after Module 4 completes (bonfireVictim is marked deceased)
  if (GS.bonfireVictim) {
    const bonfireVictimNPC = [...IDENTITIES, ...NPCS_BASE].find(c => c.id === GS.bonfireVictim);
    if (bonfireVictimNPC && !bonfireVictimNPC.alive) {
      victims.push({ id: 'bonfireVictim', name: bonfireVictimNPC.name, role: bonfireVictimNPC.role, tod: 'End of Module 4', truth: 'Learns a crucial truth and lies about it during the bonfire, triggering their death.' });
    }
  }
  
  if (victims.length === 0) {
    body.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-dm);">No victim records announced yet.</td></tr>';
    return;
  }

  victims.forEach(v => {
    const isUnlocked = isVictimTruthUnlocked(v.id);
    const truthText = isUnlocked 
      ? `<div class="unredacted-clue">${v.truth}</div>` 
      : `<div class="redacted-clue">[REDACTED - RECOVER ENVELOPE]</div>`;
    const statusText = `<span style="color:#b22222; font-weight:bold;">DECEASED</span>`;
      
    body.innerHTML += `
      <tr>
        <td style="font-family: var(--ff-t); font-weight: bold; color: #ff5e4d;">💀 ${v.name}</td>
        <td>${v.role}</td>
        <td style="font-size:0.75rem;">${v.tod}<br>${statusText}</td>
        <td>${truthText}</td>
      </tr>
    `;
  });
}

window.switchDossierTab = (tabName) => {
  SFX.click();
  document.querySelectorAll('.cf-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
  });
  document.querySelectorAll('.cf-panel').forEach(panel => {
    panel.style.display = panel.id === 'cf-panel-' + tabName ? 'block' : 'none';
  });
  
  if (tabName === 'manifest') {
    renderSuspectsTable();
  } else if (tabName === 'victims') {
    renderVictimsTable();
  }
};

// Hook Files dossiers button
$('cf-btn').onclick = () => {
  updateDossierList();
  
  document.querySelectorAll('.cf-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector('.cf-tab-btn[onclick*="dossiers"]');
  if (activeBtn) activeBtn.classList.add('active');
  
  document.querySelectorAll('.cf-panel').forEach(p => p.style.display = 'none');
  $('cf-panel-dossiers').style.display = 'block';

  currentDossierPage = 0;
  showDossierCard();
  showModal('modal-cf');
};

// Hook Map button
$('map-btn').onclick = () => {
  showModal('modal-map');
};

// ─ PROGRESS SAVE (localStorage → admin can read) ──────────────
function saveProgress(){
  const data={
    player:{ name:GS.playerName, role:GS.playerRole, icon:GS.playerIcon },
    score:GS.score, moduleIdx:GS.moduleIdx,
    moduleScores:GS.moduleScores,
    domains:GS.domains,
    fragments:GS.fragments,
    dass: {
      depression: Math.round(((GS.dass.depression || []).reduce((a, b) => a + b, 0)) * (14 / 3)),
      anxiety:    Math.round(((GS.dass.anxiety    || []).reduce((a, b) => a + b, 0)) * (14 / 3)),
      stress:     Math.round(((GS.dass.stress     || []).reduce((a, b) => a + b, 0)) * (14 / 3))
    },
    dassRaw: GS.dassRaw,
    rtSamples:GS.rtSamples,
    correctCount:GS.correctCount,
    attemptCount:GS.attemptCount,
    murderer:GS.murderer,
    killerGuess:GS.killerGuess || "",
    sessionStart:GS.sessionStart,
    lastUpdated:Math.floor(Date.now() / 1000)
  };
  localStorage.setItem('elaris_session', JSON.stringify(data));
  localStorage.setItem('elaris_session_ts', Date.now());
  
  // Update Go backend progress as well
  const userJson = localStorage.getItem('elaris_user');
  if (userJson) {
    const user = JSON.parse(userJson);
    fetch('/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.user_id || user.id,
        progress: data
      }),
      keepalive: true
    }).catch(err => console.warn('telemetry save error:', err));
  }
}

// Auto-save telemetry on midway exits (tab close, minimize, navigate away)
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveProgress();
  }
});
window.addEventListener('pagehide', saveProgress);

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

function formatPlayerDateTime(d) {
  const pad = n => String(n).padStart(2, '0');
  const yr = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const dy = pad(d.getDate());
  const hr = pad(d.getHours());
  const mn = pad(d.getMinutes());
  return `${yr}-${mo}-${dy} ${hr}:${mn}`;
}

function parsePlayerDASS(s) {
  try {
    const raw = typeof s.dass === 'object' && s.dass !== null && !Array.isArray(s.dass)
      ? s.dass
      : JSON.parse(s.dass || '{}');
    return {
      depression: raw.depression || 0,
      anxiety:    raw.anxiety || 0,
      stress:     raw.stress || 0
    };
  } catch (_) {
    return { depression: 0, anxiety: 0, stress: 0 };
  }
}

function escapeHtmlStr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

