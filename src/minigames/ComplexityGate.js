import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

// Complexity Theory — Drag problem cards into P, NP, or NP-Complete doors
//
// Cards:
//   "Searching a sorted archive"              → P
//   "Finding the GCD"                         → P
//   "Checking if a route visits every city"   → NP
//   "Checking if a knapsack fits the limit"   → NP
//   "Hamiltonian Circuit decision problem"    → NP-Complete
//   "Travelling Salesperson decision problem" → NP-Complete

const CARDS = [
  { label: 'Searching\na sorted archive',        answer: 'P',          color: 0x1e4d7a },
  { label: 'Finding\nthe GCD',                   answer: 'P',          color: 0x1e4d7a },
  { label: 'Checking if a route\nvisits every city', answer: 'NP',     color: 0x1a2d1a },
  { label: "Checking a knapsack\nfits the limit", answer: 'NP',        color: 0x1a2d1a },
  { label: 'Hamiltonian Circuit\ndecision problem', answer: 'NP-C',    color: 0x3b1515 },
  { label: 'Travelling Salesperson\ndecision problem', answer: 'NP-C', color: 0x3b1515 },
];

// Door definitions
const DOORS = [
  { id: 'P',    label: 'P',           sub: 'Efficiently\nSolvable',   color: 0x22c55e, x: 140  },
  { id: 'NP',   label: 'NP',          sub: 'Efficiently\nVerifiable', color: 0xfbbf24, x: 400  },
  { id: 'NP-C', label: 'NP-Complete', sub: 'Hardest\nin NP',          color: 0xef4444, x: 660  },
];

