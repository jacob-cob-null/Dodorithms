import Phaser from 'phaser';
import { applyCrt } from '../systems/CrtSystem.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const W = 800, H = 600;
    applyCrt(this, { vignetteStrength: 0.2 });

    // Dark sky base
    this.add.rectangle(W / 2, H / 2, W, H, 0x060d17);

    // Wall band background — anchored to bottom
    if (this.textures.exists('bg_menu')) {
      const tex = this.textures.get('bg_menu').getSourceImage();
      const bandH = 400;
      const scale = bandH / tex.height;
      this.add.tileSprite(W / 2, H, W, bandH, 'bg_menu')
        .setOrigin(0.5, 1)
        .setTileScale(scale, scale);
    }

    // Dark overlay so text remains readable
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1117, 0.55);

    // Title
    this.add.text(W / 2, 160, "Dodo's Algorithmic Adventure", {
      fontFamily: 'sans-serif',
      fontSize: '34px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2, 215, 'Earth, 2070s — Help Dodo learn the algorithms that power civilization!', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#94a3b8',
      wordWrap: { width: 560 },
      align: 'center',
    }).setOrigin(0.5);

    // Dodo placeholder
    this.add.rectangle(W / 2, 330, 80, 100, 0xef4444)
      .setStrokeStyle(2, 0xfca5a5);
    this.add.text(W / 2, 330, 'DODO', {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#fca5a5',
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.text(W / 2, 450, '▶  Play', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#0f172a',
      backgroundColor: '#38bdf8',
      padding: { x: 40, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#7dd3fc' }));
    playBtn.on('pointerout',  () => playBtn.setStyle({ backgroundColor: '#38bdf8' }));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { levelIndex: 0 });
    });

    // Archive hint
    this.add.text(W / 2, 530, 'Collect all 24 algorithms in your Archive!', {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#475569',
    }).setOrigin(0.5);

    // Version
    this.add.text(W - 8, H - 8, 'v0.1 — Levels 1 & 2', {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      color: '#334155',
    }).setOrigin(1, 1);
  }
}
