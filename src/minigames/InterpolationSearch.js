import MinigameBase from './MinigameBase.js';

// Interpolation Search on primes — find 17
// [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
//  0  1  2  3   4   5   6   7   8   9
// Step 1: lo=0 hi=9 → pos = 0 + ⌊(17-2)*9/(29-2)⌋ = ⌊135/27⌋ = 5 → arr[5]=13 < 17 → lo=6
// Step 2: lo=6 hi=9 → pos = 6 + ⌊(17-17)*3/(29-17)⌋ = 6 → arr[6]=17 → FOUND!

const ARR    = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
const TARGET = 17;

const TILE_W  = 60;
const TILE_H  = 50;
const TILE_GAP = 6;
const TILES_X  = 97;
const TILES_Y  = 210;

export default class InterpolationSearch extends MinigameBase {
  constructor() {
    super('InterpolationSearch');
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
    this.createTablet(this.algorithm?.name || 'InterpolationSearch');

    this.add.text(W / 2, 32, 'Space Phonebook — Interpolation Search', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 60, `Find alien ID  ${TARGET}  in the registry. Unlike binary search,\nwe ESTIMATE the position based on where the value probably sits.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 620 },
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

    // Formula panel
    this.add.rectangle(W / 2, 298, 720, 80, 0x0f172a).setStrokeStyle(1, 0x1e3a5f);

    this.formulaLine1 = this.add.text(W / 2, 274, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa', align: 'center',
    }).setOrigin(0.5);

    this.formulaLine2 = this.add.text(W / 2, 296, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fbbf24',
      fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);

    this.formulaLine3 = this.add.text(W / 2, 318, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8', align: 'center',
    }).setOrigin(0.5);

    // Comparison result
    this.compText = this.add.text(W / 2, 360, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#fbbf24', align: 'center',
    }).setOrigin(0.5);

    // Feedback + confirm button
    this.feedbackText = this.add.text(W / 2, 398, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.checkBtn = this.add.text(W / 2, 448, '  Check Estimated Position  ', {
      fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
      backgroundColor: '#60a5fa', padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.checkBtn.on('pointerover', () => { if (!this.solved) this.checkBtn.setStyle({ backgroundColor: '#93c5fd' }); });
    this.checkBtn.on('pointerout',  () => { if (!this.solved) this.checkBtn.setStyle({ backgroundColor: '#60a5fa' }); });
    this.checkBtn.on('pointerdown', () => { if (!this.solved) this.checkEstimate(); });

    this.stepLabel = this.add.text(W / 2, 494, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#334155',
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });

    this._refreshDisplay();
  }

  _calcPos() {
    const lo = this.lo, hi = this.hi;
    if (ARR[hi] === ARR[lo]) return lo;
    return lo + Math.floor((TARGET - ARR[lo]) * (hi - lo) / (ARR[hi] - ARR[lo]));
  }

  _refreshDisplay() {
    const lo = this.lo, hi = this.hi;
    const pos = this._calcPos();

    this.tileBgs.forEach((bg, i) => {
      if (i === pos) {
        bg.setFillStyle(0x1e4d7a).setStrokeStyle(3, 0x60a5fa);
        this.tileNums[i].num.setStyle({ color: '#f8fafc' });
      } else if (i >= lo && i <= hi) {
        bg.setFillStyle(0x0f2a4a).setStrokeStyle(2, 0x1e4d7a);
        this.tileNums[i].num.setStyle({ color: '#60a5fa' });
      } else {
        bg.setFillStyle(0x0d1117).setStrokeStyle(2, 0x1e293b);
        this.tileNums[i].num.setStyle({ color: '#334155' });
      }
    });

    const denom = ARR[hi] - ARR[lo];
    this.formulaLine1.setText(
      `pos = lo + ⌊(target − arr[lo]) × (hi − lo) / (arr[hi] − arr[lo])⌋`
    );
    this.formulaLine2.setText(
      `pos = ${lo} + ⌊(${TARGET} − ${ARR[lo]}) × (${hi} − ${lo}) / (${ARR[hi]} − ${ARR[lo]})⌋ = ${lo} + ⌊${(TARGET - ARR[lo]) * (hi - lo)} / ${denom}⌋ = ${pos}`
    );
    this.formulaLine3.setText(
      `arr[${pos}] = ${ARR[pos]}   |   target = ${TARGET}   |   range: [${lo}..${hi}]`
    );

    this.feedbackText.setText(`Formula estimates position ${pos}. Click "Check" to look there.`);
    this.feedbackText.setStyle({ color: '#64748b' });
    this.stepLabel.setText(`Step ${this.step + 1}`);
    this.compText.setText('');
  }

  checkEstimate() {
    const pos = this._calcPos();
    const val = ARR[pos];
    this.step++;

    if (val === TARGET) {
      this.solved = true;
      this.checkBtn.setAlpha(0);
      this.tileBgs[pos].setFillStyle(0x14532d).setStrokeStyle(3, 0x4ade80);
      this.tileNums[pos].num.setStyle({ color: '#4ade80' });
      this.compText.setText(`arr[${pos}] = ${val} = ${TARGET} ✓ FOUND!`);
      this.compText.setStyle({ color: '#4ade80' });
      this.feedbackText.setText(`Found in ${this.step} step${this.step > 1 ? 's' : ''}! Interpolation can be O(log log n) on uniform data — faster than binary search.`);
      this.feedbackText.setStyle({ color: '#4ade80' });
      this.cameras.main.flash(400, 96, 165, 250);

      this.time.delayedCall(700, () => {
        this.add.text(400, 540, 'Continue  →', {
          fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
          backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.finish(true));
      });
    } else {
      const dir = val < TARGET ? 'right →' : '← left';
      this.compText.setText(`arr[${pos}] = ${val} ${val < TARGET ? '<' : '>'} ${TARGET} — search ${dir}`);
      this.compText.setStyle({ color: '#fbbf24' });
      if (val < TARGET) this.lo = pos + 1;
      else              this.hi = pos - 1;
      this.time.delayedCall(600, () => this._refreshDisplay());
    }
  }

  handleClick(i) {
    // Clicking a tile shows its value in context but doesn't advance — button does
    const pos = this._calcPos();
    if (i === pos) {
      this.feedbackText.setText(`That's the estimated position! Click "Check" to confirm.`);
      this.feedbackText.setStyle({ color: '#60a5fa' });
    } else {
      this.feedbackText.setText(`The formula estimates position ${pos}. Use "Check Estimated Position" to probe it.`);
      this.feedbackText.setStyle({ color: '#64748b' });
    }
  }

}
