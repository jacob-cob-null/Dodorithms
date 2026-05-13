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

  _seededRandom(seed) {
    let s = seed;
    return function () {
      s |= 0; s = s + 0x6d2b79f5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  buildBackground(levelConfig) {
    const { worldWidth, parallax, id } = levelConfig;
    if (!parallax) return;

    const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = this._seededRandom(seed);

    parallax.forEach(layer => {
      const g = this.add.graphics().setScrollFactor(layer.scrollFactor);
      if (layer.type === 'stars')    this._drawStars(g, worldWidth, rng);
      if (layer.type === 'cityFar')  this._drawCityFar(g, worldWidth, rng);
      if (layer.type === 'cityNear') this._drawCityNear(g, worldWidth, rng);
    });

    if (id === 'level1') this._drawLevel1Props(worldWidth, rng);
    if (id === 'level2') this._drawLevel2Props(worldWidth, rng);
    if (id === 'level3') this._drawLevel3Props(worldWidth, rng);
    if (id === 'level4') this._drawLevel4Props(worldWidth, rng);
    if (id === 'level5') this._drawLevel5Props(worldWidth, rng);
    if (id === 'level6') this._drawLevel6Props(worldWidth, rng);
    if (id === 'level7') this._drawLevel7Props(worldWidth, rng);
    if (id === 'level8') this._drawLevel8Props(worldWidth, rng);
  }

  _drawStars(g, W, rng) {
    // Sky base
    g.fillStyle(0x060d17, 1);
    g.fillRect(0, 0, W, 545);

    // Stars — small bright dots
    for (let i = 0; i < 220; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, 420);
      const sz = rng() > 0.85 ? 2 : 1;
      const blue = rng() > 0.6;
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

  _drawCityFar(g, W, rng) {
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
          if (rng() > 0.44) {
            g.fillStyle(0x1e4d7a, Phaser.Math.FloatBetween(0.3, 0.85));
            g.fillRect(wx, wy, 4, 7);
          }
        }
      }

      // Antenna spire
      if (rng() > 0.45) {
        g.fillStyle(0x152840, 1);
        g.fillRect(x + Math.floor(bw / 2) - 1, by - 20, 2, 20);
        g.fillStyle(0xef4444, 0.7);
        g.fillRect(x + Math.floor(bw / 2) - 2, by - 22, 4, 4);
      }

      x += bw + Phaser.Math.Between(3, 22);
    }
  }

  _drawCityNear(g, W, rng) {
    const NEONS = [0xf59e0b, 0x38bdf8, 0xa855f7, 0xef4444, 0x4ade80];
    let x = 0;
    while (x < W) {
      const bw = Phaser.Math.Between(52, 112);
      const bh = Phaser.Math.Between(50, 148);
      const by = 540 - bh;
      const accent = NEONS[Math.floor(rng() * NEONS.length)];

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
          if (rng() > 0.38) {
            g.fillStyle(rng() > 0.65 ? accent : 0xfbbf24,
              Phaser.Math.FloatBetween(0.25, 0.65));
            g.fillRect(wx, wy, 7, 10);
          }
        }
      }

      // Billboard rectangle on some buildings
      if (rng() > 0.7) {
        g.fillStyle(accent, 0.18);
        g.fillRect(x + 6, by + 10, bw - 12, 22);
        g.lineStyle(1, accent, 0.5);
        g.strokeRect(x + 6, by + 10, bw - 12, 22);
      }

      x += bw + Phaser.Math.Between(6, 32);
    }
  }

  _drawLevel1Props(W, rng) {
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

  _drawLevel2Props(W, rng) {
    // Server racks along the floor
    [200, 500, 800, 1200, 1600, 2000, 2400].forEach(rx => {
      const rack = this.add.graphics();
      rack.fillStyle(0x0f1e30, 1); rack.fillRect(-14, -64, 28, 64);
      rack.lineStyle(1, 0x1e3a5f, 1); rack.strokeRect(-14, -64, 28, 64);
      // Drive bays
      for (let row = 0; row < 5; row++) {
        const lit = rng() > 0.4;
        rack.fillStyle(lit ? 0x06b6d4 : 0x1e3a5f, lit ? 0.8 : 0.3);
        rack.fillRect(-10, -58 + row * 11, 20, 7);
      }
      // Status light
      rack.fillStyle(rng() > 0.2 ? 0x4ade80 : 0xef4444, 1);
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

  _drawLevel5Props(W, rng) {
    // Deep space — nebula patches
    const nebula = this.add.graphics();
    [[400,300,180,0x3730a3],[1200,200,140,0x1e1b4b],[2000,350,160,0x312e81],[2800,250,130,0x1d4ed8]].forEach(([nx,ny,r,c]) => {
      nebula.fillStyle(c, 0.05);
      nebula.fillEllipse(nx, ny, r * 2.4, r);
    });

    // Large planets in background
    [[320, 180, 48, 0x7c3aed],[1600, 140, 36, 0x1e40af],[2700, 200, 55, 0x065f46]].forEach(([px,py,pr,pc]) => {
      const g = this.add.graphics();
      g.fillStyle(pc, 0.22);
      g.fillCircle(px, py, pr);
      g.lineStyle(1, pc, 0.18);
      g.strokeCircle(px, py, pr);
      // Ring
      g.lineStyle(2, pc, 0.12);
      g.strokeEllipse(px, py, pr * 3.2, pr * 0.6);
    });

    // Census terminal stations along floor
    [250, 700, 1150, 1600, 2050, 2500, 2950].forEach(tx => {
      const term = this.add.graphics();
      term.fillStyle(0x0c1445, 1); term.fillRect(-16, -56, 32, 56);
      term.lineStyle(1, 0x3730a3, 0.5); term.strokeRect(-16, -56, 32, 56);
      // Screen glow
      term.fillStyle(0x60a5fa, 0.12); term.fillRect(-12, -50, 24, 24);
      term.lineStyle(1, 0x60a5fa, 0.3); term.strokeRect(-12, -50, 24, 24);
      // Data lines on screen
      for (let l = 0; l < 3; l++) {
        term.fillStyle(0x60a5fa, 0.2); term.fillRect(-10, -44 + l * 7, 14 + l * 4, 3);
      }
      term.x = tx; term.y = 552;
    });

    // Starfield dust (tiny dots at ground level)
    const dust = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      const dx = (i * 137.5) % W;
      const dy = 520 + (i % 4) * 8;
      dust.fillStyle(0x60a5fa, 0.08 + (i % 3) * 0.06);
      dust.fillCircle(dx, dy, 1 + (i % 2));
    }

    // Census data beams (vertical scan lines)
    const beam = this.add.graphics();
    [500, 1100, 1800, 2400].forEach(bx => {
      beam.lineStyle(1, 0x3730a3, 0.1);
      beam.lineBetween(bx, 0, bx, 560);
    });

    // Highlighted census arch above Platform D (featured)
    const arch = this.add.graphics();
    arch.lineStyle(2, 0x60a5fa, 0.4);
    arch.strokeRect(2554, 308, 92, 54);
    arch.fillStyle(0x60a5fa, 0.04);
    arch.fillRect(2554, 308, 92, 54);
    // Orbital ring above
    arch.lineStyle(1, 0x60a5fa, 0.2);
    arch.strokeEllipse(2600, 295, 120, 30);
  }

  _drawLevel4Props(W, rng) {
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

  _drawLevel3Props(W, rng) {
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

  _drawLevel6Props(W, rng) {
    // Deep-space hull floor strip
    const hull = this.add.graphics();
    for (let x = 0; x < W; x += 60) {
      hull.fillStyle(0x2d1d6b, 0.12);
      hull.fillRect(x, 548, 40, 8);
    }

    // Cargo containers stacked along the floor
    [180, 420, 820, 1200, 1700, 2200, 2480].forEach((cx, i) => {
      const cg = this.add.graphics();
      const colors = [0x1a0d3d, 0x0d1f35, 0x1a1a2e];
      const col = colors[i % colors.length];
      cg.fillStyle(col, 1);
      cg.fillRect(-28, -46, 56, 46);
      cg.lineStyle(1, 0x4c1d95, 0.5);
      cg.strokeRect(-28, -46, 56, 46);
      // Rivets
      [[-22, -38], [18, -38], [-22, -12], [18, -12]].forEach(([rx, ry]) => {
        cg.fillStyle(0x7c3aed, 0.4);
        cg.fillCircle(rx, ry, 2);
      });
      // Colour stripe / label band
      cg.fillStyle(0x7c3aed, 0.25);
      cg.fillRect(-28, -22, 56, 8);
      cg.x = cx; cg.y = 552;
    });

    // Porthole windows along the top (showing stars outside)
    [120, 400, 750, 1100, 1500, 1900, 2350].forEach(px => {
      const port = this.add.graphics();
      port.fillStyle(0x050b18, 1);
      port.fillCircle(0, 0, 18);
      port.lineStyle(3, 0x4c1d95, 0.8);
      port.strokeCircle(0, 0, 18);
      // Crosshair
      port.lineStyle(1, 0x4c1d95, 0.3);
      port.lineBetween(-18, 0, 18, 0);
      port.lineBetween(0, -18, 0, 18);
      // Star inside
      port.fillStyle(0xffffff, 0.7);
      port.fillRect(-2, -2, 2, 2);
      port.fillStyle(0x93c5fd, 0.5);
      port.fillRect(6, -8, 1, 1);
      port.fillRect(-8, 5, 1, 1);
      port.x = px; port.y = 40;
    });

    // Gravity ring generators (horizontal rings on the ground)
    [500, 1050, 1600, 2300].forEach(gx => {
      const ring = this.add.graphics();
      ring.lineStyle(2, 0x7c3aed, 0.35);
      ring.strokeEllipse(0, 0, 70, 14);
      ring.lineStyle(1, 0xa855f7, 0.15);
      ring.strokeEllipse(0, 0, 90, 18);
      ring.x = gx; ring.y = 552;
    });

    // Medical bay panel above Platform A (heap priority)
    const medPanel = this.add.graphics();
    medPanel.fillStyle(0x1a0d3d, 1);
    medPanel.fillRect(640, 340, 120, 60);
    medPanel.lineStyle(1, 0xef4444, 0.4);
    medPanel.strokeRect(640, 340, 120, 60);
    medPanel.lineStyle(1, 0xef4444, 0.2);
    medPanel.lineBetween(640, 370, 760, 370);
    // Red cross icon
    medPanel.fillStyle(0xef4444, 0.5);
    medPanel.fillRect(692, 346, 16, 6);
    medPanel.fillRect(697, 341, 6, 16);

    // Holographic cargo manifest display above Platform C (knapsack)
    const manifest = this.add.graphics();
    manifest.fillStyle(0x0d1f35, 1);
    manifest.fillRect(2040, 340, 120, 60);
    manifest.lineStyle(1, 0x38bdf8, 0.4);
    manifest.strokeRect(2040, 340, 120, 60);
    // Data rows
    for (let r = 0; r < 3; r++) {
      manifest.fillStyle(0x38bdf8, 0.15 + r * 0.07);
      manifest.fillRect(2048, 350 + r * 14, 60 + r * 8, 8);
    }
    manifest.lineStyle(1, 0x38bdf8, 0.2);
    manifest.lineBetween(2040, 374, 2160, 374);

    // DP table arch above Platform B (change-making)
    const dpArch = this.add.graphics();
    dpArch.lineStyle(2, 0xa855f7, 0.4);
    dpArch.strokeRect(1390, 322, 120, 50);
    dpArch.lineStyle(1, 0xa855f7, 0.18);
    dpArch.lineBetween(1390, 347, 1510, 347);
    dpArch.fillStyle(0xa855f7, 0.05);
    dpArch.fillRect(1390, 322, 120, 50);

    // Ceiling conduit cables
    const conduit = this.add.graphics();
    conduit.lineStyle(1, 0x4c1d95, 0.2);
    conduit.lineBetween(0, 8, W, 8);
    conduit.lineStyle(1, 0x7c3aed, 0.1);
    conduit.lineBetween(0, 18, W, 18);
  }

  _drawLevel7Props(W, rng) {
    // Launchpad floor markings (dashed yellow lines)
    const markings = this.add.graphics();
    for (let x = 0; x < W; x += 50) {
      markings.fillStyle(0xf59e0b, 0.12);
      markings.fillRect(x, 548, 28, 8);
    }

    // Communication towers
    [280, 680, 1100, 1680, 2280].forEach(tx => {
      const tower = this.add.graphics();
      // Stem
      tower.fillStyle(0x0f2038, 1);
      tower.fillRect(-4, -120, 8, 120);
      // Crossbeam
      tower.fillStyle(0x1e3a5f, 1);
      tower.fillRect(-22, -80, 44, 6);
      // Dish
      tower.fillStyle(0x1e3a5f, 1);
      tower.fillEllipse(0, -128, 28, 12);
      tower.lineStyle(1, 0x38bdf8, 0.4);
      tower.strokeEllipse(0, -128, 28, 12);
      // Antenna tip
      tower.fillStyle(0xef4444, 0.8);
      tower.fillCircle(0, -134, 3);
      tower.x = tx; tower.y = 552;
    });

    // Fiber optic cables along floor
    const cables = this.add.graphics();
    cables.lineStyle(1, 0x38bdf8, 0.22);
    cables.lineBetween(0, 548, W, 548);
    cables.lineStyle(1, 0x60a5fa, 0.10);
    cables.lineBetween(0, 553, W, 553);

    // Server rack panels near ground
    [480, 980, 1580, 2080].forEach(rx => {
      const rack = this.add.graphics();
      rack.fillStyle(0x0c1a2e, 1);
      rack.fillRect(-22, -48, 44, 48);
      rack.lineStyle(1, 0x1e3a5f, 0.6);
      rack.strokeRect(-22, -48, 44, 48);
      for (let r = 0; r < 4; r++) {
        rack.fillStyle(0x38bdf8, 0.15 + r * 0.04);
        rack.fillRect(-16, -42 + r * 10, 32, 6);
      }
      rack.x = rx; rack.y = 552;
    });

    // MST arch above Platform A (x=700)
    const mstArch = this.add.graphics();
    mstArch.lineStyle(2, 0x38bdf8, 0.4);
    mstArch.strokeRect(638, 336, 124, 58);
    mstArch.lineStyle(1, 0x38bdf8, 0.15);
    mstArch.lineBetween(638, 365, 762, 365);
    mstArch.fillStyle(0x38bdf8, 0.04);
    mstArch.fillRect(638, 336, 124, 58);

    // Dijkstra arch above Platform B (x=1450)
    const djkArch = this.add.graphics();
    djkArch.lineStyle(2, 0xf59e0b, 0.4);
    djkArch.strokeRect(1388, 296, 124, 58);
    djkArch.lineStyle(1, 0xf59e0b, 0.15);
    djkArch.lineBetween(1388, 325, 1512, 325);
    djkArch.fillStyle(0xf59e0b, 0.04);
    djkArch.fillRect(1388, 296, 124, 58);

    // Ceiling network conduit
    const conduit = this.add.graphics();
    conduit.lineStyle(1, 0x1e3a5f, 0.25);
    conduit.lineBetween(0, 6, W, 6);
    conduit.lineStyle(1, 0x38bdf8, 0.08);
    conduit.lineBetween(0, 16, W, 16);
  }

  _drawLevel8Props(W, rng) {
    // Dense starfield (climactic finale)
    const stars = this.add.graphics();
    for (let i = 0; i < 350; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, 420);
      const sz = rng() > 0.9 ? 2 : 1;
      const blue = rng() > 0.5;
      stars.fillStyle(blue ? 0x93c5fd : 0xffffff, Phaser.Math.FloatBetween(0.1, 0.9));
      stars.fillRect(sx, sy, sz, sz);
    }

    // Holographic lock scanlines near start
    const lockG = this.add.graphics();
    for (let i = 0; i < 4; i++) {
      lockG.lineStyle(1, 0xa855f7, 0.18 - i * 0.03);
      lockG.lineBetween(0, 80 + i * 14, W, 80 + i * 14);
    }

    // Energy columns spaced across world
    [400, 900, 1500, 2200, 2900].forEach(ex => {
      const eg = this.add.graphics();
      eg.lineStyle(1, 0xa855f7, 0.15);
      eg.lineBetween(ex, 0, ex, 552);
    });

    // Chessboard hint tiles above Platform A (x=700, y=430)
    const chess = this.add.graphics();
    const cs = 16;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const isLight = (r + c) % 2 === 0;
        chess.fillStyle(isLight ? 0x1e293b : 0x0f172a, 0.5);
        chess.fillRect(636 + c * cs, 346 + r * cs, cs, cs);
        chess.lineStyle(1, 0x334155, 0.3);
        chess.strokeRect(636 + c * cs, 346 + r * cs, cs, cs);
      }
    }

    // P / NP / NP-Complete door hint frames above Platform B (x=1400)
    const doorColors = [0x22c55e, 0xfbbf24, 0xef4444];
    doorColors.forEach((col, i) => {
      const dx = 1290 + i * 56;
      const dg = this.add.graphics();
      dg.lineStyle(1, col, 0.3);
      dg.strokeRect(dx, 306, 46, 60);
      dg.fillStyle(col, 0.05);
      dg.fillRect(dx, 306, 46, 60);
    });

    // Launch pad glow circle near exit
    const padG = this.add.graphics();
    padG.lineStyle(2, 0x4ade80, 0.2);
    padG.strokeEllipse(3200, 552, 220, 28);
    padG.fillStyle(0x4ade80, 0.05);
    padG.fillEllipse(3200, 552, 220, 28);

    // Ship silhouette hint near exit
    const shipG = this.add.graphics();
    shipG.fillStyle(0x38bdf8, 0.10);
    shipG.fillTriangle(3200, 430, 3170, 500, 3230, 500);
    shipG.lineStyle(1, 0x38bdf8, 0.2);
    shipG.strokeTriangle(3200, 430, 3170, 500, 3230, 500);

    // Complexity archway above Platform B
    const compArch = this.add.graphics();
    compArch.lineStyle(2, 0xa855f7, 0.35);
    compArch.strokeRect(1336, 296, 128, 58);
    compArch.fillStyle(0xa855f7, 0.04);
    compArch.fillRect(1336, 296, 128, 58);
  }

  // ─────────────────────────────────────────────────────────────────────────

  showEndScreen() {
    this.cameras.main.setBackgroundColor('#0d1117');
    this.add.text(400, 190, "Dodo's Algorithmic Adventure", {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#475569',
    }).setOrigin(0.5);

    this.add.text(400, 228, 'All Levels Complete!', {
      fontFamily: 'sans-serif', fontSize: '34px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(400, 270, '"Thanks for everything! You humans sure have some incredibly\nefficient ways to solve problems. Next stop — ZZS!"', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#94a3b8',
      align: 'center', fontStyle: 'italic',
    }).setOrigin(0.5);

    this.add.text(400, 320, '— Dodo', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#475569',
    }).setOrigin(0.5);

    const total = archiveSystem.getAllAlgorithms().length;
    this.add.text(400, 358, `Algorithms collected: ${total} / 30`, {
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

  update(time, delta) {
    this.playerController?.update(time, delta);
    this.interactionSystem?.update(time, delta);
  }
}
