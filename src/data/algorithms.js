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
};
