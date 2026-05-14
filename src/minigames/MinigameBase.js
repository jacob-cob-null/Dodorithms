import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

const FONT_MONO = { fontFamily: '"Courier New", Courier, monospace' };

export const TABLET = {
  x: 40,
  y: 20,
  w: 720,
  h: 560,
  headerH: 32,
  footerH: 28,
};

export const CONTENT = {
  x: 56,
  y: 64,
  w: 688,
  h: 488,
};

export default class MinigameBase extends Phaser.Scene {
  constructor(sceneKey) {
    super(sceneKey);
    this.sceneKey = sceneKey;
    this._tabletShell = null;
    this._isFinishing = false;
  }

  createTablet(title, options = {}) {
    const {
      accent = 0x38bdf8,
      background = 0x020810,
      status = 'ALGORITHM TRAINING MODULE',
    } = options;

    this.cameras.main.setBackgroundColor('#030712');

    const bg = this.add.graphics();
    bg.fillStyle(background, 0.94);
    bg.fillRect(0, 0, 800, 600);
    this._drawWorldBorder(bg, accent);

    const shell = this.add.container(400, 300);
    this._tabletShell = shell;

    const panel = this.add.graphics();
    this._drawTabletPanel(panel, TABLET.w, TABLET.h, accent);
    shell.add(panel);

    const header = this.add.graphics();
    this._drawHeader(header, title, accent);
    shell.add(header);

    const titleText = this.add.text(-TABLET.w / 2 + 18, -TABLET.h / 2 + 10, `> ${title.toUpperCase()}`, {
      ...FONT_MONO,
      fontSize: '12px',
      color: '#7dd3fc',
    });
    shell.add(titleText);

    const statusText = this.add.text(-TABLET.w / 2 + 18, TABLET.h / 2 - 20, status, {
      ...FONT_MONO,
      fontSize: '10px',
      color: '#475569',
    });
    shell.add(statusText);

    this._drawScanlines(shell);
    this._drawScanlineOverlay();

    shell.setScale(0.05);
    shell.setAlpha(0);
    this.tweens.add({
      targets: shell,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 180,
      ease: 'Back.Out',
    });
    this.time.delayedCall(55, () => shell?.setAlpha(0.45));
    this.time.delayedCall(80, () => shell?.setAlpha(1));
    this.time.delayedCall(115, () => shell?.setAlpha(0.72));
    this.time.delayedCall(140, () => shell?.setAlpha(1));

    this.contentBounds = CONTENT;
    return CONTENT;
  }

  makeButton(x, y, label, onClick, options = {}) {
    const {
      w = Math.max(92, label.length * 9 + 28),
      h = 34,
      fill = 0x0f2744,
      hoverFill = 0x38bdf8,
      textColor = '#7dd3fc',
      hoverTextColor = '#06111f',
      stroke = 0x38bdf8,
    } = options;

    const button = this.add.container(x, y);
    const bg = this.add.graphics();
    const text = this.add.text(0, 0, label, {
      ...FONT_MONO,
      fontSize: '12px',
      color: textColor,
    }).setOrigin(0.5);

    const draw = (hover = false) => {
      bg.clear();
      const activeFill = hover ? hoverFill : fill;
      bg.fillStyle(activeFill, 1);
      bg.fillRect(-w / 2, -h / 2, w, h);
      bg.fillStyle(hover ? 0x7dd3fc : 0x1e3a5f, 1);
      bg.fillRect(-w / 2, -h / 2, w, 3);
      bg.lineStyle(1, stroke, hover ? 1 : 0.8);
      bg.strokeRect(-w / 2, -h / 2, w, h);
      bg.fillStyle(stroke, 1);
      bg.fillRect(-w / 2, -h / 2, 3, 3);
      bg.fillRect(w / 2 - 3, -h / 2, 3, 3);
      bg.fillRect(-w / 2, h / 2 - 3, 3, 3);
      bg.fillRect(w / 2 - 3, h / 2 - 3, 3, 3);
      text.setStyle({ color: hover ? hoverTextColor : textColor });
    };

    draw(false);
    button.add([bg, text]);
    button.setSize(w, h);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => draw(true));
    button.on('pointerout', () => draw(false));
    button.on('pointerdown', () => onClick?.());

