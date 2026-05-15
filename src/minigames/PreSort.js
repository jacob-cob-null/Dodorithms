import MinigameBase from './MinigameBase.js';

// PreSorting: shows WHY we sort
// Phase 1: sequential search on unsorted [8,3,7,1,4,5,2,6] for target 5 → 6 comparisons
// Phase 2: sort the array (one click)
// Phase 3: binary search on sorted [1,2,3,4,5,6,7,8] for target 5 → 3 comparisons

const UNSORTED = [8, 3, 7, 1, 4, 5, 2, 6];
const SORTED   = [1, 2, 3, 4, 5, 6, 7, 8];
const TARGET   = 5;

const TILE_W  = 60;
const TILE_H  = 46;
const TILE_GAP = 6;
const TILES_X  = 97;
const TILES_Y  = 195;

export default class PreSort extends MinigameBase {
  constructor() { super('PreSort'); }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.phase     = 1;  // 1=sequential, 2=sorted, 3=binary
    this.seqIdx    = 0;
    this.bsLo      = 0;
    this.bsHi      = SORTED.length - 1;
    this.seqComps  = 0;
    this.bsComps   = 0;
    this.waiting   = false;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'PreSort');

    this.add.text(W / 2, 30, 'Cargo Manifest — PreSorting', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 58, `Find cargo item  #${TARGET}  in the manifest.\nFirst unsorted (slow), then sorted (fast) — see the difference!`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Phase indicator
    this.phaseText = this.add.text(W / 2, 96, 'Phase 1 — Unsorted: Sequential Search', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#fbbf24',
    }).setOrigin(0.5);

    // Tiles
    this.tileBgs  = [];
    this.tileNums = [];
    const arr = UNSORTED;
    arr.forEach((val, i) => {
      const cx = TILES_X + i * (TILE_W + TILE_GAP);
      const bg = this.add.rectangle(cx, TILES_Y, TILE_W, TILE_H, 0x1e293b).setStrokeStyle(2, 0x334155);
      const num = this.add.text(cx, TILES_Y, String(val), {
        fontFamily: 'monospace', fontSize: '18px', color: '#94a3b8', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tileBgs.push(bg);
      this.tileNums.push(num);
    });

    // Pointer arrow
    this.pointerText = this.add.text(TILES_X, TILES_Y + TILE_H / 2 + 14, '▲', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#38bdf8',
    }).setOrigin(0.5).setAlpha(0);

    // Comparison result
    this.compResult = this.add.text(W / 2, TILES_Y + TILE_H / 2 + 34, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fbbf24', align: 'center',
    }).setOrigin(0.5);

    // Stats bar
    this.statsText = this.add.text(W / 2, 286, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      align: 'center',
    }).setOrigin(0.5);

    // Action button
    this.actionBtn = this.add.text(W / 2, 334, '  Scan Next  ', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#0f172a',
      backgroundColor: '#fbbf24', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.actionBtn.on('pointerdown', () => { if (!this.solved && !this.waiting) this.onAction(); });

    // Comparison table (shown at end)
    this.tableText = this.add.text(W / 2, 400, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#94a3b8',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(W / 2, 460, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });

    this.statsText.setText(`Target: #${TARGET}   |   Comparisons: 0`);
  }

  onAction() {
    if (this.phase === 1) this._seqScan();
    else if (this.phase === 2) this._sortArray();
    else if (this.phase === 3) this._binaryStep();
  }

  _seqScan() {
    if (this.seqIdx >= UNSORTED.length) return;
    const val = UNSORTED[this.seqIdx];
    this.seqComps++;

    // Highlight current tile
    this.tileBgs.forEach((bg, i) => {
      if (i < this.seqIdx)       bg.setFillStyle(0x1a3a4a).setStrokeStyle(2, 0x334155);
      else if (i === this.seqIdx) bg.setFillStyle(0x1e4d7a).setStrokeStyle(2, 0x38bdf8);
      else                       bg.setFillStyle(0x1e293b).setStrokeStyle(2, 0x334155);
    });
    this.pointerText.setAlpha(1).x = TILES_X + this.seqIdx * (TILE_W + TILE_GAP);
    this.statsText.setText(`Target: #${TARGET}   |   Comparisons: ${this.seqComps}`);

    if (val === TARGET) {
      this.tileBgs[this.seqIdx].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
      this.tileNums[this.seqIdx].setStyle({ color: '#4ade80' });
      this.compResult.setText(`Found #${TARGET} at index [${this.seqIdx}] after ${this.seqComps} comparisons!`);
      this.compResult.setStyle({ color: '#4ade80' });
      this.actionBtn.setText('  Sort the Manifest!  ');
      this.actionBtn.setStyle({ backgroundColor: '#a855f7', color: '#f8fafc' });
      this.feedbackText.setText(`Sequential search needed ${this.seqComps} comparisons on unsorted data.\nNow sort first — then we can do better.`);
      this.feedbackText.setStyle({ color: '#fbbf24' });
      this.phase = 2;
    } else {
      this.compResult.setText(`arr[${this.seqIdx}] = ${val} ≠ ${TARGET}`);
      this.compResult.setStyle({ color: '#ef4444' });
      this.seqIdx++;
    }
  }

  _sortArray() {
    this.phase = 3;
    this.bsLo = 0;
    this.bsHi = SORTED.length - 1;
    this.compResult.setText('');
    this.pointerText.setAlpha(0);

    // Update tiles to sorted array
    SORTED.forEach((val, i) => {
      this.tileNums[i].setText(String(val));
      this.tileBgs[i].setFillStyle(0x1e293b).setStrokeStyle(2, 0x334155);
      this.tileNums[i].setStyle({ color: '#94a3b8' });
    });

    this.phaseText.setText('Phase 3 — Sorted: Binary Search');
    this.phaseText.setStyle({ color: '#60a5fa' });
    this.actionBtn.setText('  Check Midpoint  ');
    this.actionBtn.setStyle({ backgroundColor: '#60a5fa', color: '#0f172a' });
    this.statsText.setText(`Target: #${TARGET}   |   Binary comparisons: 0`);
    this.feedbackText.setText('Array sorted! Now use binary search — click the midpoint each step.');
    this.feedbackText.setStyle({ color: '#60a5fa' });
  }

  _binaryStep() {
    const mid = Math.floor((this.bsLo + this.bsHi) / 2);
    this.bsComps++;

    // Highlight range and mid
    this.tileBgs.forEach((bg, i) => {
      if (i === mid)                              bg.setFillStyle(0x1e4d7a).setStrokeStyle(3, 0x60a5fa);
      else if (i >= this.bsLo && i <= this.bsHi) bg.setFillStyle(0x0f2a4a).setStrokeStyle(2, 0x1e4d7a);
      else                                        bg.setFillStyle(0x0d1117).setStrokeStyle(2, 0x1e293b);
    });

    const val = SORTED[mid];
    this.statsText.setText(`Target: #${TARGET}   |   Binary comparisons: ${this.bsComps}`);
    this.compResult.setText(`arr[${mid}] = ${val} ${val < TARGET ? '<' : val > TARGET ? '>' : '='} ${TARGET}`);

    if (val === TARGET) {
      this.tileBgs[mid].setFillStyle(0x14532d).setStrokeStyle(3, 0x4ade80);
      this.tileNums[mid].setStyle({ color: '#4ade80' });
      this.compResult.setStyle({ color: '#4ade80' });
      this._finish();
    } else {
      this.compResult.setStyle({ color: '#fbbf24' });
      if (val < TARGET) this.bsLo = mid + 1;
      else              this.bsHi = mid - 1;
    }
  }

  _finish() {
    this.solved = true;
    this.actionBtn.setAlpha(0);
    this.phaseText.setText('PreSorting pays off!');
    this.phaseText.setStyle({ color: '#4ade80' });
    this.tableText.setText(
      `Sequential (unsorted):  ${this.seqComps} comparisons\n` +
      `Binary Search (sorted): ${this.bsComps} comparisons\n` +
      `→ Sort once, search many times in O(log n)!`
    );
    this.tableText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 96, 165, 250);

    this.time.delayedCall(700, () => {
      this.add.text(400, 530, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
