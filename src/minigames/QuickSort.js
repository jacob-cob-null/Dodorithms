import MinigameBase from './MinigameBase.js';

// Quicksort — user picks pivot, we partition, repeat on sub-arrays
const INITIAL = [5, 3, 8, 1, 9, 2, 7];

const TILE_W   = 70;
const TILE_H   = 56;
const TILE_GAP = 8;
const TILES_X  = 119; // centre of tile[0]
const TILES_Y  = 255;

// Lomuto partition (in-place, returns final pivot index)
function lomuto(arr, lo, hi, pivotIdx) {
  const a = [...arr];
  [a[pivotIdx], a[hi]] = [a[hi], a[pivotIdx]]; // move pivot to end
  const pivot = a[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (a[j] <= pivot) { i++; [a[i], a[j]] = [a[j], a[i]]; }
  }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
  return { arr: a, finalIdx: i + 1 };
}

export default class QuickSort extends MinigameBase {
  constructor() {
    super('QuickSort');
  }

  init(data) {
    this.algorithm    = data.algorithm;
    this.solved       = false;
    this.arr          = [...INITIAL];
    this.settled      = new Set();         // indices confirmed in final position
    this.ranges       = [{ lo: 0, hi: INITIAL.length - 1 }]; // sub-arrays to sort
    this.pivots       = 0;
    this.waiting      = false;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'QuickSort');

