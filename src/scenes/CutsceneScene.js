import Phaser from 'phaser';

const W = 800;
const H = 600;

const FRAMES = [
  {
    key: 'intro_scene_1',
    caption: 'Dodo said goodbye to ZZS and stepped toward the stars.',
  },
  {
    key: 'intro_scene_2',
    caption: 'His tiny ship carried him past moons, buttons, and blinking lights.',
  },
  {
    key: 'intro_scene_3',
    caption: 'Then everything went wrong at once.',
  },
  {
    key: 'intro_scene_4',
    caption: 'The closest safe place was a blue planet called Earth.',
  },
  {
    key: 'intro_scene_5',
    caption: 'Dodo held on tight as the ship fell through the sky.',
  },
];

export default class CutsceneScene extends Phaser.Scene {
  constructor() {
    super('CutsceneScene');
  }

  create() {
    this._setCrtScene('cutscene');
    this.scene.bringToTop();

    this.index = 0;
    this.transitioning = false;
    this.canAdvance = false;
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    ['music_menu','music_level1','music_level2','music_minigame','music_gamecomplete']
      .forEach(k => this.sound.stopByKey(k));
    ['sfx_portal_hum','sfx_level_complete','sfx_gamecomplete_sting']
      .forEach(k => this.sound.stopByKey(k));
    this.sound.stopByKey('music_story');
    this.sound.play('music_story', { loop: true, volume: 0.3 });

    this.add.rectangle(W / 2, H / 2, W, H, 0x020617, 1).setDepth(0);

    this.sceneImage = this.add.image(W / 2, H / 2, FRAMES[0].key).setDepth(1);
    this._fitImageToScreen(this.sceneImage);

    this.captionBand = this.add
      .rectangle(W / 2, H - 58, W, 116, 0x020617, 0.76)
      .setDepth(5);
    this.captionBand.setStrokeStyle(1, 0x334155, 0.8);

    this.captionText = this.add
      .text(W / 2, H - 72, FRAMES[0].caption, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#f8fafc',
        align: 'center',
        wordWrap: { width: 700 },
        lineSpacing: 6,
        stroke: '#020617',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.hintText = this.add
      .text(W - 24, H - 24, 'ENTER  ▶', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(1, 1)
      .setDepth(6);

    this.fade = this.add.rectangle(W / 2, H / 2, W, H, 0x020617, 0).setDepth(10);

    this.input.on('pointerdown', this._advance, this);
    this.cameras.main.fadeIn(280, 2, 6, 23);
    this.time.delayedCall(180, () => {
      this.canAdvance = true;
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this._advance();
    }
  }

  _advance() {
    if (!this.canAdvance) return;
    if (this.transitioning) return;

    if (this.index >= FRAMES.length - 1) {
      this.transitioning = true;
      this.sound.stopByKey('sfx_transition');
      this.sound.play('sfx_transition', { volume: 0.7 });
      this.sound.stopByKey('music_story');
      this.cameras.main.fadeOut(260, 2, 6, 23);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GameScene', { levelIndex: 0 });
      });
      return;
    }

    this.sound.stopByKey('sfx_ui_click');
    this.sound.play('sfx_ui_click', { volume: 0.6 });
    this.transitioning = true;
    const nextIndex = this.index + 1;

    this.tweens.add({
      targets: this.fade,
      alpha: 1,
      duration: 130,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.index = nextIndex;
        this.sceneImage.setTexture(FRAMES[this.index].key);
        this._fitImageToScreen(this.sceneImage);
        this.captionText.setText(FRAMES[this.index].caption);

        this.tweens.add({
          targets: this.fade,
          alpha: 0,
          duration: 170,
          ease: 'Sine.InOut',
          onComplete: () => {
            this.transitioning = false;
          },
        });
      },
    });
  }

  _fitImageToScreen(image) {
    const texture = this.textures.get(image.texture.key).source[0];
    const scale = Math.max(W / texture.width, H / texture.height);
    image.setDisplaySize(texture.width * scale, texture.height * scale);
  }

  _setCrtScene(sceneName) {
    if (typeof document === 'undefined') return;
    const root = document.getElementById('game');
    if (root) root.dataset.crtScene = sceneName;
  }
}
