import Phaser from "phaser";
import EventBus from "../systems/EventBus.js";
import { EVENTS } from "../systems/events.js";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    this.add.text(16, 580, "UI scene online", {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#94a3b8",
    });

    this.promptText = this.add
      .text(16, 548, "", {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#fbbf24",
      })
      .setVisible(false);

    EventBus.on(EVENTS.SHOW_PROMPT, (payload) => {
      if (!payload) {
        return;
      }
      this.promptText.setText(payload.text || "Press E");
      this.promptText.setVisible(true);
    });

    EventBus.on(EVENTS.HIDE_PROMPT, () => {
      this.promptText.setVisible(false);
    });

    EventBus.on(EVENTS.START_DIALOGUE, () => {
      this.promptText.setText("Dialogue started");
      this.promptText.setVisible(true);
    });
  }
}
