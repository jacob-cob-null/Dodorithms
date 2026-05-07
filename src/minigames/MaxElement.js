import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

const READINGS = [42, 67, 31, 89, 55, 73, 28, 61];
const LABELS   = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const MAX_VAL  = Math.max(...READINGS); // 89

export default class MaxElement extends Phaser.Scene {
  constructor() {
    super('MaxElement');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.scanning  = false;
    this.scanIdx   = 0;   // next bar to check
    this.maxIdx    = 0;   // index of current assumed max
    this.maxVal    = READINGS[0];
  }

  create() {
    const W = 800, H = 600;
    const BAR_W   = 60;
    const BAR_GAP = 14;
    const CHART_X = 80;   // left edge of first bar
    const BASE_Y  = 390;  // y where bars sit
    const SCALE   = 2.2;  // px per unit

    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    this.add.text(W / 2, 36, 'Peak Wind Scanner', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 66, `Assume the FIRST reading is the highest. Scan each one — update if you find bigger.\nFind the peak wind speed before Dodo flies.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 620 },
    }).setOrigin(0.5);

    // Chart base line
    const g = this.add.graphics();
    g.lineStyle(2, 0x334155, 1);
    g.lineBetween(CHART_X - 10, BASE_Y + 4, CHART_X + READINGS.length * (BAR_W + BAR_GAP) + 10, BASE_Y + 4);

    // Draw bars
    this.barGraphics = [];
    this.barLabels   = [];
    this.valLabels   = [];

    READINGS.forEach((val, i) => {
      const bx = CHART_X + i * (BAR_W + BAR_GAP);
      const bh = val * SCALE;

      const bg = this.add.graphics();
      bg.fillStyle(0x1e4d7a, 1);
      bg.fillRect(bx, BASE_Y - bh, BAR_W, bh);
      this.barGraphics.push(bg);

      this.valLabels.push(
        this.add.text(bx + BAR_W / 2, BASE_Y - bh - 14, String(val), {
          fontFamily: 'monospace', fontSize: '11px', color: '#475569',
        }).setOrigin(0.5)
      );

      this.barLabels.push(
        this.add.text(bx + BAR_W / 2, BASE_Y + 14, LABELS[i], {
          fontFamily: 'sans-serif', fontSize: '11px', color: '#64748b',
        }).setOrigin(0.5)
      );
    });

    // Highlight first bar as assumed max
    this._highlightMax(0);
    this._highlightScanning(0);

    // Max tracker
    this.add.text(W / 2, 418, 'Current assumed max:', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#64748b',
    }).setOrigin(0.5);

    this.maxText = this.add.text(W / 2, 442, `${this.maxVal} km/h  (${LABELS[this.maxIdx]})`, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#fbbf24', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Check Next button
    this.checkBtn = this.add.text(W / 2, 490, '  Check Next Reading  ', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#0f172a',
      backgroundColor: '#38bdf8', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.checkBtn.on('pointerover', () => { if (!this.solved) this.checkBtn.setStyle({ backgroundColor: '#7dd3fc' }); });
    this.checkBtn.on('pointerout',  () => { if (!this.solved) this.checkBtn.setStyle({ backgroundColor: '#38bdf8' }); });
    this.checkBtn.on('pointerdown', () => { if (!this.solved && !this.scanning) this.checkNext(); });

    this.feedbackText = this.add.text(W / 2, 538, `Start: assume ${LABELS[0]} (${READINGS[0]}) is the max.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    this.add.text(W - 10, H - 10, 'Skip', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#334155',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(false));
  }

  _highlightMax(idx) {
    const BAR_W = 60, BAR_GAP = 14, CHART_X = 80, BASE_Y = 390, SCALE = 2.2;
    this.barGraphics.forEach((bg, i) => {
      bg.clear();
      const bx = CHART_X + i * (BAR_W + BAR_GAP);
      const bh = READINGS[i] * SCALE;
      if (i === idx) {
        bg.fillStyle(0xf59e0b, 1);
      } else if (i < this.scanIdx) {
        bg.fillStyle(0x1e3a5f, 0.8);
      } else {
        bg.fillStyle(0x1e4d7a, 1);
      }
      bg.fillRect(bx, BASE_Y - bh, BAR_W, bh);
    });
  }

  _highlightScanning(idx) {
    const BAR_W = 60, BAR_GAP = 14, CHART_X = 80, BASE_Y = 390, SCALE = 2.2;
    if (this.scanMarker) this.scanMarker.destroy();
    const bx = CHART_X + idx * (BAR_W + BAR_GAP);
    const bh = READINGS[idx] * SCALE;
    this.scanMarker = this.add.graphics();
    this.scanMarker.lineStyle(2, 0x38bdf8, 0.9);
    this.scanMarker.strokeRect(bx - 2, BASE_Y - bh - 2, BAR_W + 4, bh + 4);
  }

  checkNext() {
    this.scanning = true;
    this.scanIdx++;

    if (this.scanIdx >= READINGS.length) {
      this._finishScan();
      return;
    }

    const val = READINGS[this.scanIdx];
    this._highlightScanning(this.scanIdx);

    if (val > this.maxVal) {
      // New max found!
      this.maxVal = val;
      this.maxIdx = this.scanIdx;
      this._highlightMax(this.maxIdx);
      this.maxText.setText(`${this.maxVal} km/h  (${LABELS[this.maxIdx]})`);
      this.feedbackText.setText(`${val} > previous max! New max = ${val} km/h`);
      this.feedbackText.setStyle({ color: '#4ade80' });
    } else {
      this.feedbackText.setText(`${val} ≤ ${this.maxVal} — current max holds.`);
      this.feedbackText.setStyle({ color: '#64748b' });
      this._highlightMax(this.maxIdx);
    }

    if (this.scanIdx === READINGS.length - 1) {
      this.time.delayedCall(400, () => this._finishScan());
    } else {
      this.scanning = false;
    }
  }

  _finishScan() {
    this.solved = true;
    this.checkBtn.setAlpha(0);
    if (this.scanMarker) this.scanMarker.destroy();

    // Glow the max bar
    this._highlightMax(this.maxIdx);
    this.valLabels[this.maxIdx].setStyle({ color: '#fbbf24', fontSize: '13px' });

    this.feedbackText.setText(
      `Peak wind: ${MAX_VAL} km/h from ${LABELS[this.maxIdx]}  —  found in one pass, O(n).`
    );
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 251, 191, 36);

    this.time.delayedCall(700, () => {
      this.add.text(400, 568, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

  finish(success) {
    EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
    this.scene.resume('GameScene');
    this.scene.stop('MaxElement');
  }
}
