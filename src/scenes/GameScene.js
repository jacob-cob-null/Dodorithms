import Phaser from "phaser";
import Player from "../entities/Player.js";
import Interactable from "../entities/Interactable.js";
import PlayerController from "../systems/PlayerController.js";
import InteractionSystem from "../systems/InteractionSystem.js";
import EventBus from "../systems/EventBus.js";
import { EVENTS } from "../systems/events.js";
import archiveSystem from "../systems/ArchiveSystem.js";
import { LEVELS } from "../data/levels.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.levelIndex        = data?.levelIndex ?? 0;
    this.completedObstacles = new Set();
    this.obstacleSprites   = new Map();
    this.activeMiniGameCfg = null;
  }

  create() {
    const levelConfig = LEVELS[this.levelIndex];

    if (!levelConfig) {
      this.showEndScreen();
      return;
    }

    this.currentLevel = levelConfig;
    const { worldWidth, bgColor, playerStart, platforms, obstacles, exit } = levelConfig;

    // World setup
    this.cameras.main.setBackgroundColor(bgColor);
    this.physics.world.setBounds(0, 0, worldWidth, 600);

    // ── Parallax background (must be first so it renders behind everything) ──
    this.buildBackground(levelConfig);

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    platforms.forEach(p => {
      this.platforms.create(p.x, p.y, 'platform').setScale(p.scaleX, p.scaleY).refreshBody();
    });

    // Player
    this.player = new Player(this, playerStart.x, playerStart.y);
    this.physics.add.collider(this.player, this.platforms);
    this.playerController = new PlayerController(this, this.player);

    // Camera follow
    this.cameras.main.setBounds(0, 0, worldWidth, 600);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Interaction system
    this.interactionSystem = new InteractionSystem(this, this.player);

    // Build level objects
    obstacles.forEach(cfg => this.buildObstacle(cfg));
    this.buildExitPortal(exit);

    // HUD (fixed to camera)
    this.add.text(12, 12, levelConfig.name, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#38bdf8',
    }).setScrollFactor(0);

    this.add.text(12, 30, levelConfig.subtitle, {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#475569',
    }).setScrollFactor(0);

    this.add.text(400, 12, '← → to move   SPACE to jump   E to interact', {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#334155',
    }).setOrigin(0.5, 0).setScrollFactor(0);

    // Event listeners
    this._onStartDialogue = () => {
      this.playerController.setEnabled(false);
      this.interactionSystem.setEnabled(false);
    };
    this._onEndDialogue = () => {
      this.playerController.setEnabled(true);
      this.interactionSystem.setEnabled(true);
    };
    this._onPuzzleComplete = (payload) => {
      const cfg = this.activeMiniGameCfg;
      if (payload?.success && cfg) {
        this.completedObstacles.add(cfg.id);
        this.obstacleSprites.get(cfg.id)?.setAlpha(0.4);
        // ArchiveSystem handles addAlgorithm + ALGORITHM_UNLOCKED via PUZZLE_COMPLETE
      }
      this.activeMiniGameCfg = null;
      this.scene.resume('GameScene');
      this.playerController?.setEnabled(true);
      this.interactionSystem?.setEnabled(true);
    };

    EventBus.on(EVENTS.START_DIALOGUE,  this._onStartDialogue,  this);
    EventBus.on(EVENTS.END_DIALOGUE,    this._onEndDialogue,    this);
    EventBus.on(EVENTS.PUZZLE_COMPLETE, this._onPuzzleComplete, this);

    this.events.on('shutdown', this.cleanup, this);
  }

  buildObstacle(cfg) {
    const texture = this.textures.exists(cfg.texture) ? cfg.texture : 'npc';
    const sprite = new Interactable(this, cfg.x, cfg.y, texture, {
      id: cfg.id,
      onInteract: () => {
        if (this.completedObstacles.has(cfg.id)) return;
        EventBus.emit(EVENTS.START_DIALOGUE, {
          speaker: cfg.speaker,
          lines: cfg.lines,
          onComplete: () => this.handleObstacleComplete(cfg),
        });
      },
    });

    // Name label above sprite
    this.add.text(cfg.x, cfg.y - 34, cfg.speaker, {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#64748b',
    }).setOrigin(0.5);

    // Interactable glow label
    if (cfg.objectType === 'interactable') {
      this.add.text(cfg.x, cfg.y - 34, '[!]', {
        fontFamily: 'sans-serif', fontSize: '13px', color: '#38bdf8',
      }).setOrigin(0.5);
    }

    this.obstacleSprites.set(cfg.id, sprite);
    this.interactionSystem.register(sprite);
  }

  handleObstacleComplete(cfg) {
    if (!cfg.action) {
      this.completedObstacles.add(cfg.id);
      this.obstacleSprites.get(cfg.id)?.setAlpha(0.4);
      return;
    }

    if (cfg.action.type === 'unlock') {
      this.completedObstacles.add(cfg.id);
      this.obstacleSprites.get(cfg.id)?.setAlpha(0.4);
      archiveSystem.addAlgorithm(cfg.action.algorithm);
      EventBus.emit(EVENTS.ALGORITHM_UNLOCKED, cfg.action.algorithm);

    } else if (cfg.action.type === 'minigame') {
      this.activeMiniGameCfg = cfg;
      this.playerController.setEnabled(false);
      this.interactionSystem.setEnabled(false);
      this.scene.pause('GameScene');
      this.scene.launch(cfg.action.scene, { algorithm: cfg.action.algorithm });
    }
  }

  buildExitPortal(exitCfg) {
    const portal = new Interactable(this, exitCfg.x, exitCfg.y, 'portal', {
      id: 'exit-portal',
      onInteract: () => {
        this.scene.start('GameScene', { levelIndex: this.levelIndex + 1 });
      },
    });
    this.interactionSystem.register(portal);

    // Pulsing tween
    this.tweens.add({
      targets: portal,
      alpha: 0.5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.add.text(exitCfg.x, exitCfg.y - 42, 'NEXT LEVEL', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#818cf8',
    }).setOrigin(0.5);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  BACKGROUND / PARALLAX
  // ─────────────────────────────────────────────────────────────────────────

  buildBackground(levelConfig) {
    const { worldWidth, parallax, id } = levelConfig;
    if (!parallax) return;

    parallax.forEach(layer => {
      const g = this.add.graphics().setScrollFactor(layer.scrollFactor);
      if (layer.type === 'stars')    this._drawStars(g, worldWidth);
      if (layer.type === 'cityFar')  this._drawCityFar(g, worldWidth);
      if (layer.type === 'cityNear') this._drawCityNear(g, worldWidth);
    });

    if (id === 'level1') this._drawLevel1Props(worldWidth);
    if (id === 'level2') this._drawLevel2Props(worldWidth);
    if (id === 'level3') this._drawLevel3Props(worldWidth);
    if (id === 'level4') this._drawLevel4Props(worldWidth);
  }

  _drawStars(g, W) {
    // Sky base
    g.fillStyle(0x060d17, 1);
    g.fillRect(0, 0, W, 545);

    // Stars — small bright dots
    for (let i = 0; i < 220; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, 420);
      const sz = Math.random() > 0.85 ? 2 : 1;
      const blue = Math.random() > 0.6;
      g.fillStyle(blue ? 0x93c5fd : 0xffffff, Phaser.Math.FloatBetween(0.2, 1));
      g.fillRect(x, y, sz, sz);
    }

    // Alien planet (ZZS homeworld hint)
    g.fillStyle(0x1e3a5f, 1); g.fillCircle(700, 95, 46);
    g.fillStyle(0x2d4f75, 1); g.fillCircle(700, 95, 38);
    g.fillStyle(0x1e3a5f, 1); g.fillRect(654, 83, 92, 10); // ring band
    g.fillStyle(0x38bdf8, 0.06); g.fillCircle(700, 95, 82); // glow halo

    // Distant nebula smear
    for (let i = 0; i < 3; i++) {
      const nx = Phaser.Math.Between(200, W - 200);
      const ny = Phaser.Math.Between(40, 180);
      g.fillStyle(0x312e81, 0.07);
      g.fillEllipse(nx, ny, 220, 60);
    }
  }

  _drawCityFar(g, W) {
    // Very dark distant silhouettes
    let x = 0;
    while (x < W) {
      const bw = Phaser.Math.Between(42, 88);
      const bh = Phaser.Math.Between(80, 210);
      const by = 540 - bh;
      g.fillStyle(0x0a1a2e, 1);
      g.fillRect(x, by, bw, bh);

      // Window grid
      for (let wy = by + 8; wy < 534; wy += 13) {
        for (let wx = x + 4; wx < x + bw - 4; wx += 10) {
          if (Math.random() > 0.44) {
            g.fillStyle(0x1e4d7a, Phaser.Math.FloatBetween(0.3, 0.85));
            g.fillRect(wx, wy, 4, 7);
          }
        }
      }

      // Antenna spire
      if (Math.random() > 0.45) {
        g.fillStyle(0x152840, 1);
        g.fillRect(x + Math.floor(bw / 2) - 1, by - 20, 2, 20);
        g.fillStyle(0xef4444, 0.7);
        g.fillRect(x + Math.floor(bw / 2) - 2, by - 22, 4, 4);
      }

      x += bw + Phaser.Math.Between(3, 22);
    }
  }

  _drawCityNear(g, W) {
    const NEONS = [0xf59e0b, 0x38bdf8, 0xa855f7, 0xef4444, 0x4ade80];
    let x = 0;
    while (x < W) {
      const bw = Phaser.Math.Between(52, 112);
      const bh = Phaser.Math.Between(50, 148);
      const by = 540 - bh;
      const accent = NEONS[Math.floor(Math.random() * NEONS.length)];

      g.fillStyle(0x0d1f35, 1);
      g.fillRect(x, by, bw, bh);

      // Neon outline
      g.lineStyle(1, accent, 0.35);
      g.strokeRect(x + 1, by + 1, bw - 2, bh - 2);

      // Neon sign strip at roof
      g.fillStyle(accent, 0.55);
      g.fillRect(x + 4, by + 4, bw - 8, 5);

      // Windows (larger)
      for (let wy = by + 16; wy < 528; wy += 18) {
        for (let wx = x + 6; wx < x + bw - 6; wx += 14) {
          if (Math.random() > 0.38) {
            g.fillStyle(Math.random() > 0.65 ? accent : 0xfbbf24,
              Phaser.Math.FloatBetween(0.25, 0.65));
            g.fillRect(wx, wy, 7, 10);
          }
        }
      }

      // Billboard rectangle on some buildings
      if (Math.random() > 0.7) {
        g.fillStyle(accent, 0.18);
        g.fillRect(x + 6, by + 10, bw - 12, 22);
        g.lineStyle(1, accent, 0.5);
        g.strokeRect(x + 6, by + 10, bw - 12, 22);
      }

      x += bw + Phaser.Math.Between(6, 32);
    }
  }

  _drawLevel1Props(W) {
    // Crashed spaceship wreckage — near player spawn
    const wreck = this.add.graphics();
    wreck.fillStyle(0x1e293b, 1); wreck.fillRect(0, 0, 100, 35);
    wreck.fillStyle(0x334155, 1); wreck.fillRect(15, -18, 65, 18);
    wreck.fillStyle(0x0f172a, 1); wreck.fillRect(20, 4, 14, 14); // porthole
    wreck.fillStyle(0xef4444, 0.5); wreck.fillRect(0, 32, 100, 6);  // scorch
    wreck.fillStyle(0xf97316, 0.3); wreck.fillRect(10, 38, 80, 4);
    wreck.x = 145; wreck.y = 517;

    // Street lamps along the path
    [480, 870, 1180, 1650, 2150, 2300].forEach(lx => {
      const lamp = this.add.graphics();
      lamp.fillStyle(0x334155, 1);
      lamp.fillRect(-3, -64, 6, 64);
      lamp.fillRect(-12, -72, 24, 8);
      lamp.fillStyle(0xfbbf24, 0.9);
      lamp.fillRect(-8, -72, 16, 6);
      lamp.fillStyle(0xfbbf24, 0.05);
      lamp.fillEllipse(0, -40, 70, 50); // light pool
      lamp.x = lx; lamp.y = 552;
    });

    // Hologram projectors near each NPC
    [320, 1000, 1900].forEach(hx => {
      const holo = this.add.graphics();
      holo.fillStyle(0x1e3a5f, 1); holo.fillRect(-6, -14, 12, 14);
      holo.fillStyle(0x38bdf8, 0.18); holo.fillTriangle(-18, -14, 18, -14, 0, -46);
      holo.lineStyle(1, 0x38bdf8, 0.4); holo.strokeTriangle(-18, -14, 18, -14, 0, -46);
      holo.x = hx; holo.y = 552;
    });

    // Ground floor neon strip accent
    const strip = this.add.graphics();
    strip.lineStyle(2, 0x38bdf8, 0.12);
    strip.lineBetween(0, 553, W, 553);
  }

  _drawLevel2Props(W) {
    // Server racks along the floor
    [200, 500, 800, 1200, 1600, 2000, 2400].forEach(rx => {
      const rack = this.add.graphics();
      rack.fillStyle(0x0f1e30, 1); rack.fillRect(-14, -64, 28, 64);
      rack.lineStyle(1, 0x1e3a5f, 1); rack.strokeRect(-14, -64, 28, 64);
      // Drive bays
      for (let row = 0; row < 5; row++) {
        const lit = Math.random() > 0.4;
        rack.fillStyle(lit ? 0x06b6d4 : 0x1e3a5f, lit ? 0.8 : 0.3);
        rack.fillRect(-10, -58 + row * 11, 20, 7);
      }
      // Status light
      rack.fillStyle(Math.random() > 0.2 ? 0x4ade80 : 0xef4444, 1);
      rack.fillRect(6, -62, 4, 4);
      rack.x = rx; rack.y = 552;
    });

    // Overhead data cables (horizontal runs)
    const cable = this.add.graphics();
    cable.lineStyle(2, 0x0e7490, 0.25);
    for (let y = 480; y <= 510; y += 10) {
      cable.lineBetween(0, y, W, y);
    }

    // Holographic terminal screens above platforms
    [[700, 422], [1450, 382], [2150, 422]].forEach(([hx, hy]) => {
      const screen = this.add.graphics();
      screen.fillStyle(0x06b6d4, 0.08); screen.fillRect(-36, -44, 72, 40);
      screen.lineStyle(1, 0x06b6d4, 0.4); screen.strokeRect(-36, -44, 72, 40);
      // Scan lines
      for (let l = 0; l < 4; l++) {
        screen.lineStyle(1, 0x06b6d4, 0.15);
        screen.lineBetween(-32, -38 + l * 8, 32, -38 + l * 8);
      }
      screen.x = hx; screen.y = hy;
    });

    // Amber warning strip on floor
    const strip = this.add.graphics();
    strip.lineStyle(2, 0xf59e0b, 0.1);
    strip.lineBetween(0, 553, W, 553);

    // Ceiling conduit
    const conduit = this.add.graphics();
    conduit.lineStyle(3, 0x1e3a5f, 0.5);
    conduit.lineBetween(0, 2, W, 2);
    conduit.fillStyle(0x06b6d4, 0.06);
    conduit.fillRect(0, 0, W, 5);
  }

  _drawLevel4Props(W) {
    // Train tracks along the floor (two parallel rails)
    const track = this.add.graphics();
    track.lineStyle(3, 0x334155, 0.7);
    track.lineBetween(0, 546, W, 546);
    track.lineBetween(0, 554, W, 554);
    // Sleepers (cross-ties)
    for (let x = 0; x < W; x += 32) {
      track.lineStyle(4, 0x1e293b, 0.9);
      track.lineBetween(x, 543, x, 557);
    }

    // Platform edge strips at each station marker
    [350, 800, 1300, 1750, 2250].forEach(px => {
      const plat = this.add.graphics();
      plat.fillStyle(0xa855f7, 0.08);
      plat.fillRect(-48, -8, 96, 8);
      plat.lineStyle(1, 0xa855f7, 0.3);
      plat.strokeRect(-48, -8, 96, 8);
      plat.x = px; plat.y = 552;
    });

    // Route map boards above platforms
    [[700, 422], [1450, 382], [2100, 422]].forEach(([mx, my]) => {
      const board = this.add.graphics();
      board.fillStyle(0x1a0d3d, 1);
      board.fillRect(-42, -34, 84, 30);
      board.lineStyle(1, 0xa855f7, 0.4);
      board.strokeRect(-42, -34, 84, 30);
      // Dot-matrix style route lines
      for (let l = 0; l < 3; l++) {
        board.fillStyle(0xa855f7, 0.25 + l * 0.15);
        board.fillRect(-36, -28 + l * 8, 40 + l * 8, 4);
      }
      board.x = mx; board.y = my;
    });

    // Overhead power lines
    const wire = this.add.graphics();
    wire.lineStyle(1, 0xa855f7, 0.12);
    wire.lineBetween(0, 8, W, 8);
    wire.lineStyle(1, 0x7c3aed, 0.08);
    wire.lineBetween(0, 16, W, 16);

    // Departure sign pillars
    [250, 750, 1200, 1700, 2300].forEach(px => {
      const pillar = this.add.graphics();
      pillar.fillStyle(0x1a0d3d, 1);
      pillar.fillRect(-3, -80, 6, 80);
      pillar.fillStyle(0x2d1d6b, 1);
      pillar.fillRect(-20, -88, 40, 22);
      pillar.lineStyle(1, 0xa855f7, 0.35);
      pillar.strokeRect(-20, -88, 40, 22);
      pillar.x = px; pillar.y = 552;
    });
  }

  _drawLevel3Props(W) {
    // Bio-hazard floor stripe
    const stripe = this.add.graphics();
    for (let x = 0; x < W; x += 40) {
      stripe.fillStyle(0x22c55e, 0.06);
      stripe.fillRect(x, 548, 20, 8);
    }

    // Lab bench counters along the floor
    [300, 650, 1050, 1550, 1900, 2300].forEach(bx => {
      const bench = this.add.graphics();
      bench.fillStyle(0x0c2a10, 1);
      bench.fillRect(-40, -20, 80, 20);
      bench.lineStyle(1, 0x22c55e, 0.4);
      bench.strokeRect(-40, -20, 80, 20);
      // Petri dishes / containers
      for (let d = 0; d < 3; d++) {
        bench.fillStyle(0x4ade80, 0.15 + d * 0.08);
        bench.fillCircle(-22 + d * 22, -28, 8);
        bench.lineStyle(1, 0x22c55e, 0.4);
        bench.strokeCircle(-22 + d * 22, -28, 8);
      }
      bench.x = bx; bench.y = 552;
    });

    // DNA helix wall decorations
    [150, 550, 1000, 1400, 1800, 2250].forEach(hx => {
      const helix = this.add.graphics();
      for (let y = 0; y < 6; y++) {
        const wave = Math.sin(y * 1.2) * 8;
        helix.fillStyle(0x22c55e, 0.2 + (y % 2) * 0.15);
        helix.fillCircle(wave, y * 14, 4);
        helix.fillStyle(0x4ade80, 0.15);
        helix.fillCircle(-wave, y * 14, 4);
        if (y < 5) {
          helix.lineStyle(1, 0x22c55e, 0.15);
          helix.lineBetween(wave, y * 14, -wave, (y + 1) * 14);
        }
      }
      helix.x = hx; helix.y = 460;
    });

    // Ceiling scan beams (green horizontal lines)
    const beams = this.add.graphics();
    beams.lineStyle(1, 0x22c55e, 0.08);
    for (let y = 0; y < 5; y++) {
      beams.lineBetween(0, 15 + y * 8, W, 15 + y * 8);
    }

    // Bio-scanner arch above Platform B (featured obstacle)
    const arch = this.add.graphics();
    arch.lineStyle(2, 0x22c55e, 0.45);
    arch.strokeRect(1400, 330, 100, 52);
    arch.lineStyle(1, 0x22c55e, 0.2);
    arch.lineBetween(1400, 356, 1500, 356); // mid crossbar
    arch.fillStyle(0x22c55e, 0.05);
    arch.fillRect(1400, 330, 100, 52);
  }

  // ─────────────────────────────────────────────────────────────────────────

  showEndScreen() {
    this.cameras.main.setBackgroundColor('#0d1117');
    this.add.text(400, 220, 'Levels 1 & 2 Complete!', {
      fontFamily: 'sans-serif', fontSize: '32px', color: '#f8fafc',
    }).setOrigin(0.5);
    this.add.text(400, 275, 'More levels coming soon...', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#94a3b8',
    }).setOrigin(0.5);

    const total = archiveSystem.getAllAlgorithms().length;
    this.add.text(400, 320, `Algorithms collected: ${total} / 24`, {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#38bdf8',
    }).setOrigin(0.5);

    const btn = this.add.text(400, 390, 'Back to Menu', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#0f172a',
      backgroundColor: '#38bdf8', padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }

  cleanup() {
    EventBus.off(EVENTS.START_DIALOGUE,  this._onStartDialogue,  this);
    EventBus.off(EVENTS.END_DIALOGUE,    this._onEndDialogue,    this);
    EventBus.off(EVENTS.PUZZLE_COMPLETE, this._onPuzzleComplete, this);
  }

  update() {
    this.playerController?.update();
    this.interactionSystem?.update();
  }
}
