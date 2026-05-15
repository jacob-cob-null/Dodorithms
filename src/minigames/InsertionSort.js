import MinigameBase from './MinigameBase.js';

// Insertion Sort: [4, 2, 7, 1, 5]
// Each round: take the next key and click where it belongs in the sorted portion
const INITIAL = [4, 2, 7, 1, 5];

const TILE_W   = 74;
const TILE_H   = 58;
const TILE_GAP = 10;
const TILES_X  = 143; // center of first tile
const TILES_Y  = 265;
const SLOT_W   = 18;
const SLOT_H   = 38;

export default class InsertionSort extends MinigameBase {
  constructor() {
    super('InsertionSort');
  }

  init(data) {
    this.algorithm  = data.algorithm;
    this.solved     = false;
    this.arr        = [...INITIAL];
    this.sortedCount = 1;  // first element already "sorted"
    this.comps       = 0;
    this.waiting     = false;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'InsertionSort');

    this.add.text(W / 2, 34, 'Departure Board — Insertion Sort', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 64, `Sort train departure times. Take the highlighted ticket and click\nthe correct gap to insert it into the sorted portion (green).`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Tiles
    this.tileBgs  = [];
    this.tileNums = [];
    for (let i = 0; i < this.arr.length; i++) {
      const cx = TILES_X + i * (TILE_W + TILE_GAP);
      const bg = this.add.rectangle(cx, TILES_Y, TILE_W, TILE_H, 0x1e293b)
        .setStrokeStyle(2, 0x334155);
      const num = this.add.text(cx, TILES_Y, String(this.arr[i]), {
        fontFamily: 'sans-serif', fontSize: '28px', color: '#f8fafc', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tileBgs.push(bg);
      this.tileNums.push(num);
    }

    // Slot markers (between sorted tiles + before first and after last sorted)
    // Rebuilt each round
    this.slotGroup = [];

    // Round label
    this.roundText = this.add.text(W / 2, 110, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#a855f7',
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(W / 2, 370, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.compText = this.add.text(W / 2, 396, 'Comparisons: 0', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });

    this._refreshDisplay();
  }

  _refreshDisplay() {
    // Colour tiles
    for (let i = 0; i < this.arr.length; i++) {
      if (i < this.sortedCount) {
        this.tileBgs[i].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
        this.tileNums[i].setStyle({ color: '#4ade80' });
      } else if (i === this.sortedCount) {
        this.tileBgs[i].setFillStyle(0x3b1f6a).setStrokeStyle(2, 0xa855f7);
        this.tileNums[i].setStyle({ color: '#c084fc' });
      } else {
        this.tileBgs[i].setFillStyle(0x1e293b).setStrokeStyle(2, 0x334155);
        this.tileNums[i].setStyle({ color: '#64748b' });
      }
    }

    // Rebuild slot targets
    this.slotGroup.forEach(s => s.destroy());
    this.slotGroup = [];

    if (this.sortedCount >= this.arr.length) {
      this._finishSort();
      return;
    }

    const key = this.arr[this.sortedCount];
    this.roundText.setText(`Round ${this.sortedCount}  —  Insert key ${key} into sorted portion`);

    // Draw slots: sortedCount+1 slots (before each sorted card + after last)
    for (let s = 0; s <= this.sortedCount; s++) {
      // Slot s sits to the left of sorted tile s (or after last)
      const sx = s === 0
        ? TILES_X - TILE_W / 2 - TILE_GAP / 2 - SLOT_W / 2
        : TILES_X + (s - 1) * (TILE_W + TILE_GAP) + TILE_W / 2 + TILE_GAP / 2 + SLOT_W / 2;

      const slotBg = this.add.rectangle(sx, TILES_Y, SLOT_W, SLOT_H, 0x2d1d6b)
        .setStrokeStyle(2, 0xa855f7)
        .setInteractive({ useHandCursor: true });

      const slotTxt = this.add.text(sx, TILES_Y, '↓', {
        fontFamily: 'sans-serif', fontSize: '14px', color: '#a855f7',
      }).setOrigin(0.5);

      const slotIdx = s; // capture for closure
      slotBg.on('pointerover', () => slotBg.setFillStyle(0x4c1d95));
      slotBg.on('pointerout',  () => slotBg.setFillStyle(0x2d1d6b));
      slotBg.on('pointerdown', () => {
        if (!this.solved && !this.waiting) this.handleSlot(slotIdx);
      });

      this.slotGroup.push(slotBg, slotTxt);
    }

    this.feedbackText.setText('Click the ↓ gap where the purple key card belongs.');
    this.feedbackText.setStyle({ color: '#64748b' });
  }

  handleSlot(slotIdx) {
    const key = this.arr[this.sortedCount];

    // Find correct insertion position
    let correct = this.sortedCount; // default: after all sorted
    for (let i = 0; i < this.sortedCount; i++) {
      this.comps++;
      if (key < this.arr[i]) { correct = i; break; }
    }
    this.compText.setText(`Comparisons: ${this.comps}`);

    if (slotIdx !== correct) {
      this.feedbackText.setText(
        `Not quite! ${key} belongs at slot ${correct}${correct === 0 ? ' (before all)' : ` (after ${this.arr[correct - 1]})`}.`
      );
      this.feedbackText.setStyle({ color: '#ef4444' });
      this.playIncorrectSfx();
      this.cameras.main.shake(160, 0.005);
      return;
    }

    // Correct — insert key at slotIdx
    this.waiting = true;
    this.feedbackText.setText(`Correct! Inserting ${key} at position ${slotIdx}.`);
    this.feedbackText.setStyle({ color: '#4ade80' });

    // Shift arr
    this.arr.splice(this.sortedCount, 1);
    this.arr.splice(slotIdx, 0, key);
    this.sortedCount++;

    // Update tile labels
    for (let i = 0; i < this.arr.length; i++) {
      this.tileNums[i].setText(String(this.arr[i]));
    }

    this.time.delayedCall(420, () => {
      this.waiting = false;
      this._refreshDisplay();
    });
  }

  _finishSort() {
    this.solved = true;
    this.slotGroup.forEach(s => s.destroy());
    this.slotGroup = [];
    this.roundText.setText('Sorted!  All tickets in order.');
    this.roundText.setStyle({ color: '#4ade80' });
    this.feedbackText.setText(
      `Insertion Sort complete — ${this.comps} comparisons. Efficient for nearly-sorted data!`
    );
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 168, 85, 247);

    this.time.delayedCall(700, () => {
      this.add.text(400, 450, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
