import Phaser from "phaser";
import DialogueSystem from "../systems/DialogueSystem.js";
import archiveSystem from "../systems/ArchiveSystem.js";
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
    this.unlockCard = null;
    this.inventoryOverlay = null;
    this.inventoryListText = null;

    this.createInventoryButton();

    EventBus.on(EVENTS.OPEN_PUZZLE, (payload) => {
      this.openPuzzleOverlay(payload?.puzzle);
    });

    EventBus.on(EVENTS.ALGORITHM_UNLOCKED, (algorithm) => {
      this.showAlgorithmUnlocked(algorithm);
      if (this.inventoryOverlay) {
        this.renderInventoryList();
      }
    });
  }

  createInventoryButton() {
    this.inventoryButton = this.add
      .text(760, 18, "Archive", {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#0f172a",
        backgroundColor: "#f8fafc",
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    this.inventoryButton.on("pointerdown", () => {
      this.toggleInventory();
    });
  }

  toggleInventory() {
    if (this.inventoryOverlay) {
      this.closeInventory();
    } else {
      this.openInventory();
    }
  }

  openInventory() {
    if (this.inventoryOverlay) {
      return;
    }

    const overlay = this.add.container(0, 0);
    const backdrop = this.add
      .rectangle(0, 0, 800, 600, 0x0b1020, 0.85)
      .setOrigin(0, 0);
    const panel = this.add
      .rectangle(400, 300, 520, 380, 0x1e293b, 0.95)
      .setStrokeStyle(2, 0x38bdf8, 1);
    const title = this.add.text(400, 140, "Algorithm Archive", {
      fontFamily: "sans-serif",
      fontSize: "22px",
      color: "#f8fafc",
    });
    title.setOrigin(0.5, 0.5);

    this.inventoryListText = this.add.text(180, 190, "", {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#e2e8f0",
      lineSpacing: 6,
      wordWrap: { width: 440 },
    });

    const closeHint = this.add.text(400, 450, "Click to close", {
      fontFamily: "sans-serif",
      fontSize: "14px",
      color: "#94a3b8",
    });
    closeHint.setOrigin(0.5, 0.5);

    overlay.add([backdrop, panel, title, this.inventoryListText, closeHint]);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 800, 600),
      Phaser.Geom.Rectangle.Contains,
    );
    overlay.on("pointerdown", () => this.closeInventory());

    this.inventoryOverlay = overlay;
    this.renderInventoryList();
  }

  closeInventory() {
    if (!this.inventoryOverlay) {
      return;
    }
    this.inventoryOverlay.destroy(true);
    this.inventoryOverlay = null;
    this.inventoryListText = null;
  }

  renderInventoryList() {
    if (!this.inventoryListText) {
      return;
    }
    const algorithms = archiveSystem.getAllAlgorithms();
    if (!algorithms.length) {
      this.inventoryListText.setText("No algorithms unlocked yet.");
      return;
    }

    const lines = algorithms.map((algo, index) => {
      const label = algo?.name || "Unknown";
      return `${index + 1}. ${label}`;
    });
    this.inventoryListText.setText(lines.join("\n"));
  }

  openPuzzleOverlay(puzzle) {
    if (this.puzzleOverlay) {
      return;
    }

    if (this.inventoryOverlay) {
      this.closeInventory();
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

  showAlgorithmUnlocked(algorithm) {
    if (this.unlockCard) {
      this.unlockCard.destroy(true);
      this.unlockCard = null;
    }

    const card = this.add.container(0, 0);
    const panel = this.add
      .rectangle(400, 160, 420, 120, 0x1e293b, 0.95)
      .setStrokeStyle(2, 0x38bdf8, 1);
    const title = this.add.text(400, 140, "Algorithm Unlocked", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#e2e8f0",
    });
    title.setOrigin(0.5, 0.5);
    const name = this.add.text(400, 175, algorithm?.name || "Unknown", {
      fontFamily: "sans-serif",
      fontSize: "22px",
      color: "#f8fafc",
    });
    name.setOrigin(0.5, 0.5);

    card.add([panel, title, name]);
    card.setAlpha(0);
    card.y = -10;

    this.tweens.add({
      targets: card,
      alpha: 1,
      y: 0,
      duration: 250,
      ease: "Sine.Out",
    });

    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: card,
        alpha: 0,
        y: -10,
        duration: 250,
        ease: "Sine.In",
        onComplete: () => {
          card.destroy(true);
          if (this.unlockCard === card) {
            this.unlockCard = null;
          }
        },
      });
    });

    this.unlockCard = card;
  }
}
