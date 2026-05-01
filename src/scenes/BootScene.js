import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x4ade80, 1);
    graphics.fillRect(0, 0, 32, 48);
    graphics.generateTexture("player", 32, 48);

    graphics.clear();
    graphics.fillStyle(0x94a3b8, 1);
    graphics.fillRect(0, 0, 64, 16);
    graphics.generateTexture("platform", 64, 16);

    graphics.clear();
    graphics.fillStyle(0xf59e0b, 1);
    graphics.fillRect(0, 0, 32, 48);
    graphics.generateTexture("npc", 32, 48);

    graphics.clear();
    graphics.fillStyle(0x38bdf8, 1);
    graphics.fillRect(0, 0, 28, 28);
    graphics.generateTexture("interactable", 28, 28);

    graphics.destroy();
  }

  create() {
    this.scene.start("GameScene");
    this.scene.launch("UIScene");
  }
}
