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

    const left = this.cursors.left?.isDown || this.keys.left.isDown;
    const right = this.cursors.right?.isDown || this.keys.right.isDown;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.jump);

    if (left) {
      this.player.setVelocityX(-200);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(200);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jumpPressed && this.player.body.blocked.down) {
      this.player.setVelocityY(-380);
    }

    // Animation state machine
    const onGround = this.player.body.blocked.down;
    const movingH = left || right;
    const newState = !onGround ? 'jump' : movingH ? 'walk' : 'idle';
    if (newState !== this.player.state) {
      this.player.state = newState;
      // Tint as visual stand-in until real spritesheets arrive
      const tints = { idle: 0x22c55e, walk: 0x4ade80, jump: 0x86efac };
      this.player.setTint(tints[newState]);
    }
  }
}
