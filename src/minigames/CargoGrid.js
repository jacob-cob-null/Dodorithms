import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

// 0/1 Knapsack DP — pack max value within capacity 4
// Items: ZZS Crystal (w=1,v=2), Fuel Cell (w=3,v=4), Med Kit (w=2,v=3)
// Capacity: 4
//
// DP table dp[item][cap]:
//       c=0  c=1  c=2  c=3  c=4
// i=0:   0    0    0    0    0     (no items)
// i=1:   0    2    2    2    2     (Crystal w=1,v=2)
// i=2:   0    2    2    4    6     (FuelCell w=3,v=4) ← dp[2][4]=6 optimal!
// i=3:   0    2    3    5    6     (MedKit w=2,v=3)
//
// Optimal: Crystal + FuelCell = w:4, v:6

const ITEMS = [
  { name: 'ZZS Crystal', w: 1, v: 2, color: 0x7c3aed, emoji: '🔮' },
  { name: 'Fuel Cell',   w: 3, v: 4, color: 0x1d4ed8, emoji: '⚡' },
  { name: 'Med Kit',     w: 2, v: 3, color: 0x065f46, emoji: '💊' },
];
const CAP = 4;

// Pre-compute DP table
const dp = [];
for (let i = 0; i <= ITEMS.length; i++) {
  dp.push(new Array(CAP + 1).fill(0));
}
for (let i = 1; i <= ITEMS.length; i++) {
  const { w, v } = ITEMS[i - 1];
  for (let c = 0; c <= CAP; c++) {
    dp[i][c] = c >= w ? Math.max(dp[i-1][c], v + dp[i-1][c-w]) : dp[i-1][c];
  }
}

const CELL_W = 72, CELL_H = 38;
const TABLE_X = 210, TABLE_Y = 210; // top-left of dp[1][0] (row headers offset)
const ROW_LABELS = ['(none)', 'Crystal', 'FuelCell', 'MedKit'];

export default class CargoGrid extends Phaser.Scene {
  constructor() { super('CargoGrid'); }

  init(data) {
    this.algorithm  = data.algorithm;
    this.solved     = false;
    this.rowFilled  = 0;   // how many item rows computed (row 0 = base case)
    this.waiting    = false;
  }

  create() {
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x100518);

