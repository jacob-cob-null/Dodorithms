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
    this.inventoryPageText = null;
    this.inventoryPrevButton = null;
    this.inventoryNextButton = null;
    this.inventoryPage = 0;
    this.inventoryPageSize = 5;
    this.checklistOverlay = null;

    this.createTopButtons();

    EventBus.on(EVENTS.OPEN_PUZZLE, (payload) => {
      this.openPuzzleOverlay(payload?.puzzle);
    });

    EventBus.on(EVENTS.ALGORITHM_UNLOCKED, (algorithm) => {
      this.showAlgorithmUnlocked(algorithm);
      if (this.inventoryOverlay) {
        this.renderInventoryList();
      }
      this.pulseButton(this.inventoryButton);
    });
  }

  createTopButtons() {
    this.inventoryButton = this.createButton(760, 18, "Archive", {
      align: "right",
    });
    this.inventoryButton.on("pointerdown", () => this.toggleInventory());

    this.checklistButton = this.createButton(670, 18, "Checklist", {
      align: "right",
    });
    this.checklistButton.on("pointerdown", () => this.toggleChecklist());
  }

  createButton(x, y, label, { align = "left" } = {}) {
    const button = this.add
      .text(x, y, label, {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#0f172a",
        backgroundColor: "#f8fafc",
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      })
      .setOrigin(align === "right" ? 1 : 0, 0)
      .setInteractive({ useHandCursor: true });

    button.on("pointerover", () => {
      button.setStyle({ backgroundColor: "#38bdf8", color: "#0b1020" });
    });

    button.on("pointerout", () => {
      button.setStyle({ backgroundColor: "#f8fafc", color: "#0f172a" });
    });

    return button;
  }

  pulseButton(button) {
    if (!button) {
      return;
    }
    this.tweens.add({
      targets: button,
      scale: 1.08,
      duration: 120,
      yoyo: true,
      ease: "Sine.Out",
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

    if (this.checklistOverlay) {
      this.closeChecklist();
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

    const subtitle = this.add.text(400, 165, "Unlocked algorithms", {
      fontFamily: "sans-serif",
      fontSize: "14px",
      color: "#94a3b8",
    });
    subtitle.setOrigin(0.5, 0.5);

    this.inventoryListText = this.add.text(180, 200, "", {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#e2e8f0",
      lineSpacing: 8,
      wordWrap: { width: 440 },
    });

    this.inventoryPageText = this.add.text(400, 430, "", {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#94a3b8",
    });
    this.inventoryPageText.setOrigin(0.5, 0.5);

    this.inventoryPrevButton = this.createButton(290, 440, "Prev");
    this.inventoryNextButton = this.createButton(510, 440, "Next");
    this.inventoryPrevButton.on("pointerdown", () => {
      this.inventoryPage -= 1;
      this.renderInventoryList();
    });
    this.inventoryNextButton.on("pointerdown", () => {
      this.inventoryPage += 1;
      this.renderInventoryList();
    });

    const closeButton = this.createButton(610, 120, "Close");
    closeButton.on("pointerdown", () => this.closeInventory());

    const closeHint = this.add.text(400, 450, "Click to close", {
      fontFamily: "sans-serif",
      fontSize: "14px",
      color: "#94a3b8",
    });
    closeHint.setOrigin(0.5, 0.5);

    overlay.add([
      backdrop,
      panel,
      title,
      subtitle,
      this.inventoryListText,
      this.inventoryPageText,
      this.inventoryPrevButton,
      this.inventoryNextButton,
      closeButton,
      closeHint,
    ]);
    backdrop.setInteractive({ useHandCursor: true });
    backdrop.on("pointerdown", () => this.closeInventory());

    overlay.setAlpha(0);
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 160,
      ease: "Sine.Out",
    });

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
    this.inventoryPageText = null;
    this.inventoryPrevButton = null;
    this.inventoryNextButton = null;
  }

  renderInventoryList() {
    if (!this.inventoryListText) {
      return;
    }
    const algorithms = archiveSystem.getAllAlgorithms();
    if (!algorithms.length) {
      this.inventoryListText.setText("No algorithms unlocked yet.");
      if (this.inventoryPageText) {
        this.inventoryPageText.setText("Page 0 of 0");
      }
      if (this.inventoryPrevButton) {
        this.inventoryPrevButton.setVisible(false);
      }
      if (this.inventoryNextButton) {
        this.inventoryNextButton.setVisible(false);
      }
      return;
    }

    const totalPages = Math.max(
      1,
      Math.ceil(algorithms.length / this.inventoryPageSize),
    );
    this.inventoryPage = Phaser.Math.Clamp(
      this.inventoryPage,
      0,
      totalPages - 1,
    );
    const start = this.inventoryPage * this.inventoryPageSize;
    const end = start + this.inventoryPageSize;
    const pageItems = algorithms.slice(start, end);

    const lines = pageItems.map((algo, index) => {
      const label = algo?.name || "Unknown";
      const description = algo?.description || "";
      const number = start + index + 1;
      if (description) {
        return `${number}. ${label}\n   ${description}`;
      }
      return `${number}. ${label}`;
    });
    this.inventoryListText.setText(lines.join("\n"));

    if (this.inventoryPageText) {
      this.inventoryPageText.setText(
        `Page ${this.inventoryPage + 1} of ${totalPages}`,
      );
    }
    if (this.inventoryPrevButton) {
      this.inventoryPrevButton.setVisible(totalPages > 1);
    }
    if (this.inventoryNextButton) {
      this.inventoryNextButton.setVisible(totalPages > 1);
    }
  }

  toggleChecklist() {
    if (this.checklistOverlay) {
      this.closeChecklist();
    } else {
      this.openChecklist();
    }
  }

  openChecklist() {
    if (this.checklistOverlay) {
      return;
    }

    if (this.inventoryOverlay) {
      this.closeInventory();
    }

    const overlay = this.add.container(0, 0);
    const backdrop = this.add
      .rectangle(0, 0, 800, 600, 0x0b1020, 0.85)
      .setOrigin(0, 0);
    const panel = this.add
      .rectangle(400, 300, 520, 320, 0x1e293b, 0.95)
      .setStrokeStyle(2, 0x38bdf8, 1);
    const title = this.add.text(400, 170, "Done Checklist", {
      fontFamily: "sans-serif",
      fontSize: "22px",
      color: "#f8fafc",
    });
    title.setOrigin(0.5, 0.5);

    const checklistText = this.add.text(200, 210, "", {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#e2e8f0",
      lineSpacing: 8,
      wordWrap: { width: 400 },
    });
    checklistText.setText(
      [
        "[ ] Walk + jump",
        "[ ] Talk to an NPC",
        "[ ] Open/close the puzzle overlay",
        "[ ] Algorithm unlocked popup + archive entry",
      ].join("\n"),
    );

    const note = this.add.text(400, 400, "Verify in play mode", {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#94a3b8",
    });
    note.setOrigin(0.5, 0.5);

    const closeButton = this.createButton(610, 160, "Close");
    closeButton.on("pointerdown", () => this.closeChecklist());

    overlay.add([backdrop, panel, title, checklistText, note, closeButton]);
    backdrop.setInteractive({ useHandCursor: true });
    backdrop.on("pointerdown", () => this.closeChecklist());

    overlay.setAlpha(0);
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 160,
      ease: "Sine.Out",
    });

    this.checklistOverlay = overlay;
  }

  closeChecklist() {
    if (!this.checklistOverlay) {
      return;
    }
    this.checklistOverlay.destroy(true);
    this.checklistOverlay = null;
  }

  openPuzzleOverlay(puzzle) {
    if (this.puzzleOverlay) {
      return;
    }

    if (this.inventoryOverlay) {
      this.closeInventory();
    }

    if (this.checklistOverlay) {
      this.closeChecklist();
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

    const solveButton = this.createButton(300, 340, "Solve");
    const failButton = this.createButton(430, 340, "Fail");

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
