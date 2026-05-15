import MinigameBase from './MinigameBase.js';

// Binary Search — find 56 in sorted star registry
// [8, 14, 22, 31, 45, 56, 67, 78, 89, 95]
//  0   1   2   3   4   5   6   7   8   9
// Step 1: lo=0 hi=9 mid=4 → arr[4]=45 < 56 → go right
// Step 2: lo=5 hi=9 mid=7 → arr[7]=78 > 56 → go left
// Step 3: lo=5 hi=6 mid=5 → arr[5]=56 → FOUND!

const ARR    = [8, 14, 22, 31, 45, 56, 67, 78, 89, 95];
const TARGET = 56;

const TILE_W  = 60;
const TILE_H  = 50;
const TILE_GAP = 6;
const TILES_X  = 97;  // centre of tile[0]
const TILES_Y  = 240;

export default class BinarySearch extends MinigameBase {
  constructor() {
    super('BinarySearch');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.lo        = 0;
    this.hi        = ARR.length - 1;
    this.step      = 0;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'BinarySearch');

    this.add.text(W / 2, 34, 'Star Registry — Binary Search', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 64, `Find star ID  ${TARGET}  in the sorted registry.\nEach step: click the MIDDLE tile of the current search range.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Array tiles
    this.tileBgs  = [];
    this.tileNums = [];
    ARR.forEach((val, i) => {
      const cx = TILES_X + i * (TILE_W + TILE_GAP);
      const bg = this.add.rectangle(cx, TILES_Y, TILE_W, TILE_H, 0x1e293b)
        .setStrokeStyle(2, 0x334155)
        .setInteractive({ useHandCursor: true });
      const num = this.add.text(cx, TILES_Y - 6, String(val), {
        fontFamily: 'monospace', fontSize: '16px', color: '#94a3b8', fontStyle: 'bold',
      }).setOrigin(0.5);
      const idx = this.add.text(cx, TILES_Y + 16, `[${i}]`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#334155',
      }).setOrigin(0.5);

      bg.on('pointerover', () => { if (!this.solved) bg.setAlpha(0.8); });
      bg.on('pointerout',  () => { if (!this.solved) bg.setAlpha(1); });
      bg.on('pointerdown', () => { if (!this.solved) this.handleClick(i); });

      this.tileBgs.push(bg);
      this.tileNums.push({ num, idx });
    });

    // Range bracket
    this.rangeText = this.add.text(W / 2, 162, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#60a5fa',
      align: 'center',
    }).setOrigin(0.5);

    // Formula display
    this.formulaBox = this.add.rectangle(W / 2, 310, 600, 44, 0x0f172a)
      .setStrokeStyle(1, 0x1e3a5f);
    this.formulaText = this.add.text(W / 2, 310, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#60a5fa',
      align: 'center',
    }).setOrigin(0.5);

    // Comparison result
    this.compText = this.add.text(W / 2, 354, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#fbbf24',
      align: 'center',
    }).setOrigin(0.5);

    // Feedback
    this.feedbackText = this.add.text(W / 2, 390, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.stepLabel = this.add.text(W / 2, 422, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#334155',
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });

    this._refreshHighlights();
  }

  _refreshHighlights() {
    const mid = Math.floor((this.lo + this.hi) / 2);

    this.tileBgs.forEach((bg, i) => {
      if (i === mid) {
        bg.setFillStyle(0x1e4d7a).setStrokeStyle(2, 0x60a5fa);
        this.tileNums[i].num.setStyle({ color: '#f8fafc' });
      } else if (i >= this.lo && i <= this.hi) {
        bg.setFillStyle(0x0f2a4a).setStrokeStyle(2, 0x1e4d7a);
        this.tileNums[i].num.setStyle({ color: '#60a5fa' });
      } else {
        bg.setFillStyle(0x0d1117).setStrokeStyle(2, 0x1e293b);
        this.tileNums[i].num.setStyle({ color: '#334155' });
      }
    });

    this.rangeText.setText(
      `Search range: [${this.lo}] = ${ARR[this.lo]}  …  [${this.hi}] = ${ARR[this.hi]}   |   mid = ⌊(${this.lo}+${this.hi})/2⌋ = ${mid}`
    );
    this.formulaText.setText(
      `arr[${mid}] = ${ARR[mid]}   ${ARR[mid] < TARGET ? '<' : ARR[mid] > TARGET ? '>' : '='} target ${TARGET}`
    );
    this.feedbackText.setText(`Click the highlighted mid tile [${mid}].`);
    this.feedbackText.setStyle({ color: '#64748b' });
    this.stepLabel.setText(`Step ${this.step + 1}`);
  }

  handleClick(i) {
    const mid = Math.floor((this.lo + this.hi) / 2);

    if (i !== mid) {
      this.feedbackText.setText(`That's not the midpoint. mid = ⌊(${this.lo}+${this.hi})/2⌋ = ${mid}.`);
      this.feedbackText.setStyle({ color: '#ef4444' });
      this.playIncorrectSfx();
      this.cameras.main.shake(160, 0.005);
      return;
    }

    this.step++;
    const val = ARR[mid];

    if (val === TARGET) {
      // Found!
      this.solved = true;
      this.tileBgs[mid].setFillStyle(0x14532d).setStrokeStyle(3, 0x4ade80);
      this.tileNums[mid].num.setStyle({ color: '#4ade80' });
      this.compText.setText(`arr[${mid}] = ${val} = ${TARGET} ✓`);
      this.compText.setStyle({ color: '#4ade80' });
      this.feedbackText.setText(`FOUND in ${this.step} step${this.step > 1 ? 's' : ''}! Binary search: O(log n) — only ${this.step} comparisons for ${ARR.length} elements.`);
      this.feedbackText.setStyle({ color: '#4ade80' });
      this.cameras.main.flash(400, 96, 165, 250);

      this.time.delayedCall(700, () => {
        this.add.text(400, 470, 'Continue  →', {
          fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
          backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.finish(true));
      });
    } else {
      // Narrow range
      const dir = val < TARGET ? 'right →' : '← left';
      this.compText.setText(`arr[${mid}] = ${val} ${val < TARGET ? '<' : '>'} ${TARGET} — search ${dir}`);
      this.compText.setStyle({ color: '#fbbf24' });

      if (val < TARGET) this.lo = mid + 1;
      else              this.hi = mid - 1;

      this.time.delayedCall(500, () => this._refreshHighlights());
    }
  }

}
