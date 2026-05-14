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

const LEVEL_ACCENTS = {
  level1: 0xf59e0b,
  level2: 0x06b6d4,
  level3: 0x22c55e,
  level4: 0xa855f7,
  level5: 0xf59e0b,
  level6: 0xa855f7,
  level7: 0x38bdf8,
  level8: 0xfbbf24,
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.levelIndex        = data?.levelIndex ?? 0;
    this.currentLevel      = null;
    this.isEndScreen       = false;
    this.completedObstacles = new Set();
    this.obstacleSprites   = new Map();
    this.activeMiniGameCfg = null;
  }

  create() {
    if (typeof document !== 'undefined') {
      const root = document.getElementById('game');
      if (root) root.dataset.crtScene = 'game';
    }

    applyCrt(this, { vignetteStrength: 0.16 });

    const levelConfig = LEVELS[this.levelIndex];

    if (!levelConfig) {
      this.currentLevel = null;
      this.isEndScreen = true;
      this.showEndScreen();
      return;
    }

    this.currentLevel = levelConfig;
    this.isEndScreen = false;
    const { worldWidth, bgColor, playerStart, platforms, obstacles, exit } = levelConfig;

    // World setup
    this.cameras.main.setBackgroundColor(bgColor);
    this.physics.world.setBounds(0, 0, worldWidth, 600);

    // ── Parallax background (must be first so it renders behind everything) ──
    this.buildBackground(levelConfig);

    // Camera fade in
    this.cameras.main.fadeIn(900, 0, 0, 0);

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

    this._showLevelTransition(levelConfig);

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

    // NPC idle breathing tween. Keep y fixed so feet stay visually planted.
    if (cfg.texture && cfg.texture.startsWith('npc_')) {
      const baseScaleX = sprite.scaleX;
      const baseScaleY = sprite.scaleY;
      this.tweens.add({
        targets: sprite,
        scaleX: baseScaleX * 0.992,
        scaleY: baseScaleY * 1.012,
        duration: 1250 + Math.random() * 350,
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
    g.fillStyle(led, 0.05);
    g.fillRect(x - 10, y + h - 9, w + 20, 18);
    g.fillStyle(led, 0.08);
    g.fillRect(x - 6, y + h - 6, w + 12, 11);
    g.fillStyle(led, 0.13);
    g.fillRect(x - 2, y + h - 4, w + 4, 6);

    const rim = this.add.rectangle(p.x, y + h - 2, w, 3, led, 0.56).setDepth(8);
    const rimCore = this.add.rectangle(p.x, y + h - 3, Math.max(22, w * 0.36), 1, 0xffffff, 0.42).setDepth(9);
    const underGlow = this.add.rectangle(p.x, y + h + 3, w + 12, 5, led, 0.18).setDepth(6);
    this.tweens.add({
      targets: [rim, rimCore, underGlow],
      alpha: { from: 0.24, to: 0.72 },
      duration: theme === 'tech' ? 780 : 1050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Small pulsing endpoint LEDs make platforms feel powered without distracting.
    [x + 8, x + w - 12].forEach((px, idx) => {
      const dot = this.add.rectangle(px, y + h - 3, 5, 3, led, 0.9).setDepth(10);
      const dotGlow = this.add.rectangle(px, y + h - 3, 16, 5, led, 0.16).setDepth(9);
      this.tweens.add({
        targets: [dot, dotGlow],
        alpha: 0.24,
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
        this.playerController?.setEnabled(false);
        this.interactionSystem?.setEnabled(false);
        this.cameras.main.fadeOut(900, 0, 0, 0);
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

  _showLevelTransition(levelConfig) {
    const accent = LEVEL_ACCENTS[levelConfig.id] || 0x38bdf8;
    const accentHex = `#${accent.toString(16).padStart(6, '0')}`;
    const location = levelConfig.location || levelConfig.subtitle || '';
    const holdMs = 2400;
    const fadeMs = 420;

    this.playerController?.setEnabled(false);
    this.interactionSystem?.setEnabled(false);

    const shade = this.add.rectangle(400, 300, 800, 600, 0x020810, 0.62)
      .setScrollFactor(0)
      .setDepth(300);

    const panel = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(301);
    panel.fillStyle(0x020810, 0.72);
    panel.fillRect(150, 214, 500, 142);
    panel.lineStyle(2, accent, 0.65);
    panel.strokeRect(150, 214, 500, 142);
    panel.fillStyle(accent, 0.16);
    panel.fillRect(170, 225, 124, 3);
    panel.fillRect(506, 342, 124, 3);
    panel.fillStyle(accent, 0.08);
    panel.fillRect(164, 260, 472, 1);
    panel.fillRect(164, 310, 472, 1);

    const title = this.add.text(400, 262, levelConfig.name, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#e0fbff',
      align: 'center',
      stroke: '#020810',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: accentHex, blur: 12, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

    const subtitle = this.add.text(400, 310, location, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '15px',
      color: '#b6f3ff',
      align: 'center',
      stroke: '#020810',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

    const scan = this.add.rectangle(400, 335, 360, 2, accent, 0.62)
      .setScrollFactor(0)
      .setDepth(303);

    const group = [shade, panel, title, subtitle, scan];
    group.forEach(obj => obj.setAlpha(0));

    this.tweens.add({
      targets: group,
      alpha: 1,
      duration: fadeMs,
      ease: 'Sine.Out',
      onComplete: () => {
        this.tweens.add({
          targets: title,
          alpha: { from: 0.5, to: 1 },
          duration: 240,
          yoyo: true,
          repeat: 4,
          ease: 'Stepped',
        });
        this.tweens.add({
          targets: scan,
          scaleX: { from: 0.35, to: 1.08 },
          alpha: { from: 0.2, to: 0.75 },
          duration: 520,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.InOut',
        });
      },
    });

    this.time.delayedCall(holdMs, () => {
      this.tweens.add({
        targets: group,
        alpha: 0,
        duration: fadeMs,
        ease: 'Sine.In',
        onComplete: () => {
          group.forEach(obj => obj.destroy());
          this.playerController?.setEnabled(true);
          this.interactionSystem?.setEnabled(true);
        },
      });
    });
  }

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

    let hasStarLayer = false;
    parallax.forEach(layer => {
      if (layer.type === 'cityFar' || layer.type === 'cityNear') return;
      const g = this.add.graphics()
        .setScrollFactor(layer.scrollFactor)
        .setDepth(layer.scrollFactor > 0.08 ? -22 : -28);
      if (layer.type === 'stars') {
        hasStarLayer = true;
        this._drawStars(g, worldWidth, rng);
      }
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
    if (hasStarLayer) {
      this._addAnimatedSkyEffects(worldWidth, rng);
      this._addShootingStars(worldWidth, rng);
    }
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
    for (let i = 0; i < 10; i++) {
      const s = this.add.graphics().setScrollFactor(0.05);
      const cool = Math.random() > 0.45;
      s.fillStyle(cool ? 0xbfdbfe : 0xffffff, 0.92);
      s.fillRect(0, 0, i % 3 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
      s.fillStyle(cool ? 0x38bdf8 : 0xfbbf24, 0.08);
      s.fillRect(-5, 0, 12, 1);
      s.fillRect(1, -5, 1, 12);
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

  _addAnimatedSkyEffects(W, rng) {
    const auroraDefs = [
      { y: 84, color: 0x22c55e, scroll: 0.035, depth: -18, alpha: 0.32, dir: 1 },
      { y: 142, color: 0x38bdf8, scroll: 0.045, depth: -17, alpha: 0.28, dir: -1 },
      { y: 204, color: 0xa855f7, scroll: 0.055, depth: -16, alpha: 0.22, dir: 1 },
    ];

    auroraDefs.forEach((def, bandIndex) => {
      const band = this.add.graphics()
        .setScrollFactor(def.scroll)
        .setDepth(def.depth);
      const width = W + 360;
      for (let x = -180; x < width; x += 16) {
        const wave = Math.sin((x + bandIndex * 70) / (115 + bandIndex * 30)) * (16 + bandIndex * 8);
        const y = wave;
        const nextWave = Math.sin((x + 18 + bandIndex * 70) / (115 + bandIndex * 30)) * (16 + bandIndex * 8);
        band.lineStyle(5, def.color, def.alpha * 0.1);
        band.lineBetween(x - 2, y + 2, x + 20, nextWave + 2);
        band.lineStyle(3, def.color, def.alpha * 0.22);
        band.lineBetween(x - 1, y + 1, x + 19, nextWave + 1);
        band.lineStyle(2, def.color, def.alpha * 0.62);
        band.lineBetween(x, y, x + 18, nextWave);
        band.lineStyle(1, 0xffffff, def.alpha * 0.18);
        band.lineBetween(x + 2, y - 1, x + 14, nextWave - 1);
        band.fillStyle(def.color, def.alpha * 0.24);
        band.fillRect(x + 5, y + 7, 12, 2);
        if (x % 80 === 0) {
          const h = 20 + Math.sin((x + bandIndex * 45) / 55) * 8;
          band.fillStyle(def.color, 0.03);
          band.fillRect(x + 8, y + 4, 3, h);
        }
      }
      band.x = def.dir > 0 ? -90 : 90;
      band.y = def.y;
      band.alpha = 0.78;
      this.tweens.add({
        targets: band,
        x: band.x + def.dir * 170,
        alpha: 1,
        scaleY: 1.08,
        duration: 8200 + bandIndex * 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

    [
      { x: W * 0.28, y: 110, color: 0x38bdf8, core: 0xf8fafc },
      { x: W * 0.72, y: 205, color: 0xa855f7, core: 0xfbbf24 },
    ].forEach((src, i) => {
      const glow = this.add.graphics()
        .setScrollFactor(0.035)
        .setDepth(-15);
      glow.fillStyle(src.color, 0.045);
      glow.fillEllipse(0, 0, 118 - i * 18, 34);
      glow.fillStyle(src.core, 0.13);
      glow.fillRect(-3, -3, 6, 6);
      glow.fillStyle(src.color, 0.16);
      glow.fillRect(-44, -1, 88, 2);
      glow.fillRect(-1, -16, 2, 32);
      glow.x = src.x;
      glow.y = src.y;
      this.tweens.add({
        targets: glow,
        alpha: 0.28,
        scaleX: 1.18,
        scaleY: 1.18,
        angle: i ? -4 : 4,
        duration: 2600 + i * 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

    [
      { x: Math.min(W - 220, 700), y: 95, color: 0x38bdf8, w: 154, h: 24 },
      { x: Math.max(260, W - 520), y: 150, color: 0xf59e0b, w: 102, h: 17 },
    ].forEach((p, i) => {
      const ring = this.add.graphics()
        .setScrollFactor(0.05)
        .setDepth(-14);
      ring.lineStyle(2, p.color, 0.22);
      ring.strokeEllipse(0, 0, p.w, p.h);
      ring.lineStyle(1, 0xffffff, 0.1);
      ring.strokeEllipse(0, 0, p.w - 14, p.h - 5);
      ring.x = p.x;
      ring.y = p.y + 2;
      this.tweens.add({
        targets: ring,
        alpha: 0.24,
        scaleX: 1.13,
        duration: 1700 + i * 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });
  }

  _addShootingStars(W, rng) {
    const colors = [0xffffff, 0x93c5fd, 0x67e8f9, 0xfbbf24];
    for (let i = 0; i < 4; i++) {
      const star = this.add.graphics().setScrollFactor(0.035 + i * 0.008).setDepth(-13);
      const color = colors[i % colors.length];
      star.lineStyle(1, color, 0.58);
      star.lineBetween(0, 0, -54, -18);
      star.lineStyle(1, color, 0.18);
      star.lineBetween(-10, 2, -86, -24);
      star.fillStyle(0xffffff, 0.95);
      star.fillRect(0, -1, 3, 3);
      star.fillStyle(color, 0.08);
      star.fillRect(-72, -22, 72, 4);

      const startX = 140 + rng() * (W - 280);
      const startY = 35 + rng() * 190;
      star.x = startX;
      star.y = startY;
      star.alpha = 0;

      const reset = () => {
        star.x = 80 + rng() * (W - 160);
        star.y = 35 + rng() * 210;
        star.alpha = 0;
      };

      this.tweens.add({
        targets: star,
        x: startX + 180 + rng() * 170,
        y: startY + 58 + rng() * 70,
        alpha: { from: 0, to: 0.82 },
        duration: 1050 + i * 170,
        delay: 1200 + i * 1650,
        repeat: -1,
        repeatDelay: 4600 + i * 1400,
        ease: 'Cubic.Out',
        onRepeat: reset,
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
    {
      const sf = g.scrollFactorX ?? 0.05;
      const isNearLayer = sf > 0.08;

      if (!isNearLayer) {
        g.fillStyle(0x020814, 1);
        g.fillRect(0, 0, W, 150);
        g.fillStyle(0x041020, 1);
        g.fillRect(0, 150, W, 185);
        g.fillStyle(0x071426, 1);
        g.fillRect(0, 335, W, 210);
        g.fillStyle(0x38bdf8, 0.018);
        g.fillRect(0, 72, W, 210);
        g.fillStyle(0xa855f7, 0.012);
        g.fillRect(0, 186, W, 150);

        [
          { y: 82, color: 0x22c55e, phase: 0, width: 180 },
          { y: 124, color: 0x38bdf8, phase: 90, width: 230 },
          { y: 176, color: 0xa855f7, phase: 180, width: 210 },
        ].forEach((a, bandIndex) => {
          for (let x = -40; x < W + 80; x += 18) {
            const wave = Math.sin((x + a.phase) / a.width) * (18 + bandIndex * 7);
            const y = a.y + wave;
            const next = Math.sin((x + 18 + a.phase) / a.width) * (18 + bandIndex * 7);
            g.lineStyle(5, a.color, 0.015);
            g.lineBetween(x - 2, y + 2, x + 20, a.y + next + 2);
            g.lineStyle(3, a.color, 0.032);
            g.lineBetween(x - 1, y + 1, x + 19, a.y + next + 1);
            g.lineStyle(2, a.color, 0.085);
            g.lineBetween(x, y, x + 18, a.y + next);
            g.lineStyle(1, 0xffffff, 0.026);
            g.lineBetween(x + 2, y - 1, x + 15, a.y + next - 1);
            g.fillStyle(a.color, 0.052);
            g.fillRect(x + 5, y + 6, 12, 2);
            if (bandIndex === 1 && x % 90 === 0) {
              g.fillStyle(0xffffff, 0.026);
              g.fillRect(x + 8, y + 2, 3, 24);
            }
          }
        });

        [
          { x: W * 0.28, y: 110, color: 0x38bdf8, core: 0xf8fafc, rot: 0.3 },
          { x: W * 0.72, y: 205, color: 0xa855f7, core: 0xfbbf24, rot: -0.4 },
        ].forEach((galaxy, gi) => {
          g.fillStyle(galaxy.color, 0.03);
          g.fillEllipse(galaxy.x, galaxy.y, 260 - gi * 40, 78);
          g.fillStyle(galaxy.core, 0.08);
          g.fillEllipse(galaxy.x, galaxy.y, 56, 22);
          for (let arm = 0; arm < 2; arm++) {
            for (let step = 0; step < 72; step++) {
              const t = step / 9;
              const radius = 8 + step * 1.55;
              const angle = t + arm * Math.PI + galaxy.rot;
              const px = galaxy.x + Math.cos(angle) * radius * 1.55;
              const py = galaxy.y + Math.sin(angle) * radius * 0.42;
              const color = step % 3 === 0 ? galaxy.core : galaxy.color;
              g.fillStyle(color, 0.12 - step * 0.0011);
              g.fillRect(px, py, step % 7 === 0 ? 3 : 2, 2);
            }
          }
          g.fillStyle(0xffffff, 0.82);
          g.fillRect(galaxy.x - 2, galaxy.y - 2, 4, 4);
        });

        [
          { x: Math.min(W - 220, 700), y: 95, r: 46, body: 0x2d4f75, shade: 0x1e3a5f, ring: 0x38bdf8 },
          { x: Math.max(260, W - 520), y: 150, r: 30, body: 0x7c3aed, shade: 0x312e81, ring: 0xf59e0b },
        ].forEach((p, i) => {
          g.fillStyle(p.ring, 0.032);
          g.fillCircle(p.x, p.y, p.r * 1.9);
          g.fillStyle(0xffffff, 0.028);
          g.fillCircle(p.x - p.r * 0.22, p.y - p.r * 0.22, p.r * 1.05);
          g.lineStyle(i === 0 ? 3 : 2, p.ring, 0.24);
          g.strokeEllipse(p.x, p.y + 2, p.r * 2.8, p.r * 0.48);
          g.lineStyle(1, 0xffffff, 0.2);
          g.strokeEllipse(p.x, p.y + 1, p.r * 2.55, p.r * 0.36);
          g.fillStyle(p.shade, 1);
          g.fillCircle(p.x, p.y, p.r);
          g.fillStyle(p.body, 1);
          g.fillCircle(p.x - p.r * 0.12, p.y - p.r * 0.08, p.r * 0.82);
          g.fillStyle(0xffffff, 0.16);
          g.fillCircle(p.x - p.r * 0.34, p.y - p.r * 0.38, p.r * 0.18);
          g.fillStyle(0x93c5fd, 0.2);
          g.fillRect(p.x - p.r * 0.74, p.y - p.r * 0.12, p.r * 1.15, 3);
          g.fillStyle(p.ring, 0.22);
          g.fillRect(p.x - p.r * 0.54, p.y + p.r * 0.22, p.r * 0.82, 2);
          g.fillStyle(p.shade, 0.48);
          g.fillCircle(p.x - p.r * 0.24, p.y - p.r * 0.1, p.r * 0.17);
          g.fillCircle(p.x + p.r * 0.26, p.y + p.r * 0.24, p.r * 0.1);
        });
      }

      const starCount = isNearLayer ? 190 : 460;
      for (let i = 0; i < starCount; i++) {
        const x = rng() * W;
        const y = rng() * (isNearLayer ? 420 : 500);
        const r = rng();
        const sz = isNearLayer ? (r > 0.9 ? 3 : r > 0.58 ? 2 : 1) : (r > 0.94 ? 3 : r > 0.76 ? 2 : 1);
        const palette = [0xffffff, 0xbfdbfe, 0x93c5fd, 0xfef3c7, 0x67e8f9];
        const color = palette[Math.floor(rng() * palette.length)];
        const alpha = (isNearLayer ? 0.2 : 0.18) + rng() * (isNearLayer ? 0.62 : 0.78);
        g.fillStyle(color, alpha);
        g.fillRect(x, y, sz, sz);
        if (r > 0.985) {
          g.fillStyle(color, 0.08);
          g.fillRect(x - 5, y, 12, 1);
          g.fillRect(x, y - 5, 1, 12);
        }
      }

      for (let i = 0; i < (isNearLayer ? 4 : 10); i++) {
        const sx = rng() * W;
        const sy = 20 + rng() * 320;
        const color = rng() > 0.5 ? 0x93c5fd : 0xffffff;
        g.fillStyle(color, 0.07);
        g.fillCircle(sx, sy, 10 + rng() * 8);
        g.fillStyle(0xffffff, 0.9);
        g.fillRect(sx - 1, sy - 1, 3, 3);
      }

      for (let i = 0; i < 5; i++) {
        const sx = rng() * W * 0.86;
        const sy = 35 + rng() * 210;
        const len = 44 + rng() * 82;
        const color = rng() > 0.4 ? 0xffffff : 0x67e8f9;
        g.lineStyle(1, color, isNearLayer ? 0.18 : 0.26);
        g.lineBetween(sx, sy, sx + len, sy + 14 + rng() * 22);
        g.fillStyle(color, isNearLayer ? 0.3 : 0.42);
        g.fillRect(sx + len - 2, sy + 14, 3, 2);
      }
    }
    return;
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
    sky.fillStyle(0xf59e0b, 0.03); sky.fillCircle(moonX, moonY, 72);
    sky.fillStyle(0x38bdf8, 0.018); sky.fillCircle(moonX - 10, moonY + 4, 92);
    sky.fillStyle(0x2b1a38, 0.74); sky.fillCircle(moonX, moonY, 32);
    sky.fillStyle(0x5b3b73, 0.84); sky.fillCircle(moonX - 5, moonY - 4, 25);
    sky.fillStyle(0xffffff, 0.14); sky.fillCircle(moonX - 14, moonY - 14, 7);
    sky.fillStyle(0xf59e0b, 0.22); sky.fillRect(moonX - 16, moonY - 2, 22, 2);
    sky.fillStyle(0x38bdf8, 0.18); sky.fillRect(moonX - 26, moonY + 8, 34, 2);

    for (let lane = 0; lane < 5; lane++) {
      const y = 130 + lane * 38 + Math.floor(rng() * 14);
      for (let x = 120 + lane * 70; x < W; x += 420 + Math.floor(rng() * 130)) {
        sky.fillStyle(lane % 2 === 0 ? 0xf59e0b : 0x38bdf8, 0.12);
        sky.fillRect(x, y, 34 + Math.floor(rng() * 24), 1);
        sky.fillStyle(0xffffff, 0.22);
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
      this._drawLevel1MetalPanel(holo, -13, -18, 26, 18, { accent: 0x38bdf8, alpha: 0.56 });
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
      this._drawLevel1MetalPanel(canopy, cx - 94, 426, 188, 18, { accent: 0xf59e0b, alpha: 0.34 });
      canopy.fillStyle(0x38bdf8, 0.09);
      canopy.fillRect(cx - 84, 444, 168, 2);
      canopy.fillStyle(0xf59e0b, 0.18);
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

  _addPixelGlow(x, y, w, h, color, { depth = 6, alpha = 0.36, pulse = true } = {}) {
    const glow = this.add.rectangle(x, y, w, h, color, alpha).setDepth(depth);
    const core = this.add.rectangle(x, y, Math.max(2, Math.floor(w * 0.45)), Math.max(2, Math.floor(h * 0.45)), 0xffffff, alpha * 0.45).setDepth(depth + 1);
    if (pulse) {
      this.tweens.add({
        targets: [glow, core],
        alpha: alpha * 0.35,
        duration: 900 + (x % 5) * 140,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
    return { glow, core };
  }

  _addLevelPylon(x, y, h, accent, label) {
    const g = this.add.graphics().setDepth(4);
    this._drawLevel1MetalPanel(g, x - 13, y - h, 26, h, { accent, alpha: 0.9 });
    this._drawLevel1MetalPanel(g, x - 30, y - h - 22, 60, 24, { accent, alpha: 0.86 });
    g.fillStyle(accent, 0.2);
    g.fillRect(x - 22, y - h - 15, 44, 8);
    g.fillStyle(accent, 0.65);
    g.fillRect(x - 16, y - h - 11, 32, 2);
    this._addPixelGlow(x, y - h - 10, 56, 10, accent, { depth: 5, alpha: 0.22 });
    if (label) {
      this.add.text(x, y - h - 37, label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#dbeafe',
        backgroundColor: 'rgba(2, 8, 16, 0.58)',
        padding: { x: 4, y: 1 },
      }).setOrigin(0.5).setDepth(6);
    }
  }

  _addLevel1LandingPad(x, surfaceY) {
    const pad = this.add.graphics().setDepth(4);
    pad.x = x; pad.y = surfaceY;
    pad.fillStyle(0x020810, 0.65); pad.fillEllipse(0, 6, 190, 22);
    this._drawLevel1MetalPanel(pad, -94, -14, 188, 18, { accent: 0xf59e0b, alpha: 0.46 });
    for (let i = -4; i <= 4; i++) {
      pad.fillStyle(i % 2 === 0 ? 0x334155 : 0x0f172a, 0.46);
      pad.fillRect(i * 20 - 9, -11, 17, 10);
    }
    pad.fillStyle(0xf59e0b, 0.36); pad.fillRect(-82, -20, 26, 3);
    pad.fillStyle(0xef4444, 0.3); pad.fillRect(56, -20, 26, 3);
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
    this._drawLevel1MetalPanel(stage, -74, -10, 148, 14, { accent: 0xf59e0b, alpha: 0.44 });
    stage.fillStyle(0xfbbf24, 0.26); stage.fillRect(-54, -15, 28, 3);
    stage.fillStyle(0x38bdf8, 0.22); stage.fillRect(22, -15, 34, 3);
  }

  _drawLevel2Props(W, rng) {
    {
      const accent = 0x06b6d4;
      const floor = this.add.graphics().setDepth(1);
      for (let x = 0; x < W; x += 76) {
        this._drawLevel1MetalPanel(floor, x, 540, 74, 28, { accent, alpha: 0.5 });
      }
      floor.fillStyle(accent, 0.12); floor.fillRect(0, 552, W, 2);
      floor.lineStyle(1, 0x334155, 0.68); floor.lineBetween(0, 548, W, 548);
      floor.lineStyle(1, accent, 0.28); floor.lineBetween(0, 557, W, 557);
      floor.lineStyle(1, 0xf59e0b, 0.14); floor.lineBetween(0, 562, W, 562);

      for (let i = 0; i < 88; i++) {
        const sx = Math.floor(rng() * W);
        const sy = 506 + Math.floor(rng() * 44);
        const len = 8 + Math.floor(rng() * 26);
        const color = rng() > 0.72 ? 0xf59e0b : accent;
        floor.lineStyle(1, color, 0.06 + rng() * 0.08);
        floor.lineBetween(sx, sy, sx + len, sy);
      }

      const ceiling = this.add.graphics().setDepth(2);
      for (let i = 0; i < 6; i++) {
        const y = 256 + i * 16;
        ceiling.lineStyle(1, i % 2 ? 0x1e3a5f : 0x020810, 0.58);
        ceiling.beginPath();
        ceiling.moveTo(0, y);
        for (let x = 0; x <= W; x += 120) {
          ceiling.lineTo(x, y + Math.sin((x + i * 70) / 170) * 7);
        }
        ceiling.strokePath();
      }
      ceiling.lineStyle(1, accent, 0.13);
      [310, 620, 1180, 1720, 2320].forEach(cx => ceiling.lineBetween(cx, 274, cx + 84, 332));

      [190, 820, 1180, 2020, 2420].forEach((rx, i) => {
        const rack = this.add.graphics().setDepth(3);
        rack.x = rx; rack.y = 552;
        rack.fillStyle(0x020810, 0.46); rack.fillEllipse(0, 0, 62, 12);
        this._drawLevel1MetalPanel(rack, -22, -74, 44, 74, { accent, alpha: 0.62 });
        for (let row = 0; row < 6; row++) {
          const lit = (row + i) % 2 === 0 || rng() > 0.55;
          rack.fillStyle(lit ? accent : 0x1e3a5f, lit ? 0.42 : 0.2);
          rack.fillRect(-15, -66 + row * 10, 30, 5);
        }
        rack.fillStyle(i % 3 === 0 ? 0xef4444 : 0x4ade80, 0.62);
        rack.fillRect(13, -69, 4, 4);
      });

      [430, 1040, 1360, 1960, 2320, 2640].forEach((lx, i) => {
        const lampAccent = i % 3 === 0 ? 0xf59e0b : accent;
        const lamp = this.add.graphics().setDepth(3);
        lamp.x = lx; lamp.y = 552;
        lamp.fillStyle(lampAccent, 0.028); lamp.fillRect(-54, -104, 108, 104);
        lamp.fillStyle(lampAccent, 0.05); lamp.fillEllipse(0, 0, 132, 24);
        lamp.fillStyle(0x020810, 0.46); lamp.fillEllipse(0, 0, 88, 14);
        this._drawLevel1MetalPanel(lamp, -5, -88, 10, 88, { accent: lampAccent, alpha: 0.76, led: false });
        this._drawLevel1MetalPanel(lamp, -18, -100, 36, 14, { accent: lampAccent, alpha: 0.78 });
        lamp.fillStyle(lampAccent, 0.18); lamp.fillRect(-22, -105, 44, 23);
        lamp.fillStyle(lampAccent, 0.95); lamp.fillRect(-11, -93, 22, 4);
        lamp.fillStyle(0xffffff, 0.42); lamp.fillRect(-4, -93, 8, 1);
        lamp.fillStyle(lampAccent, 0.07); lamp.fillEllipse(0, -48, 82, 94);
        lamp.fillStyle(lampAccent, 0.16); lamp.fillRect(-34, -1, 68, 2);

        const pulse = this.add.rectangle(lx, 459, 28, 4, lampAccent, 0.24).setDepth(4);
        this.tweens.add({
          targets: pulse,
          alpha: 0.12,
          scaleX: 1.55,
          duration: 980 + i * 120,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      });

      [[565, 448, 'BORDER'], [1288, 452, 'FEE OK'], [2050, 448, 'CLEAR']].forEach(([gx, gy, label], gateIndex) => {
        const gate = this.add.graphics().setDepth(4);
        gate.fillStyle(0x020810, 0.5); gate.fillEllipse(gx, gy + 74, 152, 22);
        this._drawLevel1MetalPanel(gate, gx - 72, gy + 54, 144, 18, { accent, alpha: 0.42 });
        this._drawLevel1MetalPanel(gate, gx - 66, gy - 34, 18, 88, { accent, alpha: 0.54, led: false });
        this._drawLevel1MetalPanel(gate, gx + 48, gy - 34, 18, 88, { accent, alpha: 0.54, led: false });
        this._drawLevel1MetalPanel(gate, gx - 80, gy - 48, 160, 18, { accent: gateIndex === 1 ? 0xf59e0b : accent, alpha: 0.36 });
        gate.fillStyle(accent, 0.032); gate.fillRect(gx - 44, gy - 30, 88, 84);
        gate.lineStyle(1, accent, 0.15); gate.strokeRect(gx - 44, gy - 30, 88, 84);
        gate.fillStyle(gateIndex === 1 ? 0xf59e0b : 0x4ade80, 0.72); gate.fillRect(gx + 55, gy - 22, 4, 4);
        gate.fillStyle(accent, 0.18); gate.fillRect(gx - 30, gy + 28, 60, 3);
        this._addPixelGlow(gx, gy + 20, 88, 10, accent, { depth: 5, alpha: 0.1 });
        this.add.text(gx, gy - 60, label, {
          fontFamily: 'monospace', fontSize: '9px', color: '#67e8f9',
          backgroundColor: 'rgba(2, 8, 16, 0.55)', padding: { x: 4, y: 1 },
        }).setOrigin(0.5).setDepth(5);
      });

      [[700, 444, 'SCAN'], [1450, 414, 'AUTH'], [2150, 444, 'LOGS']].forEach(([x, y, label]) => {
        const panel = this.add.graphics().setDepth(3);
        this._drawLevel1MetalPanel(panel, x - 58, y - 58, 116, 54, { accent, alpha: 0.58 });
        panel.fillStyle(accent, 0.12); panel.fillRect(x - 48, y - 50, 96, 34);
        for (let l = 0; l < 6; l++) {
          panel.fillStyle(accent, 0.1 + l * 0.015);
          panel.fillRect(x - 40, y - 44 + l * 5, 70 - l * 6, 2);
        }
        this.add.text(x, y - 67, label, {
          fontFamily: 'monospace', fontSize: '9px', color: '#67e8f9',
          backgroundColor: 'rgba(2, 8, 16, 0.55)', padding: { x: 4, y: 1 },
        }).setOrigin(0.5).setDepth(4);
      });

      const bus = this.add.graphics().setDepth(2);
      bus.lineStyle(2, 0x1e3a5f, 0.75);
      [360, 388, 416].forEach(y => bus.lineBetween(0, y, W, y));
      bus.lineStyle(1, accent, 0.22);
      for (let x = 80; x < W; x += 180) {
        bus.lineBetween(x, 360, x + 70, 416);
        bus.fillStyle(accent, 0.45); bus.fillRect(x + 68, 414, 6, 4);
      }

      const bridge = this.add.graphics().setDepth(2);
      [700, 1450, 2150].forEach((cx, i) => {
        const bridgeAccent = i === 1 ? 0xf59e0b : accent;
        this._drawLevel1MetalPanel(bridge, cx - 98, i === 1 ? 388 : 418, 196, 18, { accent: bridgeAccent, alpha: 0.34 });
        bridge.fillStyle(accent, 0.08);
        bridge.fillRect(cx - 88, (i === 1 ? 406 : 436), 176, 2);
        bridge.fillStyle(bridgeAccent, 0.18);
        bridge.fillRect(cx - 74, (i === 1 ? 411 : 441), 44, 3);
        bridge.fillStyle(0x020810, 0.28);
        bridge.fillRect(cx + 58, (i === 1 ? 411 : 441), 22, 3);
      });

      [[318, 'ENTRY'], [870, 'MAX'], [1515, 'O(n²)'], [2225, 'SORT']].forEach(([hx, text], i) => {
        const holo = this.add.graphics().setDepth(3);
        holo.x = hx; holo.y = 552;
        this._drawLevel1MetalPanel(holo, -14, -20, 28, 20, { accent: i === 2 ? 0xf59e0b : accent, alpha: 0.56 });
        holo.fillStyle(accent, 0.07); holo.fillTriangle(-32, -16, 32, -16, 0, -70);
        holo.lineStyle(1, accent, 0.26); holo.strokeTriangle(-32, -16, 32, -16, 0, -70);
        for (let sy = -64; sy < -20; sy += 6) {
          holo.fillStyle(accent, 0.06);
          holo.fillRect(-20, sy, 40, 1);
        }
        this.add.text(hx, 496, text, {
          fontFamily: 'monospace', fontSize: '9px', color: i === 2 ? '#fbbf24' : '#67e8f9',
          backgroundColor: 'rgba(2, 8, 16, 0.44)', padding: { x: 3, y: 1 },
        }).setOrigin(0.5).setDepth(4);
      });

      [[375, 514], [2520, 514]].forEach(([cx, cy], i) => {
        const cart = this.add.graphics().setDepth(3);
        cart.fillStyle(0x020810, 0.42); cart.fillEllipse(cx, cy + 32, 82, 14);
        this._drawLevel1MetalPanel(cart, cx - 38, cy, 76, 26, { accent: i % 2 ? 0xf59e0b : accent, alpha: 0.38 });
        cart.fillStyle(0x0f172a, 0.48); cart.fillRect(cx - 25, cy + 8, 18, 9); cart.fillRect(cx + 7, cy + 8, 18, 9);
        cart.fillStyle(i % 2 ? 0xf59e0b : accent, 0.32); cart.fillRect(cx - 30, cy - 5, 60, 3);
        cart.fillStyle(0x020810, 0.9); cart.fillRect(cx - 26, cy + 25, 8, 5); cart.fillRect(cx + 18, cy + 25, 8, 5);
      });

      // Command-center core: a big readable server spine behind the route.
      [980, 1780].forEach((cx, i) => {
        const core = this.add.graphics().setDepth(3);
        this._drawLevel1MetalPanel(core, cx - 44, 282, 88, 142, { accent, alpha: 0.7 });
        for (let r = 0; r < 7; r++) {
          core.fillStyle(r % 2 ? 0x1e3a5f : accent, r % 2 ? 0.42 : 0.26);
          core.fillRect(cx - 32, 296 + r * 16, 64, 7);
        }
        this._addPixelGlow(cx, 352, 72, 12, accent, { depth: 5, alpha: 0.24 });
        this.add.text(cx, 266, i === 0 ? 'DATA CORE' : 'VISA NET', {
          fontFamily: 'monospace', fontSize: '9px', color: '#67e8f9',
          backgroundColor: 'rgba(2, 8, 16, 0.58)', padding: { x: 4, y: 1 },
        }).setOrigin(0.5).setDepth(5);
      });

      [[1120, 318], [2380, 330]].forEach(([cx, cy], i) => {
        const globe = this.add.graphics().setDepth(4);
        this._drawLevel1MetalPanel(globe, cx - 72, cy + 48, 144, 20, { accent, alpha: 0.42 });
        globe.fillStyle(accent, 0.055); globe.fillCircle(cx, cy, 54);
        globe.lineStyle(1, accent, 0.32); globe.strokeCircle(cx, cy, 50);
        globe.lineStyle(1, accent, 0.2);
        globe.strokeEllipse(cx, cy, 92, 28);
        globe.strokeEllipse(cx, cy, 38, 92);
        globe.lineBetween(cx - 42, cy - 16, cx + 38, cy + 18);
        globe.fillStyle(i ? 0xf59e0b : 0x4ade80, 0.76); globe.fillRect(cx - 4, cy - 4, 8, 8);
        this._addPixelGlow(cx, cy, 92, 12, accent, { depth: 5, alpha: 0.13 });
      });

      [300, 1670, 2500].forEach((cx, i) => {
        const cam = this.add.graphics().setDepth(3);
        this._drawLevel1MetalPanel(cam, cx - 18, 294, 36, 14, { accent: i % 2 ? 0xf59e0b : accent, alpha: 0.38 });
        cam.lineStyle(1, 0x334155, 0.62); cam.lineBetween(cx, 294, cx, 278);
        cam.fillStyle(i % 2 ? 0xf59e0b : accent, 0.28);
        cam.fillTriangle(cx - 14, 308, cx + 14, 308, cx, 338);
      });
    }
    return;
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
    {
      const accent = 0x60a5fa;
      const floor = this.add.graphics().setDepth(1);
      for (let x = 0; x < W; x += 88) {
        this._drawLevel1MetalPanel(floor, x, 540, 86, 28, { accent, alpha: 0.45 });
      }
      [250, 700, 1150, 1600, 2050, 2500, 2950].forEach((tx, i) => {
        const term = this.add.graphics().setDepth(3);
        term.x = tx; term.y = 552;
        term.fillStyle(0x020810, 0.45); term.fillEllipse(0, 0, 58, 12);
        this._drawLevel1MetalPanel(term, -20, -62, 40, 62, { accent, alpha: 0.94 });
        term.fillStyle(accent, 0.13); term.fillRect(-13, -54, 26, 26);
        term.lineStyle(1, accent, 0.35); term.strokeRect(-13, -54, 26, 26);
        for (let l = 0; l < 5; l++) {
          term.fillStyle(accent, 0.12);
          term.fillRect(-10, -49 + l * 5, 20 - l * 2, 1);
        }
        term.fillStyle(i % 2 ? 0xf59e0b : 0x38bdf8, 0.6);
        term.fillRect(-14, -12, 28, 3);
      });

      const beams = this.add.graphics().setDepth(2);
      [500, 1100, 1800, 2400].forEach(bx => {
        beams.fillStyle(accent, 0.035);
        beams.fillRect(bx - 5, 0, 10, 552);
        beams.fillStyle(accent, 0.18);
        beams.fillRect(bx - 1, 0, 2, 552);
        this._drawLevel1MetalPanel(beams, bx - 22, 520, 44, 20, { accent, alpha: 0.34 });
      });

      const arch = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(arch, 2550, 306, 100, 60, { accent, alpha: 0.74 });
      arch.fillStyle(accent, 0.08); arch.fillRect(2560, 316, 80, 38);
      arch.lineStyle(1, accent, 0.45); arch.strokeRect(2560, 316, 80, 38);
      arch.fillStyle(0xf59e0b, 0.5); arch.fillRect(2570, 360, 60, 3);

      // Alien census array: central star-map equipment, very different silhouette from Level 2.
      [[900, 328, 'SPECIES MAP'], [1900, 328, 'STAR INDEX']].forEach(([cx, cy, label]) => {
        const map = this.add.graphics().setDepth(4);
        this._drawLevel1MetalPanel(map, cx - 76, cy - 42, 152, 84, { accent, alpha: 0.74 });
        map.lineStyle(1, accent, 0.28);
        const pts = [[cx - 46, cy - 10], [cx - 12, cy - 28], [cx + 28, cy - 4], [cx + 50, cy + 22], [cx - 22, cy + 24]];
        for (let i = 0; i < pts.length - 1; i++) map.lineBetween(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        pts.forEach(([px, py], idx) => {
          map.fillStyle(idx % 2 ? 0xf59e0b : accent, 0.8);
          map.fillRect(px - 3, py - 3, 6, 6);
        });
        this._addPixelGlow(cx, cy, 120, 10, accent, { depth: 5, alpha: 0.18 });
        this.add.text(cx, cy - 56, label, {
          fontFamily: 'monospace', fontSize: '9px', color: '#bfdbfe',
          backgroundColor: 'rgba(2, 8, 16, 0.58)', padding: { x: 4, y: 1 },
        }).setOrigin(0.5).setDepth(5);
      });

      [430, 2860].forEach((cx, i) => {
        const beacon = this.add.graphics().setDepth(3);
        beacon.x = cx; beacon.y = 552;
        this._drawLevel1MetalPanel(beacon, -6, -76, 12, 76, { accent, alpha: 0.48, led: false });
        beacon.fillStyle(i % 2 ? 0xf59e0b : accent, 0.2);
        beacon.fillRect(-24, -84, 48, 10);
        beacon.fillStyle(i % 2 ? 0xf59e0b : accent, 0.42);
        beacon.fillRect(-16, -80, 32, 2);
        beacon.fillStyle(accent, 0.055);
        beacon.fillEllipse(0, -52, 92, 64);
      });
    }
    return;
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
    {
      const accent = 0xa855f7;
      const track = this.add.graphics().setDepth(1);
      track.fillStyle(0x05030f, 0.62); track.fillRect(0, 538, W, 30);
      track.lineStyle(3, 0x334155, 0.75); track.lineBetween(0, 546, W, 546); track.lineBetween(0, 555, W, 555);
      track.lineStyle(1, accent, 0.35); track.lineBetween(0, 551, W, 551);
      for (let x = 0; x < W; x += 72) this._drawLevel1MetalPanel(track, x, 526, 56, 12, { accent, alpha: 0.34 });

      [350, 800, 1300, 1750, 2250].forEach((px, i) => {
        const marker = this.add.graphics().setDepth(3);
        marker.x = px; marker.y = 552;
        this._drawLevel1MetalPanel(marker, -56, -18, 112, 14, { accent, alpha: 0.42 });
        marker.fillStyle(accent, 0.16); marker.fillEllipse(0, -6, 136, 20);
        marker.fillStyle(0xf59e0b, 0.45); marker.fillRect(-42, -23, 32, 3);
        marker.fillStyle(i % 2 ? 0x38bdf8 : accent, 0.5); marker.fillRect(14, -23, 34, 3);
      });

      [[700, 424, 'ROUTE'], [1450, 394, 'DFS'], [2100, 424, 'BFS']].forEach(([mx, my, label]) => {
        const board = this.add.graphics().setDepth(4);
        this._drawLevel1MetalPanel(board, mx - 54, my - 46, 108, 42, { accent, alpha: 0.92 });
        for (let l = 0; l < 5; l++) {
          board.fillStyle(accent, 0.11);
          board.fillRect(mx - 42, my - 38 + l * 7, 78 - l * 5, 2);
        }
        this.add.text(mx, my - 56, label, {
          fontFamily: 'monospace', fontSize: '9px', color: '#d8b4fe',
          backgroundColor: 'rgba(10, 3, 22, 0.55)', padding: { x: 4, y: 1 },
        }).setOrigin(0.5).setDepth(5);
      });

      [250, 750, 1200, 1700, 2300].forEach(px => {
        const sign = this.add.graphics().setDepth(3);
        sign.x = px; sign.y = 552;
        this._drawLevel1MetalPanel(sign, -4, -88, 8, 88, { accent, alpha: 0.9, led: false });
        this._drawLevel1MetalPanel(sign, -26, -96, 52, 26, { accent, alpha: 0.88 });
        sign.fillStyle(0xf59e0b, 0.42); sign.fillRect(-18, -88, 36, 3);
      });

      const train = this.add.graphics().setDepth(3);
      this._drawLevel1MetalPanel(train, 272, 474, 452, 46, { accent, alpha: 0.46 });
      train.fillStyle(0x05030f, 0.82); train.fillRect(292, 486, 412, 20);
      train.fillStyle(accent, 0.18); train.fillRect(302, 492, 392, 4);
      for (let i = 0; i < 7; i++) {
        train.fillStyle(i % 2 ? 0xa855f7 : 0xf59e0b, 0.48);
        train.fillRect(326 + i * 52, 489, 28, 8);
      }
      this._addPixelGlow(500, 504, 380, 10, accent, { depth: 4, alpha: 0.2 });

      const gate = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(gate, 1328, 284, 244, 92, { accent, alpha: 0.68 });
      gate.fillStyle(accent, 0.09); gate.fillRect(1346, 302, 208, 54);
      gate.lineStyle(1, accent, 0.38);
      gate.lineBetween(1370, 342, 1400, 318);
      gate.lineBetween(1400, 318, 1442, 350);
      gate.lineBetween(1442, 350, 1494, 314);
      gate.lineBetween(1494, 314, 1532, 344);
      [1370, 1400, 1442, 1494, 1532].forEach((nx, i) => {
        gate.fillStyle(i % 2 ? 0xf59e0b : accent, 0.78);
        gate.fillRect(nx - 3, (i % 2 ? 318 : 342) - 3, 6, 6);
      });
      this._addPixelGlow(1450, 330, 184, 12, accent, { depth: 5, alpha: 0.22 });
      this.add.text(1450, 270, 'HYPER ROUTE', {
        fontFamily: 'monospace', fontSize: '9px', color: '#d8b4fe',
        backgroundColor: 'rgba(10, 3, 22, 0.58)', padding: { x: 4, y: 1 },
      }).setOrigin(0.5).setDepth(5);

      [520, 2480].forEach((cx, i) => {
        const turnstile = this.add.graphics().setDepth(3);
        turnstile.x = cx; turnstile.y = 552;
        this._drawLevel1MetalPanel(turnstile, -28, -42, 56, 24, { accent, alpha: 0.36 });
        turnstile.fillStyle(0x05030f, 0.62); turnstile.fillEllipse(0, 0, 72, 12);
        turnstile.lineStyle(1, i % 2 ? 0xf59e0b : accent, 0.3);
        turnstile.lineBetween(-18, -30, 18, -20);
        turnstile.lineBetween(-18, -20, 18, -30);
        turnstile.fillStyle(i % 2 ? 0xf59e0b : accent, 0.32);
        turnstile.fillRect(-20, -48, 40, 3);
      });
    }
    return;
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
    {
      const accent = 0x22c55e;
      const floor = this.add.graphics().setDepth(1);
      for (let x = 0; x < W; x += 82) this._drawLevel1MetalPanel(floor, x, 540, 80, 28, { accent, alpha: 0.46 });

      [300, 650, 1050, 1550, 1900, 2300].forEach((bx, i) => {
        const bench = this.add.graphics().setDepth(3);
        bench.x = bx; bench.y = 552;
        bench.fillStyle(0x020810, 0.45); bench.fillEllipse(0, 0, 112, 14);
        this._drawLevel1MetalPanel(bench, -54, -24, 108, 24, { accent, alpha: 0.52 });
        for (let d = 0; d < 3; d++) {
          const jx = -30 + d * 30;
          bench.fillStyle(accent, 0.12); bench.fillRect(jx - 9, -48, 18, 24);
          bench.lineStyle(1, accent, 0.42); bench.strokeRect(jx - 9, -48, 18, 24);
          bench.fillStyle(0x86efac, 0.42); bench.fillRect(jx - 5, -38, 10, 8);
          bench.fillStyle(0xffffff, 0.2); bench.fillRect(jx - 6, -46, 3, 18);
        }
        bench.fillStyle(i % 2 ? 0x38bdf8 : accent, 0.2); bench.fillRect(-42, -31, 84, 2);
      });

      [150, 550, 1000, 1400, 1800, 2250].forEach(hx => {
        const helix = this.add.graphics().setDepth(2);
        helix.x = hx; helix.y = 438;
        this._drawLevel1MetalPanel(helix, -22, 76, 44, 16, { accent, alpha: 0.34 });
        for (let y = 0; y < 7; y++) {
          const wave = Math.sin(y * 1.15) * 10;
          helix.fillStyle(accent, 0.34); helix.fillRect(wave - 2, y * 13, 4, 4);
          helix.fillStyle(0x86efac, 0.24); helix.fillRect(-wave - 2, y * 13, 4, 4);
          if (y < 6) {
            helix.lineStyle(1, accent, 0.18);
            helix.lineBetween(wave, y * 13 + 2, -wave, (y + 1) * 13 + 2);
          }
        }
      });

      const arch = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(arch, 1394, 326, 112, 60, { accent, alpha: 0.7 });
      arch.fillStyle(accent, 0.08); arch.fillRect(1404, 336, 92, 40);
      arch.lineStyle(1, accent, 0.5); arch.strokeRect(1404, 336, 92, 40);
      arch.fillStyle(0x86efac, 0.34); arch.fillRect(1422, 354, 56, 3);

      [[760, 362, 'GENOME VAT'], [1800, 362, 'BIO LOCK']].forEach(([cx, cy, label], i) => {
        const tank = this.add.graphics().setDepth(4);
        this._drawLevel1MetalPanel(tank, cx - 52, cy - 82, 104, 124, { accent, alpha: 0.74 });
        tank.fillStyle(0x052e16, 0.6); tank.fillRect(cx - 34, cy - 66, 68, 82);
        tank.lineStyle(1, 0x86efac, 0.48); tank.strokeRect(cx - 34, cy - 66, 68, 82);
        tank.fillStyle(0x86efac, 0.1); tank.fillRect(cx - 30, cy - 58, 60, 66);
        for (let b = 0; b < 8; b++) {
          tank.fillStyle(b % 2 ? accent : 0x86efac, 0.28);
          tank.fillRect(cx - 22 + (b * 13) % 46, cy - 50 + b * 8, 4, 4);
        }
        tank.fillStyle(i ? 0x38bdf8 : accent, 0.5);
        tank.fillRect(cx - 42, cy + 26, 84, 4);
        this._addPixelGlow(cx, cy - 20, 76, 14, 0x86efac, { depth: 5, alpha: 0.18 });
        this.add.text(cx, cy - 98, label, {
          fontFamily: 'monospace', fontSize: '9px', color: '#bbf7d0',
          backgroundColor: 'rgba(2, 16, 8, 0.58)', padding: { x: 4, y: 1 },
        }).setOrigin(0.5).setDepth(5);
      });

      const scanner = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(scanner, 2328, 330, 148, 74, { accent, alpha: 0.7 });
      scanner.fillStyle(accent, 0.1); scanner.fillRect(2342, 344, 120, 40);
      for (let i = 0; i < 6; i++) {
        scanner.fillStyle(i % 2 ? 0x86efac : accent, 0.34);
        scanner.fillRect(2352 + i * 17, 354 + (i % 3) * 5, 10, 3);
      }
      this._addPixelGlow(2402, 366, 118, 9, accent, { depth: 5, alpha: 0.2 });

      [480, 2520].forEach((cx, i) => {
        const grow = this.add.graphics().setDepth(3);
        grow.x = cx; grow.y = 552;
        grow.fillStyle(0x020810, 0.42); grow.fillEllipse(0, 0, 70, 12);
        this._drawLevel1MetalPanel(grow, -24, -58, 48, 48, { accent, alpha: 0.36 });
        grow.fillStyle(0x052e16, 0.62); grow.fillRect(-16, -48, 32, 28);
        grow.fillStyle(i % 2 ? 0x38bdf8 : accent, 0.22); grow.fillRect(-18, -63, 36, 3);
        for (let leaf = 0; leaf < 4; leaf++) {
          grow.fillStyle(0x86efac, 0.34);
          grow.fillRect(-10 + leaf * 6, -31 - (leaf % 2) * 5, 5, 8);
        }
      });
    }
    return;
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
    {
      const accent = 0x7c3aed;
      const floor = this.add.graphics().setDepth(1);
      for (let x = 0; x < W; x += 88) this._drawLevel1MetalPanel(floor, x, 540, 86, 28, { accent, alpha: 0.44 });

      [180, 820, 1200, 2200, 2480].forEach((cx, i) => {
        const crate = this.add.graphics().setDepth(3);
        crate.x = cx; crate.y = 552;
        const crateAccent = [0x7c3aed, 0x38bdf8, 0xf59e0b][i % 3];
        crate.fillStyle(0x020810, 0.45); crate.fillEllipse(0, 0, 72, 14);
        this._drawLevel1MetalPanel(crate, -34, -52, 68, 52, { accent: crateAccent, alpha: 0.42 });
        crate.fillStyle(crateAccent, 0.22); crate.fillRect(-30, -29, 60, 8);
        crate.fillStyle(0x0f172a, 0.65); crate.fillRect(-22, -44, 12, 10); crate.fillRect(10, -44, 12, 10);
      });

      [500, 1050, 1600, 2300].forEach((gx, i) => {
        const ring = this.add.graphics().setDepth(2);
        ring.x = gx; ring.y = 552;
        this._drawLevel1MetalPanel(ring, -30, -14, 60, 14, { accent, alpha: 0.38 });
        ring.lineStyle(2, accent, 0.28);
        ring.strokeEllipse(0, -8, 86, 18);
        ring.lineStyle(1, 0x38bdf8, 0.2);
        ring.strokeEllipse(0, -8, 60, 12);
      });

      const med = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(med, 636, 334, 128, 68, { accent: 0xef4444, alpha: 0.74 });
      med.fillStyle(0xef4444, 0.45); med.fillRect(692, 352, 16, 6); med.fillRect(697, 347, 6, 16);
      med.fillStyle(0xef4444, 0.1); med.fillRect(646, 376, 108, 12);

      const manifest = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(manifest, 2036, 334, 128, 68, { accent: 0x38bdf8, alpha: 0.74 });
      for (let r = 0; r < 4; r++) {
        manifest.fillStyle(0x38bdf8, 0.13 + r * 0.02);
        manifest.fillRect(2048, 348 + r * 12, 80 - r * 8, 5);
      }

      const dp = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(dp, 1388, 318, 124, 58, { accent, alpha: 0.74 });
      for (let c = 0; c < 5; c++) {
        dp.fillStyle(accent, 0.12); dp.fillRect(1400 + c * 19, 334, 14, 26);
      }

      const crane = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(crane, 908, 268, 300, 22, { accent: 0xf59e0b, alpha: 0.36 });
      this._drawLevel1MetalPanel(crane, 930, 290, 18, 154, { accent: 0xf59e0b, alpha: 0.62, led: false });
      crane.lineStyle(1, 0xf59e0b, 0.32);
      for (let x = 936; x < 1180; x += 34) {
        crane.lineBetween(x, 274, x + 28, 288);
        crane.lineBetween(x + 28, 274, x, 288);
      }
      crane.lineStyle(2, 0x38bdf8, 0.26);
      crane.lineBetween(1110, 290, 1110, 402);
      this._drawLevel1MetalPanel(crane, 1074, 402, 72, 30, { accent: 0x38bdf8, alpha: 0.46 });
      this._addPixelGlow(1110, 416, 64, 11, 0x38bdf8, { depth: 5, alpha: 0.2 });

      const airlock = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(airlock, 2260, 296, 154, 104, { accent, alpha: 0.68 });
      airlock.fillStyle(0x16072f, 0.7); airlock.fillRect(2284, 316, 106, 64);
      airlock.lineStyle(1, accent, 0.38); airlock.strokeRect(2284, 316, 106, 64);
      airlock.fillStyle(0xf59e0b, 0.48); airlock.fillRect(2298, 386, 78, 4);
      this._addPixelGlow(2337, 346, 94, 12, accent, { depth: 5, alpha: 0.18 });

      [600, 2440].forEach((cx, i) => {
        const hazard = this.add.graphics().setDepth(3);
        hazard.x = cx; hazard.y = 552;
        hazard.fillStyle(0x020810, 0.45); hazard.fillEllipse(0, 0, 88, 14);
        this._drawLevel1MetalPanel(hazard, -30, -34, 60, 24, { accent: i % 2 ? 0x38bdf8 : 0xf59e0b, alpha: 0.42 });
        hazard.fillStyle(i % 2 ? 0x38bdf8 : 0xf59e0b, 0.26);
        hazard.fillRect(-24, -42, 48, 3);
        hazard.lineStyle(1, accent, 0.18);
        hazard.strokeEllipse(0, -18, 76, 18);
      });
    }
    return;
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
    {
      const accent = 0x38bdf8;
      const floor = this.add.graphics().setDepth(1);
      for (let x = 0; x < W; x += 84) this._drawLevel1MetalPanel(floor, x, 540, 82, 28, { accent, alpha: 0.42 });

      [280, 680, 1100, 1680, 2280].forEach((tx, i) => {
        const tower = this.add.graphics().setDepth(3);
        tower.x = tx; tower.y = 552;
        tower.fillStyle(0x020810, 0.45); tower.fillEllipse(0, 0, 72, 14);
        this._drawLevel1MetalPanel(tower, -7, -124, 14, 124, { accent, alpha: 0.72, led: false });
        this._drawLevel1MetalPanel(tower, -30, -84, 60, 12, { accent, alpha: 0.38 });
        tower.lineStyle(1, accent, 0.28);
        tower.lineBetween(-24, -72, 0, -120); tower.lineBetween(24, -72, 0, -120);
        tower.fillStyle(accent, 0.16); tower.fillEllipse(0, -132, 36, 14);
        tower.lineStyle(1, accent, 0.55); tower.strokeEllipse(0, -132, 36, 14);
        tower.fillStyle(i % 2 ? 0xf59e0b : 0xef4444, 0.75); tower.fillRect(-2, -142, 4, 4);
      });

      [480, 980, 1580, 2080].forEach(rx => {
        const rack = this.add.graphics().setDepth(3);
        rack.x = rx; rack.y = 552;
        this._drawLevel1MetalPanel(rack, -28, -54, 56, 54, { accent, alpha: 0.62 });
        for (let r = 0; r < 4; r++) {
          rack.fillStyle(accent, 0.16 + r * 0.03);
          rack.fillRect(-19, -45 + r * 10, 38, 5);
        }
      });

      const cable = this.add.graphics().setDepth(2);
      cable.lineStyle(1, accent, 0.22);
      [[280, 680], [680, 1100], [1100, 1680], [1680, 2280]].forEach(([a, b]) => {
        cable.lineBetween(a, 430, b, 390);
        cable.fillStyle(accent, 0.32); cable.fillRect((a + b) / 2, 408, 5, 5);
      });

      const mst = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(mst, 636, 332, 128, 66, { accent, alpha: 0.72 });
      mst.fillStyle(accent, 0.12); mst.fillRect(650, 344, 100, 36);
      const dj = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(dj, 1386, 292, 128, 66, { accent: 0xf59e0b, alpha: 0.72 });
      dj.fillStyle(0xf59e0b, 0.12); dj.fillRect(1400, 304, 100, 36);

      const hub = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(hub, 1776, 314, 160, 88, { accent, alpha: 0.72 });
      hub.fillStyle(0x052033, 0.72); hub.fillRect(1794, 332, 124, 48);
      hub.lineStyle(1, accent, 0.34);
      [[1820, 356], [1856, 340], [1884, 366], [1910, 348]].forEach(([nx, ny], i, arr) => {
        if (i > 0) hub.lineBetween(arr[i - 1][0], arr[i - 1][1], nx, ny);
        hub.fillStyle(i % 2 ? 0xf59e0b : accent, 0.82);
        hub.fillRect(nx - 4, ny - 4, 8, 8);
      });
      this._addPixelGlow(1856, 356, 118, 12, accent, { depth: 5, alpha: 0.18 });
      this.add.text(1856, 300, 'ROUTING HUB', {
        fontFamily: 'monospace', fontSize: '9px', color: '#bae6fd',
        backgroundColor: 'rgba(2, 8, 16, 0.58)', padding: { x: 4, y: 1 },
      }).setOrigin(0.5).setDepth(5);

      const dish = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(dish, 2468, 446, 86, 24, { accent: 0xf59e0b, alpha: 0.42 });
      dish.lineStyle(2, 0xf59e0b, 0.36);
      dish.strokeEllipse(2511, 420, 82, 28);
      dish.lineStyle(1, accent, 0.22);
      dish.strokeEllipse(2511, 420, 118, 42);
      this._addPixelGlow(2511, 420, 80, 10, 0xf59e0b, { depth: 5, alpha: 0.16 });

      [360, 2380].forEach((cx, i) => {
        const relay = this.add.graphics().setDepth(3);
        relay.x = cx; relay.y = 552;
        relay.fillStyle(0x020810, 0.42); relay.fillEllipse(0, 0, 76, 12);
        this._drawLevel1MetalPanel(relay, -22, -44, 44, 34, { accent, alpha: 0.36 });
        relay.lineStyle(1, i % 2 ? 0xf59e0b : accent, 0.28);
        relay.strokeCircle(0, -58, 16);
        relay.strokeCircle(0, -58, 26);
        relay.fillStyle(i % 2 ? 0xf59e0b : accent, 0.64);
        relay.fillRect(-3, -61, 6, 6);
      });
    }
    return;
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
    {
      const accent = 0xa855f7;
      const floor = this.add.graphics().setDepth(1);
      for (let x = 0; x < W; x += 88) this._drawLevel1MetalPanel(floor, x, 540, 86, 28, { accent, alpha: 0.44 });

      [400, 900, 1500, 2200, 2900].forEach(ex => {
        const col = this.add.graphics().setDepth(2);
        col.fillStyle(accent, 0.035); col.fillRect(ex - 8, 0, 16, 552);
        col.fillStyle(accent, 0.18); col.fillRect(ex - 1, 0, 2, 552);
        this._drawLevel1MetalPanel(col, ex - 24, 520, 48, 22, { accent, alpha: 0.34 });
      });

      const chess = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(chess, 626, 336, 84, 84, { accent: 0xfbbf24, alpha: 0.58 });
      const cs = 16;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          chess.fillStyle((r + c) % 2 === 0 ? 0x334155 : 0x0f172a, 0.8);
          chess.fillRect(636 + c * cs, 346 + r * cs, cs, cs);
        }
      }

      const doorColors = [0x22c55e, 0xfbbf24, 0xef4444];
      doorColors.forEach((col, i) => {
        const dx = 1288 + i * 58;
        const door = this.add.graphics().setDepth(4);
        this._drawLevel1MetalPanel(door, dx, 302, 50, 68, { accent: col, alpha: 0.7 });
        door.fillStyle(col, 0.12); door.fillRect(dx + 8, 312, 34, 46);
        door.fillStyle(col, 0.55); door.fillRect(dx + 12, 362, 26, 3);
      });

      const pad = this.add.graphics().setDepth(3);
      this._drawLevel1MetalPanel(pad, 3088, 524, 224, 24, { accent: 0x4ade80, alpha: 0.42 });
      pad.fillStyle(0x4ade80, 0.08); pad.fillEllipse(3200, 536, 260, 34);
      pad.lineStyle(2, 0x4ade80, 0.28); pad.strokeEllipse(3200, 536, 220, 26);

      const ship = this.add.graphics().setDepth(4);
      ship.fillStyle(0x0f172a, 0.86); ship.fillTriangle(3200, 424, 3168, 502, 3232, 502);
      ship.lineStyle(1, 0x38bdf8, 0.42); ship.strokeTriangle(3200, 424, 3168, 502, 3232, 502);
      ship.fillStyle(0x38bdf8, 0.22); ship.fillRect(3194, 470, 12, 18);
      ship.fillStyle(0xf59e0b, 0.34); ship.fillRect(3182, 502, 36, 4);

      const comp = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(comp, 1332, 292, 136, 66, { accent, alpha: 0.72 });
      comp.fillStyle(accent, 0.1); comp.fillRect(1346, 306, 108, 38);

      const reactor = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(reactor, 1842, 284, 176, 118, { accent, alpha: 0.74 });
      reactor.fillStyle(0x170b2e, 0.74); reactor.fillRect(1864, 308, 132, 66);
      reactor.lineStyle(1, accent, 0.42); reactor.strokeRect(1864, 308, 132, 66);
      reactor.lineStyle(1, 0x38bdf8, 0.28);
      reactor.lineBetween(1880, 356, 1920, 324);
      reactor.lineBetween(1920, 324, 1958, 362);
      reactor.lineBetween(1958, 362, 1984, 334);
      [1880, 1920, 1958, 1984].forEach((nx, i) => {
        reactor.fillStyle(i % 2 ? 0xf59e0b : 0x38bdf8, 0.82);
        reactor.fillRect(nx - 4, (i % 2 ? 324 : 356) - 4, 8, 8);
      });
      this._addPixelGlow(1930, 342, 128, 14, accent, { depth: 5, alpha: 0.2 });

      const gantry = this.add.graphics().setDepth(4);
      this._drawLevel1MetalPanel(gantry, 3138, 324, 24, 196, { accent: 0x4ade80, alpha: 0.8, led: false });
      this._drawLevel1MetalPanel(gantry, 3238, 324, 24, 196, { accent: 0x4ade80, alpha: 0.8, led: false });
      gantry.lineStyle(1, 0x4ade80, 0.28);
      for (let y = 340; y < 506; y += 28) {
        gantry.lineBetween(3162, y, 3238, y + 18);
        gantry.lineBetween(3238, y, 3162, y + 18);
      }
      this._addPixelGlow(3200, 504, 150, 10, 0x4ade80, { depth: 5, alpha: 0.18 });

      [980, 2440].forEach((cx, i) => {
        const pylon = this.add.graphics().setDepth(3);
        pylon.x = cx; pylon.y = 552;
        pylon.fillStyle(0x020810, 0.44); pylon.fillEllipse(0, 0, 82, 13);
        this._drawLevel1MetalPanel(pylon, -18, -70, 36, 60, { accent, alpha: 0.32 });
        pylon.fillStyle(i % 2 ? 0xfbbf24 : accent, 0.22);
        pylon.fillTriangle(-26, -78, 26, -78, 0, -108);
        pylon.lineStyle(1, i % 2 ? 0xfbbf24 : accent, 0.32);
        pylon.strokeTriangle(-26, -78, 26, -78, 0, -108);
        pylon.fillStyle(0xffffff, 0.34);
        pylon.fillRect(-3, -95, 6, 6);
      });
    }
    return;
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

  _legacyEndScreen() {
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

  showEndScreen() {
    this.cameras.main.setBackgroundColor('#061225');
    this._drawEndSpaceBackdrop();
    this._drawEndSignalFrame();

    this.add.text(400, 142, 'Dodorithms', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '50px',
      fontStyle: 'bold',
      color: '#e0fbff',
      stroke: '#083344',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: '#22d3ee', blur: 18, fill: true },
    }).setOrigin(0.5).setDepth(10);

    this.add.rectangle(400, 179, 352, 2, 0x67e8f9, 0.55).setDepth(10);

    this.add.text(400, 218, 'All Levels Complete', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#f8fafc',
      stroke: '#020810',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 12, fill: true },
    }).setOrigin(0.5).setDepth(10);

    const panel = this.add.graphics().setDepth(8);
    panel.fillStyle(0x020713, 0.74);
    panel.fillRect(150, 258, 500, 146);
    panel.lineStyle(2, 0x22d3ee, 0.58);
    panel.strokeRect(150, 258, 500, 146);
    panel.fillStyle(0x22d3ee, 0.15);
    panel.fillRect(172, 270, 120, 3);
    panel.fillRect(508, 389, 120, 3);
    panel.fillStyle(0xf59e0b, 0.18);
    panel.fillRect(214, 389, 92, 3);

    this.add.text(400, 307, '"Thanks for everything. Earth algorithms are weirdly efficient.\nNext stop: ZZS, before I accidentally optimize the snacks."', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '14px',
      color: '#b6f3ff',
      align: 'center',
      fontStyle: 'italic',
      stroke: '#020810',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(400, 362, '- Dodo', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '13px',
      color: '#fbbf24',
      stroke: '#020810',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    const total = archiveSystem.getAllAlgorithms().length;
    this.add.text(400, 432, `Archive synced: ${total} / 30 algorithms`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '15px',
      color: '#67e8f9',
      stroke: '#020810',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    const btn = this._makeEndButton(400, 480, 'BACK TO MENU');
    btn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }

  _drawEndSpaceBackdrop() {
    this.add.rectangle(400, 300, 800, 600, 0x061225).setDepth(0);

    const g = this.add.graphics().setDepth(1);
    [
      { y: 108, color: 0x0ea5e9, alpha: 0.12, amp: 18 },
      { y: 178, color: 0x22c55e, alpha: 0.08, amp: 20 },
      { y: 462, color: 0xa855f7, alpha: 0.08, amp: 26 },
    ].forEach((band, bandIndex) => {
      for (let x = -40; x < 840; x += 12) {
        const y = band.y + Math.sin((x + bandIndex * 70) / 78) * band.amp;
        g.fillStyle(band.color, band.alpha);
        g.fillRect(x, y, 18, 4 + ((x / 12 + bandIndex) % 4));
      }
    });

    this._drawEndPlanet(620, 142, 48, 0x1d4ed8, 0x7dd3fc, 0x07142f, true);
    this._drawEndPlanet(178, 426, 30, 0xb45309, 0xfbbf24, 0x2b1203, false);

    for (let i = 0; i < 132; i++) {
      const x = (i * 71) % 800;
      const y = 24 + ((i * 131) % 530);
      const size = i % 19 === 0 ? 2 : 1;
      const color = i % 9 === 0 ? 0xf8fafc : (i % 5 === 0 ? 0x67e8f9 : 0x94a3b8);
      this.add.rectangle(x, y, size, size, color, 0.48 + (i % 4) * 0.1).setDepth(2);
    }

    const route = this.add.graphics().setDepth(3);
    route.lineStyle(1, 0x38bdf8, 0.22);
    route.strokeEllipse(400, 432, 280, 58);
    route.strokeEllipse(400, 432, 190, 38);
    route.lineStyle(1, 0xf59e0b, 0.24);
    route.strokeEllipse(400, 432, 110, 22);
    route.fillStyle(0x22d3ee, 0.55);
    route.fillRect(396, 429, 8, 4);
  }

  _drawEndPlanet(x, y, r, base, hi, shade, ring) {
    const g = this.add.graphics().setDepth(2);
    if (ring) {
      g.lineStyle(2, 0x38bdf8, 0.24);
      g.strokeEllipse(x, y + 8, r * 2.75, r * 0.72);
      g.lineStyle(1, 0xf59e0b, 0.18);
      g.strokeEllipse(x, y + 10, r * 3.2, r * 0.86);
    }
    for (let yy = -r; yy <= r; yy += 4) {
      const width = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)) * 2 / 4) * 4;
      g.fillStyle(base, 0.86);
      g.fillRect(x - width / 2, y + yy, width, 4);
      if (yy > r * 0.1) {
        g.fillStyle(shade, 0.28);
        g.fillRect(x - width / 2, y + yy, width, 4);
      }
      if (yy % 16 === 0) {
        g.fillStyle(hi, 0.16);
        g.fillRect(x - width / 2 + 8, y + yy, Math.max(8, width - 18), 2);
      }
    }
    g.fillStyle(hi, 0.24);
    g.fillRect(x - r * 0.32, y - r * 0.32, 14, 14);
  }

  _drawEndSignalFrame() {
    const g = this.add.graphics().setDepth(9);
    g.lineStyle(1, 0x0ea5e9, 0.28);
    g.strokeRect(22, 18, 756, 564);
    g.fillStyle(0x22d3ee, 0.42);
    [[22, 18], [746, 18], [22, 570], [746, 570]].forEach(([x, y]) => {
      g.fillRect(x, y, 32, 2);
      g.fillRect(x, y, 2, 14);
    });
  }

  _makeEndButton(x, y, label) {
    const base = this.add.graphics().setDepth(10);
    const draw = (hover = false) => {
      base.clear();
      const fill = hover ? 0x67e8f9 : 0x0e7490;
      const edge = hover ? 0xf8fafc : 0x22d3ee;
      base.fillStyle(0x020713, 0.86);
      base.fillRect(x - 102, y - 24, 204, 48);
      base.fillStyle(fill, hover ? 0.28 : 0.18);
      base.fillRect(x - 96, y - 18, 192, 36);
      base.lineStyle(2, edge, hover ? 0.9 : 0.62);
      base.strokeRect(x - 102, y - 24, 204, 48);
      base.fillStyle(edge, hover ? 0.95 : 0.72);
      base.fillRect(x - 90, y + 15, 180, 3);
      base.fillRect(x - 90, y - 18, 30, 3);
      base.fillRect(x + 60, y - 18, 30, 3);
    };

    draw(false);
    const text = this.add.text(x, y - 1, label, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#e0fbff',
      stroke: '#042f3d',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: '#22d3ee', blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

    text.on('pointerover', () => draw(true));
    text.on('pointerout', () => draw(false));
    return text;
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
