import Phaser from "phaser";
import DialogueSystem from "../systems/DialogueSystem.js";
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

    this.dialogueSystem = new DialogueSystem(this);
    this.puzzleOverlay = null;

    EventBus.on(EVENTS.OPEN_PUZZLE, (payload) => {
      this.openPuzzleOverlay(payload?.puzzle);
    });
  }

  openPuzzleOverlay(puzzle) {
    if (this.puzzleOverlay) {
      return;
    }

    this.scene.pause("GameScene");
    EventBus.emit(EVENTS.HIDE_PROMPT);

    const overlay = this.add.container(0, 0);
    const backdrop = this.add
      .rectangle(0, 0, 800, 600, 0x0b1020, 0.85)
      .setOrigin(0, 0);
    const title = this.add.text(400, 220, "Puzzle", {
      fontFamily: "sans-serif",
      fontSize: "26px",
      color: "#f8fafc",
    });
    title.setOrigin(0.5, 0.5);
    const subtitle = this.add.text(
      400,
      260,
      `Puzzle: ${puzzle?.name || "Unknown"}`,
      {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#cbd5f5",
      },
    );
    subtitle.setOrigin(0.5, 0.5);

    const solveButton = this.add
      .text(300, 340, "Solve", {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#0f172a",
        backgroundColor: "#f8fafc",
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      })
      .setInteractive({ useHandCursor: true });

    const failButton = this.add
      .text(430, 340, "Fail", {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#0f172a",
        backgroundColor: "#f8fafc",
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      })
      .setInteractive({ useHandCursor: true });

    solveButton.on("pointerdown", () => {
      EventBus.emit(EVENTS.PUZZLE_COMPLETE, {
        success: true,
        algorithm: {
          id: puzzle?.id || "unknown",
          name: puzzle?.name || "Unknown",
          description: puzzle?.description || "",
        },
      });
      this.closePuzzleOverlay();
    });

    failButton.on("pointerdown", () => {
      EventBus.emit(EVENTS.PUZZLE_COMPLETE, {
        success: false,
        algorithm: {
          id: puzzle?.id || "unknown",
          name: puzzle?.name || "Unknown",
          description: puzzle?.description || "",
        },
      });
      this.closePuzzleOverlay();
    });

    overlay.add([backdrop, title, subtitle, solveButton, failButton]);
    this.puzzleOverlay = overlay;
  }

  closePuzzleOverlay() {
    if (!this.puzzleOverlay) {
      return;
    }
    this.puzzleOverlay.destroy(true);
    this.puzzleOverlay = null;
    this.scene.resume("GameScene");
  }
}
