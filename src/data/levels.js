import { ALGORITHMS } from './algorithms.js';

export const LEVELS = [
  {
    id: 'level1',
    name: 'Level 1: The Arrival',
    subtitle: 'Guide: Laurenze',
    worldWidth: 2600,
    bgColor: '#060d17',
    playerStart: { x: 120, y: 450 },

    // Ground surface y=552. Max jump height ~90px → reachable platform surface ≥ 462.
    // Platform surface = platform_y - 8 (scaleY=1 → half height=8).
    platforms: [
      { x: 1300, y: 568, scaleX: 40.625, scaleY: 2 }, // ground (full width)
      { x: 650,  y: 483, scaleX: 4.5,    scaleY: 1 }, // A: surface=475, spans ~506–794
      { x: 1300, y: 478, scaleX: 5,      scaleY: 1 }, // B: surface=470, spans ~140–1460
      { x: 1980, y: 483, scaleX: 4.5,    scaleY: 1 }, // C: surface=475, spans ~1836–2124
    ],

    // Parallax background layers (drawn back-to-front by GameScene)
    parallax: [
      { type: 'stars',    scrollFactor: 0.05 },
      { type: 'cityFar',  scrollFactor: 0.20 },
      { type: 'cityNear', scrollFactor: 0.45 },
    ],

    obstacles: [
      {
        // Ground — first thing Dodo sees
        id: 'l1-intro',
        x: 380, y: 528,
        objectType: 'npc',
        texture: 'npc_laurenze',
        speaker: 'Laurenze',
        lines: [
          "Whoa! You're from ZZS, aren't you? I'm Laurenze. Welcome to Earth!",
          "Looks like your landing pad got wrecked. Let's fix that before the city fines us.",
          "Jump up to that platform ahead — that's where the broken pad is!",
        ],
        action: null,
      },
      {
        // ON Platform A (surface=475) — Dodo must jump up to reach it
        id: 'l1-shattered-pad',
        x: 650, y: 461,
        objectType: 'interactable',
        texture: 'interactable',
        speaker: 'Laurenze',
        lines: [
          "We need square smart-tiles to fill this rectangular landing pad — no cutting allowed!",
          "Find the BIGGEST tile size that divides both the length AND the width evenly.",
          "It runs in O(log n) time — even for a massive pad, we get the answer almost instantly!",
        ],
        action: { type: 'minigame', scene: 'ShatteredPad', algorithm: ALGORITHMS.EUCLID },
      },
      {
        // Ground — after jumping back down
        id: 'l1-souvenirs',
        x: 1050, y: 528,
        objectType: 'npc',
        texture: 'npc_laurenze',
        speaker: 'Laurenze',
        lines: [
          "Dodo: I want to make gift kits for my friends back home! 60 Earth-candies and 48 glowing rocks.",
          "How do I split them equally with no leftovers?",
          "Start from 48 and step down one by one — does 48 divide both? 47? Keep going until 12 does!",
          "That's the Consecutive Integer Check. Simple and reliable. Algorithm saved!",
        ],
        action: { type: 'unlock', algorithm: ALGORITHMS.CONSECUTIVE_INTEGER },
      },
      {
        // ON Platform B (surface=470) — jump up again
        id: 'l1-smartphone',
        x: 1300, y: 446,
        objectType: 'npc',
        texture: 'npc_laurenze',
        speaker: 'Laurenze',
        lines: [
          "Dodo: My phone just connected to your network! I need to hide my ZZS data from hackers!",
          "We break this security code into its prime numbers — start from 2 and work upward.",
          "Middle School Procedure. The foundation of RSA encryption. Algorithm saved!",
        ],
        action: { type: 'unlock', algorithm: ALGORITHMS.MIDDLE_SCHOOL },
      },
      {
        // ON Platform C (surface=475) — final climb before exit
        id: 'l1-prof-andrew',
        x: 1980, y: 451,
        objectType: 'npc',
        texture: 'npc_professor',
        speaker: 'Prof. Andrew',
        lines: [
          "Fascinating work! You've just experienced the bedrock of computational thinking.",
          "Euclid's Algorithm found your GCD in O(log n) — mathematically elegant!",
          "The Consecutive Integer Check handled distribution, and the Middle School Procedure secured comms.",
          "Head to the exit portal — the Command Center awaits!",
        ],
        action: null,
      },
    ],

    // Ground — drop down from Platform C to exit
    exit: { x: 2350, y: 528 },
  },

  {
    id: 'level2',
    name: 'Level 2: The Command Center',
    subtitle: 'Guide: Trizy',
    worldWidth: 2800,
    bgColor: '#0a1628',
    playerStart: { x: 120, y: 450 },
    platforms: [
      { x: 1400, y: 568, scaleX: 43.75, scaleY: 2 },
      { x: 700,  y: 430, scaleX: 4, scaleY: 1 },
      { x: 1450, y: 390, scaleX: 4, scaleY: 1 },
      { x: 2150, y: 430, scaleX: 4, scaleY: 1 },
    ],
    obstacles: [
      {
        id: 'l2-intro',
        x: 350, y: 520,
        objectType: 'npc',
        texture: 'npc_trizy',
        speaker: 'Trizy',
        lines: [
          "Hey Laurenze! And... wow, an actual dragon. Nice to meet you, Dodo.",
          "I could really use an extra pair of claws — the data center is a complete mess!",
        ],
        action: null,
      },
      {
        id: 'l2-fraud',
        x: 750, y: 520,
        objectType: 'npc',
        texture: 'npc_trizy',
        speaker: 'Trizy',
        lines: [
          "Someone skipped the Earth visa fee! These logs are completely unsorted.",
          "We have to check every single entry from top to bottom until we spot the fake.",
          "No shortcuts when data is unsorted — Sequential Search. O(n) worst case. Algorithm saved!",
        ],
        action: { type: 'unlock', algorithm: ALGORITHMS.SEQUENTIAL_SEARCH },
      },
      {
        id: 'l2-skies',
        x: 1200, y: 520,
        objectType: 'npc',
        texture: 'npc_trizy',
        speaker: 'Trizy',
        lines: [
          "Dodo: Is it safe to fly to the next sector? The wind readings look erratic!",
          "Assume the first reading is the highest. Scan each one — if you see bigger, that's your new peak.",
          "MaxElement. One clean pass to find the peak value. Algorithm saved!",
        ],
        action: { type: 'unlock', algorithm: ALGORITHMS.MAX_ELEMENT },
      },
      {
        id: 'l2-guest-list',
        x: 1650, y: 520,
        objectType: 'interactable',
        texture: 'interactable',
        speaker: 'Trizy',
        lines: [
          "The tour registration glitched — it's doubling up members!",
          "We compare every single name against every other name to clear out the clones.",
          "Fair warning, Dodo: this is an O(n²) process. Watch how comparisons explode!",
        ],
        action: { type: 'minigame', scene: 'GuestList', algorithm: ALGORITHMS.UNIQUE_ELEMENTS },
      },
      {
        id: 'l2-tour',
        x: 2050, y: 520,
        objectType: 'npc',
        texture: 'npc_trizy',
        speaker: 'Trizy',
        lines: [
          "Dodo: I want to visit Paris, Neo-Manila, New York, and Tokyo. Fastest route?",
          "To find the ABSOLUTE shortest trip we map out every possible order of those 4 cities.",
          "4 cities = 4! = 24 routes. Exhaustive Search — guaranteed optimal, but it explodes with scale. Algorithm saved!",
        ],
        action: { type: 'unlock', algorithm: ALGORITHMS.EXHAUSTIVE_SEARCH },
      },
      {
        id: 'l2-prof-andrew',
        x: 2450, y: 520,
        objectType: 'npc',
        texture: 'npc_professor',
        speaker: 'Prof. Andrew',
        lines: [
          "A bit tedious, wasn't it? That's the nature of unsorted data!",
          "Sequential Search has no shortcut without order. MaxElement finds peaks in a single sweep.",
          "That guest list showed the O(n²) danger — and routing 4 cities means 24 permutations!",
          "Some problems grow so massive even our best computers struggle. Onwards!",
        ],
        action: null,
      },
    ],
    exit: { x: 2700, y: 520 },
  },
];
