import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

// Landing pad: 18m × 12m  →  GCD = 6
const PAD_W_M = 18;
const PAD_H_M = 12;
const PX_PER_M = 20;
const PAD_W = PAD_W_M * PX_PER_M; // 360
const PAD_H = PAD_H_M * PX_PER_M; // 240
const TILE_OPTIONS = [2, 3, 4, 6];
const CORRECT = 6;

export default class ShatteredPad extends Phaser.Scene {
  constructor() {
    super('ShatteredPad');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved = false;
  }

  create() {
    const W = 800, H = 600;

    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    // Header
    this.add.text(W / 2, 38, '🏗  The Shattered Pad', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 72, `Landing pad is ${PAD_W_M}m × ${PAD_H_M}m.\nSelect the LARGEST square tile that fills it perfectly with no cutting.`, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Landing pad
    this.padCX = W / 2;
    this.padCY = 265;
    this.padGraphics = this.add.graphics();
    this.drawPadEmpty();

    // Dimension labels
    this.add.text(this.padCX, this.padCY - PAD_H / 2 - 14, `${PAD_W_M}m`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
    }).setOrigin(0.5, 1);
    this.add.text(this.padCX + PAD_W / 2 + 10, this.padCY, `${PAD_H_M}m`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
    }).setOrigin(0, 0.5);

    // Tile option buttons
    this.buttons = [];
    TILE_OPTIONS.forEach((size, i) => {
      const bx = 140 + i * 175;
      const by = 470;
      const bg = this.add.rectangle(bx, by, 130, 52, 0x1e293b)
        .setStrokeStyle(2, 0x475569)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(bx, by, `${size}m × ${size}m`, {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#e2e8f0',
      }).setOrigin(0.5);

      bg.on('pointerover', () => { if (!this.solved) bg.setStrokeStyle(2, 0x38bdf8); });
      bg.on('pointerout',  () => { if (!this.solved) bg.setStrokeStyle(2, 0x475569); });
      bg.on('pointerdown', () => { if (!this.solved) this.handleChoice(size, bg); });
      this.buttons.push({ bg, label, size });
    });

    // Feedback text
    this.feedbackText = this.add.text(W / 2, 520, '', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#fbbf24',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    // Skip
    this.add.text(W - 10, H - 10, 'Skip', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#334155',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(false));
  }

  drawPadEmpty() {
    const g = this.padGraphics;
    g.clear();
    g.fillStyle(0x1e293b, 1);
    g.fillRect(this.padCX - PAD_W / 2, this.padCY - PAD_H / 2, PAD_W, PAD_H);
    g.lineStyle(2, 0x38bdf8, 1);
    g.strokeRect(this.padCX - PAD_W / 2, this.padCY - PAD_H / 2, PAD_W, PAD_H);
  }

  handleChoice(size, btn) {
    const divides18 = PAD_W_M % size === 0;
    const divides12 = PAD_H_M % size === 0;
    const fits = divides18 && divides12;
    const isCorrect = size === CORRECT;

    if (isCorrect) {
      this.solved = true;
      this.drawTileGrid(size);
      this.feedbackText.setText(`✓  GCD(${PAD_W_M}, ${PAD_H_M}) = ${size}  —  fits as a ${PAD_W_M / size} × ${PAD_H_M / size} grid perfectly!`);
      this.feedbackText.setStyle({ color: '#4ade80' });
      btn.setStrokeStyle(2, 0x4ade80).setFillStyle(0x14532d);

      this.time.delayedCall(600, () => {
        this.feedbackText.setAlpha(0);
        this.add.text(400, 560, 'Continue  →', {
          fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
          backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.finish(true));
      });

    } else if (fits) {
      this.feedbackText.setText(`${size}m tiles fit — but is it the LARGEST possible tile? Think bigger!`);
      this.feedbackText.setStyle({ color: '#fbbf24' });
      this.drawTileGrid(size, 0x334155);

    } else {
      const bad = !divides18 ? PAD_W_M : PAD_H_M;
      this.feedbackText.setText(`✗  ${bad} ÷ ${size} = ${(bad / size).toFixed(1)} — that tile would need to be cut!`);
      this.feedbackText.setStyle({ color: '#ef4444' });
      this.cameras.main.shake(220, 0.008);
      this.drawPadEmpty();
    }
  }

  drawTileGrid(size, color = 0x166534) {
    const g = this.padGraphics;
    g.clear();
    const tilePx = size * PX_PER_M;
    const cols = PAD_W_M / size;
    const rows = PAD_H_M / size;
    const ox = this.padCX - PAD_W / 2;
    const oy = this.padCY - PAD_H / 2;
    const gap = 3;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.fillStyle(color, 1);
        g.fillRect(ox + c * tilePx + gap, oy + r * tilePx + gap, tilePx - gap * 2, tilePx - gap * 2);
        g.lineStyle(1, 0x4ade80, 0.4);
        g.strokeRect(ox + c * tilePx + gap, oy + r * tilePx + gap, tilePx - gap * 2, tilePx - gap * 2);
      }
    }
    g.lineStyle(2, 0x38bdf8, 1);
    g.strokeRect(ox, oy, PAD_W, PAD_H);
  }

  finish(success) {
    EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
    this.scene.resume('GameScene');
    this.scene.stop('ShatteredPad');
  }
}