    this.add.text(W / 2, 28, 'Cargo Grid — 0/1 Knapsack', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 55, `Pack the most valuable cargo within capacity ${CAP}.\nFill the DP table row by row — each row adds one item.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Item cards on left
    this.add.text(72, 92, 'Items', {
      fontFamily: 'monospace', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);
    ITEMS.forEach((item, i) => {
      const iy = 115 + i * 52;
      const g  = this.add.graphics();
      g.fillStyle(item.color, 0.2); g.fillRect(10, iy - 18, 124, 38);
      g.lineStyle(1, item.color, 0.5); g.strokeRect(10, iy - 18, 124, 38);
      this.add.text(76, iy - 5, item.name, {
        fontFamily: 'sans-serif', fontSize: '11px', color: '#e2e8f0',
      }).setOrigin(0.5);
      this.add.text(76, iy + 9, `w=${item.w}  v=${item.v}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8',
      }).setOrigin(0.5);
    });

    // ── DP Table ──────────────────────────────────────────────────────────
    // Column headers (capacity 0-4)
    this.add.text(TABLE_X - 72, TABLE_Y - 22, 'Item \\ Cap →', {
      fontFamily: 'monospace', fontSize: '10px', color: '#334155',
    }).setOrigin(0, 0.5);
    for (let c = 0; c <= CAP; c++) {
      this.add.text(TABLE_X + c * CELL_W + CELL_W / 2, TABLE_Y - 22, `c=${c}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#475569',
      }).setOrigin(0.5);
    }

    // Row labels + cells
    this.cellBgs = [];
    this.cellVals = [];
    for (let i = 0; i <= ITEMS.length; i++) {
      // Row label
      this.add.text(TABLE_X - 8, TABLE_Y + i * CELL_H + CELL_H / 2, ROW_LABELS[i], {
        fontFamily: 'monospace', fontSize: '10px', color: '#334155',
      }).setOrigin(1, 0.5);

      const rowBgs = [], rowVals = [];
      for (let c = 0; c <= CAP; c++) {
        const cx = TABLE_X + c * CELL_W + CELL_W / 2;
        const cy = TABLE_Y + i * CELL_H + CELL_H / 2;
        const bg = this.add.rectangle(cx, cy, CELL_W - 3, CELL_H - 3, 0x1e293b).setStrokeStyle(1, 0x334155);
        const val = this.add.text(cx, cy, i === 0 ? '0' : '—', {
          fontFamily: 'monospace', fontSize: '14px',
          color: i === 0 ? '#4ade80' : '#334155', fontStyle: 'bold',
        }).setOrigin(0.5);
        if (i === 0) bg.setFillStyle(0x1a2d1a);
        rowBgs.push(bg);
        rowVals.push(val);
      }
      this.cellBgs.push(rowBgs);
      this.cellVals.push(rowVals);
    }

    // Formula display
    this.formulaText = this.add.text(W / 2, 392, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa',
      align: 'center', wordWrap: { width: 700 },
    }).setOrigin(0.5);

    // Fill Row button
    this.fillBtn = this.add.text(W / 2, 432, '  Compute Next Row  ', {
      fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
      backgroundColor: '#a855f7', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.fillBtn.on('pointerover', () => { if (!this.solved) this.fillBtn.setStyle({ backgroundColor: '#c084fc' }); });
    this.fillBtn.on('pointerout',  () => { if (!this.solved) this.fillBtn.setStyle({ backgroundColor: '#a855f7' }); });
    this.fillBtn.on('pointerdown', () => { if (!this.solved && !this.waiting) this.fillNextRow(); });

    this.feedbackText = this.add.text(W / 2, 476, 'Row 0 pre-filled (base case: no items = 0 value). Click to compute item rows.', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.add.text(W - 10, H - 10, 'Skip', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#334155',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(false));
  }

  fillNextRow() {
    if (this.rowFilled >= ITEMS.length) return;
    this.waiting = true;
    const i    = this.rowFilled + 1;
    const item = ITEMS[i - 1];

    // Highlight this row's cells one by one
    let c = 0;
    const fillCell = () => {
      if (c > CAP) {
        // Done with row
        this.rowFilled++;
        const nextItem = ITEMS[this.rowFilled] || null;
        if (this.rowFilled >= ITEMS.length) {
          this._backtrack();
        } else {
          this.feedbackText.setText(`Row ${i} done. Next: add "${nextItem.name}" (w=${nextItem.w}, v=${nextItem.v}).`);
          this.feedbackText.setStyle({ color: '#a855f7' });
          this.waiting = false;
        }
        return;
      }

      const val = dp[i][c];
      const came_from_prev = dp[i-1][c] >= (c >= item.w ? item.v + dp[i-1][c-item.w] : -Infinity);
      const used_item = !came_from_prev && c >= item.w;

      this.cellBgs[i][c].setFillStyle(used_item ? 0x1a3f6e : 0x1a2d1a).setStrokeStyle(1, used_item ? 0x60a5fa : 0x334155);
      this.cellVals[i][c].setText(String(val)).setStyle({ color: used_item ? '#60a5fa' : '#4ade80' });

      // Formula for this cell
      const formula = c >= item.w
        ? `dp[${i}][${c}] = max(dp[${i-1}][${c}]=${dp[i-1][c]},  ${item.v}+dp[${i-1}][${c-item.w}]=${item.v+dp[i-1][c-item.w]}) = ${val}`
        : `dp[${i}][${c}] = dp[${i-1}][${c}] = ${val}  (${item.name} too heavy)`;
      this.formulaText.setText(formula);

      c++;
      this.time.delayedCall(160, fillCell);
    };

    this.feedbackText.setText(`Computing row ${i}: adding "${item.name}" (w=${item.w}, v=${item.v})`);
    fillCell();
  }

  _backtrack() {
    // Highlight optimal items by backtracking from dp[3][4]
    let c = CAP;
    const selected = [];
    for (let i = ITEMS.length; i >= 1; i--) {
      if (dp[i][c] !== dp[i-1][c]) {
        selected.push(i - 1); // zero-based item index
        c -= ITEMS[i-1].w;
      }
    }

    // Highlight selected cells
    selected.forEach(itemIdx => {
      const row = itemIdx + 1;
      // find which cap column was the key
      let cc = CAP;
      for (let ii = ITEMS.length; ii >= row; ii--) {
        if (ii === row) {
          this.cellBgs[row][cc].setFillStyle(0x14532d).setStrokeStyle(3, 0x4ade80);
          this.cellVals[row][cc].setStyle({ color: '#4ade80', fontSize: '16px' });
        }
        if (dp[ii][cc] !== dp[ii-1][cc]) cc -= ITEMS[ii-1].w;
      }
    });

    // Highlight final cell dp[3][4]
    this.cellBgs[ITEMS.length][CAP].setFillStyle(0x14532d).setStrokeStyle(3, 0x4ade80);
    this.cellVals[ITEMS.length][CAP].setStyle({ color: '#4ade80', fontSize: '18px' });

    const names = selected.map(i => ITEMS[i].name).join(' + ');
    const totalV = selected.reduce((s, i) => s + ITEMS[i].v, 0);
    const totalW = selected.reduce((s, i) => s + ITEMS[i].w, 0);

    this.formulaText.setText(`Optimal: ${names}  =  weight ${totalW}/${CAP}  value ${totalV}  ✓`);
    this.formulaText.setStyle({ color: '#4ade80' });
    this.feedbackText.setText('Backtracked through the table to find which items were included!');
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.fillBtn.setAlpha(0);
    this.solved = true;
    this.cameras.main.flash(400, 168, 85, 247);

    this.time.delayedCall(800, () => {
      this.add.text(400, 545, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

  finish(success) {
    EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
    this.scene.resume('GameScene');
    this.scene.stop('CargoGrid');
  }
}
