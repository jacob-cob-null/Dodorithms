import Phaser from "phaser";
import Player from "../entities/Player.js";
import Interactable from "../entities/Interactable.js";
import PlayerController from "../systems/PlayerController.js";
import InteractionSystem from "../systems/InteractionSystem.js";
import EventBus from "../systems/EventBus.js";
import { EVENTS } from "../systems/events.js";
import archiveSystem from "../systems/ArchiveSystem.js";
import { applyCrt } from "../systems/CrtSystem.js";
import { LEVELS } from "../data/levels.js";

const LEVEL_THEMES = {
  level1: 'city', level2: 'tech', level3: 'lab', level4: 'train',
  level5: 'space', level6: 'space', level7: 'network', level8: 'academy',
};

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
    applyCrt(this, { vignetteStrength: 0.16 });

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

    // Camera fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Platforms — themed per level
    const theme = LEVEL_THEMES[levelConfig.id] || 'city';
    const platTex = this.textures.exists(`platform_${theme}`) ? `platform_${theme}` : 'platform';
    this.platforms = this.physics.add.staticGroup();
    platforms.forEach(p => {
      this._drawPlatformGlow(p, theme);
      this.platforms.create(p.x, p.y, platTex).setScale(p.scaleX, p.scaleY).setDepth(7).refreshBody();
    });

    // Player
    this.player = new Player(this, playerStart.x, playerStart.y);
    this.player.setDepth(12);
    this.playerShadow = this.add.ellipse(playerStart.x, playerStart.y + 31, 38, 8, 0x000000, 0.34)
      .setDepth(8);
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
      fontFamily: '"Courier New", Courier, monospace', fontSize: '13px', color: '#38bdf8',
    }).setScrollFactor(0);

    this.add.text(12, 28, levelConfig.subtitle, {
      fontFamily: '"Courier New", Courier, monospace', fontSize: '11px', color: '#334155',
    }).setScrollFactor(0);

    this.add.text(400, 10, '← → to move   SPACE to jump   E to interact', {
      fontFamily: '"Courier New", Courier, monospace', fontSize: '10px', color: '#1e3a5f',
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
    const isRealNpc = cfg.texture && cfg.texture.startsWith('npc_') && this.textures.exists(cfg.texture);
    const isNpcSprite = cfg.texture && cfg.texture.startsWith('npc_');
    const shadowW = isNpcSprite ? 38 : 26;
    const shadowY = isNpcSprite ? cfg.y + 35 : cfg.y + 15;
    const shadow = this.add.ellipse(cfg.x, shadowY, shadowW, 8, 0x000000, 0.34)
      .setDepth(8);

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
    sprite.setDepth(12);
    sprite.shadow = shadow;

    // Scale real NPC images down to game size
    if (isRealNpc) sprite.setDisplaySize(48, 72);

    // NPC idle bob tween
    if (cfg.texture && cfg.texture.startsWith('npc_')) {
      this.tweens.add({
        targets: sprite,
        y: cfg.y - 3,
        duration: 1400 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    // Name label above sprite
    const labelY = isNpcSprite ? cfg.y - 52 : cfg.y - 30;
    const label = this.add.text(cfg.x, labelY, cfg.speaker, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#9fb3c8',
      backgroundColor: 'rgba(2, 8, 16, 0.45)',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(14);

    // Interactable glow label
    if (cfg.objectType === 'interactable') {
      this.add.text(cfg.x, labelY - 18, '[!]', {
        fontFamily: 'monospace', fontSize: '13px', color: '#38bdf8',
      }).setOrigin(0.5).setDepth(14);
    }

    this.obstacleSprites.set(cfg.id, sprite);
    this.interactionSystem.register(sprite);
  }

  _drawPlatformGlow(p, theme) {
    const ledColors = {
      city: 0xf59e0b,
      tech: 0x06b6d4,
      lab: 0x22c55e,
      train: 0xa855f7,
      space: 0xa855f7,
      network: 0x38bdf8,
      academy: 0xfbbf24,
    };
    const led = ledColors[theme] || 0x38bdf8;
    const w = 64 * p.scaleX;
    const h = 16 * p.scaleY;
    const x = p.x - w / 2;
    const y = p.y - h / 2;

    const g = this.add.graphics().setDepth(5);

    // Pixel rim aura: layered rectangles instead of soft circles, so it keeps the pixel-art read.
    g.fillStyle(led, 0.035);
    g.fillRect(x - 8, y + h - 7, w + 16, 14);
    g.fillStyle(led, 0.06);
    g.fillRect(x - 4, y + h - 5, w + 8, 9);
    g.fillStyle(led, 0.18);
    g.fillRect(x, y + h - 3, w, 3);
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(x + 4, y + h - 4, Math.max(16, w * 0.28), 1);

    // Small pulsing endpoint LEDs make platforms feel powered without distracting.
    [x + 8, x + w - 12].forEach((px, idx) => {
      const dot = this.add.rectangle(px, y + h - 2, 4, 2, led, 0.8).setDepth(8);
      this.tweens.add({
        targets: dot,
        alpha: 0.25,
        duration: 950 + idx * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });
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
    // Outer glow sprite (ADD blend behind portal)
    const glow = this.add.sprite(exitCfg.x, exitCfg.y, 'portal');
    glow.setAlpha(0.15).setScale(1.5).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: glow,
      alpha: 0.05,
      scaleX: 1.7,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    const portal = new Interactable(this, exitCfg.x, exitCfg.y, 'portal', {
      id: 'exit-portal',
      onInteract: () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { levelIndex: this.levelIndex + 1 });
        });
      },
    });
    this.interactionSystem.register(portal);

    // Breathing pulse — alpha + scaleX
    this.tweens.add({
      targets: portal,
      alpha: 0.6,
      scaleX: 0.95,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Floating particles around portal
    for (let i = 0; i < 6; i++) {
      const px = exitCfg.x + Phaser.Math.Between(-14, 14);
      const dot = this.add.graphics();
      dot.fillStyle(0xa78bfa, 0.6);
      dot.fillCircle(0, 0, 2);
      dot.x = px;
      dot.y = exitCfg.y + 20;
      this.tweens.add({
        targets: dot,
        y: exitCfg.y - 30,
        alpha: 0,
        duration: 1200 + i * 200,
        delay: i * 220,
        repeat: -1,
        ease: 'Sine.In',
        onRepeat: () => {
          dot.x = exitCfg.x + Phaser.Math.Between(-14, 14);
          dot.y = exitCfg.y + 20;
          dot.alpha = 0.6;
        },
      });
    }

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
    const { worldWidth, parallax, id, bgColor } = levelConfig;
    if (!parallax) return;

    const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = this._seededRandom(seed);

    parallax.forEach(layer => {
      if (layer.type === 'cityFar' || layer.type === 'cityNear') return;
      const g = this.add.graphics().setScrollFactor(layer.scrollFactor);
      if (layer.type === 'stars') this._drawStars(g, worldWidth, rng);
    });

    if (id === 'level1') {
      this._drawLevel1Parallax(worldWidth, rng);
    }

    // Wall band — anchored to bottom, tiles horizontally across world width
    const bgKey = `bg_${id}`;
    if (this.textures.exists(bgKey)) {
      const tex = this.textures.get(bgKey).getSourceImage();
      const bandH = 400;
      const scale = bandH / tex.height;

      const band = this.add.tileSprite(0, 600, worldWidth, bandH, bgKey)
        .setOrigin(0, 1)
        .setTileScale(scale, scale)
        .setScrollFactor(0.8)
        .setAlpha(0.92);

      // Blur via preFX if supported (Phaser 4 WebGL)
      if (band.preFX) {
        band.preFX.addBlur(0, 2, 2, 0.8);
      }

      // Subtle dark overlay — 8%
      const dark = this.add.graphics().setScrollFactor(0.8);
      dark.fillStyle(0x000000, 0.08);
      dark.fillRect(0, 200, worldWidth, 400);
    }

    if (id === 'level1') this._drawLevel1Props(worldWidth, rng);
    if (id === 'level2') this._drawLevel2Props(worldWidth, rng);
    if (id === 'level3') { this._drawLevel3Props(worldWidth, rng); this._addBioPulse(worldWidth); }
    if (id === 'level4') this._drawLevel4Props(worldWidth, rng);
    if (id === 'level5') { this._drawLevel5Props(worldWidth, rng); this._addTwinkleStars(worldWidth); }
    if (id === 'level6') { this._drawLevel6Props(worldWidth, rng); this._addGravityRingPulse(worldWidth); this._addTwinkleStars(worldWidth); }
    if (id === 'level7') { this._drawLevel7Props(worldWidth, rng); this._addTwinkleStars(worldWidth); }
    if (id === 'level8') { this._drawLevel8Props(worldWidth, rng); this._addTwinkleStars(worldWidth); }

    // Ambient dust motes — floating particles across world
    this._spawnDustMotes(worldWidth);
  }

  _spawnDustMotes(W) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const dot = this.add.graphics().setScrollFactor(0.6);
      const sz = rng => rng() > 0.6 ? 2 : 1;
      dot.fillStyle(0xffffff, 0.04 + Math.random() * 0.05);
      dot.fillRect(0, 0, Math.random() > 0.6 ? 2 : 1, Math.random() > 0.6 ? 2 : 1);
      dot.x = Math.random() * W;
      dot.y = 100 + Math.random() * 450;
      const dur = 3000 + Math.random() * 4000;
      this.tweens.add({
        targets: dot,
        y: dot.y - (60 + Math.random() * 80),
        alpha: 0,
        duration: dur,
        delay: Math.random() * dur,
        repeat: -1,
        ease: 'Sine.In',
        onRepeat: () => {
          dot.x = Math.random() * W;
          dot.y = 480 + Math.random() * 60;
          dot.alpha = 0.04 + Math.random() * 0.05;
        },
      });
    }
  }

  _addTwinkleStars(W) {
    // 6 individual bright stars that pulse alpha — scrollFactor matches star layer
    for (let i = 0; i < 6; i++) {
      const s = this.add.graphics().setScrollFactor(0.05);
      s.fillStyle(0xffffff, 0.9);
      s.fillRect(0, 0, 2, 2);
      s.x = 60 + Math.floor(Math.random() * (W - 120));
      s.y = 20 + Math.floor(Math.random() * 300);
      this.tweens.add({
        targets: s,
        alpha: 0.1,
        duration: 1500 + Math.random() * 1500,
        delay: Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  _addBioPulse(W) {
    // One glowing specimen jar that slowly pulses (lab level 3)
    const jar = this.add.graphics().setScrollFactor(1.0);
    jar.fillStyle(0x4ade80, 0.2);
    jar.fillCircle(0, 0, 10);
    jar.fillStyle(0x86efac, 0.55);
    jar.fillCircle(0, 0, 5);
    jar.x = 300; jar.y = 524;
    this.tweens.add({
      targets: jar,
      alpha: 0.3,
      scaleX: 1.2, scaleY: 1.2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  _addGravityRingPulse(W) {
    // Gravity rings that expand/contract — space station level 6
    [500, 1050, 1600, 2300].forEach((gx, i) => {
      const ring = this.add.graphics().setScrollFactor(1.0);
      ring.lineStyle(1, 0x7c3aed, 0.3);
      ring.strokeEllipse(0, 0, 70, 14);
      ring.x = gx; ring.y = 552;
      this.tweens.add({
        targets: ring,
        scaleX: 1.15,
        alpha: 0.4,
        duration: 1800 + i * 300,
        delay: i * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });
  }

  _drawStars(g, W, rng) {
    // Sky gradient — dark at top, slightly lighter at horizon
    g.fillStyle(0x020810, 1);
    g.fillRect(0, 0, W, 200);
    g.fillStyle(0x040c18, 1);
    g.fillRect(0, 200, W, 150);
    g.fillStyle(0x060d17, 1);
    g.fillRect(0, 350, W, 195);

    // Stars — dense field with varied sizes
    for (let i = 0; i < 400; i++) {
      const x = rng() * W;
      const y = rng() * 500;
      const r = rng();
      const sz = r > 0.92 ? 3 : r > 0.75 ? 2 : 1;
      const blue = rng() > 0.55;
      const alpha = 0.15 + rng() * 0.85;
      g.fillStyle(blue ? 0x93c5fd : 0xffffff, alpha);
      g.fillRect(x, y, sz, sz);
    }

    // Bright accent stars with glow halos
    for (let i = 0; i < 8; i++) {
      const sx = rng() * W;
      const sy = rng() * 350;
      g.fillStyle(0xffffff, 0.04);
      g.fillCircle(sx, sy, 8);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(sx - 1, sy - 1, 3, 3);
    }

    // Alien planet with craters and ring
    const px = 700, py = 95;
    g.fillStyle(0x38bdf8, 0.03); g.fillCircle(px, py, 90);   // far glow
    g.fillStyle(0x1e3a5f, 1);    g.fillCircle(px, py, 46);   // body
    g.fillStyle(0x2d4f75, 1);    g.fillCircle(px, py, 38);   // bright face
    g.fillStyle(0x1e3a5f, 0.6);  g.fillCircle(px - 12, py - 8, 8);  // crater
    g.fillStyle(0x1e3a5f, 0.4);  g.fillCircle(px + 10, py + 12, 5); // crater
    // Ring
    g.lineStyle(3, 0x38bdf8, 0.15);
    g.strokeEllipse(px, py, 130, 20);
    g.lineStyle(1, 0x93c5fd, 0.25);
    g.strokeEllipse(px, py, 120, 16);

    // Nebula wisps — multiple with color variation
    const nebColors = [0x312e81, 0x1e1b4b, 0x3730a3, 0x1d4ed8];
    for (let i = 0; i < 6; i++) {
      const nx = rng() * W;
      const ny = 30 + rng() * 280;
      const nc = nebColors[Math.floor(rng() * nebColors.length)];
      g.fillStyle(nc, 0.04 + rng() * 0.05);
      g.fillEllipse(nx, ny, 150 + rng() * 200, 40 + rng() * 50);
    }

    // Shooting star traces
    for (let i = 0; i < 2; i++) {
      const sx = rng() * W * 0.8;
      const sy = rng() * 200;
      g.lineStyle(1, 0xffffff, 0.15);
      g.lineBetween(sx, sy, sx + 40 + rng() * 30, sy + 15 + rng() * 10);
    }
  }

  _drawCityFar(g, W, rng) {
    // Atmospheric haze at horizon
    g.fillStyle(0x0a1628, 0.3);
    g.fillRect(0, 460, W, 90);

    // Dark distant silhouettes
    let x = 0;
    while (x < W) {
      const bw = 42 + Math.floor(rng() * 46);
      const bh = 80 + Math.floor(rng() * 130);
      const by = 540 - bh;
      g.fillStyle(0x0a1a2e, 1);
      g.fillRect(x, by, bw, bh);

      // Rooftop edge highlight
      g.fillStyle(0x1e3a5f, 0.3);
      g.fillRect(x, by, bw, 2);

      // Window grid — warm/cool mix
      for (let wy = by + 8; wy < 534; wy += 13) {
        for (let wx = x + 4; wx < x + bw - 4; wx += 10) {
          if (rng() > 0.44) {
            const warm = rng() > 0.6;
            g.fillStyle(warm ? 0xfbbf24 : 0x1e4d7a, 0.2 + rng() * 0.5);
            g.fillRect(wx, wy, 4, 7);
          }
        }
      }

      // Antenna spire with blinking light
      if (rng() > 0.45) {
        g.fillStyle(0x152840, 1);
        g.fillRect(x + Math.floor(bw / 2) - 1, by - 20, 2, 20);
        g.fillStyle(0xef4444, 0.7);
        g.fillRect(x + Math.floor(bw / 2) - 2, by - 22, 4, 4);
        // Red glow
        g.fillStyle(0xef4444, 0.06);
        g.fillCircle(x + Math.floor(bw / 2), by - 20, 8);
      }

      x += bw + 3 + Math.floor(rng() * 20);
    }
  }

  _drawCityNear(g, W, rng) {
    const NEONS = [0xf59e0b, 0x38bdf8, 0xa855f7, 0xef4444, 0x4ade80];
    let x = 0;
    while (x < W) {
      const bw = 52 + Math.floor(rng() * 60);
      const bh = 50 + Math.floor(rng() * 98);
      const by = 540 - bh;
      const accent = NEONS[Math.floor(rng() * NEONS.length)];

      // Building body
      g.fillStyle(0x0d1f35, 1);
      g.fillRect(x, by, bw, bh);

      // Side edge glow
      g.fillStyle(accent, 0.08);
      g.fillRect(x, by, 2, bh);
      g.fillRect(x + bw - 2, by, 2, bh);

      // Neon roof line
      g.fillStyle(accent, 0.6);
      g.fillRect(x, by, bw, 2);
      // Roof glow bleed
      g.fillStyle(accent, 0.04);
      g.fillRect(x - 4, by - 6, bw + 8, 8);

      // Neon sign strip below roof
      g.fillStyle(accent, 0.45);
      g.fillRect(x + 4, by + 6, bw - 8, 5);

      // Windows with frames
      for (let wy = by + 18; wy < 528; wy += 18) {
        for (let wx = x + 6; wx < x + bw - 6; wx += 14) {
          if (rng() > 0.38) {
            const warm = rng() > 0.6;
            const wc = warm ? 0xfbbf24 : accent;
            // Window frame
            g.fillStyle(0x1e3a5f, 0.6);
            g.fillRect(wx - 1, wy - 1, 9, 12);
            // Window light
            g.fillStyle(wc, 0.2 + rng() * 0.45);
            g.fillRect(wx, wy, 7, 10);
          }
        }
      }

      // Billboard on some buildings
      if (rng() > 0.65) {
        g.fillStyle(accent, 0.15);
        g.fillRect(x + 6, by + 12, bw - 12, 22);
        g.lineStyle(1, accent, 0.5);
        g.strokeRect(x + 6, by + 12, bw - 12, 22);
        // Scanlines on billboard
        for (let sy = by + 14; sy < by + 32; sy += 3) {
          g.fillStyle(accent, 0.06);
          g.fillRect(x + 7, sy, bw - 14, 1);
        }
      }

      // Ground-level light pool from building
      g.fillStyle(accent, 0.03);
      g.fillEllipse(x + bw / 2, 548, bw + 10, 16);

      x += bw + 6 + Math.floor(rng() * 26);
    }
  }

  _drawLevel1Parallax(W, rng) {
    const sky = this.add.graphics().setScrollFactor(0.08).setDepth(-20);
    const moonX = 1680;
    const moonY = 92;
    sky.fillStyle(0xf59e0b, 0.035); sky.fillCircle(moonX, moonY, 70);
    sky.fillStyle(0x2b1a38, 0.9); sky.fillCircle(moonX, moonY, 34);
    sky.fillStyle(0x4c2d5f, 0.9); sky.fillCircle(moonX - 5, moonY - 4, 27);
    sky.fillStyle(0xf59e0b, 0.25); sky.fillRect(moonX - 16, moonY - 2, 22, 3);
    sky.fillStyle(0x38bdf8, 0.16); sky.fillRect(moonX - 26, moonY + 8, 34, 2);

    for (let lane = 0; lane < 5; lane++) {
      const y = 130 + lane * 38 + Math.floor(rng() * 14);
      for (let x = 120 + lane * 70; x < W; x += 420 + Math.floor(rng() * 130)) {
        sky.fillStyle(lane % 2 === 0 ? 0xf59e0b : 0x38bdf8, 0.18);
        sky.fillRect(x, y, 44 + Math.floor(rng() * 30), 2);
        sky.fillStyle(0xffffff, 0.28);
        sky.fillRect(x + 2, y, 2, 2);
      }
    }

    const far = this.add.graphics().setScrollFactor(0.22).setDepth(-15);
    far.fillStyle(0x050b18, 0.72);
    far.fillRect(0, 360, W, 190);
    let x = -40;
    while (x < W + 80) {
      const bw = 38 + Math.floor(rng() * 56);
      const bh = 78 + Math.floor(rng() * 150);
      const top = 538 - bh;
      far.fillStyle(0x071426, 0.92);
      far.fillRect(x, top, bw, bh);
      far.fillStyle(0x10233c, 0.75);
      far.fillRect(x, top, bw, 2);
      if (rng() > 0.45) {
        far.fillStyle(0x1e3a5f, 0.42);
        far.fillRect(x + Math.floor(bw / 2), top - 26, 2, 26);
        far.fillStyle(0xef4444, 0.58);
        far.fillRect(x + Math.floor(bw / 2) - 1, top - 29, 4, 3);
      }
      for (let wy = top + 9; wy < 530; wy += 15) {
        for (let wx = x + 5; wx < x + bw - 5; wx += 12) {
          if (rng() > 0.7) {
            far.fillStyle(rng() > 0.5 ? 0xf59e0b : 0x38bdf8, 0.25);
            far.fillRect(wx, wy, 4, 6);
          }
        }
      }
      x += bw + 8 + Math.floor(rng() * 18);
    }

    const mid = this.add.graphics().setScrollFactor(0.58).setDepth(-8);
    for (let i = 0; i < 18; i++) {
      const rx = Math.floor(rng() * W);
      const ry = 230 + Math.floor(rng() * 260);
      const len = 18 + Math.floor(rng() * 44);
      mid.lineStyle(1, rng() > 0.5 ? 0x38bdf8 : 0xf59e0b, 0.08 + rng() * 0.07);
      mid.lineBetween(rx, ry, rx - len, ry + Math.floor(len * 0.42));
    }
  }

  _drawLevel1Props(W, rng) {
    {
    const road = this.add.graphics().setDepth(1);
    road.fillStyle(0x0f172a, 0.58);
    road.fillRect(0, 540, W, 28);
    for (let x = 0; x < W; x += 64) {
      this._drawLevel1MetalPanel(road, x, 540, 62, 28, { led: false, alpha: 0.58 });
    }
    road.lineStyle(1, 0x334155, 0.65);
    road.lineBetween(0, 548, W, 548);
    road.lineStyle(1, 0xf59e0b, 0.3);
    road.lineBetween(0, 553, W, 553);
    road.lineStyle(1, 0x38bdf8, 0.14);
    road.lineBetween(0, 559, W, 559);

    for (let i = 0; i < 95; i++) {
      const x = Math.floor(rng() * W);
      const y = 505 + Math.floor(rng() * 46);
      const len = 8 + Math.floor(rng() * 28);
      const color = rng() > 0.55 ? 0xf59e0b : 0x38bdf8;
      road.lineStyle(1, color, 0.08 + rng() * 0.08);
      road.lineBetween(x, y, x + len, y);
    }

    const wreck = this.add.graphics().setDepth(2);
    wreck.x = 132; wreck.y = 514;
    wreck.fillStyle(0xf59e0b, 0.05); wreck.fillEllipse(52, 31, 170, 54);
    this._drawLevel1MetalPanel(wreck, 0, 8, 116, 30, { accent: 0xf59e0b, alpha: 0.92 });
    this._drawLevel1MetalPanel(wreck, 16, -12, 76, 20, { accent: 0xf59e0b, alpha: 0.96 });
    wreck.fillStyle(0x020810, 0.95); wreck.fillRect(30, 0, 36, 14);
    wreck.lineStyle(1, 0x334155, 0.85); wreck.strokeRect(30, 0, 36, 14);
    wreck.fillStyle(0x38bdf8, 0.45); wreck.fillRect(35, 3, 20, 3);
    wreck.fillStyle(0xef4444, 0.75); wreck.fillRect(5, 35, 102, 3);
    wreck.fillStyle(0xf59e0b, 0.9); wreck.fillRect(20, 41, 70, 3);
    wreck.lineStyle(1, 0xf59e0b, 0.35);
    wreck.lineBetween(10, 48, 116, 18);
    wreck.lineBetween(0, 20, 96, 48);

    this._addLevel1LandingPad(650, 482);
    this._addLevel1DataKiosk(1300, 482);
    this._addLevel1ProfessorStage(1980, 482);

    [470, 880, 1180, 1660, 2140, 2380].forEach((lx, i) => {
      const lamp = this.add.graphics().setDepth(3);
      lamp.x = lx; lamp.y = 552;
      lamp.fillStyle(0xf59e0b, 0.035); lamp.fillRect(-58, -92, 116, 92);
      lamp.fillStyle(0xf59e0b, 0.045); lamp.fillEllipse(0, 0, 150, 28);
      lamp.fillStyle(0x020810, 0.45); lamp.fillEllipse(0, 0, 92, 15);
      this._drawLevel1MetalPanel(lamp, -4, -74, 8, 74, { led: false, alpha: 0.94 });
      this._drawLevel1MetalPanel(lamp, -16, -84, 32, 12, { accent: 0xf59e0b, alpha: 0.96 });
      lamp.fillStyle(0xf59e0b, 0.16); lamp.fillRect(-20, -88, 40, 20);
      lamp.fillStyle(0xfbbf24, 1); lamp.fillRect(-10, -78, 20, 4);
      lamp.fillStyle(0xffffff, 0.55); lamp.fillRect(-4, -78, 8, 1);
      lamp.fillStyle(0xf59e0b, 0.09); lamp.fillEllipse(0, -42, 86, 88);
      lamp.fillStyle(0xf59e0b, 0.08); lamp.fillEllipse(0, 0, 148, 26);
      lamp.fillStyle(0xf59e0b, 0.18);
      lamp.fillRect(-34, -1, 68, 2);
      lamp.fillStyle(0xf59e0b, 0.1);
      lamp.fillRect(-50, 3, 100, 2);
      if (i % 2 === 0) {
        lamp.fillStyle(0x38bdf8, 0.42);
        lamp.fillRect(8, -60, 2, 18);
      }

      const pulse = this.add.rectangle(lx, 474, 26, 4, 0xfbbf24, 0.42).setDepth(4);
      this.tweens.add({
        targets: pulse,
        alpha: 0.14,
        scaleX: 1.45,
        duration: 1100 + i * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

    [[318, 'ARRIVAL'], [1010, 'GCD'], [1900, 'O(log n)']].forEach(([hx, text]) => {
      const holo = this.add.graphics().setDepth(3);
      holo.x = hx; holo.y = 552;
      this._drawLevel1MetalPanel(holo, -13, -18, 26, 18, { accent: 0x38bdf8, alpha: 0.96 });
      holo.fillStyle(0x38bdf8, 0.08); holo.fillTriangle(-28, -14, 28, -14, 0, -62);
      holo.lineStyle(1, 0x38bdf8, 0.28); holo.strokeTriangle(-28, -14, 28, -14, 0, -62);
      for (let sy = -58; sy < -18; sy += 5) {
        holo.fillStyle(0x38bdf8, 0.06);
        holo.fillRect(-18, sy, 36, 1);
      }
      this.add.text(hx, 502, text, {
        fontFamily: 'monospace', fontSize: '9px', color: '#38bdf8',
        backgroundColor: 'rgba(2, 8, 16, 0.42)', padding: { x: 3, y: 1 },
      }).setOrigin(0.5).setDepth(4);
    });

    const cables = this.add.graphics().setDepth(2);
    cables.lineStyle(1, 0x0f172a, 0.65);
    for (let i = 0; i < 5; i++) {
      const y = 354 + i * 11;
      cables.beginPath();
      cables.moveTo(0, y);
      for (let x = 0; x <= W; x += 140) {
        cables.lineTo(x, y + Math.sin((x + i * 60) / 150) * 9);
      }
      cables.strokePath();
    }

    const canopy = this.add.graphics().setDepth(2);
    [560, 1250, 1860].forEach(cx => {
      this._drawLevel1MetalPanel(canopy, cx - 94, 426, 188, 18, { accent: 0xf59e0b, alpha: 0.78 });
      canopy.fillStyle(0x38bdf8, 0.18);
      canopy.fillRect(cx - 84, 444, 168, 2);
      canopy.fillStyle(0xf59e0b, 0.35);
      canopy.fillRect(cx - 78, 449, 42, 3);
    });
    }
  }

  _drawLevel1MetalPanel(g, x, y, w, h, { accent = 0xf59e0b, alpha = 1, led = true } = {}) {
    g.fillStyle(0x1e293b, alpha);
    g.fillRect(x, y, w, h);
    g.lineStyle(1, 0x334155, 0.82 * alpha);
    g.strokeRect(x, y, w, h);

    for (let gy = y + 4; gy < y + h - 4; gy += 5) {
      g.fillStyle(0x334155, 0.38 * alpha);
      g.fillRect(x + 2, gy, w - 4, 1);
    }

    g.fillStyle(0x0f172a, 0.58 * alpha);
    g.fillRect(x + 3, y + 3, Math.max(4, Math.floor(w * 0.18)), 2);
    g.fillRect(x + w - Math.max(8, Math.floor(w * 0.22)) - 3, y + h - 5, Math.max(6, Math.floor(w * 0.2)), 2);

    g.fillStyle(0x0f172a, 0.8 * alpha);
    [[x + 4, y + 4], [x + w - 6, y + 4], [x + 4, y + h - 6], [x + w - 6, y + h - 6]].forEach(([rx, ry]) => {
      g.fillRect(rx, ry, 2, 2);
    });

    if (led) {
      g.fillStyle(accent, 0.14 * alpha);
      g.fillRect(x, y + h - 6, w, 6);
      g.fillStyle(accent, 0.82 * alpha);
      g.fillRect(x + 3, y + h - 4, w - 6, 2);
    }
  }

  _addLevel1LandingPad(x, surfaceY) {
    const pad = this.add.graphics().setDepth(4);
    pad.x = x; pad.y = surfaceY;
    pad.fillStyle(0x020810, 0.65); pad.fillEllipse(0, 6, 190, 22);
    this._drawLevel1MetalPanel(pad, -94, -14, 188, 18, { accent: 0xf59e0b, alpha: 0.96 });
    for (let i = -4; i <= 4; i++) {
      pad.fillStyle(i % 2 === 0 ? 0x334155 : 0x0f172a, 0.8);
      pad.fillRect(i * 20 - 9, -11, 17, 10);
    }
    pad.fillStyle(0xf59e0b, 0.75); pad.fillRect(-82, -20, 26, 3);
    pad.fillStyle(0xef4444, 0.55); pad.fillRect(56, -20, 26, 3);
  }

  _addLevel1DataKiosk(x, surfaceY) {
    const kiosk = this.add.graphics().setDepth(4);
    kiosk.x = x + 92; kiosk.y = surfaceY;
    kiosk.fillStyle(0x020810, 0.55); kiosk.fillEllipse(0, 5, 54, 12);
    this._drawLevel1MetalPanel(kiosk, -18, -56, 36, 56, { accent: 0x38bdf8, alpha: 0.96 });
    kiosk.fillStyle(0x38bdf8, 0.14); kiosk.fillRect(-11, -48, 22, 24);
    kiosk.lineStyle(1, 0x38bdf8, 0.35); kiosk.strokeRect(-11, -48, 22, 24);
    kiosk.fillStyle(0x38bdf8, 0.5); kiosk.fillRect(-8, -42, 16, 2);
    kiosk.fillRect(-8, -35, 10, 2);
    kiosk.fillStyle(0xf59e0b, 0.6); kiosk.fillRect(7, -7, 5, 5);
  }

  _addLevel1ProfessorStage(x, surfaceY) {
    const stage = this.add.graphics().setDepth(4);
    stage.x = x; stage.y = surfaceY;
    stage.fillStyle(0x020810, 0.55); stage.fillEllipse(0, 6, 160, 18);
    this._drawLevel1MetalPanel(stage, -74, -10, 148, 14, { accent: 0xf59e0b, alpha: 0.94 });
    stage.fillStyle(0xfbbf24, 0.45); stage.fillRect(-54, -15, 28, 3);
    stage.fillStyle(0x38bdf8, 0.34); stage.fillRect(22, -15, 34, 3);
  }

  _drawLevel2Props(W, rng) {
    // Server racks — holographic outlines
    [200, 500, 800, 1200, 1600, 2000, 2400].forEach(rx => {
      const rack = this.add.graphics();
      rack.fillStyle(0x0f1e30, 0.4); rack.fillRect(-14, -64, 28, 64);
      rack.lineStyle(1, 0x1e3a5f, 0.4); rack.strokeRect(-14, -64, 28, 64);
      for (let row = 0; row < 5; row++) {
        const lit = rng() > 0.4;
        rack.fillStyle(lit ? 0x06b6d4 : 0x1e3a5f, lit ? 0.35 : 0.15);
        rack.fillRect(-10, -58 + row * 11, 20, 7);
      }
      // Status LED with glow
      const green = rng() > 0.2;
      rack.fillStyle(green ? 0x4ade80 : 0xef4444, 0.8);
      rack.fillRect(6, -62, 4, 4);
      rack.fillStyle(green ? 0x4ade80 : 0xef4444, 0.04);
      rack.fillCircle(8, -60, 10);
      rack.x = rx; rack.y = 552;
    });

    // Holographic terminal screens — with scanlines
    [[700, 422], [1450, 382], [2150, 422]].forEach(([hx, hy]) => {
      const screen = this.add.graphics();
      screen.fillStyle(0x06b6d4, 0.05); screen.fillRect(-36, -44, 72, 40);
      screen.lineStyle(1, 0x06b6d4, 0.3); screen.strokeRect(-36, -44, 72, 40);
      for (let l = 0; l < 8; l++) {
        screen.fillStyle(0x06b6d4, 0.04);
        screen.fillRect(-34, -42 + l * 5, 68, 1);
      }
      // Glow halo behind screen
      screen.fillStyle(0x06b6d4, 0.02);
      screen.fillEllipse(0, -24, 90, 60);
      screen.x = hx; screen.y = hy;
    });

    // Ambient cyan floor accent
    const strip = this.add.graphics();
    strip.lineStyle(1, 0x06b6d4, 0.06);
    strip.lineBetween(0, 553, W, 553);
  }

  _drawLevel5Props(W, rng) {
    // Census terminal stations — holographic kiosks
    [250, 700, 1150, 1600, 2050, 2500, 2950].forEach(tx => {
      const term = this.add.graphics();
      term.fillStyle(0x0c1445, 0.35); term.fillRect(-16, -56, 32, 56);
      term.lineStyle(1, 0x3730a3, 0.3); term.strokeRect(-16, -56, 32, 56);
      // Screen glow
      term.fillStyle(0x60a5fa, 0.08); term.fillRect(-12, -50, 24, 24);
      term.lineStyle(1, 0x60a5fa, 0.2); term.strokeRect(-12, -50, 24, 24);
      // Scanlines on screen
      for (let l = 0; l < 5; l++) {
        term.fillStyle(0x60a5fa, 0.05);
        term.fillRect(-12, -48 + l * 5, 24, 1);
      }
      // Glow halo
      term.fillStyle(0x60a5fa, 0.02);
      term.fillEllipse(0, -38, 50, 40);
      term.x = tx; term.y = 552;
    });

    // Vertical scan beams — very subtle
    const beam = this.add.graphics();
    [500, 1100, 1800, 2400].forEach(bx => {
      beam.lineStyle(1, 0x3730a3, 0.05);
      beam.lineBetween(bx, 0, bx, 560);
    });

    // Census arch above Platform D
    const arch = this.add.graphics();
    arch.lineStyle(2, 0x60a5fa, 0.25);
    arch.strokeRect(2554, 308, 92, 54);
    arch.fillStyle(0x60a5fa, 0.03);
    arch.fillRect(2554, 308, 92, 54);
    arch.lineStyle(1, 0x60a5fa, 0.12);
    arch.strokeEllipse(2600, 295, 120, 30);
  }

  _drawLevel4Props(W, rng) {
    // Train tracks — subtle rail glow
    const track = this.add.graphics();
    track.lineStyle(2, 0x334155, 0.3);
    track.lineBetween(0, 546, W, 546);
    track.lineBetween(0, 554, W, 554);
    // Energy between rails
    track.fillStyle(0xa855f7, 0.03);
    track.fillRect(0, 546, W, 8);

    // Platform edge strips — neon markers
    [350, 800, 1300, 1750, 2250].forEach(px => {
      const plat = this.add.graphics();
      plat.fillStyle(0xa855f7, 0.05);
      plat.fillRect(-48, -8, 96, 8);
      plat.lineStyle(1, 0xa855f7, 0.2);
      plat.strokeRect(-48, -8, 96, 8);
      // Glow bleed
      plat.fillStyle(0xa855f7, 0.02);
      plat.fillEllipse(0, -4, 110, 20);
      plat.x = px; plat.y = 552;
    });

    // Route map boards — holographic panels with scanlines
    [[700, 422], [1450, 382], [2100, 422]].forEach(([mx, my]) => {
      const board = this.add.graphics();
      board.fillStyle(0x1a0d3d, 0.4);
      board.fillRect(-42, -34, 84, 30);
      board.lineStyle(1, 0xa855f7, 0.25);
      board.strokeRect(-42, -34, 84, 30);
      for (let l = 0; l < 6; l++) {
        board.fillStyle(0xa855f7, 0.04);
        board.fillRect(-40, -32 + l * 5, 80, 1);
      }
      // Glow halo
      board.fillStyle(0xa855f7, 0.02);
      board.fillEllipse(0, -19, 100, 50);
      board.x = mx; board.y = my;
    });

    // Departure sign pillars — ghostly
    [250, 750, 1200, 1700, 2300].forEach(px => {
      const pillar = this.add.graphics();
      pillar.fillStyle(0x1a0d3d, 0.3);
      pillar.fillRect(-3, -80, 6, 80);
      pillar.fillStyle(0x2d1d6b, 0.35);
      pillar.fillRect(-20, -88, 40, 22);
      pillar.lineStyle(1, 0xa855f7, 0.2);
      pillar.strokeRect(-20, -88, 40, 22);
      pillar.x = px; pillar.y = 552;
    });
  }

  _drawLevel3Props(W, rng) {
    // Lab bench counters — holographic
    [300, 650, 1050, 1550, 1900, 2300].forEach(bx => {
      const bench = this.add.graphics();
      bench.fillStyle(0x0c2a10, 0.35);
      bench.fillRect(-40, -20, 80, 20);
      bench.lineStyle(1, 0x22c55e, 0.2);
      bench.strokeRect(-40, -20, 80, 20);
      // Specimen jars — glowing circles
      for (let d = 0; d < 3; d++) {
        bench.fillStyle(0x4ade80, 0.08);
        bench.fillCircle(-22 + d * 22, -28, 12); // outer glow
        bench.fillStyle(0x4ade80, 0.15);
        bench.fillCircle(-22 + d * 22, -28, 6);
        bench.lineStyle(1, 0x22c55e, 0.2);
        bench.strokeCircle(-22 + d * 22, -28, 6);
      }
      bench.x = bx; bench.y = 552;
    });

    // DNA helix — ethereal floating
    [150, 550, 1000, 1400, 1800, 2250].forEach(hx => {
      const helix = this.add.graphics();
      for (let y = 0; y < 6; y++) {
        const wave = Math.sin(y * 1.2) * 8;
        helix.fillStyle(0x22c55e, 0.12 + (y % 2) * 0.08);
        helix.fillCircle(wave, y * 14, 3);
        helix.fillStyle(0x4ade80, 0.08);
        helix.fillCircle(-wave, y * 14, 3);
        if (y < 5) {
          helix.lineStyle(1, 0x22c55e, 0.08);
          helix.lineBetween(wave, y * 14, -wave, (y + 1) * 14);
        }
      }
      // Glow halo
      helix.fillStyle(0x22c55e, 0.02);
      helix.fillEllipse(0, 40, 40, 100);
      helix.x = hx; helix.y = 460;
    });

    // Bio-scanner arch
    const arch = this.add.graphics();
    arch.lineStyle(2, 0x22c55e, 0.3);
    arch.strokeRect(1400, 330, 100, 52);
    arch.lineStyle(1, 0x22c55e, 0.12);
    arch.lineBetween(1400, 356, 1500, 356);
    arch.fillStyle(0x22c55e, 0.03);
    arch.fillRect(1400, 330, 100, 52);
  }

  _drawLevel6Props(W, rng) {
    // Cargo containers — holographic
    [180, 420, 820, 1200, 1700, 2200, 2480].forEach((cx, i) => {
      const cg = this.add.graphics();
      const colors = [0x1a0d3d, 0x0d1f35, 0x1a1a2e];
      cg.fillStyle(colors[i % 3], 0.35);
      cg.fillRect(-28, -46, 56, 46);
      cg.lineStyle(1, 0x4c1d95, 0.25);
      cg.strokeRect(-28, -46, 56, 46);
      // Rivets
      [[-22, -38], [18, -38], [-22, -12], [18, -12]].forEach(([rx, ry]) => {
        cg.fillStyle(0x7c3aed, 0.2);
        cg.fillCircle(rx, ry, 2);
      });
      // Label band
      cg.fillStyle(0x7c3aed, 0.12);
      cg.fillRect(-28, -22, 56, 8);
      cg.x = cx; cg.y = 552;
    });

    // Gravity ring generators — subtle glow
    [500, 1050, 1600, 2300].forEach(gx => {
      const ring = this.add.graphics();
      ring.lineStyle(1, 0x7c3aed, 0.15);
      ring.strokeEllipse(0, 0, 70, 14);
      ring.fillStyle(0x7c3aed, 0.02);
      ring.fillEllipse(0, 0, 90, 18);
      ring.x = gx; ring.y = 552;
    });

    // Medical bay panel — holographic with scanlines
    const medPanel = this.add.graphics();
    medPanel.fillStyle(0x1a0d3d, 0.35);
    medPanel.fillRect(640, 340, 120, 60);
    medPanel.lineStyle(1, 0xef4444, 0.25);
    medPanel.strokeRect(640, 340, 120, 60);
    for (let sy = 342; sy < 398; sy += 4) {
      medPanel.fillStyle(0xef4444, 0.03);
      medPanel.fillRect(641, sy, 118, 1);
    }
    // Red cross
    medPanel.fillStyle(0xef4444, 0.3);
    medPanel.fillRect(692, 346, 16, 6);
    medPanel.fillRect(697, 341, 6, 16);
    medPanel.fillStyle(0xef4444, 0.02);
    medPanel.fillEllipse(700, 370, 140, 80);

    // Cargo manifest — holographic
    const manifest = this.add.graphics();
    manifest.fillStyle(0x0d1f35, 0.35);
    manifest.fillRect(2040, 340, 120, 60);
    manifest.lineStyle(1, 0x38bdf8, 0.25);
    manifest.strokeRect(2040, 340, 120, 60);
    for (let r = 0; r < 3; r++) {
      manifest.fillStyle(0x38bdf8, 0.08 + r * 0.03);
      manifest.fillRect(2048, 350 + r * 14, 60 + r * 8, 8);
    }

    // DP arch — holographic
    const dpArch = this.add.graphics();
    dpArch.lineStyle(2, 0xa855f7, 0.25);
    dpArch.strokeRect(1390, 322, 120, 50);
    dpArch.fillStyle(0xa855f7, 0.03);
    dpArch.fillRect(1390, 322, 120, 50);
  }

  _drawLevel7Props(W, rng) {
    // Communication towers — holographic lattice
    [280, 680, 1100, 1680, 2280].forEach(tx => {
      const tower = this.add.graphics();
      tower.fillStyle(0x0f2038, 0.35);
      tower.fillRect(-4, -120, 8, 120);
      tower.fillStyle(0x1e3a5f, 0.3);
      tower.fillRect(-22, -80, 44, 6);
      // Dish with glow
      tower.fillStyle(0x1e3a5f, 0.3);
      tower.fillEllipse(0, -128, 28, 12);
      tower.lineStyle(1, 0x38bdf8, 0.2);
      tower.strokeEllipse(0, -128, 28, 12);
      // Antenna tip + glow
      tower.fillStyle(0xef4444, 0.5);
      tower.fillCircle(0, -134, 3);
      tower.fillStyle(0xef4444, 0.04);
      tower.fillCircle(0, -134, 12);
      tower.x = tx; tower.y = 552;
    });

    // Server rack panels — holographic
    [480, 980, 1580, 2080].forEach(rx => {
      const rack = this.add.graphics();
      rack.fillStyle(0x0c1a2e, 0.3);
      rack.fillRect(-22, -48, 44, 48);
      rack.lineStyle(1, 0x1e3a5f, 0.25);
      rack.strokeRect(-22, -48, 44, 48);
      for (let r = 0; r < 4; r++) {
        rack.fillStyle(0x38bdf8, 0.08 + r * 0.02);
        rack.fillRect(-16, -42 + r * 10, 32, 6);
      }
      rack.x = rx; rack.y = 552;
    });

    // MST arch — holographic
    const mstArch = this.add.graphics();
    mstArch.lineStyle(2, 0x38bdf8, 0.25);
    mstArch.strokeRect(638, 336, 124, 58);
    mstArch.fillStyle(0x38bdf8, 0.03);
    mstArch.fillRect(638, 336, 124, 58);

    // Dijkstra arch — holographic
    const djkArch = this.add.graphics();
    djkArch.lineStyle(2, 0xf59e0b, 0.25);
    djkArch.strokeRect(1388, 296, 124, 58);
    djkArch.fillStyle(0xf59e0b, 0.03);
    djkArch.fillRect(1388, 296, 124, 58);
  }

  _drawLevel8Props(W, rng) {
    // Energy columns — very subtle vertical beams
    [400, 900, 1500, 2200, 2900].forEach(ex => {
      const eg = this.add.graphics();
      eg.lineStyle(1, 0xa855f7, 0.06);
      eg.lineBetween(ex, 0, ex, 552);
      eg.fillStyle(0xa855f7, 0.01);
      eg.fillRect(ex - 6, 0, 12, 552);
    });

    // Chessboard hint tiles — holographic grid
    const chess = this.add.graphics();
    const cs = 16;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const isLight = (r + c) % 2 === 0;
        chess.fillStyle(isLight ? 0x1e293b : 0x0f172a, 0.25);
        chess.fillRect(636 + c * cs, 346 + r * cs, cs, cs);
        chess.lineStyle(1, 0x334155, 0.15);
        chess.strokeRect(636 + c * cs, 346 + r * cs, cs, cs);
      }
    }

    // P / NP / NP-Complete door frames — holographic
    const doorColors = [0x22c55e, 0xfbbf24, 0xef4444];
    doorColors.forEach((col, i) => {
      const dx = 1290 + i * 56;
      const dg = this.add.graphics();
      dg.lineStyle(1, col, 0.2);
      dg.strokeRect(dx, 306, 46, 60);
      dg.fillStyle(col, 0.03);
      dg.fillRect(dx, 306, 46, 60);
    });

    // Launch pad glow — subtle ring
    const padG = this.add.graphics();
    padG.lineStyle(1, 0x4ade80, 0.12);
    padG.strokeEllipse(3200, 552, 220, 28);
    padG.fillStyle(0x4ade80, 0.02);
    padG.fillEllipse(3200, 552, 220, 28);

    // Ship silhouette — ethereal
    const shipG = this.add.graphics();
    shipG.fillStyle(0x38bdf8, 0.05);
    shipG.fillTriangle(3200, 430, 3170, 500, 3230, 500);
    shipG.lineStyle(1, 0x38bdf8, 0.12);
    shipG.strokeTriangle(3200, 430, 3170, 500, 3230, 500);
    // Glow
    shipG.fillStyle(0x38bdf8, 0.02);
    shipG.fillEllipse(3200, 470, 100, 80);

    // Complexity archway — holographic
    const compArch = this.add.graphics();
    compArch.lineStyle(2, 0xa855f7, 0.2);
    compArch.strokeRect(1336, 296, 128, 58);
    compArch.fillStyle(0xa855f7, 0.02);
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
    if (this.playerShadow && this.player) {
      this.playerShadow.x = this.player.x;
      this.playerShadow.y = this.player.y + 31;
      const grounded = this.player.body?.blocked?.down;
      this.playerShadow.setAlpha(grounded ? 0.34 : 0.14);
      this.playerShadow.setScale(grounded ? 1 : 0.72, grounded ? 1 : 0.75);
    }
  }
}
