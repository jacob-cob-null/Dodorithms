import Phaser from "phaser";

export default class Interactable extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, texture, { id, type, data, onInteract } = {}) {
    super(scene, x, y, texture);

    this.id = id;
    this.type = type;
    this.data = data;
    this.onInteract = onInteract;

    scene.add.existing(this);
  }
}
