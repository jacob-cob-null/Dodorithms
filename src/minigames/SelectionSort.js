import MinigameBase from './MinigameBase.js';

// Selection Sort: [5, 2, 8, 1, 9, 3]
// Each round: find minimum in unsorted portion, swap to front of unsorted
const INITIAL = [5, 2, 8, 1, 9, 3];

const TILE_W  = 72;
const TILE_H  = 56;
const TILE_GAP = 10;
const TILES_X  = 119; // x of first tile center
const TILES_Y  = 280;

export default class SelectionSort extends MinigameBase {
  constructor() {
    super('SelectionSort');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.arr       = [...INITIAL];
    this.round     = 0;          // sorted so far (left boundary)
    this.selected  = null;       // index user clicked
    this.waiting   = false;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'SelectionSort');

    this.add.text(W / 2, 34, 'Patient Priority — Selection Sort', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 66, `Sort patient severity scores from lowest to highest.\nEach round: click the MINIMUM score in the unsorted (blue) portion.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Round label
    this.roundText = this.add.text(W / 2, 112, 'Round 1 — find the minimum', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#38bdf8',
    }).setOrigin(0.5);

    // Tile graphics and labels
    this.tileBgs  = [];
    this.tileNums = [];
    for (let i = 0; i < this.arr.length; i++) {
      const cx = TILES_X + i * (TILE_W + TILE_GAP);
      const bg = this.add.rectangle(cx, TILES_Y, TILE_W, TILE_H, 0x1e4d7a)
        .setStrokeStyle(2, 0x38bdf8)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        if (!this.solved && !this.waiting && i >= this.round) bg.setStrokeStyle(2, 0x7dd3fc);
      });
      bg.on('pointerout', () => {
        if (!this.solved && i >= this.round) this._refreshTile(i);
      });
      bg.on('pointerdown', () => {
        if (!this.solved && !this.waiting && i >= this.round) this.handleClick(i);
      });
      const num = this.add.text(cx, TILES_Y, String(this.arr[i]), {
        fontFamily: 'sans-serif', fontSize: '26px', color: '#f8fafc', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tileBgs.push(bg);
      this.tileNums.push(num);
    }

    // Index labels below tiles
    for (let i = 0; i < this.arr.length; i++) {
      const cx = TILES_X + i * (TILE_W + TILE_GAP);
      this.add.text(cx, TILES_Y + TILE_H / 2 + 12, `[${i}]`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#475569',
      }).setOrigin(0.5);
    }

    // Sorted / unsorted region labels
    this.sortedLabel   = this.add.text(TILES_X, TILES_Y + TILE_H / 2 + 30, '', {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#4ade80',
    }).setOrigin(0.5);
    this.unsortedLabel = this.add.text(TILES_X, TILES_Y + TILE_H / 2 + 30, 'Unsorted →', {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#38bdf8',
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(W / 2, 390, 'Click the smallest number in the blue (unsorted) tiles.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    // Comparison count
    this.compText = this.add.text(W / 2, 418, `Comparisons: 0`, {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);
    this.comps = 0;

    // Swap log
    this.logText = this.add.text(W / 2, 445, '', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#64748b',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });
  }

  _findTrueMin() {
    let minIdx = this.round;
    for (let i = this.round + 1; i < this.arr.length; i++) {
      this.comps++;
      if (this.arr[i] < this.arr[minIdx]) minIdx = i;
    }
    this.comps++;
    this.compText.setText(`Comparisons: ${this.comps}`);
    return minIdx;
  }

  _refreshTile(i) {
    if (i < this.round) {
      this.tileBgs[i].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
    } else {
      this.tileBgs[i].setFillStyle(0x1e4d7a).setStrokeStyle(2, 0x38bdf8);
    }
  }

  handleClick(clickedIdx) {
    const trueMin = this._findTrueMin();

    if (clickedIdx !== trueMin) {
      // Wrong choice
      this.feedbackText.setText(
        `${this.arr[clickedIdx]} is not the minimum. Look for ${this.arr[trueMin]}!`
      );
      this.feedbackText.setStyle({ color: '#ef4444' });
      this.tileBgs[clickedIdx].setStrokeStyle(2, 0xef4444);
      this.playIncorrectSfx();
      this.cameras.main.shake(180, 0.006);
      this.time.delayedCall(500, () => this._refreshTile(clickedIdx));
      return;
    }

    // Correct — execute swap
    this.waiting = true;
    this.feedbackText.setStyle({ color: '#4ade80' });

    if (trueMin !== this.round) {
      this.feedbackText.setText(
        `Correct! Minimum is ${this.arr[trueMin]}. Swapping index [${trueMin}] ↔ [${this.round}].`
      );
      this.logText.setText(
        (this.logText.text + `  [${this.round}]↔[${trueMin}]`).trim()
      );
      // Swap in array
      [this.arr[this.round], this.arr[trueMin]] = [this.arr[trueMin], this.arr[this.round]];
    } else {
      this.feedbackText.setText(
        `Correct! ${this.arr[trueMin]} is already in position [${this.round}]. No swap needed.`
      );
    }

    // Update tile labels
    for (let i = 0; i < this.arr.length; i++) {
      this.tileNums[i].setText(String(this.arr[i]));
    }

    // Mark this.round as sorted (green)
    this.tileBgs[this.round].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
    this.tileNums[this.round].setStyle({ color: '#4ade80' });
    this.round++;

    if (this.round >= this.arr.length - 1) {
      // Last element auto-sorted
      this.tileBgs[this.round].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
      this.tileNums[this.round].setStyle({ color: '#4ade80' });
      this._finish();
      return;
    }

    this.roundText.setText(`Round ${this.round + 1} — find the minimum`);
    this.time.delayedCall(500, () => { this.waiting = false; });
  }

  _finish() {
    this.solved = true;
    this.roundText.setText('Sorted!  All rounds complete.');
    this.roundText.setStyle({ color: '#4ade80' });
    this.feedbackText.setText(
      `Selection Sort complete — O(n²) comparisons: ${this.comps}. Always scans the full unsorted portion.`
    );
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 74, 222, 128);

    this.time.delayedCall(700, () => {
      this.add.text(400, 490, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
