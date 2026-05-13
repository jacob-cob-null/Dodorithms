import Phaser from "phaser";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0.1);

    this.body.setSize(24, 40);
    this.body.setOffset(4, 8);
    this.body.setMaxVelocity(300, 600);

    this.state = 'idle'; // 'idle' | 'walk' | 'jump'
  }
}
