import MinigameBase from './MinigameBase.js';

// Middle School Procedure: Prime Factorization of 60
// 60 → ÷2 → 30 → ÷2 → 15 → ÷3 → 5 (prime)
// Result: 2 × 2 × 3 × 5

const PRIMES = [2, 3, 5, 7];
const TARGET = 60;

export default class MiddleSchool extends MinigameBase {
  constructor() {
    super('MiddleSchool');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved = false;
    this.remaining = TARGET;
    this.factors = [];
  }

  create() {
    const W = 800, H = 600;

    this.createTablet(this.algorithm?.name || 'MiddleSchool');

    // Header
    this.add.text(W / 2, 36, 'Phone Security — Middle School Procedure', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 68, `Break ${TARGET} into its prime factors to build the encryption key.\nAlways divide by the SMALLEST prime that fits.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 580 },
    }).setOrigin(0.5);

    // Steps ladder (drawn dynamically)
    this.stepsContainer = this.add.container(0, 0);
    this.stepY = 140;

    // Current number display
    this._drawCurrentNumber();

    // Prime buttons
    this.add.text(W / 2, 420, 'Select the smallest prime that divides the current number:', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#64748b',
    }).setOrigin(0.5);

    this.primeButtons = [];
    PRIMES.forEach((p, i) => {
      const bx = 190 + i * 140;
      const bg = this.add.rectangle(bx, 470, 110, 52, 0x1e293b)
        .setStrokeStyle(2, 0x475569)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(bx, 470, String(p), {
        fontFamily: 'sans-serif', fontSize: '26px', color: '#e2e8f0', fontStyle: 'bold',
      }).setOrigin(0.5);

      bg.on('pointerover', () => { if (!this.solved) bg.setStrokeStyle(2, 0x38bdf8); });
      bg.on('pointerout',  () => { if (!this.solved) bg.setStrokeStyle(2, 0x475569); });
      bg.on('pointerdown', () => { if (!this.solved) this.handlePrime(p, bg, label); });
      this.primeButtons.push({ bg, label, prime: p });
    });

    // Factor chain display
    this.add.text(W / 2, 530, 'Factors found:', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#64748b',
    }).setOrigin(0.5);

    this.factorChainText = this.add.text(W / 2, 555, '—', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#38bdf8',
    }).setOrigin(0.5);

    // Feedback
    this.feedbackText = this.add.text(W / 2, 585, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#fbbf24',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    // Skip
    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });
  }

  _drawCurrentNumber() {
    if (this.currentNumText) this.currentNumText.destroy();
    if (this.currentNumLabel) this.currentNumLabel.destroy();

    const W = 800;
    const isPrime = this._isPrime(this.remaining);

    this.currentNumLabel = this.add.text(W / 2, 260, isPrime ? 'PRIME — done!' : 'Current number to divide:', {
      fontFamily: 'sans-serif', fontSize: '13px', color: isPrime ? '#4ade80' : '#64748b',
    }).setOrigin(0.5);

    this.currentNumText = this.add.text(W / 2, 320, String(this.remaining), {
      fontFamily: 'sans-serif', fontSize: '72px', color: isPrime ? '#4ade80' : '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  _isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  _updateFactorChain() {
    if (this.factors.length === 0) {
      this.factorChainText.setText('—');
    } else {
      this.factorChainText.setText(this.factors.join(' × '));
    }
  }

  handlePrime(p, btn, label) {
    if (this.remaining % p !== 0) {
      // Wrong choice
      this.feedbackText.setText(`${this.remaining} ÷ ${p} = ${(this.remaining / p).toFixed(2)} — not a whole number! Try a different prime.`);
      this.feedbackText.setStyle({ color: '#ef4444' });
      btn.setStrokeStyle(2, 0xef4444);
      this.cameras.main.shake(200, 0.007);
      this.time.delayedCall(500, () => btn.setStrokeStyle(2, 0x475569));
      return;
    }

    // Correct — add a step line
    const stepText = `  ${this.remaining}  ÷  ${p}  =  ${this.remaining / p}`;
    const sy = this.stepY + this.factors.length * 30;

    if (sy < 250) {
      this.add.text(400, sy, stepText, {
        fontFamily: 'monospace', fontSize: '15px', color: '#4ade80',
      }).setOrigin(0.5);

      // Arrow
      this.add.text(520, sy, '→', {
        fontFamily: 'sans-serif', fontSize: '14px', color: '#475569',
      }).setOrigin(0, 0.5);
    }

    this.remaining = this.remaining / p;
    this.factors.push(p);
    this.feedbackText.setText('');
    this._updateFactorChain();
    this._drawCurrentNumber();

    // Check if remaining is prime → we're done
    if (this._isPrime(this.remaining)) {
      this.factors.push(this.remaining);
      this._updateFactorChain();
      this._drawCurrentNumber();

      // Disable buttons
      this.solved = true;
      this.primeButtons.forEach(({ bg }) => bg.disableInteractive().setAlpha(0.35));

      this.feedbackText.setText(`${TARGET} = ${this.factors.join(' × ')}   Algorithm complete!`);
      this.feedbackText.setStyle({ color: '#4ade80' });
      this.cameras.main.flash(400, 74, 222, 128);

      this.time.delayedCall(700, () => {
        this.add.text(400, 585, 'Continue  →', {
          fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
          backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.finish(true));
      });
    }
  }

}
