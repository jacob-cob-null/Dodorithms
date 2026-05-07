export const ALGORITHMS = {
  EUCLID: {
    id: 'euclid',
    name: "Euclid's Algorithm",
    description: "Find the GCD of two numbers in O(log n) time.",
  },
  CONSECUTIVE_INTEGER: {
    id: 'consecutive-integer',
    name: 'Consecutive Integer Check',
    description: 'Find GCD by checking integers in decreasing order.',
  },
  MIDDLE_SCHOOL: {
    id: 'middle-school',
    name: 'Middle School Procedure',
    description: 'Find prime factors by dividing from 2 upward.',
  },
  SEQUENTIAL_SEARCH: {
    id: 'sequential-search',
    name: 'Sequential Search',
    description: 'Check every item in an unsorted list one by one. O(n).',
  },
  MAX_ELEMENT: {
    id: 'max-element',
    name: 'MaxElement',
    description: 'Track the running maximum while scanning a list.',
  },
  UNIQUE_ELEMENTS: {
    id: 'unique-elements',
    name: 'UniqueElements',
    description: 'Compare every element against every other to find duplicates. O(n²).',
  },
  EXHAUSTIVE_SEARCH: {
    id: 'exhaustive-search',
    name: 'Exhaustive Search',
    description: 'Try all n! permutations to guarantee the optimal solution.',
  },

  // ── Level 3 ─────────────────────────────────────────────────────────────
  SELECTION_SORT: {
    id: 'selection-sort',
    name: 'Selection Sort',
    description: 'Repeatedly select the minimum and place it in sorted position. O(n²).',
  },
  BUBBLE_SORT: {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    description: 'Swap adjacent out-of-order pairs until no swaps remain. O(n²).',
  },
  BRUTE_FORCE_STRING: {
    id: 'brute-force-string',
    name: 'Brute-Force String Matching',
    description: 'Slide the pattern across the text, comparing character by character.',
  },

  // ── Level 4 ─────────────────────────────────────────────────────────────
  INSERTION_SORT: {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    description: 'Take each unsorted element and insert it into the correct sorted position.',
  },
  DFS: {
    id: 'dfs',
    name: 'Depth-First Search',
    description: 'Explore as deep as possible down each branch before backtracking.',
  },
  BFS: {
    id: 'bfs',
    name: 'Breadth-First Search',
    description: 'Explore all neighbours at the current depth before going deeper. Guarantees shortest path.',
  },

  // ── Level 5 ─────────────────────────────────────────────────────────────
  BINARY_SEARCH: {
    id: 'binary-search',
    name: 'Binary Search',
    description: 'Halve the search range each step by checking the midpoint. O(log n).',
  },
  INTERPOLATION_SEARCH: {
    id: 'interpolation-search',
    name: 'Interpolation Search',
    description: 'Estimate position by value distribution. Faster than binary on uniform data.',
  },
  QUICKSORT: {
    id: 'quicksort',
    name: 'Quicksort',
    description: 'Pick a pivot, partition around it, recursively sort sub-arrays. O(n log n) average.',
  },
  MERGE_SORT: {
    id: 'merge-sort',
    name: 'Merge Sort',
    description: 'Split, sort halves, merge back. Guaranteed O(n log n) — stable and predictable.',
  },

  // ── Level 6 ─────────────────────────────────────────────────────────────
  PRIORITY_QUEUE: {
    id: 'priority-queue',
    name: 'Priority Queue / Heap',
    description: 'Always extract the highest-priority element in O(log n) using a max-heap.',
  },
  PRESORT: {
    id: 'presort',
    name: 'PreSorting',
    description: 'Sort data once as preprocessing so every subsequent search is O(log n).',
  },
  CHANGE_MAKING: {
    id: 'change-making',
    name: 'Change-Making (DP)',
    description: 'Find the minimum number of coins for a target using dynamic programming.',
  },
  KNAPSACK: {
    id: 'knapsack',
    name: '0/1 Knapsack',
    description: 'Select items to maximise value within a weight limit using a DP table.',
  },

  // ── Level 7 ─────────────────────────────────────────────────────────────
  KRUSKAL_PRIM: {
    id: 'kruskal-prim',
    name: "Kruskal's / Prim's",
    description: 'Build a Minimum Spanning Tree connecting all nodes with the lowest total edge weight.',
  },
  HUFFMAN: {
    id: 'huffman',
    name: 'Huffman Coding',
    description: 'Greedy data compression: assign shortest bit-codes to the most-frequent characters.',
  },
  DIJKSTRA: {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    description: 'Find the shortest path in a weighted graph by always expanding the nearest unvisited node.',
  },

  // ── Level 8 ─────────────────────────────────────────────────────────────
  BACKTRACKING: {
    id: 'backtracking',
    name: 'Backtracking',
    description: 'Build solutions one step at a time; abandon paths that cannot lead to a valid answer.',
  },
  BRANCH_AND_BOUND: {
    id: 'branch-and-bound',
    name: 'Branch-and-Bound',
    description: "Optimize by pruning branches whose best-possible cost can't beat the current best solution.",
  },
  COMPLEXITY_THEORY: {
    id: 'complexity-theory',
    name: 'Complexity Theory (P/NP)',
    description: 'Classify problems by difficulty: P (efficiently solvable), NP (efficiently verifiable), NP-Complete.',
  },
};