export default class ComplexityGate extends Phaser.Scene {
  constructor() { super('ComplexityGate'); }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.placed    = 0;
    this.cardObjs  = [];
  }

  create() {
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1a);

    this.add.text(W / 2, 26, 'The Complexity Gate — P, NP, NP-Complete', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 52, 'Drag each problem card into the correct complexity class door.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
    }).setOrigin(0.5);

    // ── Doors ────────────────────────────────────────────────────────────
    DOORS.forEach(door => {
      const dg = this.add.graphics();
      dg.fillStyle(door.color, 0.08);
      dg.fillRect(door.x - 80, 90, 160, 220);
      dg.lineStyle(2, door.color, 0.5);
      dg.strokeRect(door.x - 80, 90, 160, 220);

      this.add.text(door.x, 115, door.label, {
        fontFamily: 'sans-serif', fontSize: '18px', color: Phaser.Display.Color.IntegerToColor(door.color).rgba,
        fontStyle: 'bold',
      }).setOrigin(0.5).setTint(door.color);

      this.add.text(door.x, 142, door.sub, {
        fontFamily: 'monospace', fontSize: '10px', color: '#475569',
        align: 'center', lineSpacing: 2,
      }).setOrigin(0.5);
    });

    // ── Draggable cards ──────────────────────────────────────────────────
    const CARD_W = 130, CARD_H = 52;
    // Arrange in two rows of 3 at the bottom
    CARDS.forEach((card, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const ox = 145 + col * 170;
      const oy = 360 + row * 76;

      const bg = this.add.rectangle(ox, oy, CARD_W, CARD_H, card.color)
        .setStrokeStyle(1, 0x475569)
        .setInteractive({ draggable: true, useHandCursor: true });

      const txt = this.add.text(ox, oy, card.label, {
        fontFamily: 'sans-serif', fontSize: '11px', color: '#e2e8f0',
        align: 'center', wordWrap: { width: CARD_W - 10 }, lineSpacing: 2,
      }).setOrigin(0.5);

      // Store origin so we can snap back
      bg.setData('origX', ox);
      bg.setData('origY', oy);
      bg.setData('answer', card.answer);
      bg.setData('txt', txt);
      bg.setData('locked', false);

      // Drag events
      bg.on('drag', (pointer, dragX, dragY) => {
        if (bg.getData('locked')) return;
        bg.x = dragX; bg.y = dragY;
        txt.x = dragX; txt.y = dragY;
      });

      bg.on('dragend', () => {
        if (bg.getData('locked')) return;
        this._handleDrop(bg, txt);
      });

      bg.on('pointerover', () => {
        if (!bg.getData('locked')) bg.setStrokeStyle(2, 0xa855f7);
      });
      bg.on('pointerout', () => {
        if (!bg.getData('locked')) bg.setStrokeStyle(1, 0x475569);
      });

      this.cardObjs.push({ bg, txt });
    });

    // Enable drag input
    this.input.on('drag', (pointer, obj, x, y) => {
      obj.x = x; obj.y = y;
      const t = obj.getData('txt');
      if (t) { t.x = x; t.y = y; }
    });

    // ── Feedback ─────────────────────────────────────────────────────────
    this.feedbackText = this.add.text(W / 2, 518, 'Drag each card into the correct door. Cards snap back if wrong.', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#64748b',
      align: 'center',
    }).setOrigin(0.5);

    this.progressText = this.add.text(W / 2, 540, `Sorted: 0 / ${CARDS.length}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);

    this.add.text(W - 10, H - 10, 'Skip', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#334155',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(false));
  }

  _handleDrop(bg, txt) {
    const cx = bg.x;
    const answer = bg.getData('answer');

    // Find which door zone the card was dropped in
    let droppedDoor = null;
    DOORS.forEach(door => {
      if (cx >= door.x - 80 && cx <= door.x + 80 && bg.y >= 90 && bg.y <= 310) {
        droppedDoor = door;
      }
    });

    if (!droppedDoor) {
      // Outside all doors — snap back
      this._snapBack(bg, txt);
      return;
    }

    if (droppedDoor.id === answer) {
      // Correct!
      this.placed++;
      bg.setData('locked', true);
      bg.setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
      bg.disableInteractive();

      // Snap neatly into the door zone
      const slotY = 175 + (this.placed % 3) * 28;
      bg.x = droppedDoor.x; bg.y = slotY;
      txt.x = droppedDoor.x; txt.y = slotY;

      this.feedbackText.setText(`Correct! "${this._shortLabel(answer)}" is the right class.`);
      this.feedbackText.setStyle({ color: '#4ade80' });
      this.progressText.setText(`Sorted: ${this.placed} / ${CARDS.length}`);

      if (this.placed >= CARDS.length) {
        this.time.delayedCall(400, () => this._finish());
      }
    } else {
      // Wrong door — shake and snap back
      this.cameras.main.shake(160, 0.005);
      this.feedbackText.setText(`Not quite — that problem belongs in "${answer}". Try again!`);
      this.feedbackText.setStyle({ color: '#ef4444' });
      this._snapBack(bg, txt);
    }
  }

  _snapBack(bg, txt) {
    const ox = bg.getData('origX'), oy = bg.getData('origY');
    this.tweens.add({
      targets: [bg, txt],
      x: { getActiveValue: (target) => (target === bg ? ox : ox) },
      duration: 0,
    });
    bg.x = ox; bg.y = oy;
    txt.x = ox; txt.y = oy;
  }

  _shortLabel(id) {
    if (id === 'P')    return 'P — efficiently solvable';
    if (id === 'NP')   return 'NP — efficiently verifiable';
    return 'NP-Complete — hardest in NP';
  }

  _finish() {
    this.solved = true;

    // Dim all cards area
    this.cardObjs.forEach(({ bg }) => bg.setAlpha(bg.getData('locked') ? 1 : 0.3));

    this.feedbackText.setAlpha(0);
    this.progressText.setAlpha(0);

    // P ?= NP reveal
    const revealBg = this.add.rectangle(400, 400, 780, 130, 0x0a0a1a).setStrokeStyle(2, 0xa855f7);
    this.add.text(400, 375, 'P  ?=  NP', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#a855f7', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const pnpText = this.add.text(400, 413, "If P = NP, every problem easy to verify would also be easy to solve.\nBut if P ≠ NP, some problems may remain hard to solve forever.", {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 700 },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [this.children.list[this.children.list.length - 3]],
      alpha: 1, duration: 600, delay: 200,
    });
    this.tweens.add({
      targets: pnpText,
      alpha: 1, duration: 600, delay: 600,
    });

    // Fade in P?=NP text manually
    const title = this.add.text(400, 375, 'P  ?=  NP', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#a855f7', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 700, delay: 200 });

    this.cameras.main.flash(400, 168, 85, 247);

    this.time.delayedCall(1400, () => {
      this.add.text(400, 568, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

  finish(success) {
    EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
    this.scene.resume('GameScene');
    this.scene.stop('ComplexityGate');
  }
}
