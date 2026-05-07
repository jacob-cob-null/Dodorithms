import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

// Change-Making DP: target=11, coins=[1,5,6,9]
// Greedy (largest first): 9+1+1 = 3 coins  ← suboptimal!
// DP optimal:             6+5   = 2 coins   ← best!
//
// dp[0..11]:
//  0:0  1:1  2:2  3:3  4:4  5:1  6:1  7:2  8:3  9:1  10:2  11:2
//
// User fills dp[5], dp[6], dp[9], dp[11] — the "interesting" DP cells

const TARGET = 11;
const COINS  = [1, 5, 6, 9];

// Full DP table (pre-computed for auto-fill)
const DP = new Array(TARGET + 1).fill(Infinity);
DP[0] = 0;
for (let i = 1; i <= TARGET; i++) {
  for (const c of COINS) {
    if (c <= i && DP[i - c] + 1 < DP[i]) DP[i] = DP[i - c] + 1;
  }
}

// Key cells user must fill, with which coin gives the optimum
const KEY_CELLS = [5, 6, 9, 11];

export default class ChangeMaking extends Phaser.Scene {
  constructor() { super('ChangeMaking'); }

  init(data) {
    this.algorithm   = data.algorithm;
    this.solved      = false;
    this.filled      = new Set([0]);   // dp[0]=0 auto-filled
    this.keyIdx      = 0;              // which KEY_CELL we're on
    this.waiting     = false;
  }

  create() {
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x100518);

    this.add.text(W / 2, 30, 'Change Machine — Dynamic Programming', {
      fontFamily: 'sans-serif', fontSize: '21px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 57, `Make change for  ${TARGET} credits  using the fewest coins.\nCoins available: [${COINS.join(', ')}]`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center',
    }).setOrigin(0.5);

