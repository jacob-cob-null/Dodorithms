import MinigameBase from './MinigameBase.js';

// Consecutive Integer Check: GCD(60, 48)
// Start at t = min(a,b) = 48, step down until t divides both
const A = 60;
const B = 48;
const GCD = 12;

export default class ConsecutiveInt extends MinigameBase {
  constructor() {
    super('ConsecutiveInt');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved = false;
    this.candidate = B; // start at 48
    this.history = [];  // tested candidates
  }

  create() {
    const W = 800, H = 600;

    // Background
    this.createTablet(this.algorithm?.name || 'ConsecutiveInt');

    // Header
    this.add.text(W / 2, 36, 'The Gift Kits', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 70, `Split ${A} candies AND ${B} rocks into EQUAL kits — no leftovers.\nFind the LARGEST number of kits possible.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 580 },
    }).setOrigin(0.5);

    // Gift boxes
    this._drawGiftBox(210, 175, A, '🍬 Candies', 0xf59e0b);
    this._drawGiftBox(590, 175, B, '🪨 Rocks', 0x60a5fa);

    // Algorithm label
    this.add.text(W / 2, 175, '÷', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#475569',
    }).setOrigin(0.5);

    // Candidate display
    this.add.text(W / 2, 265, 'Current candidate', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
    }).setOrigin(0.5);

    this.candText = this.add.text(W / 2, 310, String(this.candidate), {
      fontFamily: 'sans-serif', fontSize: '64px', color: '#38bdf8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Division result line
    this.resultA = this.add.text(210, 390, '', {
      fontFamily: 'sans-serif', fontSize: '17px', color: '#94a3b8',
    }).setOrigin(0.5);

    this.resultB = this.add.text(590, 390, '', {
      fontFamily: 'sans-serif', fontSize: '17px', color: '#94a3b8',
    }).setOrigin(0.5);

    // History row (small chips)
    this.histContainer = this.add.container(W / 2, 440);
    this.histLabel = this.add.text(W / 2, 423, '', {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#334155',
    }).setOrigin(0.5);

    // Test button
    this.testBtn = this.add.text(W / 2, 498, `  Test ÷ ${this.candidate}  `, {
      fontFamily: 'sans-serif', fontSize: '19px', color: '#0f172a',
      backgroundColor: '#38bdf8', padding: { x: 32, y: 11 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.testBtn.on('pointerover', () => {
      if (!this.solved) this.testBtn.setStyle({ backgroundColor: '#7dd3fc' });
    });
    this.testBtn.on('pointerout',  () => {
      if (!this.solved) this.testBtn.setStyle({ backgroundColor: '#38bdf8' });
    });
    this.testBtn.on('pointerdown', () => {
      if (!this.solved && !this.testing) this.testCandidate();
    });

    // Feedback / status
    this.feedbackText = this.add.text(W / 2, 560, 'Click "Test" to check if this number divides both gifts evenly.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    // Skip
    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });
  }

  _drawGiftBox(cx, cy, count, label, color) {
    const g = this.add.graphics();
    g.fillStyle(color, 0.15);
    g.fillRoundedRect(cx - 80, cy - 46, 160, 92, 8);
    g.lineStyle(2, color, 0.6);
    g.strokeRoundedRect(cx - 80, cy - 46, 160, 92, 8);
    this.add.text(cx, cy - 18, String(count), {
      fontFamily: 'sans-serif', fontSize: '34px', color: '#f8fafc', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, cy + 24, label, {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#94a3b8',
    }).setOrigin(0.5);
  }

  testCandidate() {
    this.testing = true;
    const t = this.candidate;
    const aOk = A % t === 0;
    const bOk = B % t === 0;

    // Show division result
    this.resultA.setText(`${A} ÷ ${t} = ${(A / t).toFixed(2).replace('.00', '')} ${aOk ? '✓' : '✗'}`);
    this.resultA.setStyle({ color: aOk ? '#4ade80' : '#ef4444' });

    this.resultB.setText(`${B} ÷ ${t} = ${(B / t).toFixed(2).replace('.00', '')} ${bOk ? '✓' : '✗'}`);
    this.resultB.setStyle({ color: bOk ? '#4ade80' : '#ef4444' });

    if (aOk && bOk) {
      // Found the GCD!
      this.solved = true;
      this.testBtn.setAlpha(0);
      this.feedbackText.setText(`GCD(${A}, ${B}) = ${t}  →  You can make ${t} equal kits!  (${A/t} candies + ${B/t} rocks each)`);
      this.feedbackText.setStyle({ color: '#4ade80', fontSize: '14px' });
      this.candText.setStyle({ color: '#4ade80' });

      this.cameras.main.flash(400, 74, 222, 128);

      this.time.delayedCall(700, () => {
        this.add.text(400, 560, 'Continue  →', {
          fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
          backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.finish(true));
      });

    } else {
      // Failed — record and step down
      this.history.push(t);
      this.feedbackText.setText(
        `${t} ${!aOk ? `doesn't divide ${A}` : `doesn't divide ${B}`} — try a smaller number.`
      );
      this.feedbackText.setStyle({ color: '#fbbf24' });
      this.cameras.main.shake(180, 0.005);

      // Update history chips (show last 10)
      const shown = this.history.slice(-10);
      this.histLabel.setText(`Tested: ${shown.join(', ')}`);

      this.time.delayedCall(550, () => {
        this.candidate--;
        if (this.candidate < 1) {
          // fallback (shouldn't happen for valid GCD)
          this.feedbackText.setText('No divisor found — something went wrong.');
          this.testing = false;
          return;
        }
        this.candText.setText(String(this.candidate));
        this.testBtn.setText(`  Test ÷ ${this.candidate}  `);
        this.resultA.setText('');
        this.resultB.setText('');
        this.feedbackText.setText('Click "Test" to check if this number divides both gifts evenly.');
        this.feedbackText.setStyle({ color: '#64748b' });
        this.testing = false;
      });
    }
  }

}
