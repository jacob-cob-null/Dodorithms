import Phaser from "phaser";

const NPC_COLORS = {
  npc_laurenze:  0xf59e0b,
  npc_trizy:     0x06b6d4,
  npc_jacob:     0x22c55e,
  npc_kyla:      0xa855f7,
  npc_professor: 0xfbbf24,
};

// Platform themes: [surfaceColor, ledColor, grooveColor]
const PLATFORM_THEMES = {
  city:    { surface: 0x1e293b, led: 0xf59e0b, groove: 0x334155 },
  tech:    { surface: 0x0f2744, led: 0x06b6d4, groove: 0x1e3a5f },
  lab:     { surface: 0x0d2b12, led: 0x22c55e, groove: 0x14532d },
  train:   { surface: 0x120b2e, led: 0xa855f7, groove: 0x1e1048 },
  space:   { surface: 0x1a0a2e, led: 0xf59e0b, groove: 0x251240 },
  network: { surface: 0x0c1a2e, led: 0x38bdf8, groove: 0x1e3a5f },
  academy: { surface: 0x0a0a1a, led: 0xfbbf24, groove: 0x1e1e2e },
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Background wall bands
    this.load.image('bg_level1', 'assets/bg_level1.png');
    this.load.image('bg_level2', 'assets/bg_level2.png');
    this.load.image('bg_level3', 'assets/bg_level3.png');
    this.load.image('bg_level4', 'assets/bg_level4.png');
    this.load.image('bg_level5', 'assets/bg_level5.png');
    this.load.image('bg_level6', 'assets/bg_level6.png');
    this.load.image('bg_level7', 'assets/bg_level7.png');
    this.load.image('bg_level8', 'assets/bg_level8.png');

    for (let i = 1; i <= 5; i += 1) {
      this.load.image(`intro_scene_${i}`, `assets/cutscene/scene_${i}.png`);
    }

    // Player sprites
    this.load.image('player_idle',  'assets/player_idle.png');
    this.load.image('player_walk1', 'assets/player_walk1.png');
    this.load.image('player_walk2', 'assets/player_walk2.png');
    this.load.image('player_walk3', 'assets/player_walk3.png');
    this.load.image('player_jump',  'assets/player_jump.png');

    // NPC sprites
    this.load.image('npc_laurenze',  'assets/npc_laurenze.png');
    this.load.image('npc_trizy',     'assets/npc_trizy.png');
    this.load.image('npc_jacob',     'assets/npc_jacob.png');
    this.load.image('npc_kyla',      'assets/npc_kyla.png');
    this.load.image('npc_professor', 'assets/npc_professor.png');

    // NPC dialogue portraits (3 variations each: _a, _b, _c)
    const PORTRAIT_NPCS = ['laurenze', 'trizy', 'jacob', 'kyla', 'professor'];
    for (const npc of PORTRAIT_NPCS) {
      for (const v of ['_a', '_b', '_c']) {
        this.load.image(`portrait_${npc}${v}`, `assets/portrait_${npc}${v}.png`);
      }
    }

    const g = this.add.graphics();

    // ── Player fallback (used as 'player' key for physics body sizing) ──
    g.fillStyle(0x00000000, 0);
    g.fillRect(0, 0, 32, 48);
    g.generateTexture("player", 32, 48);

    // ── Themed platform textures ──
    Object.entries(PLATFORM_THEMES).forEach(([name, t]) => {
      g.clear();
      // Surface base
      g.fillStyle(t.surface, 1);
      g.fillRect(0, 0, 64, 16);
      // Depth shade bands
      g.fillStyle(0x000000, 0.12);
      g.fillRect(0, 6, 64, 4);
      g.fillStyle(0x000000, 0.06);
      g.fillRect(0, 10, 64, 3);
      // Groove lines
      for (let y = 2; y < 9; y += 4) {
        g.fillStyle(t.groove, 0.5);
        g.fillRect(0, y, 64, 1);
      }
      // Bright top edge (walkable surface highlight)
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(0, 0, 64, 1);
      // Rivet dots at each end (led-colored)
      g.fillStyle(t.led, 0.75);
      [3, 59].forEach(rx => { g.fillRect(rx, 3, 2, 2); g.fillRect(rx, 8, 2, 2); });
      // Side edges
      g.fillStyle(0x000000, 0.35);
      g.fillRect(0, 0, 1, 16);
      g.fillRect(63, 0, 1, 16);
      // LED glow bleed
      g.fillStyle(t.led, 0.1);
      g.fillRect(0, 10, 64, 6);
      // LED strip — 3px with bright center line
      g.fillStyle(t.led, 0.75);
      g.fillRect(0, 13, 64, 3);
      g.fillStyle(t.led, 1.0);
      g.fillRect(0, 14, 64, 1);
      g.generateTexture(`platform_${name}`, 64, 16);
    });

    // Default fallback platform (slate)
    g.clear();
    g.fillStyle(0x1e293b, 1);
    g.fillRect(0, 0, 64, 16);
    g.fillStyle(0x000000, 0.12);
    g.fillRect(0, 6, 64, 4);
    g.fillStyle(0x334155, 0.5);
    for (let y = 2; y < 9; y += 4) g.fillRect(0, y, 64, 1);
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(0, 0, 64, 1);
    g.fillStyle(0x38bdf8, 0.7);
    [3, 59].forEach(rx => { g.fillRect(rx, 3, 2, 2); g.fillRect(rx, 8, 2, 2); });
    g.fillStyle(0x000000, 0.35);
    g.fillRect(0, 0, 1, 16); g.fillRect(63, 0, 1, 16);
    g.fillStyle(0x38bdf8, 0.1);
    g.fillRect(0, 10, 64, 6);
    g.fillStyle(0x38bdf8, 0.75);
    g.fillRect(0, 13, 64, 3);
    g.fillStyle(0x38bdf8, 1.0);
    g.fillRect(0, 14, 64, 1);
    g.generateTexture("platform", 64, 16);

    // ── Generic NPC fallback (real NPC images loaded above) ──
    g.clear();
    g.fillStyle(0x0f172a, 1);
    g.fillRect(0, 0, 32, 48);
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(2, 2, 28, 44);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(2, 2, 28, 4);
    g.lineStyle(1, 0x0f172a, 1);
    g.strokeRect(0, 0, 32, 48);
    g.generateTexture("npc", 32, 48);

    // ── Interactable — holographic crystal orb ──
    g.clear();
    // Outer glow halos
    g.fillStyle(0x38bdf8, 0.04);
    g.fillCircle(14, 14, 14);
    g.fillStyle(0x38bdf8, 0.09);
    g.fillCircle(14, 14, 10);
    // Diamond body — two triangles (top and bottom half)
    g.fillStyle(0x0ea5e9, 0.35);
    g.fillTriangle(14, 4, 3, 14, 25, 14);    // top half
    g.fillStyle(0x38bdf8, 0.28);
    g.fillTriangle(3, 14, 25, 14, 14, 24);   // bottom half
    // Inner facet highlight
    g.fillStyle(0x7dd3fc, 0.65);
    g.fillTriangle(14, 7, 9, 14, 19, 14);
    // Sparkle dots at cardinal points
    g.fillStyle(0xffffff, 0.75);
    g.fillRect(13, 1, 2, 2);   // top
    g.fillRect(13, 25, 2, 2);  // bottom
    g.fillRect(1, 13, 2, 2);   // left
    g.fillRect(25, 13, 2, 2);  // right
    // White core
    g.fillStyle(0xffffff, 0.95);
    g.fillRect(13, 13, 2, 2);
    g.generateTexture("interactable", 28, 28);

    // ── Portal — holographic energy pillar ──
    g.clear();
    // Outer glow
    g.fillStyle(0x818cf8, 0.06);
    g.fillRect(-4, -4, 44, 64);
    // Dark fill
    g.fillStyle(0x1e1b4b, 0.85);
    g.fillRect(0, 0, 36, 56);
    // Inner energy column
    g.fillStyle(0x818cf8, 0.2);
    g.fillRect(6, 2, 24, 52);
    g.fillStyle(0xa78bfa, 0.15);
    g.fillRect(12, 2, 12, 52);
    // Bright center line
    g.fillStyle(0xc7d2fe, 0.4);
    g.fillRect(16, 2, 4, 52);
    // Scanlines
    for (let y = 0; y < 56; y += 4) {
      g.fillStyle(0xc7d2fe, 0.08);
      g.fillRect(0, y, 36, 1);
    }
    // Border glow
    g.lineStyle(1, 0xa78bfa, 0.6);
    g.strokeRect(0, 0, 36, 56);
    g.lineStyle(1, 0xc7d2fe, 0.25);
    g.strokeRect(1, 1, 34, 54);
    g.generateTexture("portal", 36, 56);

    g.destroy();
  }

  create() {
    this.scene.start("MainMenuScene");
    this.scene.launch("UIScene");
  }
}
