import Phaser from "phaser";
import EventBus from "./EventBus.js";
import { EVENTS } from "./events.js";

export default class InteractionSystem {
  constructor(scene, player, radius = 70) {
    this.scene = scene;
    this.player = player;
    this.radius = radius;
    this.interactables = [];
    this.currentTarget = null;
    this.interactKey = scene.input.keyboard.addKey("E");
  }

  register(interactable) {
    this.interactables.push(interactable);
  }

  update() {
    const target = this.findNearest();

    if (target !== this.currentTarget) {
      if (target) {
        EventBus.emit(EVENTS.SHOW_PROMPT, {
          x: target.x,
          y: target.y - 40,
          text: "Press E",
        });
      } else {
        EventBus.emit(EVENTS.HIDE_PROMPT);
      }
      this.currentTarget = target;
    }

    if (target && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      target.onInteract?.();
    }
  }

  findNearest() {
    let nearest = null;
    let nearestDistance = this.radius;

    for (const interactable of this.interactables) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        interactable.x,
        interactable.y,
      );

      if (distance <= nearestDistance) {
        nearestDistance = distance;
        nearest = interactable;
      }
    }

    return nearest;
  }
}
