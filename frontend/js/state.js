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
    height: 165,
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
    height: 188,
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
    height: 170,
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
    height: 178,
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
    height: 180,
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
    height: 185,
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
    height: 162,
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
    height: 173,
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
    height: 160,
    details: 'Sarah Bennett, investor. Confident and highly influential. She put immense pressure on research coordinators to expand the trials and collect more data despite severe safety concerns to protect her capital.',
    alibi: '<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>9:00 PM - 9:30 PM:</strong> VIP beach photoshoot (Beach security log shows beach lights were shut off at 9:30 PM).<br>• <strong>9:45 PM:</strong> Retired to Cabin 7.</div>',
    image: 'assets/portrait_mia_1780832174257.png'
  }
];

const NPCS_BASE = [
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
    height: 168,
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
    height: 172,
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
    height: 176,
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
  
  const victimId = GS.bonfireVictim || 'influencer';
  const vMeta = CHARACTER_META[victimId] || CHARACTER_META.influencer;
  
  const t1Id = (window._bonfireTruthTellers && window._bonfireTruthTellers[0]) || 'doctor';
  const t2Id = (window._bonfireTruthTellers && window._bonfireTruthTellers[1]) || 'ceo';
  const t1Meta = CHARACTER_META[t1Id] || CHARACTER_META.doctor || { name: 'Dr. Avery Ross' };
  const t2Meta = CHARACTER_META[t2Id] || CHARACTER_META.ceo || { name: 'Marcus Hale' };
  const tName1 = t1Meta.name;
  const tName2 = t2Meta.name;
  
  const list = [
    // Module 1 (The Shoreline)
    {
      text: `"This wasn't supposed to happen.\nWe only agreed to collect data. ${meta.name} was never supposed to find out."\n\n[Beach audio recorder log. Speaker unknown. Dated: 3 years ago.]`,
      clue: `The victim, Kai Nakamura, discovered that ${meta.name} was connected to the Project Echo cover-up.`
    },
    // Module 2 (The Lighthouse)
    {
      text: `"[Evidence recovered: A handwritten note found in the deceased Lighthouse Keeper's hand]\n\n'Cabin 7' [Marked with a large red X]"`,
      clue: `The dead Lighthouse Keeper was holding a note reading 'Cabin 7' marked with a large red X.`
    },
    // Module 3 (Cabin 7)
    {
      text: `"[Evidence Decrypted: Kai's Dossier on ${meta.name}]\n\nRelationship: Secret financial coordinator for Project Echo.\nInvestigation Focus: Tracing the offshore accounts used to fund the suppressed clinical trials.\nHidden Fact: Surveillance records place them meeting with the caretaker hours before the lighthouse went dark."`,
      clue: `Linked the Cabin 7 intruder item to ${meta.name}, revealing their secret financial coordination of Project Echo and meetings before the murder.`
    },
    // Module 4 (The Bonfire)
    {
      text: `the suspect who lied is dead. Someone doesnt like lies. \n\nNew Clue : Someone poisoned them intentionally. Could it be ${tName1} and ${tName2}`,
      clue: `the suspect who lied is dead. Someone doesnt like lies. New Clue : Someone poisoned them intentionally. Could it be ${tName1} and ${tName2}`
    },
    // Module 5 (Lost Baggage)
    {
      text: `"[Baggage search report]\n\nA folder of historical documents was found hidden in the luggage of ${vMeta.name}. It contains clinical trial blueprints and a detailed layout of the island's server room."`,
      clue: `${vMeta.name} was carrying server blueprints and suppressed clinical trial records.`
    },
    // Module 6 (The Forest Trail)
    {
      text: `"You reach at the end of the forest to discover a hidden Server room with a board that says 'Project Echo'."`,
      clue: `"You reach at the end of the forest to discover a hidden Server room with a board that says 'Project Echo'."`
    },
    // Module 7 (The Storm Shelter)
    {
      text: `"[Final pages of PROJECT ECHO report]\n\n'Participants exhibited severe and sustained increases in stress, anxiety, and depressive cognition. Data was suppressed.'\n\n[Suppress-Signatures: Project Director, Dr. Avery Ross, and ${meta.name} (Consultant)]"`,
      clue: `${meta.name} is documented as an operator in the suppressed Project Echo report.`
    },
    // Module 8 (CCTV Reconstruction)
    {
      text: `"[Boardroom CCTV Reconstruction]\n\nAt 11:00 PM, a meeting took place in the boardroom. The footage clearly shows ${meta.name} present, contradicting their alibi."`,
      clue: `you can now see everyone's hiddden truth unlocked in the dossier file`
    },
    // Module 9 (Evidence Challenge)
    {
      text: `"If the truth about the secret gets out, we're finished. Marcus, Avery, all of us. Not just the ones who ran the tests."\n\n[Decrypted control room audio log belonging to ${meta.name}.]`,
      clue: `Surveillance logs decrypt to expose ${meta.name}'s secret: ${meta.secret}`
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
  {id:'beach',      title:'The Shoreline',    icon:'🏖️', loc:'Beach',      intro:'Footprints lead from the body toward the treeline. A storm is coming. Collect the evidence before the tide destroys everything.', task:'Search the shore — react quickly', hint:'Search the shoreline for critical evidence.'},
  {id:'lighthouse', title:'The Lighthouse',   icon:'🔦', loc:'Lighthouse', intro:'The security panel requires an access code. Solve the lock mechanism to enter the keeper\'s room.',task:'Solve the lock mechanism to enter the keeper\'s room', hint:'Watch the colored light signals flashing from the lighthouse lantern. Replicate the sequence exactly by tapping the colored buttons below.'},
  {id:'room',       title:'Cabin 7',          icon:'🚪', loc:'Resort',     intro:'The cabin door is slightly open. Search the room carefully to find what was left behind.', task:'Examine the cabin for anything that seems out of place.', hint:'Someone was here recently. Look closely at the room and investigate the clues left behind.'},
  {id:'bonfire',    title:'The Bonfire',      icon:'🔥', loc:'Beach',      intro:"Every guest has a story. At the bonfire, the stories don't match. One person slipped a contradiction into their alibi.", task:'Spot the logical contradiction', hint:'Open the Case Files Dossier (by clicking FILES in the header) to review the suspect\'s verified timeline. Compare their statement at the bonfire to identify and click the phrase that contradicts the official files.'},
  {id:'baggage',    title:'Lost Baggage',     icon:'🧳', loc:'Dock',       intro:"The storm scattered luggage across the resort. Worse — someone swapped items. Restore order before more evidence is lost.", task:'Match owners to their belongings', hint:'Review character occupations in the Case Files. Select a character owner first, then select their professional belonging to pair them.'},
  {id:'forest',     title:'The Forest Trail', icon:'🌲', loc:'Forest',     intro:'A witness claims to have seen a figure running through the forest. But the paths keep changing. Someone rerouted them.', task:'Follow the correct path through shifting signs', hint:'Follow the logical navigation clues below to find your way through the shifting paths.'},
  {id:'storm',      title:'The Storm Shelter', icon:'🚨', loc:'Forest',     intro:"The storm is at full strength. Power systems are failing. Decode clues to discover a password, then input the numbers on a server panel to restore the CCTV system under emergency sirens.", task:'Decode password and input on keypad', hint:'Read the decoding clue on the screen. Click on the FILES Dossier in the HUD, navigate to the correct suspect\'s profile to find their verified timeline logs, and enter the MMDD or HHMM code into the security keypad.'},
  {id:'cctv',       title:'Server Room',      icon:'📼', loc:'Resort',     intro:"The CCTV server was damaged — files scrambled. Piece together the footage timeline to establish who was where.", task:'Restore the footage sequence', hint:'Drag and drop the security clips into chronological order from Dinner (early evening) to Alarms (midnight) to restore the server logs.'},
  {id:'evidence',   title:'Evidence Challenge', icon:'📂', loc:'Resort',     intro:"The main server contains encrypted timeline fragments corrupted by visual noise. Decrypt the files before they are wiped.", task:'Match glitched logs with FILES Dossier', hint:'Read the corrupted character log. Open the FILES Dossier in the HUD, check the corresponding character\'s verified timeline, and select the option that correctly decrypts the missing value.'},
  {id:'pathfinder', title:'The Dock',         icon:'🚤', loc:'Dock',       intro:"The escape boat has been found — but the ignition lock is a sequence puzzle. Someone sabotaged it. This is the last chance.", task:'Complete the sequence under pressure', hint:'Tap the nodes in the exact alpha-numeric sequence: 1, 2, 3, A, 4, B, 5, C, 6, D. Avoid errors to unlock the ignition sequence.'},
];

// Initialize randomized timeline alibis
function initializeRandomAlibis() {
  if (GS.randomAlibis) return; // already initialized
  
  // 1. Rachel Quinn contract date
  const months = ['March', 'April', 'May', 'June'];
  const monthIdx = Math.floor(Math.random() * 4); // 0 to 3
  const monthName = months[monthIdx];
  const monthNumStr = String(monthIdx + 3).padStart(2, '0');
  const dayVal = Math.floor(Math.random() * 19) + 10; // 10 to 28
  const dayNumStr = String(dayVal).padStart(2, '0');
  
  const rachelContractCode = monthNumStr + dayNumStr; // MMDD
  const rachelContractText = `${monthName} ${dayVal}, 2026`;

  // Helper for formatting time (HH:MM PM/AM and HHMM)
  const getRandomTime = (startHour, endHour, startMin, endMin) => {
    const hr = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
    const min = Math.floor(Math.random() * (endMin - startMin + 1)) + startMin;
    const hrStr = String(hr).padStart(2, '0');
    const minStr = String(min).padStart(2, '0');
    return {
      code: hrStr + minStr,
      text: `${hr}:${minStr} PM`
    };
  };

  // 2. Maya Singh RFID exit
  const mayaExit = getRandomTime(10, 10, 10, 59); // e.g. "10:35 PM" and "1035"
  
  // 3. Sarah Bennett photosoot end
  const sarahPhotoshoot = getRandomTime(9, 9, 10, 50); // e.g. "9:42 PM" and "0942"
  
  // 4. Maya Singh Spa Inventory end
  const mayaInventory = getRandomTime(10, 10, 0, 30); // e.g. "10:15 PM" and "1015"
  
  // 5. Rachel Quinn Laptop disconnect
  const rachelLaptop = getRandomTime(9, 9, 10, 50); // e.g. "9:25 PM" and "0925"
  
  // 6. Daniel Price Dock audit end
  const danielDock = getRandomTime(10, 10, 10, 45); // e.g. "10:20 PM" and "1020"

  GS.randomAlibis = {
    rachelContractCode,
    rachelContractText,
    mayaExitCode: mayaExit.code,
    mayaExitText: mayaExit.text,
    sarahPhotoshootCode: sarahPhotoshoot.code,
    sarahPhotoshootText: sarahPhotoshoot.text,
    mayaInventoryCode: mayaInventory.code,
    mayaInventoryText: mayaInventory.text,
    rachelLaptopCode: rachelLaptop.code,
    rachelLaptopText: rachelLaptop.text,
    danielDockCode: danielDock.code,
    danielDockText: danielDock.text
  };

  // Map of new roles and secrets
  const newRolesAndSecrets = {
    ceo: { role: 'Security Officer', secret: 'Covered up complaints' },
    doctor: { role: 'Psychologist', secret: 'Led experiments' },
    student: { role: 'Analyst', secret: 'Former participant' },
    musician: { role: 'Marine Biologist', secret: 'Stole project data' },
    rachel: { role: 'Lawyer', secret: 'Protected Project Echo legally' },
    comedian: { role: 'Journalist', secret: 'Competed with Kai' },
    influencer: { role: 'Investor', secret: 'Funded Echo' },
    detective: { role: 'Programmer', secret: 'Built monitoring system' },
    therapist: { role: 'Nurse', secret: 'Witnessed participant harm' },
    gamer: { role: 'Research Assistant', secret: 'Falsified records' }
  };

  // Update IDENTITIES, NPCS_BASE and CHARACTER_META with new roles and secrets
  [...IDENTITIES, ...NPCS_BASE].forEach(c => {
    const metaObj = newRolesAndSecrets[c.id];
    if (metaObj) {
      c.role = metaObj.role;
      c.secret = metaObj.secret;
    }
  });

  for (const k in CHARACTER_META) {
    const metaObj = newRolesAndSecrets[k];
    if (metaObj) {
      CHARACTER_META[k].role = metaObj.role;
      CHARACTER_META[k].secret = metaObj.secret;
    }
  }

  // Update alibi text fields in IDENTITIES & NPCS_BASE to reflect the randomized values
  const rachel = [...IDENTITIES, ...NPCS_BASE].find(c => c.id === 'rachel');
  if (rachel) {
    rachel.details = `Rachel Quinn, lawyer. Composed and professional. She signed a 6-month contract with the resort on ${rachelContractText}. She drafted the legal agreements and strict non-disclosure contracts that prevented the victims of Project Echo from suing the organization.`;
    rachel.alibi = `<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:45 PM - 10:15 PM:</strong> Drafting legal files in the resort lobby (Lobby router logs show laptop disconnected at ${rachelLaptop.text}).<br>• <strong>10:30 PM:</strong> Retired to Cabin 2.</div>`;
  }

  const therapist = [...IDENTITIES, ...NPCS_BASE].find(c => c.id === 'therapist');
  if (therapist) {
    therapist.alibi = `<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>8:30 PM - ${mayaInventory.text}:</strong> Managing first aid inventory in the Spa (RFID badge logs show exit at ${mayaExit.text}).<br>• <strong>10:30 PM:</strong> Returned to Cabin 4.</div>`;
  }

  const influencer = [...IDENTITIES, ...NPCS_BASE].find(c => c.id === 'influencer');
  if (influencer) {
    influencer.alibi = `<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>9:00 PM - ${sarahPhotoshoot.text}:</strong> VIP beach photoshoot (Beach security log shows beach lights were shut off at ${sarahPhotoshoot.text}).<br>• <strong>9:45 PM:</strong> Retired to Cabin 7.</div>`;
  }

  const gamer = [...IDENTITIES, ...NPCS_BASE].find(c => c.id === 'gamer');
  if (gamer) {
    gamer.alibi = `<div style="font-family:var(--ff-m); line-height:1.4; color:var(--text-d);">• <strong>9:00 PM - ${danielDock.text}:</strong> Auditing registries at the escape vessel dock (Dock log contains no badge scans after 8:30 PM).<br>• <strong>10:30 PM:</strong> Returned to Cabin 10.</div>`;
  }
}

// Auto-run at load
initializeRandomAlibis();
