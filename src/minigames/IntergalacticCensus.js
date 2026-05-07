import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

// Merge Sort — Merge two sorted star-system lists into one
// Alpha: [3, 7, 11, 22, 35]
// Beta:  [5, 9, 15, 27, 41]
// Merged: [3, 5, 7, 9, 11, 15, 22, 27, 35, 41]

const ALPHA  = [3, 7, 11, 22, 35];
const BETA   = [5, 9, 15, 27, 41];

export default class IntergalacticCensus extends Phaser.Scene {
  constructor() {
    super('IntergalacticCensus');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.aIdx      = 0;   // front pointer for Alpha
    this.bIdx      = 0;   // front pointer for Beta
    this.merged    = [];
    this.waiting   = false;
  }

  create() {
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x050b18);

    // Title
    this.add.text(W / 2, 30, 'Intergalactic Census — Merge Sort', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 58, `Both star systems sent sorted population data.\nMerge them: always pick the SMALLER front value from either list.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // ── Alpha list ─────────────────────────────────────────────────────────
    this.add.text(200, 96, 'System ALPHA  α', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#60a5fa',
    }).setOrigin(0.5);

    this.alphaBgs  = [];
    this.alphaNums = [];
    ALPHA.forEach((val, i) => {
      const cx = 76 + i * 62;
      const bg = this.add.rectangle(cx, 138, 54, 44, 0x0f2a4a).setStrokeStyle(2, 0x1e4d7a);
      const num = this.add.text(cx, 138, String(val), {
        fontFamily: 'monospace', fontSize: '18px', color: '#60a5fa', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.alphaBgs.push(bg);
      this.alphaNums.push(num);
    });

    // ── Beta list ──────────────────────────────────────────────────────────
    this.add.text(600, 96, 'System BETA  β', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#34d399',
    }).setOrigin(0.5);

    this.betaBgs  = [];
    this.betaNums = [];
    BETA.forEach((val, i) => {
      const cx = 476 + i * 62;
      const bg = this.add.rectangle(cx, 138, 54, 44, 0x0d2f23).setStrokeStyle(2, 0x166534);
      const num = this.add.text(cx, 138, String(val), {
        fontFamily: 'monospace', fontSize: '18px', color: '#34d399', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.betaBgs.push(bg);
      this.betaNums.push(num);
    });

    // ── VS Prompt ──────────────────────────────────────────────────────────
    this.add.text(W / 2, 210, 'Which is smaller?', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
    }).setOrigin(0.5);

    // Large candidate cards
    this.alphaCard = this.add.text(230, 268, '', {
      fontFamily: 'sans-serif', fontSize: '52px', color: '#60a5fa', fontStyle: 'bold',
      backgroundColor: '#0f2a4a', padding: { x: 28, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.alphaCard.on('pointerdown', () => { if (!this.solved && !this.waiting) this.pick('alpha'); });

    this.add.text(W / 2, 268, 'vs', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#475569',
    }).setOrigin(0.5);

    this.betaCard = this.add.text(570, 268, '', {
      fontFamily: 'sans-serif', fontSize: '52px', color: '#34d399', fontStyle: 'bold',
      backgroundColor: '#0d2f23', padding: { x: 28, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.betaCard.on('pointerdown', () => { if (!this.solved && !this.waiting) this.pick('beta'); });

    // ── Merged result ──────────────────────────────────────────────────────
    this.add.text(W / 2, 362, 'Merged result:', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);

    this.mergedText = this.add.text(W / 2, 388, '[ ]', {
      fontFamily: 'monospace', fontSize: '16px', color: '#f8fafc',
      align: 'center',
    }).setOrigin(0.5);

    this.progressText = this.add.text(W / 2, 418, '0 / 10', {
      fontFamily: 'monospace', fontSize: '12px', color: '#334155',
    }).setOrigin(0.5);

    // Feedback
    this.feedbackText = this.add.text(W / 2, 450, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.add.text(W - 10, H - 10, 'Skip', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#334155',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(false));

    this._refreshCandidates();
  }

  _refreshCandidates() {
    const aLeft = this.aIdx < ALPHA.length;
    const bLeft = this.bIdx < BETA.length;

    if (aLeft) {
      this.alphaCard.setText(String(ALPHA[this.aIdx]));
      this.alphaBgs.forEach((bg, i) => {
        if (i < this.aIdx)      bg.setFillStyle(0x0d1117).setStrokeStyle(2, 0x1e293b);
        else if (i === this.aIdx) bg.setFillStyle(0x1e4d7a).setStrokeStyle(3, 0x60a5fa);
        else                    bg.setFillStyle(0x0f2a4a).setStrokeStyle(2, 0x1e4d7a);
      });
    } else {
      this.alphaCard.setText('—').setStyle({ color: '#334155' });
    }

    if (bLeft) {
      this.betaCard.setText(String(BETA[this.bIdx]));
      this.betaBgs.forEach((bg, i) => {
        if (i < this.bIdx)      bg.setFillStyle(0x0d1117).setStrokeStyle(2, 0x1e293b);
        else if (i === this.bIdx) bg.setFillStyle(0x14532d).setStrokeStyle(3, 0x34d399);
        else                    bg.setFillStyle(0x0d2f23).setStrokeStyle(2, 0x166534);
      });
    } else {
      this.betaCard.setText('—').setStyle({ color: '#334155' });
    }

    if (!aLeft) {
      // Drain remaining Beta
      this.feedbackText.setText('Alpha exhausted — append remaining Beta values.');
      this.feedbackText.setStyle({ color: '#64748b' });
    } else if (!bLeft) {
      this.feedbackText.setText('Beta exhausted — append remaining Alpha values.');
      this.feedbackText.setStyle({ color: '#64748b' });
    } else {
      const a = ALPHA[this.aIdx], b = BETA[this.bIdx];
      const smaller = a < b ? `α ${a}` : `β ${b}`;
      this.feedbackText.setText(`Compare α${a} vs β${b} — click the smaller one.`);
      this.feedbackText.setStyle({ color: '#64748b' });
    }
  }

  pick(list) {
    const aLeft = this.aIdx < ALPHA.length;
    const bLeft = this.bIdx < BETA.length;

    // Determine correct pick
    let correct;
    if (!aLeft)      correct = 'beta';
    else if (!bLeft) correct = 'alpha';
    else             correct = ALPHA[this.aIdx] <= BETA[this.bIdx] ? 'alpha' : 'beta';

    if (list !== correct) {
      const aVal = aLeft ? ALPHA[this.aIdx] : '—';
      const bVal = bLeft ? BETA[this.bIdx]  : '—';
      this.feedbackText.setText(
        `Wrong! ${list === 'alpha' ? aVal : bVal} is larger — pick the smaller one first.`
      );
      this.feedbackText.setStyle({ color: '#ef4444' });
      this.cameras.main.shake(160, 0.006);
      return;
    }

    this.waiting = true;
    const val = list === 'alpha' ? ALPHA[this.aIdx++] : BETA[this.bIdx++];
    this.merged.push(val);

    this.mergedText.setText(`[ ${this.merged.join(', ')} ]`);
    this.progressText.setText(`${this.merged.length} / ${ALPHA.length + BETA.length}`);
    this.feedbackText.setText(`Picked ${val} ✓`);
    this.feedbackText.setStyle({ color: '#4ade80' });

    // Check if one list is exhausted — drain the other automatically
    const aLeft2 = this.aIdx < ALPHA.length;
    const bLeft2 = this.bIdx < BETA.length;

    if (!aLeft2 && bLeft2) {
      // Drain Beta
      this.time.delayedCall(400, () => {
        while (this.bIdx < BETA.length) this.merged.push(BETA[this.bIdx++]);
        this.mergedText.setText(`[ ${this.merged.join(', ')} ]`);
        this.progressText.setText(`${this.merged.length} / ${ALPHA.length + BETA.length}`);
        this.waiting = false;
        this._checkComplete();
      });
    } else if (!bLeft2 && aLeft2) {
      // Drain Alpha
      this.time.delayedCall(400, () => {
        while (this.aIdx < ALPHA.length) this.merged.push(ALPHA[this.aIdx++]);
        this.mergedText.setText(`[ ${this.merged.join(', ')} ]`);
        this.progressText.setText(`${this.merged.length} / ${ALPHA.length + BETA.length}`);
        this.waiting = false;
        this._checkComplete();
      });
    } else {
      this.time.delayedCall(300, () => {
        this.waiting = false;
        this._checkComplete();
      });
    }
  }

  _checkComplete() {
    if (this.merged.length === ALPHA.length + BETA.length) {
      this._finish();
    } else {
      this._refreshCandidates();
    }
  }

  _finish() {
    this.solved = true;
    this.alphaCard.disableInteractive().setAlpha(0.3);
    this.betaCard.disableInteractive().setAlpha(0.3);

    this.feedbackText.setText(
      `Merge complete! ${ALPHA.length + BETA.length} records merged in sorted order — O(n) comparisons. Merge Sort is O(n log n) overall.`
    );
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.mergedText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(500, 96, 165, 250);

    this.time.delayedCall(800, () => {
      this.add.text(400, 540, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

  finish(success) {
    EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
    this.scene.resume('GameScene');
    this.scene.stop('IntergalacticCensus');
  }
}
