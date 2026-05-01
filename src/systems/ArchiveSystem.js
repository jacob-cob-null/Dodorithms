import EventBus from "./EventBus.js";
import { EVENTS } from "./events.js";

class ArchiveSystem {
  constructor(storageKey = "dodorithmic-archive") {
    this.storageKey = storageKey;
    this.algorithms = new Map();
    this.load();

    EventBus.on(EVENTS.PUZZLE_COMPLETE, (payload) => {
      if (!payload?.success || !payload.algorithm) {
        return;
      }
      this.addAlgorithm(payload.algorithm);
      EventBus.emit(EVENTS.ALGORITHM_UNLOCKED, payload.algorithm);
    });
  }

  addAlgorithm(algorithm) {
    if (!algorithm?.id) {
      return;
    }
    this.algorithms.set(algorithm.id, algorithm);
    this.save();
  }

  getAllAlgorithms() {
    return Array.from(this.algorithms.values());
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }
      const entries = JSON.parse(raw);
      if (Array.isArray(entries)) {
        entries.forEach((item) => {
          if (item?.id) {
            this.algorithms.set(item.id, item);
          }
        });
      }
    } catch {
      // Ignore storage errors in foundation scaffold.
    }
  }

  save() {
    try {
      const entries = this.getAllAlgorithms();
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch {
      // Ignore storage errors in foundation scaffold.
    }
  }
}

const archiveSystem = new ArchiveSystem();

export default archiveSystem;
