import Phaser from "phaser";

export default class PlayerController {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.enabled = true;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      left: "A",
      right: "D",
      up: "W",
      down: "S",
      jump: "SPACE",
    });
  }

  // Set display size and recalculate physics body to match new texture dimensions
  _applyDisplaySize(p) {
    p.setDisplaySize(48, 64);
    const src = p.texture.getSourceImage();
    const tw = src.width  || 48;
    const th = src.height || 64;
    const bw = Math.round(tw * 0.5);
    const bh = Math.round(th * 0.65);
    p.body.setSize(bw, bh);
    p.body.setOffset(Math.round((tw - bw) / 2), Math.round(th - bh));
  }

  setEnabled(isEnabled) {
    this.enabled = isEnabled;
    if (!isEnabled) {
      this.player.setVelocityX(0);
    }
  }

  update(time, delta) {
    if (!this.enabled) {
      return;
    }

    const p = this.player;
    const left = this.cursors.left?.isDown || this.keys.left.isDown;
    const right = this.cursors.right?.isDown || this.keys.right.isDown;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.jump);

    if (left) {
      p.setVelocityX(-200);
      p.setFlipX(true);
    } else if (right) {
      p.setVelocityX(200);
      p.setFlipX(false);
    } else {
      p.setVelocityX(0);
    }

    const onGround = p.body.blocked.down;

    // Reset jump count only on the frame of landing
    if (onGround && !p._wasOnGround) {
      p._jumpsUsed = 0;
    }

    // Animation state machine — runs first so texture/size is correct before tweens
    const movingH = left || right;
    const newState = !onGround ? 'jump' : movingH ? 'walk' : 'idle';

    if (newState !== p.state) {
      p.state = newState;
      p.clearTint();
      p._walkTimer = 0;
      p._walkFrame = 0;

      if (newState === 'idle') p.setTexture('player_idle');
      if (newState === 'jump') p.setTexture('player_jump');
      if (newState === 'walk') { p.setTexture('player_walk1'); p._walkFrame = 0; }

      this._applyDisplaySize(p);

      // Stop bob when leaving jump
      if (this._bobTween) { this._bobTween.stop(); this._bobTween = null; }
    }

    // Landing squash + camera shake
    if (onGround && !p._wasOnGround && p.body.velocity.y > 100) {
      if (p.body.velocity.y > 250) {
        this.scene.cameras.main.shake(80, 0.003);
      }
    }

    if (jumpPressed && p._jumpsUsed < 2) {
      p.setVelocityY(-380);
      p._jumpsUsed++;
      // Stop any existing bob, do a quick 1% stretch, then restart bob
      if (this._bobTween) { this._bobTween.stop(); this._bobTween = null; }
      this._applyDisplaySize(p);
      const sy = p.scaleY;
      this.scene.tweens.add({
        targets: p,
        scaleY: sy * 1.005,
        duration: 90, yoyo: true, ease: 'Sine.Out',
        onComplete: () => {
          this._applyDisplaySize(p);
          if (p.state === 'jump' && !this._bobTween) {
            this._bobTween = this.scene.tweens.add({
              targets: p,
              scaleY: p.scaleY * 1.01,
              duration: 300,
              yoyo: true, repeat: -1, ease: 'Sine.InOut',
              onStop: () => this._applyDisplaySize(p),
            });
          }
        },
      });
    }

    p._wasOnGround = onGround;

    // Walk frame alternation — only swap texture, preserve displaySize
    if (newState === 'walk') {
      p._walkTimer += delta;
      if (p._walkTimer >= 110) {
        p._walkTimer = 0;
        p._walkFrame = (p._walkFrame + 1) % 3;
        p.setTexture(`player_walk${p._walkFrame + 1}`);
        this._applyDisplaySize(p);
      }
    }
  }
}
