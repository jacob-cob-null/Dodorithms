import Phaser from 'phaser';
import { applyCrt } from '../systems/CrtSystem.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const W = 800,
      H = 600;
    this._starting = false;
    this._setCrtScene('menu');
    applyCrt(this, {
      barrel: 1.006,
      vignetteRadius: 1.05,
      vignetteStrength: 0.035,
      contrast: 0.025,
      saturation: 0.035,
    });

    this._drawSpaceBackdrop(W, H);
    this._drawSignalFrame(W, H);
    this._drawLedTitle(W / 2, 178);

    this.add
      .text(W / 2, 248, 'Dodo is lost in space. Algorithms are the map.', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#b6f3ff',
        align: 'center',
        stroke: '#05111f',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#22d3ee',
          blur: 10,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(10);

    const playBtn = this._makeMenuButton(W / 2, 458, 'START RUN');
    playBtn.on('pointerdown', () => {
      this._startRun();
    });
    this.input.keyboard.once('keydown-ENTER', this._startRun, this);

    this.add
      .text(W / 2, 524, 'Archive target: 30 algorithms', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#58738a',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(W - 8, H - 8, 'v0.1 - Levels 1 & 2', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#334155',
      })
      .setOrigin(1, 1)
      .setDepth(10);
  }

  _drawSpaceBackdrop(W, H) {
    this.add.rectangle(W / 2, H / 2, W, H, 0x061225).setDepth(0);

    const nebula = this.add.graphics().setDepth(1);
    const bands = [
      { y: 116, color: 0x0ea5e9, alpha: 0.12, amp: 18 },
      { y: 158, color: 0x22c55e, alpha: 0.1, amp: 20 },
      { y: 302, color: 0xa855f7, alpha: 0.09, amp: 28 },
    ];
    bands.forEach((band, bandIndex) => {
      for (let x = -40; x < W + 40; x += 12) {
        const y = band.y + Math.sin((x + bandIndex * 80) / 82) * band.amp;
        const h = 4 + ((x / 12 + bandIndex) % 4);
        nebula.fillStyle(band.color, band.alpha);
        nebula.fillRect(x, y, 18, h);
        nebula.fillStyle(band.color, band.alpha * 0.45);
        nebula.fillRect(x - 2, y + 10, 30, 2);
      }
    });

    this._drawGalaxy(172, 116, 86, 0x38bdf8, 0.18);
    this._drawGalaxy(635, 362, 112, 0xa855f7, 0.14);
    this._drawPixelPlanet(400, 348, 48, 0x1d4ed8, 0x7dd3fc, 0x07142f, true, 3);
    this._addOrbitingDodo(400, 356, 92, 24);
    this._drawPixelPlanet(154, 382, 34, 0xb45309, 0xfbbf24, 0x2b1203, false, 2);
    this._drawPixelPlanet(708, 432, 22, 0x0f766e, 0x5eead4, 0x042f2e, false, 2);

    for (let i = 0; i < 130; i++) {
      const x = (i * 73) % W;
      const y = 18 + ((i * 127) % 500);
      const size = i % 17 === 0 ? 2 : 1;
      const color = i % 11 === 0 ? 0xf8fafc : i % 5 === 0 ? 0x67e8f9 : 0x94a3b8;
      const star = this.add
        .rectangle(x, y, size, size, color, 0.5 + (i % 5) * 0.1)
        .setDepth(4);
      if (i % 9 === 0) {
        this.tweens.add({
          targets: star,
          alpha: 0.18,
          duration: 900 + (i % 6) * 180,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
    }

    this._addShootingStar(34, 96, 3600);
    this._addShootingStar(520, 54, 5200);
  }

  _drawLedTitle(x, y) {
    const title = 'Dodorithms';
    const glowStyle = {
      fontFamily: 'monospace',
      fontSize: '58px',
      fontStyle: 'bold',
      color: '#22d3ee',
      stroke: '#05111f',
      strokeThickness: 8,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#22d3ee',
        blur: 18,
        fill: true,
      },
    };

    this.add
      .text(x, y, title, { ...glowStyle, color: '#075985' })
      .setOrigin(0.5)
      .setDepth(7)
      .setAlpha(0.5);
    this.add
      .text(x + 2, y + 2, title, { ...glowStyle, color: '#f59e0b' })
      .setOrigin(0.5)
      .setDepth(8)
      .setAlpha(0.26);
    const main = this.add
      .text(x, y, title, {
        ...glowStyle,
        color: '#e0fbff',
        stroke: '#083344',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);

    const scan = this.add
      .rectangle(x, y + 34, 380, 2, 0x67e8f9, 0.55)
      .setDepth(11);
    this.tweens.add({
      targets: [main, scan],
      alpha: { from: 0.86, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  _drawOrbitConsole(x, y) {
    const g = this.add.graphics().setDepth(8);
    g.fillStyle(0x020713, 0.62);
    g.fillEllipse(x, y + 18, 270, 58);
    g.lineStyle(1, 0x38bdf8, 0.28);
    g.strokeEllipse(x, y + 4, 286, 68);
    g.strokeEllipse(x, y + 4, 208, 48);
    g.lineStyle(1, 0xf59e0b, 0.22);
    g.strokeEllipse(x, y + 6, 132, 28);
    [x - 96, x - 32, x + 42, x + 104].forEach((dotX, i) => {
      g.fillStyle(i % 2 ? 0xf59e0b : 0x38bdf8, 0.72);
      g.fillRect(dotX, y + (i % 2 ? -10 : 20), 5, 5);
    });
    this.add.rectangle(x, y + 3, 52, 6, 0x22d3ee, 0.4).setDepth(9);
    this.add.rectangle(x, y + 3, 18, 2, 0xffffff, 0.5).setDepth(10);
  }

  _makeMenuButton(x, y, label) {
    const base = this.add.graphics().setDepth(10);
    const draw = (hover = false) => {
      base.clear();
      const fill = hover ? 0x67e8f9 : 0x0e7490;
      const edge = hover ? 0xf8fafc : 0x22d3ee;
      base.fillStyle(0x020713, 0.86);
      base.fillRect(x - 96, y - 24, 192, 48);
      base.fillStyle(fill, hover ? 0.28 : 0.18);
      base.fillRect(x - 90, y - 18, 180, 36);
      base.lineStyle(2, edge, hover ? 0.9 : 0.62);
      base.strokeRect(x - 96, y - 24, 192, 48);
      base.fillStyle(edge, hover ? 0.95 : 0.72);
      base.fillRect(x - 86, y + 15, 172, 3);
      base.fillRect(x - 86, y - 18, 28, 3);
      base.fillRect(x + 58, y - 18, 28, 3);
    };

    draw(false);
    const text = this.add
      .text(x, y - 1, label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#e0fbff',
        stroke: '#042f3d',
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#22d3ee',
          blur: 8,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    text.on('pointerover', () => draw(true));
    text.on('pointerout', () => draw(false));
    return text;
  }

  _startRun() {
    if (this._starting) return;
    this._starting = true;
    this.scene.start('CutsceneScene');
  }

  _drawPixelPlanet(x, y, r, base, hi, shade, ring, depth) {
    const g = this.add.graphics().setDepth(depth);
    if (ring) {
      g.lineStyle(2, 0x38bdf8, 0.26);
      g.strokeEllipse(x, y + 8, r * 2.7, r * 0.7);
      g.lineStyle(1, 0xf59e0b, 0.18);
      g.strokeEllipse(x, y + 10, r * 3.2, r * 0.86);
    }
    for (let yy = -r; yy <= r; yy += 4) {
      const width =
        Math.floor((Math.sqrt(Math.max(0, r * r - yy * yy)) * 2) / 4) * 4;
      g.fillStyle(base, 0.86);
      g.fillRect(x - width / 2, y + yy, width, 4);
      if (yy > r * 0.1) {
        g.fillStyle(shade, 0.28);
        g.fillRect(x - width / 2, y + yy, width, 4);
      }
      if (yy % 16 === 0) {
        g.fillStyle(hi, 0.16);
        g.fillRect(x - width / 2 + 8, y + yy, Math.max(8, width - 18), 2);
      }
    }
    g.fillStyle(hi, 0.28);
    g.fillRect(x - r * 0.38, y - r * 0.36, 18, 18);
    g.fillStyle(hi, 0.14);
    g.fillRect(x - r * 0.12, y - r * 0.1, 12, 12);
  }

  _addOrbitingDodo(cx, cy, rx, ry) {
    const dodo = this.textures.exists('player_jump')
      ? this.add.sprite(cx + rx, cy, 'player_jump')
      : this.add.rectangle(cx + rx, cy, 14, 18, 0xef4444);

    dodo.setDepth(6).setOrigin(0.5, 0.62);
    if (dodo instanceof Phaser.GameObjects.Sprite) {
      dodo.setDisplaySize(22, 28);
    } else {
      dodo.setScale(1);
    }
    const dodoScaleX = Math.abs(dodo.scaleX);
    const dodoScaleY = Math.abs(dodo.scaleY);

    const helmet = this.add
      .rectangle(cx + rx + 5, cy - 9, 7, 5, 0x7dd3fc, 0.35)
      .setDepth(6.1);
    const trail = this.add
      .rectangle(cx + rx - 11, cy + 2, 18, 2, 0xf59e0b, 0.28)
      .setDepth(5.9);
    const sparkle = this.add
      .rectangle(cx + rx - 22, cy + 3, 3, 3, 0xffffff, 0.72)
      .setDepth(5.8);

    const frontRing = this.add.graphics().setDepth(6.2);
    frontRing.lineStyle(2, 0x7dd3fc, 0.3);
    for (let i = 0; i < 18; i++) {
      const a1 = Phaser.Math.DegToRad(18 + i * 5);
      const a2 = Phaser.Math.DegToRad(18 + (i + 0.6) * 5);
      frontRing.lineBetween(
        cx + Math.cos(a1) * rx,
        cy + Math.sin(a1) * ry,
        cx + Math.cos(a2) * rx,
        cy + Math.sin(a2) * ry,
      );
    }

    this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 6200,
      repeat: -1,
      ease: 'Linear',
      onUpdate: (tween) => {
        const t = tween.getValue();
        const x = cx + Math.cos(t) * rx;
        const y = cy + Math.sin(t) * ry;
        const front = Math.sin(t) > 0;
        const facingLeft = Math.cos(t) < 0;

        dodo.setPosition(x, y);
        dodo.setDepth(front ? 6 : 2.8);
        dodo.setScale((facingLeft ? -1 : 1) * dodoScaleX, dodoScaleY);

        helmet.setPosition(x + (facingLeft ? -5 : 5), y - 9);
        helmet.setDepth(front ? 6.1 : 2.9);
        trail.setPosition(x + (facingLeft ? 11 : -11), y + 2);
        trail.setDepth(front ? 5.9 : 2.7);
        sparkle.setPosition(x + (facingLeft ? 22 : -22), y + 3);
        sparkle.setDepth(front ? 5.8 : 2.6);
      },
    });
  }

  _drawGalaxy(x, y, w, color, alpha) {
    const g = this.add.graphics().setDepth(2);
    for (let i = 0; i < 7; i++) {
      g.lineStyle(1, color, alpha * (1 - i * 0.09));
      g.strokeEllipse(x, y, w + i * 14, 12 + i * 7);
    }
    g.fillStyle(0xffffff, alpha * 1.8);
    g.fillRect(x - 1, y - 1, 3, 3);
  }

  _addShootingStar(x, y, delay) {
    const tail = this.add
      .rectangle(x, y, 78, 2, 0x67e8f9, 0)
      .setDepth(5)
      .setAngle(-18);
    const core = this.add
      .rectangle(x + 40, y - 12, 4, 2, 0xffffff, 0)
      .setDepth(6);
    this.tweens.add({
      targets: [tail, core],
      x: '+=250',
      y: '+=82',
      alpha: { from: 0, to: 0.65 },
      duration: 900,
      delay,
      repeatDelay: 4300,
      repeat: -1,
      ease: 'Cubic.Out',
      onRepeat: () => {
        tail.setPosition(x, y);
        core.setPosition(x + 40, y - 12);
      },
    });
  }

  _drawSignalFrame(W, H) {
    const g = this.add.graphics().setDepth(9);
    g.lineStyle(1, 0x0ea5e9, 0.28);
    g.strokeRect(22, 18, W - 44, H - 36);
    g.fillStyle(0x22d3ee, 0.42);
    [
      [22, 18],
      [W - 54, 18],
      [22, H - 30],
      [W - 54, H - 30],
    ].forEach(([x, y]) => {
      g.fillRect(x, y, 32, 2);
      g.fillRect(x, y, 2, 14);
    });
  }

  _setCrtScene(sceneName) {
    if (typeof document === 'undefined') return;
    const root = document.getElementById('game');
    if (root) root.dataset.crtScene = sceneName;
  }
}