    this.add.text(W / 2, 32, 'Cargo Manifest — Quicksort', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 62, `Click any highlighted (yellow) tile to use as pivot.\nIt will be partitioned to its final sorted position.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Active range label
    this.rangeText = this.add.text(W / 2, 106, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fbbf24',
    }).setOrigin(0.5);

    // Tiles
    this.tileBgs  = [];
    this.tileNums = [];
    for (let i = 0; i < this.arr.length; i++) {
      const cx = TILES_X + i * (TILE_W + TILE_GAP);
      const bg = this.add.rectangle(cx, TILES_Y, TILE_W, TILE_H, 0x1e293b)
        .setStrokeStyle(2, 0x334155)
        .setInteractive({ useHandCursor: true });
      const num = this.add.text(cx, TILES_Y, String(this.arr[i]), {
        fontFamily: 'sans-serif', fontSize: '24px', color: '#f8fafc', fontStyle: 'bold',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => { if (!this.solved && !this.waiting) this.handlePivot(i); });
      this.tileBgs.push(bg);
      this.tileNums.push(num);
    }

    // Partition result display
    this.resultText = this.add.text(W / 2, 340, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#60a5fa',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(W / 2, 372, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.pivotsText = this.add.text(W / 2, 400, 'Pivots settled: 0', {
      fontFamily: 'monospace', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);

    // Auto-complete button (after 3 manual pivots)
    this.autoBtn = this.add.text(W / 2, 436, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#60a5fa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.autoBtn.on('pointerdown', () => { if (!this.solved) this._autoComplete(); });

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });

    this._refreshDisplay();
  }

  _currentRange() {
    return this.ranges.length > 0 ? this.ranges[0] : null;
  }

  _refreshDisplay() {
    const cur = this._currentRange();

    this.tileBgs.forEach((bg, i) => {
      if (this.settled.has(i)) {
        bg.setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
        this.tileNums[i].setStyle({ color: '#4ade80' });
      } else if (cur && i >= cur.lo && i <= cur.hi) {
        bg.setFillStyle(0x3b2a00).setStrokeStyle(2, 0xfbbf24);
        this.tileNums[i].setStyle({ color: '#fde68a' });
      } else if (this.ranges.some(r => i >= r.lo && i <= r.hi)) {
        bg.setFillStyle(0x0f2a4a).setStrokeStyle(2, 0x1e4d7a);
        this.tileNums[i].setStyle({ color: '#475569' });
      } else {
        bg.setFillStyle(0x0d1117).setStrokeStyle(2, 0x1e293b);
        this.tileNums[i].setStyle({ color: '#334155' });
      }
    });

    // Update tile numbers
    this.tileNums.forEach((t, i) => t.setText(String(this.arr[i])));

    if (cur) {
      this.rangeText.setText(
        `Active range: indices [${cur.lo}..${cur.hi}]  →  values [${this.arr.slice(cur.lo, cur.hi + 1).join(', ')}]`
      );
      this.feedbackText.setText('Click any yellow tile to use it as the pivot.');
      this.feedbackText.setStyle({ color: '#64748b' });
    }

    if (this.pivots >= 3 && !this.solved) {
      this.autoBtn.setText(`  Auto-finish remaining ${this.ranges.length} sub-array${this.ranges.length > 1 ? 's' : ''}  `);
    }
  }

  handlePivot(i) {
    const cur = this._currentRange();
    if (!cur) return;
    if (i < cur.lo || i > cur.hi) {
      this.feedbackText.setText(`Pick from the yellow range [${cur.lo}..${cur.hi}].`);
      this.feedbackText.setStyle({ color: '#ef4444' });
      return;
    }

    this.waiting = true;
    const pivotVal = this.arr[i];
    const { arr: newArr, finalIdx } = lomuto(this.arr, cur.lo, cur.hi, i);
    this.arr = newArr;

    // Update display
    this.tileNums.forEach((t, idx) => t.setText(String(this.arr[idx])));
    this.settled.add(finalIdx);
    this.tileBgs[finalIdx].setFillStyle(0x14532d).setStrokeStyle(3, 0x4ade80);
    this.tileNums[finalIdx].setStyle({ color: '#4ade80' });

    this.pivots++;
    this.pivotsText.setText(`Pivots settled: ${this.pivots}`);
    this.resultText.setText(
      `Pivot ${pivotVal} → index [${finalIdx}] (final position).  Left: [${this.arr.slice(cur.lo, finalIdx).join(', ')}]  Right: [${this.arr.slice(finalIdx + 1, cur.hi + 1).join(', ')}]`
    );
    this.feedbackText.setStyle({ color: '#fbbf24' });

    // Remove current range, add sub-ranges
    this.ranges.shift();
    if (finalIdx - 1 >= cur.lo) this.ranges.unshift({ lo: cur.lo,      hi: finalIdx - 1 });
    if (finalIdx + 1 <= cur.hi)  this.ranges.push  ({ lo: finalIdx + 1, hi: cur.hi      });

    this.time.delayedCall(400, () => {
      this.waiting = false;
      if (this.ranges.length === 0) {
        this._sortDone();
      } else {
        this._refreshDisplay();
        if (this.pivots >= 3) {
          this.autoBtn.setText(`  Auto-finish remaining ${this.ranges.length} sub-array${this.ranges.length > 1 ? 's' : ''}  `);
        }
      }
    });
  }

  _autoComplete() {
    if (this.solved || this.ranges.length === 0) return;
    this.autoBtn.setText('');

    const step = () => {
      if (this.ranges.length === 0) { this._sortDone(); return; }
      const cur = this.ranges[0];
      if (cur.hi <= cur.lo) {
        // Single element — auto-settle
        this.settled.add(cur.lo);
        this.ranges.shift();
        this.time.delayedCall(80, step);
        return;
      }
      const midPivot = Math.floor((cur.lo + cur.hi) / 2);
      const { arr: newArr, finalIdx } = lomuto(this.arr, cur.lo, cur.hi, midPivot);
      this.arr = newArr;
      this.settled.add(finalIdx);
      this.ranges.shift();
      if (finalIdx - 1 >= cur.lo) this.ranges.unshift({ lo: cur.lo,      hi: finalIdx - 1 });
      if (finalIdx + 1 <= cur.hi)  this.ranges.push  ({ lo: finalIdx + 1, hi: cur.hi      });
      this._refreshDisplay();
      this.time.delayedCall(120, step);
    };
    step();
  }

  _sortDone() {
    this.solved = true;
    // Mark remaining singles green
    for (let i = 0; i < this.arr.length; i++) {
      this.tileBgs[i].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
      this.tileNums[i].setStyle({ color: '#4ade80' });
    }
    this.rangeText.setText('Sorted!');
    this.rangeText.setStyle({ color: '#4ade80' });
    this.feedbackText.setText(`Quicksort complete! Each pivot found its final position. O(n log n) average — pivot choice matters for balance.`);
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 96, 165, 250);
    this.autoBtn.setText('');

    this.time.delayedCall(700, () => {
      this.add.text(400, 470, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
