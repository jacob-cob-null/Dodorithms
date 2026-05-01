import EventBus from "../systems/EventBus.js";
import { EVENTS } from "../systems/events.js";
import Interactable from "./Interactable.js";

export default class NPC extends Interactable {
  constructor(scene, x, y, { id = "npc-1", lines = [] } = {}) {
    super(scene, x, y, "npc", {
      id,
      type: "dialogue",
      data: { lines },
      onInteract: () => EventBus.emit(EVENTS.START_DIALOGUE, { lines }),
    });
  }
}
