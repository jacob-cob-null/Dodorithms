import Phaser from "phaser";

const NPC_COLORS = {
  npc_laurenze:  0xf59e0b,
  npc_trizy:     0x06b6d4,
  npc_jacob:     0x22c55e,
  npc_kyla:      0xa855f7,
  npc_professor: 0xfbbf24,
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const g = this.add.graphics();

    // Player — green
    g.fillStyle(0x4ade80, 1);
    g.fillRect(0, 0, 32, 48);
    g.generateTexture("player", 32, 48);

    // Platform — slate
    g.clear();
    g.fillStyle(0x334155, 1);
    g.fillRect(0, 0, 64, 16);
    g.generateTexture("platform", 64, 16);

    // NPC per guide
    Object.entries(NPC_COLORS).forEach(([key, color]) => {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRect(0, 0, 32, 48);
      g.generateTexture(key, 32, 48);
    });

    // Generic NPC fallback
    g.clear();
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(0, 0, 32, 48);
    g.generateTexture("npc", 32, 48);

    // Interactable — glowing cyan diamond shape
    g.clear();
    g.fillStyle(0x38bdf8, 1);
    g.fillRect(4, 0, 20, 28);
    g.generateTexture("interactable", 28, 28);

    // Portal — tall glowing pillar
    g.clear();
    g.fillStyle(0x818cf8, 1);
    g.fillRect(0, 0, 36, 56);
    g.lineStyle(2, 0xc7d2fe, 1);
    g.strokeRect(0, 0, 36, 56);
    g.generateTexture("portal", 36, 56);

    g.destroy();
  }

  create() {
    this.scene.start("MainMenuScene");
    this.scene.launch("UIScene");
  }
}