    return button;
  }

  showMistake(message = 'Incorrect input. Recalibrate and try again.') {
    this.cameras.main.shake(140, 0.004);
    const flash = this.add.rectangle(400, 300, 720, 520, 0xef4444, 0.16).setDepth(999);
    const label = this.add.text(400, 520, message, {
      ...FONT_MONO,
      fontSize: '11px',
      color: '#fecaca',
      align: 'center',
      wordWrap: { width: 640 },
    }).setOrigin(0.5).setDepth(1000);

    this.tweens.add({
      targets: [flash, label],
      alpha: 0,
      duration: 700,
      ease: 'Sine.Out',
      onComplete: () => {
        flash.destroy();
        label.destroy();
      },
    });
  }

  showSuccess(algorithmName = this.algorithm?.name || 'Algorithm', options = {}) {
    if (this._isFinishing) return;
    this._isFinishing = true;

    const { delay = 1500, success = true } = options;
    const tint = success ? 0x4ade80 : 0xef4444;
    const title = success ? 'ALGORITHM MASTERED' : 'MODULE SKIPPED';
    const color = success ? '#bbf7d0' : '#fecaca';

    this.cameras.main.flash(260, success ? 74 : 239, success ? 222 : 68, success ? 128 : 68);

    const overlay = this.add.container(400, 300).setDepth(2000);
    const panel = this.add.graphics();
    panel.fillStyle(0x020810, 0.84);
    panel.fillRect(-360, -260, 720, 520);
    panel.lineStyle(2, tint, 0.95);
    panel.strokeRect(-240, -58, 480, 116);
    panel.fillStyle(tint, 0.14);
    panel.fillRect(-236, -54, 472, 108);
    overlay.add(panel);

    overlay.add(this.add.text(0, -24, title, {
      ...FONT_MONO,
      fontSize: '20px',
      color,
    }).setOrigin(0.5));
    overlay.add(this.add.text(0, 20, algorithmName, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#f8fafc',
    }).setOrigin(0.5));

    overlay.setAlpha(0);
    overlay.setScale(0.92);
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: 'Back.Out',
    });

    this.time.delayedCall(delay, () => {
      EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
      this.scene.stop(this.sceneKey);
    });
  }

  finish(success) {
    this.showSuccess(this.algorithm?.name || 'Algorithm', { success, delay: success ? 1500 : 650 });
  }

  _drawWorldBorder(g, accent) {
    g.lineStyle(1, accent, 0.18);
    g.strokeRect(18, 18, 764, 564);
    g.fillStyle(accent, 0.05);
    g.fillRect(24, 24, 752, 2);
    g.fillRect(24, 574, 752, 2);
  }

  _drawTabletPanel(g, w, h, accent) {
    const x = -w / 2;
    const y = -h / 2;
    g.fillStyle(0x38bdf8, 0.06);
    g.fillRect(x - 12, y - 12, w + 24, h + 24);
    g.fillStyle(0x040e1e, 0.97);
    g.fillRect(x + 4, y + 4, w - 8, h - 8);
    g.lineStyle(2, accent, 0.9);
    g.strokeRect(x + 2, y + 2, w - 4, h - 4);
    g.lineStyle(1, 0x1e3a5f, 0.65);
    g.strokeRect(x + 6, y + 6, w - 12, h - 12);

    const cs = 12;
    const corners = [[x + 2, y + 2], [x + w - 2, y + 2], [x + 2, y + h - 2], [x + w - 2, y + h - 2]];
    corners.forEach(([px, py], i) => {
      const dx = i % 2 === 0 ? 1 : -1;
      const dy = i < 2 ? 1 : -1;
      g.fillStyle(accent, 1);
      g.fillRect(px, py, dx * cs, 2);
      g.fillRect(px, py, 2, dy * cs);
    });

    g.fillStyle(0x0a1f3d, 1);
    g.fillRect(x + 4, y + h - 32, w - 8, 28);
    g.fillStyle(accent, 0.9);
    g.fillRect(x + 4, y + h - 32, w - 8, 1);
  }

  _drawHeader(g, title, accent) {
    const x = -TABLET.w / 2;
    const y = -TABLET.h / 2;
    g.fillStyle(0x0a1f3d, 1);
    g.fillRect(x + 4, y + 4, TABLET.w - 8, TABLET.headerH - 4);
    g.fillStyle(accent, 0.9);
    g.fillRect(x + 4, y + TABLET.headerH, TABLET.w - 8, 1);
    [0, 10, 20].forEach((ox, i) => {
      const colors = [0x4ade80, 0xfbbf24, 0xef4444];
      g.fillStyle(colors[i], 0.9);
      g.fillRect(TABLET.w / 2 - 20 - ox, y + 12, 6, 6);
    });
  }

  _drawScanlines(shell) {
    const scan = this.add.graphics();
    for (let sy = -TABLET.h / 2 + 42; sy < TABLET.h / 2 - 38; sy += 4) {
      scan.fillStyle(0x000000, 0.055);
      scan.fillRect(-TABLET.w / 2 + 8, sy, TABLET.w - 16, 1);
    }
    shell.add(scan);
  }

  _drawScanlineOverlay() {
    const scan = this.add.graphics().setDepth(900);
    for (let y = TABLET.y + TABLET.headerH + 10; y < TABLET.y + TABLET.h - TABLET.footerH; y += 4) {
      scan.fillStyle(0x000000, 0.045);
      scan.fillRect(TABLET.x + 8, y, TABLET.w - 16, 1);
    }
    scan.lineStyle(1, 0x38bdf8, 0.08);
    for (let x = TABLET.x + 32; x < TABLET.x + TABLET.w - 32; x += 64) {
      scan.lineBetween(x, TABLET.y + 42, x, TABLET.y + TABLET.h - 34);
    }
  }
}
