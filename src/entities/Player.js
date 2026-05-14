import Phaser from "phaser";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    const tex = scene.textures.exists('player_idle') ? 'player_idle' : 'player';
    super(scene, x, y, tex);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    this.setDisplaySize(48, 64);

    // Body size/offset must be in SOURCE texture space, not display space.
    // Calculate from actual texture dimensions so it works regardless of image size.
    const src = this.texture.getSourceImage();
    const tw = src.width  || 48;
    const th = src.height || 64;
    const bw = Math.round(tw * 0.5);   // body = 50% of texture width (centered)
    const bh = Math.round(th * 0.65);  // body = 65% of texture height (bottom-aligned)
    const ox = Math.round((tw - bw) / 2);
    const oy = Math.round(th - bh);    // flush to bottom of texture
    this.body.setSize(bw, bh);
    this.body.setOffset(ox, oy);
    this.body.setMaxVelocity(300, 600);

    this.state = 'idle'; // 'idle' | 'walk' | 'jump'
    this._walkFrame = 0;
    this._walkTimer = 0;
    this._wasOnGround = true;
    this._jumpsUsed = 0;
  }
}
