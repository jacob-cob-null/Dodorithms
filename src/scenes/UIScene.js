import Phaser from "phaser";
import DialogueSystem from "../systems/DialogueSystem.js";
import archiveSystem from "../systems/ArchiveSystem.js";
import EventBus from "../systems/EventBus.js";
import { EVENTS } from "../systems/events.js";
import { applyCrt } from "../systems/CrtSystem.js";

const FONT_MONO = { fontFamily: '"Courier New", Courier, monospace' };
const COL_CYAN  = '#38bdf8';
const COL_DIM   = '#1e3a5f';
const COL_TEXT  = '#e2e8f0';
const COL_MUTED = '#475569';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    applyCrt(this, { vignetteStrength: 0.08, contrast: 0.025, saturation: 0.025 });

    this.dialogueSystem      = new DialogueSystem(this);
    this.puzzleOverlay       = null;
    this.unlockCard          = null;
    this.inventoryOverlay    = null;
    this.checklistOverlay    = null;
    this.inventoryPage       = 0;
    this.inventoryPageSize   = 6;

    this.createTopButtons();

    EventBus.on(EVENTS.OPEN_PUZZLE, (payload) => {
      this.openPuzzleOverlay(payload?.puzzle);
    });

    EventBus.on(EVENTS.ALGORITHM_UNLOCKED, (algorithm) => {
      this.showAlgorithmUnlocked(algorithm);
      if (this.inventoryOverlay) this._refreshArchiveContent();
      this.pulseButton(this.inventoryButton);
    });
  }

  // ─────────────────────────────────────────────────────────────
  //  TOP BUTTONS
  // ─────────────────────────────────────────────────────────────

  createTopButtons() {
    this.inventoryButton = this._makePixelButton(750, 14, 'Archive');
    this.inventoryButton.on('pointerdown', () => this.toggleInventory());
  }

  _makePixelButton(x, y, label) {
    const W = label.length * 8 + 24;
    const H = 22;
    // Draw everything centered on origin so setSize hit area aligns with visuals
    const hw = W / 2, hh = H / 2;

    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    this._drawBtnBg(bg, hw, hh, W, H, false);

    const text = this.add.text(0, 0, label, {
      ...FONT_MONO, fontSize: '11px', color: COL_CYAN,
    }).setOrigin(0.5, 0.5);

    btn.add([bg, text]);
    btn.setSize(W, H);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => { bg.clear(); this._drawBtnBg(bg, hw, hh, W, H, true);  text.setStyle({ color: '#0f172a' }); });
    btn.on('pointerout',   () => { bg.clear(); this._drawBtnBg(bg, hw, hh, W, H, false); text.setStyle({ color: COL_CYAN });  });

    return btn;
  }

  _drawBtnBg(g, hw, hh, W, H, hover) {
    if (hover) {
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(-hw, -hh, W, H);
      g.fillStyle(0x7dd3fc, 1);
      g.fillRect(-hw, -hh, W, 2);
    } else {
      g.fillStyle(0x0f2744, 1);
      g.fillRect(-hw, -hh, W, H);
      g.fillStyle(0x1e3a5f, 1);
      g.fillRect(-hw, -hh, W, 2);
      g.lineStyle(1, 0x38bdf8, 0.8);
      g.strokeRect(-hw, -hh, W, H);
    }
    g.fillStyle(0x38bdf8, 1);
    [[-hw,-hh],[hw-2,-hh],[-hw,hh-2],[hw-2,hh-2]].forEach(([cx,cy]) => g.fillRect(cx, cy, 2, 2));
  }

  pulseButton(button) {
    if (!button) return;
    this.tweens.add({ targets: button, scale: 1.08, duration: 120, yoyo: true, ease: 'Sine.Out' });
  }

  // ─────────────────────────────────────────────────────────────
  //  HOLOGRAM TABLET — shared shell
  // ─────────────────────────────────────────────────────────────

  /**
   * Builds and animates a hologram tablet.
   * Returns { container, contentArea } so callers can populate contentArea.
   * @param {string} title
   * @param {Function} onClose
   * @param {{ w?:number, h?:number }} opts
   */
  _openHologramTablet(title, onClose, { w = 560, h = 400 } = {}) {
    const cx = 400, cy = 300;
    const container = this.add.container(cx, cy);

    // ── Outer glow (ADD blend) ──
    const glowG = this.add.graphics();
    glowG.fillStyle(0x38bdf8, 0.06);
    glowG.fillRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24);
    glowG.setBlendMode(Phaser.BlendModes.ADD);
    container.add(glowG);

    // ── Backdrop (darkens game behind tablet) ──
    const backdrop = this.add.rectangle(0, 0, 800, 600, 0x020810, 0.7)
      .setInteractive()
      .on('pointerdown', onClose);
    container.add(backdrop);

    // ── Main panel ──
    const panelG = this.add.graphics();
    this._drawTabletPanel(panelG, w, h);
    container.add(panelG);

    // ── Scanlines ──
    const scanG = this.add.graphics();
    for (let sy = -h / 2 + 32; sy < h / 2 - 8; sy += 4) {
      scanG.fillStyle(0x000000, 0.06);
      scanG.fillRect(-w / 2 + 4, sy, w - 8, 1);
    }
    container.add(scanG);

    // ── Header bar ──
    const headerG = this.add.graphics();
    headerG.fillStyle(0x0a1f3d, 1);
    headerG.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, 28);
    headerG.fillStyle(0x38bdf8, 0.9);
    headerG.fillRect(-w / 2 + 4, -h / 2 + 30, w - 8, 1);
    // LED dots
    [0, 10, 20].forEach((ox, i) => {
      const colors = [0x4ade80, 0xfbbf24, 0xef4444];
      headerG.fillStyle(colors[i], 0.9);
      headerG.fillRect(w / 2 - 20 - ox, -h / 2 + 12, 6, 6);
    });
    container.add(headerG);

    // ── Title ──
    const titleText = this.add.text(-w / 2 + 16, -h / 2 + 10, `> ${title.toUpperCase()}`, {
      ...FONT_MONO,
      fontSize: '12px',
      color: COL_CYAN,
    });
    container.add(titleText);

    // ── Content area marker (callers add children relative to container) ──
    const contentY = -h / 2 + 40;

    // ── Materialize animation ──
    container.setScale(0.05);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scaleX: 1, scaleY: 1,
      alpha: 1,
      duration: 180,
      ease: 'Back.Out',
    });
    // Flicker
    this.time.delayedCall(60,  () => container.setAlpha(0.4));
    this.time.delayedCall(80,  () => container.setAlpha(1));
    this.time.delayedCall(110, () => container.setAlpha(0.7));
    this.time.delayedCall(130, () => container.setAlpha(1));

    return { container, contentY, w, h };
  }

  _closeHologramTablet(containerRef, onCleared) {
    if (!containerRef) return;
    this.tweens.add({
      targets: containerRef,
      scaleX: 0.05, scaleY: 0.05,
      alpha: 0,
      duration: 120,
      ease: 'Back.In',
      onComplete: () => { containerRef.destroy(true); if (onCleared) onCleared(); },
    });
  }

  _drawTabletPanel(g, w, h) {
    const x = -w / 2, y = -h / 2;
    // Body
    g.fillStyle(0x040e1e, 0.97);
    g.fillRect(x + 4, y + 4, w - 8, h - 8);
    // Outer border
    g.lineStyle(2, 0x38bdf8, 0.9);
    g.strokeRect(x + 2, y + 2, w - 4, h - 4);
    // Inner border
    g.lineStyle(1, 0x1e3a5f, 0.6);
    g.strokeRect(x + 5, y + 5, w - 10, h - 10);
    // Pixel corners — L-brackets
    const cs = 10;
    const corners = [[x+2, y+2], [x+w-2, y+2], [x+2, y+h-2], [x+w-2, y+h-2]];
    corners.forEach(([px, py], i) => {
      g.fillStyle(0x38bdf8, 1);
      const dx = i % 2 === 0 ? 1 : -1;
      const dy = i < 2 ? 1 : -1;
      g.fillRect(px, py, dx * cs, 2);
      g.fillRect(px, py, 2, dy * cs);
    });
    // Bottom status bar
    g.fillStyle(0x0a1f3d, 1);
    g.fillRect(x + 4, y + h - 32, w - 8, 28);
    g.fillStyle(0x38bdf8, 0.9);
    g.fillRect(x + 4, y + h - 32, w - 8, 1);
  }

  // ─────────────────────────────────────────────────────────────
  //  ARCHIVE (INVENTORY)
  // ─────────────────────────────────────────────────────────────

  toggleInventory() {
    if (this.inventoryOverlay) this.closeInventory();
    else this.openInventory();
  }

  openInventory() {
    if (this.inventoryOverlay) return;
    if (this.checklistOverlay) this.closeChecklist();

    const { container, contentY, w, h } = this._openHologramTablet(
      'Algorithm Archive',
      () => this.closeInventory(),
      { w: 560, h: 420 },
    );

    this.inventoryOverlay = container;
    this._archiveW = w;
    this._archiveH = h;
    this._archiveContentY = contentY;
    this.inventoryPage = 0;
    this._buildArchiveContent();
  }

  _buildArchiveContent() {
    // Remove old content nodes
    if (this._archiveContentNodes) {
      this._archiveContentNodes.forEach(n => n.destroy());
    }
    this._archiveContentNodes = [];

    const c = this.inventoryOverlay;
    const w = this._archiveW, h = this._archiveH;
    const algorithms = archiveSystem.getAllAlgorithms();
    const totalPages = Math.max(1, Math.ceil(algorithms.length / this.inventoryPageSize));
    this.inventoryPage = Phaser.Math.Clamp(this.inventoryPage, 0, totalPages - 1);
    const start = this.inventoryPage * this.inventoryPageSize;
    const pageItems = algorithms.slice(start, start + this.inventoryPageSize);

    // Subtitle
    const sub = this.add.text(-w / 2 + 16, -h / 2 + 44, `ALGORITHMS COLLECTED: ${algorithms.length}`, {
      ...FONT_MONO, fontSize: '10px', color: '#38bdf8',
    });
    c.add(sub);
    this._archiveContentNodes.push(sub);

    if (!pageItems.length) {
      const empty = this.add.text(0, 0, '[ NO ALGORITHMS UNLOCKED YET ]', {
        ...FONT_MONO, fontSize: '13px', color: COL_MUTED,
      }).setOrigin(0.5, 0.5);
      c.add(empty);
      this._archiveContentNodes.push(empty);
    }

    const ROW_H = 56;

    // List rows
    pageItems.forEach((algo, i) => {
      const rowY = -h / 2 + 62 + i * ROW_H;
      const num = start + i + 1;

      // Row bg
      const rowBg = this.add.graphics();
      rowBg.fillStyle(i % 2 === 0 ? 0x0d1f38 : 0x060f1e, 1);
      rowBg.fillRect(-w / 2 + 10, rowY, w - 20, ROW_H - 4);
      rowBg.lineStyle(1, 0x1e3a5f, 0.6);
      rowBg.strokeRect(-w / 2 + 10, rowY, w - 20, ROW_H - 4);
      c.add(rowBg);
      this._archiveContentNodes.push(rowBg);

      // Left accent bar
      const accent = this.add.graphics();
      accent.fillStyle(0x38bdf8, 0.8);
      accent.fillRect(-w / 2 + 10, rowY, 3, ROW_H - 4);
      c.add(accent);
      this._archiveContentNodes.push(accent);

      // Number badge
      const badge = this.add.graphics();
      badge.fillStyle(0x0f2744, 1);
      badge.fillRect(-w / 2 + 18, rowY + 8, 26, 26);
      badge.lineStyle(1, 0x38bdf8, 0.7);
      badge.strokeRect(-w / 2 + 18, rowY + 8, 26, 26);
      c.add(badge);
      this._archiveContentNodes.push(badge);

      const numTxt = this.add.text(-w / 2 + 31, rowY + 21, String(num).padStart(2, '0'), {
        ...FONT_MONO, fontSize: '11px', color: COL_CYAN,
      }).setOrigin(0.5, 0.5);
      c.add(numTxt);
      this._archiveContentNodes.push(numTxt);

      // Name
      const name = this.add.text(-w / 2 + 52, rowY + 7, algo?.name || 'Unknown', {
        ...FONT_MONO, fontSize: '14px', color: '#f1f5f9',
      });
      c.add(name);
      this._archiveContentNodes.push(name);

      // Description
      const desc = this.add.text(-w / 2 + 52, rowY + 28, algo?.description || '', {
        ...FONT_MONO, fontSize: '10px', color: '#94a3b8',
        wordWrap: { width: w - 90 },
      });
      c.add(desc);
      this._archiveContentNodes.push(desc);
    });

    // Page indicator
    const pageTxt = this.add.text(0, h / 2 - 44, `PAGE ${this.inventoryPage + 1} / ${totalPages}`, {
      ...FONT_MONO, fontSize: '10px', color: COL_MUTED,
    }).setOrigin(0.5, 0.5);
    c.add(pageTxt);
    this._archiveContentNodes.push(pageTxt);

    // Prev / Next buttons
    if (totalPages > 1) {
      const prev = this._makePixelButton(-w / 2 + 80, h / 2 - 22, '< PREV');
      const next = this._makePixelButton(-w / 2 + 180, h / 2 - 22, 'NEXT >');
      prev.setVisible(this.inventoryPage > 0);
      next.setVisible(this.inventoryPage < totalPages - 1);
      prev.on('pointerdown', () => { this.inventoryPage--; this._buildArchiveContent(); });
      next.on('pointerdown', () => { this.inventoryPage++; this._buildArchiveContent(); });
      c.add(prev); c.add(next);
      this._archiveContentNodes.push(prev, next);
    }

    // Close button — always far right
    const closeBtn = this._makePixelButton(w / 2 - 52, h / 2 - 22, 'CLOSE');
    closeBtn.on('pointerdown', () => this.closeInventory());
    c.add(closeBtn);
    this._archiveContentNodes.push(closeBtn);
  }

  _refreshArchiveContent() {
    if (!this.inventoryOverlay) return;
    this._buildArchiveContent();
  }

  closeInventory() {
    if (!this.inventoryOverlay) return;
    const ref = this.inventoryOverlay;
    this.inventoryOverlay = null;
    this._archiveContentNodes = null;
    this._closeHologramTablet(ref);
  }

  // ─────────────────────────────────────────────────────────────
  //  CHECKLIST
  // ─────────────────────────────────────────────────────────────

  toggleChecklist() {
    if (this.checklistOverlay) this.closeChecklist();
    else this.openChecklist();
  }

  openChecklist() {
    if (this.checklistOverlay) return;
    if (this.inventoryOverlay) this.closeInventory();

    const { container, w, h } = this._openHologramTablet(
      'Dev Checklist',
      () => this.closeChecklist(),
      { w: 480, h: 300 },
    );
    this.checklistOverlay = container;

    const items = [
      '> Walk + jump',
      '> Talk to an NPC',
      '> Open/close the puzzle overlay',
      '> Algorithm unlocked popup + archive entry',
    ];
    items.forEach((line, i) => {
      const t = this.add.text(-w / 2 + 20, -h / 2 + 52 + i * 26, line, {
        ...FONT_MONO, fontSize: '12px', color: i === 0 ? '#4ade80' : COL_TEXT,
      });
      container.add(t);
    });

    const note = this.add.text(0, h / 2 - 22, 'VERIFY IN PLAY MODE', {
      ...FONT_MONO, fontSize: '10px', color: COL_MUTED,
    }).setOrigin(0.5, 0.5);
    container.add(note);

    const closeBtn = this._makePixelButton(w / 2 - 12, h / 2 - 26, 'CLOSE');
    closeBtn.on('pointerdown', () => this.closeChecklist());
    container.add(closeBtn);
  }

  closeChecklist() {
    if (!this.checklistOverlay) return;
    const ref = this.checklistOverlay;
    this.checklistOverlay = null;
    this._closeHologramTablet(ref);
  }

  // ─────────────────────────────────────────────────────────────
  //  PUZZLE OVERLAY (placeholder — minigames use the tablet shell)
  // ─────────────────────────────────────────────────────────────

  openPuzzleOverlay(puzzle) {
    if (this.puzzleOverlay) return;
    if (this.inventoryOverlay) this.closeInventory();
    if (this.checklistOverlay) this.closeChecklist();

    this.scene.pause('GameScene');
    EventBus.emit(EVENTS.HIDE_PROMPT);

    const { container, w, h } = this._openHologramTablet(
      'Puzzle Terminal',
      null,
      { w: 480, h: 300 },
    );
    this.puzzleOverlay = container;

    const name = this.add.text(0, -h / 2 + 60, puzzle?.name || 'Unknown', {
      ...FONT_MONO, fontSize: '16px', color: COL_TEXT,
    }).setOrigin(0.5, 0);
    container.add(name);

    const desc = this.add.text(0, -h / 2 + 85, puzzle?.description || '', {
      ...FONT_MONO, fontSize: '11px', color: COL_MUTED,
      wordWrap: { width: w - 40 },
    }).setOrigin(0.5, 0);
    container.add(desc);

    const solveBtn = this._makePixelButton(-30, h / 2 - 26, 'SOLVE');
    const failBtn  = this._makePixelButton(100, h / 2 - 26, 'FAIL');

    solveBtn.on('pointerdown', () => {
      EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success: true, algorithm: { id: puzzle?.id || 'unknown', name: puzzle?.name || 'Unknown', description: puzzle?.description || '' } });
      this.closePuzzleOverlay();
    });
    failBtn.on('pointerdown', () => {
      EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success: false, algorithm: { id: puzzle?.id || 'unknown', name: puzzle?.name || 'Unknown', description: puzzle?.description || '' } });
      this.closePuzzleOverlay();
    });

    container.add(solveBtn);
    container.add(failBtn);
  }

  closePuzzleOverlay() {
    if (!this.puzzleOverlay) return;
    const ref = this.puzzleOverlay;
    this.puzzleOverlay = null;
    this._closeHologramTablet(ref, () => this.scene.resume('GameScene'));
  }

  // ─────────────────────────────────────────────────────────────
  //  ALGORITHM UNLOCKED TOAST
  // ─────────────────────────────────────────────────────────────

  showAlgorithmUnlocked(algorithm) {
    if (this.unlockCard) { this.unlockCard.destroy(true); this.unlockCard = null; }

    const card = this.add.container(400, 0);

    const W = 320, H = 64;
    const bg = this.add.graphics();
    bg.fillStyle(0x040e1e, 0.95);
    bg.fillRect(-W / 2, 0, W, H);
    bg.lineStyle(2, 0x38bdf8, 0.9);
    bg.strokeRect(-W / 2, 0, W, H);
    bg.fillStyle(0x38bdf8, 0.9);
    bg.fillRect(-W / 2, 0, W, 2);
    // Corner brackets
    const cs = 6;
    [[- W/2, 0], [W/2, 0], [-W/2, H], [W/2, H]].forEach(([px, py], i) => {
      const dx = i % 2 === 0 ? 1 : -1, dy = i < 2 ? 1 : -1;
      bg.fillStyle(0x38bdf8, 1);
      bg.fillRect(px, py, dx * cs, 2);
      bg.fillRect(px, py, 2, dy * cs);
    });

    const label = this.add.text(0, 14, 'ALGORITHM UNLOCKED', {
      ...FONT_MONO, fontSize: '10px', color: COL_CYAN,
    }).setOrigin(0.5, 0);

    const nameText = this.add.text(0, 32, algorithm?.name || 'Unknown', {
      ...FONT_MONO, fontSize: '15px', color: '#f8fafc',
    }).setOrigin(0.5, 0);

    card.add([bg, label, nameText]);
    card.setAlpha(0).setY(-80);

    this.tweens.add({ targets: card, alpha: 1, y: 10, duration: 220, ease: 'Back.Out' });

    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: card, alpha: 0, y: -20, duration: 200, ease: 'Sine.In',
        onComplete: () => { card.destroy(true); if (this.unlockCard === card) this.unlockCard = null; },
      });
    });

    this.unlockCard = card;
  }

  // ─────────────────────────────────────────────────────────────

  createButton(x, y, label) { return this._makePixelButton(x, y, label); }
}
