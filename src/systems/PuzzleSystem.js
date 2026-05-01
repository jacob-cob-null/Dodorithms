import EventBus from "./EventBus.js";
import { EVENTS } from "./events.js";

export class Puzzle {
  constructor({ id, name, description } = {}) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  start() {}

  checkSolution() {
    return false;
  }

  end() {}
}

export default class PuzzleSystem {
  constructor() {
    this.activePuzzle = null;
  }

  launch(puzzle) {
    if (!puzzle) {
      return;
    }
    this.activePuzzle = puzzle;
    puzzle.start?.();
    EventBus.emit(EVENTS.OPEN_PUZZLE, { puzzle });
  }
}
