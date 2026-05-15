import MinigameBase from './MinigameBase.js';

// Brute-Force String Matching
// Text:    G C A T A T A C G A T C G   (13 chars)
// Pattern: A T A C G                  (5 chars)
// Match at position 4: text[4..8] = ATACG
const TEXT    = 'GCATATACGATCG'.split('');
const PATTERN = 'ATACG'.split('');
const MATCH_POS = 4;

const CELL_W  = 46;
const CELL_H  = 44;
const TEXT_X  = 107; // center of first text cell
const TEXT_Y  = 195;
const PAT_Y   = 268;

export default class BiologicalClearance extends MinigameBase {
  constructor() {
    super('BiologicalClearance');
  }

  init(data) {
    this.algorithm  = data.algorithm;
    this.solved     = false;
    this.scanPos    = 0;   // current alignment position in text
    this.scanning   = false;
    this.totalComps = 0;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'BiologicalClearance');

    // Header
    this.add.text(W / 2, 32, 'Biological Clearance', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 62, `Match Dodo's DNA sequence against the sample — character by character.\nSlide the pattern until every character aligns.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Labels
    this.add.text(42, TEXT_Y, 'TEXT', {
      fontFamily: 'monospace', fontSize: '11px', color: '#475569',
    }).setOrigin(0.5);
    this.add.text(42, PAT_Y, 'PAT', {
      fontFamily: 'monospace', fontSize: '11px', color: '#22c55e',
    }).setOrigin(0.5);

    // Text cell backgrounds + chars
    this.textBgs   = [];
    this.textChars = [];
    TEXT.forEach((ch, i) => {
      const cx = TEXT_X + i * CELL_W;
      const bg = this.add.rectangle(cx, TEXT_Y, CELL_W - 4, CELL_H - 4, 0x1e293b)
        .setStrokeStyle(1, 0x334155);
      const txt = this.add.text(cx, TEXT_Y, ch, {
        fontFamily: 'monospace', fontSize: '20px', color: '#e2e8f0',
      }).setOrigin(0.5);
      this.textBgs.push(bg);
      this.textChars.push(txt);
    });

    // Index numbers below text cells
    TEXT.forEach((_, i) => {
      this.add.text(TEXT_X + i * CELL_W, TEXT_Y + CELL_H / 2 + 8, `${i}`, {
        fontFamily: 'monospace', fontSize: '9px', color: '#334155',
      }).setOrigin(0.5);
    });

    // Pattern cells (will be repositioned on shift)
    this.patBgs   = [];
    this.patChars = [];
    PATTERN.forEach((ch, i) => {
      const bg = this.add.rectangle(0, PAT_Y, CELL_W - 4, CELL_H - 4, 0x14532d)
        .setStrokeStyle(2, 0x22c55e);
      const txt = this.add.text(0, PAT_Y, ch, {
        fontFamily: 'monospace', fontSize: '20px', color: '#4ade80',
      }).setOrigin(0.5);
      this.patBgs.push(bg);
      this.patChars.push(txt);
    });
    this._alignPattern(0);

    // Position indicator
    this.posText = this.add.text(W / 2, 326, 'Position 0', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#64748b',
    }).setOrigin(0.5);

    // Scan button
    this.scanBtn = this.add.text(W / 2, 375, '  Compare at this position  ', {
      fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
      backgroundColor: '#22c55e', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.scanBtn.on('pointerover', () => { if (!this.solved) this.scanBtn.setStyle({ backgroundColor: '#4ade80' }); });
    this.scanBtn.on('pointerout',  () => { if (!this.solved) this.scanBtn.setStyle({ backgroundColor: '#22c55e' }); });
    this.scanBtn.on('pointerdown', () => { if (!this.solved && !this.scanning) this.compare(); });

    // Result cells row (shows ✓ or ✗ per character)
    this.resultChars = PATTERN.map((_, i) =>
      this.add.text(TEXT_X + (this.scanPos + i) * CELL_W, PAT_Y + CELL_H / 2 + 10, '', {
        fontFamily: 'monospace', fontSize: '12px', color: '#64748b',
      }).setOrigin(0.5)
    );

    this.feedbackText = this.add.text(W / 2, 430, 'Click "Compare" to check each character.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.compText = this.add.text(W / 2, 455, 'Total comparisons: 0', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });
  }

  _alignPattern(pos) {
    // Reposition pattern cell graphics
    PATTERN.forEach((_, i) => {
      const cx = TEXT_X + (pos + i) * CELL_W;
      this.patBgs[i].x   = cx;
      this.patChars[i].x = cx;
    });
    // Reset pattern cell colors
    this.patBgs.forEach(bg   => bg.setFillStyle(0x14532d).setStrokeStyle(2, 0x22c55e));
    this.patChars.forEach(ch => ch.setStyle({ color: '#4ade80' }));
    // Reset text cell highlights
    this.textBgs.forEach((bg, i) => {
      const inWindow = i >= this.scanPos && i < this.scanPos + PATTERN.length;
      bg.setFillStyle(inWindow ? 0x0c2a10 : 0x1e293b).setStrokeStyle(1, inWindow ? 0x22c55e : 0x334155);
    });
  }

  compare() {
    this.scanning = true;
    const pos = this.scanPos;

    // Clear previous result markers
    this.resultChars.forEach(rc => rc.setText(''));

    // Compare each character with a small delay between them
    let mismatchAt = -1;
    let step = 0;

    const compareNext = () => {
      if (step >= PATTERN.length) {
        // All matched!
        this._onFullMatch();
        return;
      }

      const textIdx = pos + step;
      const match   = TEXT[textIdx] === PATTERN[step];
      this.totalComps++;
      this.compText.setText(`Total comparisons: ${this.totalComps}`);

      // Color the pair
      this.textBgs[textIdx].setFillStyle(match ? 0x14532d : 0x7f1d1d)
        .setStrokeStyle(2, match ? 0x4ade80 : 0xef4444);
      this.textChars[textIdx].setStyle({ color: match ? '#4ade80' : '#ef4444' });
      this.patBgs[step].setFillStyle(match ? 0x14532d : 0x7f1d1d)
        .setStrokeStyle(2, match ? 0x4ade80 : 0xef4444);
      this.patChars[step].setStyle({ color: match ? '#4ade80' : '#ef4444' });

      if (!match) {
        mismatchAt = step;
        this.feedbackText.setText(
          `Mismatch at offset ${step}: text='${TEXT[textIdx]}' ≠ pattern='${PATTERN[step]}'. Shift right.`
        );
        this.feedbackText.setStyle({ color: '#ef4444' });
        this.playIncorrectSfx();

        // After showing the mismatch, auto-shift
        this.time.delayedCall(900, () => this._shift());
        return;
      }

      step++;
      this.time.delayedCall(280, compareNext);
    };

    compareNext();
  }

  _shift() {
    this.scanPos++;

    if (this.scanPos + PATTERN.length > TEXT.length) {
      // Ran off end — shouldn't happen with this text/pattern
      this.feedbackText.setText('Pattern not found in this sample.');
      this.scanning = false;
      return;
    }

    this._alignPattern(this.scanPos);
    this.posText.setText(`Position ${this.scanPos}`);
    this.feedbackText.setText(`Shifted to position ${this.scanPos}. Click "Compare" to try again.`);
    this.feedbackText.setStyle({ color: '#64748b' });
    this.scanning = false;
  }

  _onFullMatch() {
    this.solved = true;
    this.scanBtn.setAlpha(0);

    this.feedbackText.setText(
      `MATCH FOUND at position ${this.scanPos}!  "${PATTERN.join('')}" confirmed in Dodo's DNA.  Clearance granted.`
    );
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(500, 34, 197, 94);

    this.time.delayedCall(800, () => {
      this.add.text(400, 500, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
