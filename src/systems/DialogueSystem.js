import Phaser from "phaser";
import EventBus from "./EventBus.js";
import { EVENTS } from "./events.js";

export default class DialogueSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.lines = [];
    this.index = 0;

    this.promptText = scene.add
      .text(16, 548, "", {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#fbbf24",
      })
      .setVisible(false);

    this.dialogueBg = scene.add
      .rectangle(400, 520, 760, 140, 0x0f172a, 0.9)
      .setStrokeStyle(2, 0x334155, 1)
      .setVisible(false);

    this.dialogueText = scene.add
      .text(40, 470, "", {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#e2e8f0",
        wordWrap: { width: 720 },
      })
      .setVisible(false);

    this.enterKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );

    EventBus.on(EVENTS.SHOW_PROMPT, (payload) => {
      if (this.active || !payload) {
        return;
      }
      this.promptText.setText(payload.text || "Press E");
      this.promptText.setVisible(true);
    });

    EventBus.on(EVENTS.HIDE_PROMPT, () => {
      this.promptText.setVisible(false);
    });

    EventBus.on(EVENTS.START_DIALOGUE, (payload) => {
      if (!payload?.lines?.length) {
        return;
      }
      this.startDialogue(payload.lines);
    });

    scene.events.on("update", this.update, this);
  }

  startDialogue(lines) {
    this.active = true;
    this.lines = lines;
    this.index = 0;
    this.promptText.setVisible(false);

    this.dialogueBg.setVisible(true);
    this.dialogueText.setVisible(true);
    this.dialogueText.setText(this.lines[this.index]);
  }

  endDialogue() {
    this.active = false;
    this.lines = [];
    this.index = 0;
    this.dialogueBg.setVisible(false);
    this.dialogueText.setVisible(false);
    EventBus.emit(EVENTS.END_DIALOGUE);
  }

  update() {
    if (!this.active) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.index += 1;
      if (this.index >= this.lines.length) {
        this.endDialogue();
      } else {
        this.dialogueText.setText(this.lines[this.index]);
      }
    }
  }
}
