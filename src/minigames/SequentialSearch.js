import MinigameBase from './MinigameBase.js';

const RECORDS = [
  { name: 'Zyx-7',    status: 'Earth Tourist',  valid: true  },
  { name: 'Blorp',    status: 'Research Visa',   valid: true  },
  { name: 'Krix',     status: 'Earth Tourist',  valid: true  },
  { name: 'Nebb',     status: 'Earth Tourist',  valid: true  },
  { name: 'HACK-404', status: 'UNAUTHORIZED',   valid: false }, // fraud at index 4
  { name: 'Quell',    status: 'Earth Tourist',  valid: true  },
  { name: 'Flux-9',   status: 'Trade Permit',   valid: true  },
  { name: 'Dorb',     status: 'Earth Tourist',  valid: true  },
];

export default class SequentialSearch extends MinigameBase {
  constructor() {
    super('SequentialSearch');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.scanning  = false;
    this.idx       = -1;
  }

  create() {
    const W = 800, H = 600;

    this.createTablet(this.algorithm?.name || 'SequentialSearch');

    this.add.text(W / 2, 36, 'The Visa Fraud', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 66, 'Logs are unsorted — scan every entry from the top until the fraud is found.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center',
    }).setOrigin(0.5);

    // Column headers
    [['#', 90], ['Name', 240], ['Status', 460], ['Fee', 640]].forEach(([t, x]) => {
      this.add.text(x, 96, t, {
        fontFamily: 'monospace', fontSize: '11px', color: '#475569',
      }).setOrigin(0.5);
    });

    // Record rows
    this.rowBgs  = [];
    this.rowObjs = [];
    RECORDS.forEach((rec, i) => {
      const y = 120 + i * 36;
      const bg = this.add.rectangle(W / 2, y, 700, 30, 0x1e293b)
        .setStrokeStyle(1, 0x334155);
      const idxT  = this.add.text(90,  y, `[${i}]`,    { fontFamily: 'monospace', fontSize: '13px', color: '#475569' }).setOrigin(0.5);
      const nameT = this.add.text(240, y, rec.name,     { fontFamily: 'monospace', fontSize: '14px', color: '#e2e8f0' }).setOrigin(0.5);
      const statT = this.add.text(460, y, rec.status,   { fontFamily: 'monospace', fontSize: '13px', color: rec.valid ? '#94a3b8' : '#ef4444' }).setOrigin(0.5);
      const feeT  = this.add.text(640, y, rec.valid ? '✓' : '✗ SKIP', { fontFamily: 'monospace', fontSize: '13px', color: rec.valid ? '#4ade80' : '#ef4444' }).setOrigin(0.5);
      this.rowBgs.push(bg);
      this.rowObjs.push({ idxT, nameT, statT, feeT });
    });

    // Scan button
    this.scanBtn = this.add.text(W / 2, 430, '  Scan Next Entry  ', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#0f172a',
      backgroundColor: '#38bdf8', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.scanBtn.on('pointerover', () => { if (!this.solved) this.scanBtn.setStyle({ backgroundColor: '#7dd3fc' }); });
    this.scanBtn.on('pointerout',  () => { if (!this.solved) this.scanBtn.setStyle({ backgroundColor: '#38bdf8' }); });
    this.scanBtn.on('pointerdown', () => { if (!this.solved && !this.scanning) this.scanNext(); });

    this.counterText = this.add.text(W / 2, 472, 'Scanned: 0 / 8', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(W / 2, 500, 'Click "Scan Next Entry" to begin.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });
  }

  scanNext() {
    this.scanning = true;

    // Clear previous highlight
    if (this.idx >= 0) {
      const rec = RECORDS[this.idx];
      this.rowBgs[this.idx].setFillStyle(rec.valid ? 0x1e293b : 0x3b0a0a).setStrokeStyle(1, 0x334155);
    }

    this.idx++;
    if (this.idx >= RECORDS.length) {
      this.feedbackText.setText('End of list reached with no fraud found — data was clean.');
      this.scanning = false;
      return;
    }

    const rec = RECORDS[this.idx];
    this.counterText.setText(`Scanned: ${this.idx + 1} / ${RECORDS.length}`);
    this.rowBgs[this.idx].setFillStyle(0x1e4d7a).setStrokeStyle(2, 0x38bdf8);

    if (!rec.valid) {
      // Found fraud
      this.solved = true;
      this.rowBgs[this.idx].setFillStyle(0x7f1d1d).setStrokeStyle(2, 0xef4444);
      this.rowObjs[this.idx].nameT.setStyle({ color: '#ef4444' });
      this.scanBtn.setAlpha(0);
      this.cameras.main.shake(300, 0.01);

      this.feedbackText.setText(
        `FRAUD FOUND at index [${this.idx}]  —  needed ${this.idx + 1} comparisons out of ${RECORDS.length}.  O(n) worst case.`
      );
      this.feedbackText.setStyle({ color: '#4ade80' });

      this.time.delayedCall(700, () => {
        this.add.text(400, 548, 'Continue  →', {
          fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
          backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.finish(true));
      });
    } else {
      this.feedbackText.setText(`[${this.idx}] ${rec.name}: ${rec.status} — valid. Keep scanning.`);
      this.feedbackText.setStyle({ color: '#64748b' });
      this.scanning = false;
    }
  }

}
