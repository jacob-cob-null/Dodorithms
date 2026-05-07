import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

const LEFT_GUESTS  = ['Zyx-7', 'Blorp', 'Krix', 'Nebb'];
const RIGHT_GUESTS = ['Blorp', 'Quell', 'Zyx-7', 'Nebb'];
// Duplicates: Blorp (idx 0), Zyx-7 (idx 2), Nebb (idx 3)
const TOTAL_DUPES  = 3;

const BOX_W = 150;
const BOX_H = 52;
const LEFT_X  = 200;
const RIGHT_X = 600;
const ROW_START_Y = 155;
const ROW_GAP = 75;

export default class GuestList extends Phaser.Scene {
  constructor() {
    super('GuestList');
  }

  init(data) {
    this.algorithm = data.algorithm;
  }

  create() {
    const W = 800, H = 600;

    this.add.rectangle(W / 2, H / 2, W, H, 0x0a1628);

    // Header
    this.add.text(W / 2, 35, '📋  Guest List — Duplicate Detection', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);
    this.add.text(W / 2, 68, 'Click a guest on the left, then delete any duplicate found on the right.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
    }).setOrigin(0.5);

    // Column headers
    this.add.text(LEFT_X,  105, 'Registered List', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#38bdf8',
    }).setOrigin(0.5);
    this.add.text(RIGHT_X, 105, 'Incoming Registrations', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#38bdf8',
    }).setOrigin(0.5);

    // Divider
    this.add.line(W / 2, H / 2, 0, -240, 0, 240, 0x1e3a5f);

    // State
    this.deletedRight  = new Set();
    this.selectedLeft  = -1;
    this.comparisons   = 0;
    this.dupesRemoved  = 0;
    this.dupePending   = -1; // right index of current highlighted dupe
    this.done          = false;

    // Build left boxes
    this.leftBoxes = LEFT_GUESTS.map((name, i) => {
      const y = ROW_START_Y + i * ROW_GAP;
      const box = this.add.rectangle(LEFT_X, y, BOX_W, BOX_H, 0x1e293b)
        .setStrokeStyle(2, 0x475569)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(LEFT_X, y, name, {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#e2e8f0',
      }).setOrigin(0.5);
      box.on('pointerover', () => { if (!this.done && this.selectedLeft !== i) box.setFillStyle(0x243447); });
      box.on('pointerout',  () => { if (!this.done && this.selectedLeft !== i) box.setFillStyle(0x1e293b); });
      box.on('pointerdown', () => { if (!this.done) this.selectLeft(i); });
      return { box, txt };
    });

    // Build right boxes
    this.rightBoxes = RIGHT_GUESTS.map((name, i) => {
      const y = ROW_START_Y + i * ROW_GAP;
      const box = this.add.rectangle(RIGHT_X, y, BOX_W, BOX_H, 0x1e293b)
        .setStrokeStyle(2, 0x475569);
      const txt = this.add.text(RIGHT_X, y, name, {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#e2e8f0',
      }).setOrigin(0.5);
      return { box, txt };
    });

    // Comparison counter
    this.compText = this.add.text(W / 2, 460, 'Comparisons: 0', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#94a3b8',
    }).setOrigin(0.5);

    // Status
    this.statusText = this.add.text(W / 2, 490, 'Select a guest on the left to scan for duplicates.', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#fbbf24',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    // Delete button (hidden)
    this.deleteGroup = this.add.container(W / 2, 530);
    const delBg  = this.add.rectangle(0, 0, 170, 44, 0x7f1d1d).setStrokeStyle(2, 0xef4444).setInteractive({ useHandCursor: true });
    const delTxt = this.add.text(0, 0, 'Delete Duplicate', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#fca5a5',
    }).setOrigin(0.5);
    delBg.on('pointerdown', () => this.deleteDuplicate());
    this.deleteGroup.add([delBg, delTxt]);
    this.deleteGroup.setVisible(false);

    // Skip
    this.add.text(W - 10, H - 10, 'Skip', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#334155',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(false));
  }

  selectLeft(idx) {
    // Reset right visuals
    this.rightBoxes.forEach(({ box }, i) => {
      if (!this.deletedRight.has(i)) {
        box.setFillStyle(0x1e293b).setStrokeStyle(2, 0x475569);
      }
    });

    // Highlight selected left
    this.leftBoxes.forEach(({ box }, i) => {
      box.setFillStyle(i === idx ? 0x1e3a5f : 0x1e293b)
        .setStrokeStyle(2, i === idx ? 0x38bdf8 : 0x475569);
    });

    this.selectedLeft  = idx;
    this.dupePending   = -1;
    this.deleteGroup.setVisible(false);

    const target = LEFT_GUESTS[idx];
    let found = false;

    this.rightBoxes.forEach(({ box }, i) => {
      if (this.deletedRight.has(i)) return;
      this.comparisons++;
      if (RIGHT_GUESTS[i] === target) {
        box.setFillStyle(0x3a1a1a).setStrokeStyle(2, 0xef4444);
        this.dupePending = i;
        found = true;
      }
    });

    this.compText.setText(`Comparisons: ${this.comparisons}`);

    if (found) {
      this.statusText.setText(`Duplicate found! "${target}" is already registered. Delete it?`);
      this.statusText.setStyle({ color: '#ef4444' });
      this.deleteGroup.setVisible(true);
    } else {
      this.statusText.setText(`No duplicate for "${target}" — unique entry. Try another.`);
      this.statusText.setStyle({ color: '#4ade80' });
    }
  }

  deleteDuplicate() {
    if (this.dupePending < 0) return;
    const idx = this.dupePending;
    this.deletedRight.add(idx);
    this.rightBoxes[idx].box.setVisible(false);
    this.rightBoxes[idx].txt.setVisible(false);
    this.dupesRemoved++;
    this.dupePending = -1;
    this.deleteGroup.setVisible(false);

    // Reset left selection
    this.leftBoxes.forEach(({ box }) => box.setFillStyle(0x1e293b).setStrokeStyle(2, 0x475569));
    this.selectedLeft = -1;

    if (this.dupesRemoved >= TOTAL_DUPES) {
      this.onAllDupesRemoved();
    } else {
      this.statusText.setText(`${TOTAL_DUPES - this.dupesRemoved} duplicate(s) remaining. Keep scanning!`);
      this.statusText.setStyle({ color: '#fbbf24' });
    }
  }

  onAllDupesRemoved() {
    this.done = true;
    const n = LEFT_GUESTS.length;
    this.statusText.setText(
      `All duplicates removed! Total comparisons: ${this.comparisons}  (${n} × ${RIGHT_GUESTS.length} = O(n²))`,
    );
    this.statusText.setStyle({ color: '#4ade80' });

    this.time.delayedCall(500, () => {
      const cont = this.add.text(400, 575, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      cont.on('pointerdown', () => this.finish(true));
    });
  }

  finish(success) {
    EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
    this.scene.stop();
  }
}