    // Greedy demo
    this.add.rectangle(W / 2, 107, 700, 34, 0x1a0d3d).setStrokeStyle(1, 0x4c1d95);
    this.add.text(W / 2, 107, `Greedy (largest first): 9 + 1 + 1 = 3 coins  ✗  Not optimal!`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#ef4444',
    }).setOrigin(0.5);

    // DP table header
    this.add.text(W / 2, 140, 'DP Table — dp[i] = min coins to make i credits', {
      fontFamily: 'monospace', fontSize: '11px', color: '#475569',
    }).setOrigin(0.5);

    // DP cells (dp[0..11])
    const CELL_W = 52, CELL_H = 44, START_X = 50;
    this.dpBgs   = [];
    this.dpVals  = [];
    this.dpIdxs  = [];

    for (let i = 0; i <= TARGET; i++) {
      const cx = START_X + i * CELL_W + CELL_W / 2;
      const bg = this.add.rectangle(cx, 194, CELL_W - 4, CELL_H, 0x1e293b).setStrokeStyle(1, 0x334155);
      const val = this.add.text(cx, 190, i === 0 ? '0' : '?', {
        fontFamily: 'monospace', fontSize: '16px', color: i === 0 ? '#4ade80' : '#334155',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const idx = this.add.text(cx, 210, String(i), {
        fontFamily: 'monospace', fontSize: '9px', color: '#334155',
      }).setOrigin(0.5);
      this.dpBgs.push(bg);
      this.dpVals.push(val);
      this.dpIdxs.push(idx);
    }

    // Auto-fill dp[1..4] (trivial: just 1-coins)
    this.time.delayedCall(300, () => {
      for (let i = 1; i <= 4; i++) {
        this.dpVals[i].setText(String(DP[i]));
        this.dpVals[i].setStyle({ color: '#94a3b8' });
        this.dpBgs[i].setFillStyle(0x1a2d1a);
        this.filled.add(i);
      }
      this._promptNextKey();
    });

    // Formula display
    this.formulaBox = this.add.rectangle(W / 2, 282, 700, 46, 0x0f172a).setStrokeStyle(1, 0x1e3a5f);
    this.formulaText = this.add.text(W / 2, 282, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa', align: 'center',
    }).setOrigin(0.5);

    // Coin options
    this.add.text(W / 2, 320, 'Which coin gives the minimum for this cell?', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#64748b',
    }).setOrigin(0.5);

    this.coinBtns = [];
    COINS.forEach((c, i) => {
      const bx = 200 + i * 110;
      const bg = this.add.rectangle(bx, 358, 90, 42, 0x1e293b)
        .setStrokeStyle(2, 0x475569)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(bx, 358, `${c}¢`, {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#e2e8f0', fontStyle: 'bold',
      }).setOrigin(0.5);
      bg.on('pointerover', () => { if (!this.solved) bg.setStrokeStyle(2, 0xa855f7); });
      bg.on('pointerout',  () => { if (!this.solved) bg.setStrokeStyle(2, 0x475569); });
      bg.on('pointerdown', () => { if (!this.solved && !this.waiting) this.pickCoin(c, bg); });
      this.coinBtns.push({ bg, label, coin: c });
    });

    this.feedbackText = this.add.text(W / 2, 410, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.progressText = this.add.text(W / 2, 438, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);

    this.add.text(W - 10, H - 10, 'Skip', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#334155',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(false));
  }

  _promptNextKey() {
    if (this.keyIdx >= KEY_CELLS.length) { this._finish(); return; }
    const cell = KEY_CELLS[this.keyIdx];

    // Highlight the active cell
    this.dpBgs[cell].setStrokeStyle(2, 0xa855f7).setFillStyle(0x2d1d6b);
    this.dpVals[cell].setText('?').setStyle({ color: '#a855f7' });

    // Auto-fill any non-key cells between last filled and this cell
    const prev = this.keyIdx > 0 ? KEY_CELLS[this.keyIdx - 1] : 4;
    for (let i = prev + 1; i < cell; i++) {
      if (!this.filled.has(i)) {
        this.dpVals[i].setText(String(DP[i])).setStyle({ color: '#94a3b8' });
        this.dpBgs[i].setFillStyle(0x1a2d1a);
        this.filled.add(i);
      }
    }

    // Build formula
    const candidates = COINS.filter(c => c <= cell)
      .map(c => `dp[${cell-c}]+1=${DP[cell-c]+1}`)
      .join(', ');
    this.formulaText.setText(
      `dp[${cell}] = min(${candidates}) = ${DP[cell]}`
    );

    this.feedbackText.setText(`Fill dp[${cell}]: which coin gives the minimum of ${DP[cell]}?`);
    this.feedbackText.setStyle({ color: '#a855f7' });
    this.progressText.setText(`Key cell ${this.keyIdx + 1} / ${KEY_CELLS.length}`);
  }

  pickCoin(coin, btn) {
    const cell = KEY_CELLS[this.keyIdx];

    // Find which coin(s) achieve the minimum
    const optimal = COINS.filter(c => c <= cell && DP[cell - c] + 1 === DP[cell]);

    if (!optimal.includes(coin)) {
      const best = optimal[0];
      this.feedbackText.setText(
        `dp[${cell-coin}]+1 = ${DP[cell-coin]+1} — not minimal. Try coin ${best}: dp[${cell-best}]+1=${DP[cell-best]+1}.`
      );
      this.feedbackText.setStyle({ color: '#ef4444' });
      btn.setStrokeStyle(2, 0xef4444);
      this.cameras.main.shake(160, 0.005);
      this.time.delayedCall(500, () => btn.setStrokeStyle(2, 0x475569));
      return;
    }

    // Correct
    this.waiting = true;
    this.dpBgs[cell].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
    this.dpVals[cell].setText(String(DP[cell])).setStyle({ color: '#4ade80' });
    this.filled.add(cell);
    this.feedbackText.setText(`dp[${cell}] = ${DP[cell]} ✓  (use ${coin}¢ coin: dp[${cell-coin}]+1)`);
    this.feedbackText.setStyle({ color: '#4ade80' });
    btn.setStrokeStyle(2, 0x4ade80);

    this.time.delayedCall(500, () => {
      btn.setStrokeStyle(2, 0x475569);
      this.keyIdx++;
      this.waiting = false;
      this._promptNextKey();
    });
  }

  _finish() {
    this.solved = true;
    // Fill remaining cells
    for (let i = 0; i <= TARGET; i++) {
      if (!this.filled.has(i)) {
        this.dpVals[i].setText(String(DP[i])).setStyle({ color: '#94a3b8' });
        this.dpBgs[i].setFillStyle(0x1a2d1a);
      }
    }
    // Highlight dp[11]
    this.dpBgs[TARGET].setFillStyle(0x14532d).setStrokeStyle(3, 0x4ade80);
    this.dpVals[TARGET].setStyle({ color: '#4ade80', fontSize: '18px' });

    this.coinBtns.forEach(({ bg }) => bg.disableInteractive().setAlpha(0.3));
    this.formulaText.setText(`dp[${TARGET}] = 2  →  5¢ + 6¢ = ${TARGET}  ✓  DP beats greedy (3 coins)!`);
    this.formulaText.setStyle({ color: '#4ade80' });
    this.feedbackText.setText('DP filled the table bottom-up, finding the true optimum at every step.');
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 168, 85, 247);

    this.time.delayedCall(700, () => {
      this.add.text(400, 500, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

  finish(success) {
    EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
    this.scene.resume('GameScene');
    this.scene.stop('ChangeMaking');
  }
}
