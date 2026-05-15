import MinigameBase from './MinigameBase.js';

// Bubble Sort: [3, 1, 4, 2, 5]
// User decides Swap or Keep for each adjacent pair
const INITIAL = [3, 1, 4, 2, 5];

const TILE_W   = 80;
const TILE_H   = 60;
const TILE_GAP = 12;
const TILES_X  = 156; // center of first tile
const TILES_Y  = 270;

export default class BubbleSort extends MinigameBase {
  constructor() {
    super('BubbleSort');
  }

  init(data) {
    this.algorithm  = data.algorithm;
    this.solved     = false;
    this.arr        = [...INITIAL];
    this.pass       = 0;
    this.pairIdx    = 0;         // current pair being compared (left index)
    this.sortedFrom = this.arr.length; // index from which everything is sorted
    this.comps      = 0;
    this.swaps      = 0;
    this.passSwaps  = 0;
    this.waiting    = false;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'BubbleSort');

    this.add.text(W / 2, 34, 'Specimen Sorter — Bubble Sort', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 66, `Compare each adjacent pair of samples.\nIf left > right, they must SWAP. Otherwise, KEEP them.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Pass label
    this.passText = this.add.text(W / 2, 108, 'Pass 1', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#38bdf8',
    }).setOrigin(0.5);

    // Tiles
    this.tileBgs  = [];
    this.tileNums = [];
    for (let i = 0; i < this.arr.length; i++) {
      const cx = TILES_X + i * (TILE_W + TILE_GAP);
      const bg = this.add.rectangle(cx, TILES_Y, TILE_W, TILE_H, 0x1e4d7a)
        .setStrokeStyle(2, 0x334155);
      const num = this.add.text(cx, TILES_Y, String(this.arr[i]), {
        fontFamily: 'sans-serif', fontSize: '28px', color: '#f8fafc', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tileBgs.push(bg);
      this.tileNums.push(num);
    }

    // Comparison prompt
    this.promptText = this.add.text(W / 2, 340, '', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#fbbf24',
      align: 'center',
    }).setOrigin(0.5);

    // Swap / Keep buttons
    this.swapBtn = this.add.text(270, 396, '  ↔  Swap  ', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#0f172a',
      backgroundColor: '#f59e0b', padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.keepBtn = this.add.text(530, 396, '  →  Keep  ', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#f8fafc',
      backgroundColor: '#1e4d7a', padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.swapBtn.on('pointerdown', () => { if (!this.solved && !this.waiting) this.decide(true);  });
    this.keepBtn.on('pointerdown', () => { if (!this.solved && !this.waiting) this.decide(false); });

    this.feedbackText = this.add.text(W / 2, 450, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.statsText = this.add.text(W / 2, 476, 'Comparisons: 0   Swaps: 0', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });

    // Kick off first comparison
    this._showCurrentPair();
  }

  _showCurrentPair() {
    const i = this.pairIdx;
    const j = i + 1;

    // Reset all tiles to default
    for (let k = 0; k < this.arr.length; k++) {
      if (k >= this.sortedFrom) {
        this.tileBgs[k].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
        this.tileNums[k].setStyle({ color: '#4ade80' });
      } else if (k === i || k === j) {
        this.tileBgs[k].setFillStyle(0x1e3a5f).setStrokeStyle(2, 0xfbbf24);
        this.tileNums[k].setStyle({ color: '#fbbf24' });
      } else {
        this.tileBgs[k].setFillStyle(0x1e4d7a).setStrokeStyle(2, 0x334155);
        this.tileNums[k].setStyle({ color: '#f8fafc' });
      }
    }

    this.promptText.setText(`Is  ${this.arr[i]}  >  ${this.arr[j]}  ?`);
  }

  decide(wantsSwap) {
    const i   = this.pairIdx;
    const j   = i + 1;
    const shouldSwap = this.arr[i] > this.arr[j];
    this.comps++;

    if (wantsSwap !== shouldSwap) {
      // Wrong decision
      const hint = shouldSwap
        ? `${this.arr[i]} > ${this.arr[j]} — they should SWAP!`
        : `${this.arr[i]} ≤ ${this.arr[j]} — they should KEEP order.`;
      this.feedbackText.setText(hint);
      this.feedbackText.setStyle({ color: '#ef4444' });
      this.playIncorrectSfx();
      this.cameras.main.shake(160, 0.006);
      return;
    }

    this.waiting = true;
    this.feedbackText.setText('');

    if (shouldSwap) {
      // Animate swap
      this.swaps++;
      this.passSwaps++;
      [this.arr[i], this.arr[j]] = [this.arr[j], this.arr[i]];
      this.tileNums[i].setText(String(this.arr[i]));
      this.tileNums[j].setText(String(this.arr[j]));
      this.tileBgs[i].setFillStyle(0x4ade80, 0.2).setStrokeStyle(2, 0x4ade80);
      this.tileBgs[j].setFillStyle(0x4ade80, 0.2).setStrokeStyle(2, 0x4ade80);
      this.feedbackText.setText(`Swapped! ${this.arr[j]} and ${this.arr[i]} exchanged.`);
      this.feedbackText.setStyle({ color: '#4ade80' });
    } else {
      this.feedbackText.setText(`Correct — ${this.arr[i]} ≤ ${this.arr[j]}, no swap needed.`);
      this.feedbackText.setStyle({ color: '#64748b' });
    }

    this.statsText.setText(`Comparisons: ${this.comps}   Swaps: ${this.swaps}`);

    this.time.delayedCall(500, () => {
      this.pairIdx++;

      // End of this pass
      if (this.pairIdx >= this.sortedFrom - 1) {
        this.sortedFrom--;           // rightmost unsorted confirmed sorted
        this.pass++;
        this.pairIdx = 0;

        if (this.passSwaps === 0 || this.sortedFrom <= 1) {
          // No swaps in this pass → already sorted
          this._finishSort();
          return;
        }

        this.passSwaps = 0;
        this.passText.setText(`Pass ${this.pass + 1}`);
      }

      this.waiting = false;
      this._showCurrentPair();
    });
  }

  _finishSort() {
    this.solved = true;

    // Mark all green
    for (let k = 0; k < this.arr.length; k++) {
      this.tileBgs[k].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
      this.tileNums[k].setStyle({ color: '#4ade80' });
    }

    this.swapBtn.setAlpha(0);
    this.keepBtn.setAlpha(0);
    this.promptText.setText('');
    this.passText.setText('Sorted!');
    this.passText.setStyle({ color: '#4ade80' });
    this.feedbackText.setText(
      `Done in ${this.pass} passes — ${this.comps} comparisons, ${this.swaps} swaps.  O(n²) worst case.`
    );
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 74, 222, 128);

    this.time.delayedCall(700, () => {
      this.add.text(400, 530, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
