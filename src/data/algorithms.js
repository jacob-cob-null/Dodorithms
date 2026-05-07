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
};
