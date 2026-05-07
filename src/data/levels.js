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
        objectType: 'interactable',
        texture: 'npc_laurenze',
        speaker: 'Laurenze',
        lines: [
          "Dodo: I want to make gift kits for my friends back home! 60 Earth-candies and 48 glowing rocks.",
          "How do I split them equally with no leftovers?",
          "Start from 48 and step down one by one — does 48 divide both? 47? Keep going until 12 does!",
          "That's the Consecutive Integer Check. Simple and reliable. Algorithm saved!",
        ],
        action: { type: 'minigame', scene: 'ConsecutiveInt', algorithm: ALGORITHMS.CONSECUTIVE_INTEGER },
      },
      {
        // ON Platform B (surface=470) — jump up again
        id: 'l1-smartphone',
        x: 1300, y: 446,
        objectType: 'interactable',
        texture: 'npc_laurenze',
        speaker: 'Laurenze',
        lines: [
          "Dodo: My phone just connected to your network! I need to hide my ZZS data from hackers!",
          "We break this security code into its prime numbers — start from 2 and work upward.",
          "Middle School Procedure. The foundation of RSA encryption. Algorithm saved!",
        ],
        action: { type: 'minigame', scene: 'MiddleSchool', algorithm: ALGORITHMS.MIDDLE_SCHOOL },
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

    // Ground surface y=552. Platforms surface = platform_y - 8.
    // Plat A: x=700,  y=430 → surface=422 → obstacle y≈408
    // Plat B: x=1450, y=390 → surface=382 → obstacle y≈368
    // Plat C: x=2150, y=430 → surface=422 → obstacle y≈408
    platforms: [
      { x: 1400, y: 568, scaleX: 43.75, scaleY: 2 }, // ground
      { x: 700,  y: 430, scaleX: 4,     scaleY: 1 }, // A
      { x: 1450, y: 390, scaleX: 4,     scaleY: 1 }, // B (higher)
      { x: 2150, y: 430, scaleX: 4,     scaleY: 1 }, // C
    ],

    parallax: [
      { type: 'stars',    scrollFactor: 0.05 },
      { type: 'cityFar',  scrollFactor: 0.20 },
      { type: 'cityNear', scrollFactor: 0.45 },
    ],

    obstacles: [
      {
        // Ground — intro near start
        id: 'l2-intro',
        x: 350, y: 524,
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
        // ON Platform A (surface=422) — first jump
        id: 'l2-fraud',
        x: 700, y: 408,
        objectType: 'interactable',
        texture: 'npc_trizy',
        speaker: 'Trizy',
        lines: [
          "Someone skipped the Earth visa fee! These logs are completely unsorted.",
          "We have to check every single entry from top to bottom until we spot the fake.",
          "No shortcuts when data is unsorted — Sequential Search!",
        ],
        action: { type: 'minigame', scene: 'SequentialSearch', algorithm: ALGORITHMS.SEQUENTIAL_SEARCH },
      },
      {
        // Ground — after jumping back down
        id: 'l2-skies',
        x: 1100, y: 524,
        objectType: 'interactable',
        texture: 'npc_trizy',
        speaker: 'Trizy',
        lines: [
          "Dodo: Is it safe to fly to the next sector? The wind readings look erratic!",
          "Assume the first reading is the highest. Scan each one — if you see bigger, that's your new peak.",
          "MaxElement — one clean pass to find the peak value!",
        ],
        action: { type: 'minigame', scene: 'MaxElement', algorithm: ALGORITHMS.MAX_ELEMENT },
      },
      {
        // ON Platform B (surface=382) — higher climb
        id: 'l2-guest-list',
        x: 1450, y: 368,
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
        // ON Platform C (surface=422) — final climb
        id: 'l2-tour',
        x: 2150, y: 408,
        objectType: 'interactable',
        texture: 'npc_trizy',
        speaker: 'Trizy',
        lines: [
          "Dodo: I want to visit Paris, Neo-Manila, New York, and Tokyo. Fastest route?",
          "To find the ABSOLUTE shortest trip we map out every possible order of those 4 cities.",
          "4 cities = 4! = 24 routes. Exhaustive Search — guaranteed optimal, but explodes with scale!",
        ],
        action: { type: 'minigame', scene: 'ExhaustiveSearch', algorithm: ALGORITHMS.EXHAUSTIVE_SEARCH },
      },
      {
        // Ground — before exit
        id: 'l2-prof-andrew',
        x: 2500, y: 524,
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
    exit: { x: 2700, y: 524 },
  },

  // ── LEVEL 3 ──────────────────────────────────────────────────────────────
  {
    id: 'level3',
    name: 'Level 3: The Bio-Research Wing',
    subtitle: 'Guide: Jacob',
    worldWidth: 2800,
    bgColor: '#061a0a',
    playerStart: { x: 120, y: 450 },

    // Ground surface y=552.
    // Plat A: x=700,  y=430 → surface=422 → obstacle y≈408
    // Plat B: x=1450, y=390 → surface=382 → obstacle y≈368  (featured)
    // Plat C: x=2100, y=430 → surface=422 → obstacle y≈408
    platforms: [
      { x: 1400, y: 568, scaleX: 43.75, scaleY: 2 },
      { x: 700,  y: 430, scaleX: 4,     scaleY: 1 },
      { x: 1450, y: 390, scaleX: 4,     scaleY: 1 },
      { x: 2100, y: 430, scaleX: 4,     scaleY: 1 },
    ],

    parallax: [
      { type: 'stars',    scrollFactor: 0.05 },
      { type: 'cityFar',  scrollFactor: 0.20 },
      { type: 'cityNear', scrollFactor: 0.45 },
    ],

    obstacles: [
      {
        // Ground — Jacob intro near start
        id: 'l3-intro',
        x: 350, y: 524,
        objectType: 'npc',
        texture: 'npc_jacob',
        speaker: 'Jacob',
        lines: [
          "Dodo! Glad you made it through the data center. Welcome to my research wing!",
          "We sort and scan biological data here. You'll need clearance to pass through.",
          "Help me organise the records and match your DNA, and we'll get you cleared!",
        ],
        action: null,
      },
      {
        // ON Platform A — Selection Sort
        id: 'l3-selection',
        x: 700, y: 408,
        objectType: 'interactable',
        texture: 'npc_jacob',
        speaker: 'Jacob',
        lines: [
          "These patient severity scores are all over the place. We need them sorted!",
          "Each round: scan the unsorted half, find the minimum, and swap it to the front.",
          "That's Selection Sort — simple, reliable, always O(n²).",
        ],
        action: { type: 'minigame', scene: 'SelectionSort', algorithm: ALGORITHMS.SELECTION_SORT },
      },
      {
        // Ground — Bubble Sort
        id: 'l3-bubble',
        x: 1100, y: 524,
        objectType: 'interactable',
        texture: 'npc_jacob',
        speaker: 'Jacob',
        lines: [
          "Now these specimen containers need sorting before I can run them through the centrifuge.",
          "Compare each neighbouring pair — if left is bigger, swap them. Bigger values bubble up to the end.",
          "Bubble Sort — lots of swaps, but it stops early if the list is already tidy!",
        ],
        action: { type: 'minigame', scene: 'BubbleSort', algorithm: ALGORITHMS.BUBBLE_SORT },
      },
      {
        // ON Platform B (higher) — BiologicalClearance featured minigame
        id: 'l3-bio-clearance',
        x: 1450, y: 368,
        objectType: 'interactable',
        texture: 'npc_jacob',
        speaker: 'Jacob',
        lines: [
          "Last step — Dodo, the scanner needs to verify your DNA against our records.",
          "We slide your short sequence across the long sample, comparing character by character.",
          "When every character aligns, that's a match. Brute-Force String Matching!",
        ],
        action: { type: 'minigame', scene: 'BiologicalClearance', algorithm: ALGORITHMS.BRUTE_FORCE_STRING },
      },
      {
        // ON Platform C — Prof. Andrew closing
        id: 'l3-prof-andrew',
        x: 2100, y: 408,
        objectType: 'npc',
        texture: 'npc_professor',
        speaker: 'Prof. Andrew',
        lines: [
          "Nicely done, Dodo! Selection and Bubble sort are your first O(n²) sorting algorithms.",
          "Both compare every pair you can make — the work grows with the square of the input.",
          "And string matching by brute force? Slide and compare. Slow, but guaranteed correct.",
          "There are faster ways to sort and to search text — we'll get to them soon!",
        ],
        action: null,
      },
    ],
    exit: { x: 2700, y: 524 },
  },

  // ── LEVEL 4 ──────────────────────────────────────────────────────────────
  {
    id: 'level4',
    name: 'Level 4: The HyperTrain Terminal',
    subtitle: 'Guide: Kyla',
    worldWidth: 2800,
    bgColor: '#0d0a1f',
    playerStart: { x: 120, y: 450 },

    platforms: [
      { x: 1400, y: 568, scaleX: 43.75, scaleY: 2 },
      { x: 700,  y: 430, scaleX: 4,     scaleY: 1 },
      { x: 1450, y: 390, scaleX: 4,     scaleY: 1 },
      { x: 2100, y: 430, scaleX: 4,     scaleY: 1 },
    ],

    parallax: [
      { type: 'stars',    scrollFactor: 0.05 },
      { type: 'cityFar',  scrollFactor: 0.20 },
      { type: 'cityNear', scrollFactor: 0.45 },
    ],

    obstacles: [
      {
        id: 'l4-intro',
        x: 350, y: 524,
        objectType: 'npc',
        texture: 'npc_kyla',
        speaker: 'Kyla',
        lines: [
          "Dodo! Welcome to the HyperTrain terminal — I've been waiting for you.",
          "We have three trains to catch and I need your algorithmic brain to sort the tickets and navigate the network.",
          "Let's get moving before we miss the first departure!",
        ],
        action: null,
      },
      {
        id: 'l4-insertion',
        x: 700, y: 408,
        objectType: 'interactable',
        texture: 'npc_kyla',
        speaker: 'Kyla',
        lines: [
          "These departure times are out of order — we need to sort the tickets fast!",
          "Take each new ticket and slide it left until it's in the right spot among the sorted ones.",
          "Insertion Sort — great for small or nearly-sorted lists!",
        ],
        action: { type: 'minigame', scene: 'InsertionSort', algorithm: ALGORITHMS.INSERTION_SORT },
      },
      {
        id: 'l4-dfs',
        x: 1100, y: 524,
        objectType: 'interactable',
        texture: 'npc_kyla',
        speaker: 'Kyla',
        lines: [
          "The maintenance tunnels have multiple paths — but most are dead ends!",
          "Depth-First Search: go as deep as you can, backtrack when you hit a dead end.",
          "DFS uses a stack — last in, first out. Not the shortest path, but it finds a path!",
        ],
        action: { type: 'minigame', scene: 'DFS', algorithm: ALGORITHMS.DFS },
      },
      {
        id: 'l4-hypertrain',
        x: 1450, y: 368,
        objectType: 'interactable',
        texture: 'npc_kyla',
        speaker: 'Kyla',
        lines: [
          "The main network — six stations, one destination. We need the SHORTEST route!",
          "BFS spreads out like a wave — all stations one hop away before two hops, two before three.",
          "BFS guarantees the shortest path. That's the HyperTrain way!",
        ],
        action: { type: 'minigame', scene: 'HyperTrain', algorithm: ALGORITHMS.BFS },
      },
      {
        id: 'l4-prof-andrew',
        x: 2100, y: 408,
        objectType: 'npc',
        texture: 'npc_professor',
        speaker: 'Prof. Andrew',
        lines: [
          "Excellent work navigating the terminal, Dodo!",
          "Insertion Sort is elegant — each card slots into place, just like a hand of cards.",
          "DFS and BFS are the two fundamental graph traversal strategies.",
          "DFS dives deep with a stack; BFS fans out with a queue. Different tools for different problems!",
        ],
        action: null,
      },
    ],
    exit: { x: 2700, y: 524 },
  },

  // ── LEVEL 5 ──────────────────────────────────────────────────────────────
  {
    id: 'level5',
    name: 'Level 5: The Intergalactic Census',
    subtitle: 'Guides: All',
    worldWidth: 3200,
    bgColor: '#050b18',
    playerStart: { x: 120, y: 450 },

    // 4 elevated platforms to spread out 4 algorithm obstacles
    // Plat A: x=650,  y=430 → surface=422 → obs y≈408
    // Plat B: x=1300, y=390 → surface=382 → obs y≈368  (binary search)
    // Plat C: x=1950, y=430 → surface=422 → obs y≈408
    // Plat D: x=2600, y=370 → surface=362 → obs y≈348  (featured merge sort)
    platforms: [
      { x: 1600, y: 568, scaleX: 50,    scaleY: 2 },
      { x: 650,  y: 430, scaleX: 4,     scaleY: 1 },
      { x: 1300, y: 390, scaleX: 4,     scaleY: 1 },
      { x: 1950, y: 430, scaleX: 4,     scaleY: 1 },
      { x: 2600, y: 370, scaleX: 4,     scaleY: 1 },
    ],

    parallax: [
      { type: 'stars', scrollFactor: 0.02 },
      { type: 'stars', scrollFactor: 0.12 },
    ],

    obstacles: [
      {
        id: 'l5-intro',
        x: 350, y: 524,
        objectType: 'npc',
        texture: 'npc_laurenze',
        speaker: 'Laurenze',
        lines: [
          "Dodo! We've all been waiting — Trizy, Jacob, Kyla and I.",
          "The Intergalactic Census Bureau needs help. They're drowning in unsorted alien data.",
          "Four algorithms to master here — searching and sorting at scale. Let's go!",
        ],
        action: null,
      },
      {
        id: 'l5-binary',
        x: 650, y: 408,
        objectType: 'interactable',
        texture: 'npc_trizy',
        speaker: 'Trizy',
        lines: [
          "The star registry is sorted — we can exploit that!",
          "Binary search: check the middle, cut the range in half, repeat.",
          "O(log n) — 10 elements needs at most 4 checks. One million? Just 20!",
        ],
        action: { type: 'minigame', scene: 'BinarySearch', algorithm: ALGORITHMS.BINARY_SEARCH },
      },
      {
        id: 'l5-interpolation',
        x: 1300, y: 368,
        objectType: 'interactable',
        texture: 'npc_jacob',
        speaker: 'Jacob',
        lines: [
          "Binary search always checks the middle. But what if we're smarter?",
          "If the data is evenly spread, we can estimate WHERE the value likely is.",
          "Interpolation Search — like guessing a page in a dictionary instead of opening the middle!",
        ],
        action: { type: 'minigame', scene: 'InterpolationSearch', algorithm: ALGORITHMS.INTERPOLATION_SEARCH },
      },
      {
        id: 'l5-quicksort',
        x: 1950, y: 408,
        objectType: 'interactable',
        texture: 'npc_kyla',
        speaker: 'Kyla',
        lines: [
          "This cargo manifest is a mess. We need it sorted FAST.",
          "Pick any element as the pivot — everything smaller goes left, larger goes right.",
          "Quicksort! Each pivot lands in its final position. O(n log n) on average.",
        ],
        action: { type: 'minigame', scene: 'QuickSort', algorithm: ALGORITHMS.QUICKSORT },
      },
      {
        id: 'l5-census',
        x: 2600, y: 348,
        objectType: 'interactable',
        texture: 'npc_laurenze',
        speaker: 'Laurenze',
        lines: [
          "Two star systems sent us their census data — each already sorted!",
          "We merge them: compare the front of each list, take the smaller, repeat.",
          "Merge Sort — O(n log n) guaranteed, never has a bad day unlike Quicksort!",
        ],
        action: { type: 'minigame', scene: 'IntergalacticCensus', algorithm: ALGORITHMS.MERGE_SORT },
      },
      {
        id: 'l5-prof-andrew',
        x: 2950, y: 524,
        objectType: 'npc',
        texture: 'npc_professor',
        speaker: 'Prof. Andrew',
        lines: [
          "You've now seen the O(log n) searching algorithms — binary and interpolation.",
          "And the O(n log n) sorting giants — Quicksort and Merge Sort.",
          "Binary search needs sorted data. Quicksort is fast in practice. Merge Sort never degrades.",
          "Understanding these trade-offs — THAT is the heart of algorithm design!",
        ],
        action: null,
      },
    ],
    exit: { x: 3100, y: 524 },
  },
];
