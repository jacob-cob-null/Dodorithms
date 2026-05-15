/**
 * ASSET MANIFEST — Single source of truth for all game assets.
 *
 * Each entry:
 *   key          → used in Phaser (this.add.image / this.add.sprite / texture key)
 *   placeholder  → procedurally generated in BootScene until real art arrives
 *   size         → target resolution for generation
 *   tool         → Stability Matrix (backgrounds/NPCs) or Imagen 3 (Dodo/icons)
 *   prompt       → ready-to-paste prompt for the specified tool
 *
 * To swap in real art:
 *   1. Generate PNG using the prompt at the given size
 *   2. Drop into /public/assets/<key>.png
 *   3. Add to BootScene preload: this.load.image(key, 'assets/<key>.png')
 *   4. Remove placeholder generation for that key
 */

export const ASSET_MANIFEST = {
  // ═══════════════════════════════════════════════════════
  //  DODO SPRITES
  // ═══════════════════════════════════════════════════════

  dodo_idle: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, facing forward, idle neutral stance, retro game sprite, pixelated, no smoothing',
  },
  dodo_happy: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, facing forward, big pixel smile, eyes curved upward, one arm raised in excitement, retro game sprite, pixelated, no smoothing',
  },
  dodo_confused: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, facing forward, one eyebrow raised, head tilted, hand on chin thinking pose, retro game sprite, pixelated, no smoothing',
  },
  dodo_surprised: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, facing forward, mouth open wide, eyes very large, leaning back slightly, retro game sprite, pixelated, no smoothing',
  },
  dodo_celebrate: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, both arms raised in victory, big grin, facing forward, retro game sprite, pixelated, no smoothing',
  },
  dodo_interact: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, leaning forward, one arm reaching out toward an object, curious expression, facing forward, retro game sprite, pixelated, no smoothing',
  },

  // Walk frames — use NanoBanana Pro (Imagen 3) with dodo reference image as img2img
  dodo_walk_r1: {
    placeholder: { shape: 'rect', color: 0xdc2626, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, side profile facing RIGHT, RIGHT leg planted on ground bearing weight, LEFT leg raised and kicked forward in front of body, clear stride gap between legs, retro game sprite, pixelated, no smoothing',
  },
  dodo_walk_r2: {
    placeholder: { shape: 'rect', color: 0xdc2626, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, side profile facing RIGHT, LEFT leg planted on ground bearing weight, RIGHT leg raised and kicked forward in front of body, clear stride gap between legs, opposite of walk_r1, retro game sprite, pixelated, no smoothing',
  },
  dodo_walk_l1: {
    placeholder: { shape: 'rect', color: 0xdc2626, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, side profile facing LEFT, LEFT leg planted on ground bearing weight, RIGHT leg raised and kicked forward in front of body, clear stride gap between legs, retro game sprite, pixelated, no smoothing',
  },
  dodo_walk_l2: {
    placeholder: { shape: 'rect', color: 0xdc2626, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, side profile facing LEFT, RIGHT leg planted on ground bearing weight, LEFT leg raised and kicked forward in front of body, clear stride gap between legs, opposite of walk_l1, retro game sprite, pixelated, no smoothing',
  },
  dodo_idle_bounce1: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, facing forward, slightly crouched downward, idle bounce frame 1, retro game sprite, pixelated, no smoothing',
  },
  dodo_idle_bounce2: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt:
      '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, facing forward, slightly stretched upward, idle bounce frame 2, retro game sprite, pixelated, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  NPC WORLD SPRITES
  // ═══════════════════════════════════════════════════════

  npc_laurenze: {
    placeholder: { shape: 'rect', color: 0xf59e0b, w: 32, h: 48 },
    size: '512x768',
    tool: 'Done', // generated — public/assets/npc_laurenze.png
  },
  npc_trizy: {
    placeholder: { shape: 'rect', color: 0x06b6d4, w: 32, h: 48 },
    size: '512x768',
    tool: 'Done', // generated — public/assets/npc_trizy.png
  },
  npc_jacob: {
    placeholder: { shape: 'rect', color: 0x22c55e, w: 32, h: 48 },
    size: '512x768',
    tool: 'Done', // generated — public/assets/npc_jacob.png
  },
  npc_kyla: {
    placeholder: { shape: 'rect', color: 0xa855f7, w: 32, h: 48 },
    size: '512x768',
    tool: 'Done', // generated — public/assets/npc_kyla.png
  },
  npc_professor: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 32, h: 48 },
    size: '512x768',
    tool: 'Done', // generated — public/assets/npc_professor.png
  },

  // ═══════════════════════════════════════════════════════
  //  NPC DIALOGUE PORTRAITS
  // ═══════════════════════════════════════════════════════

  portrait_laurenze_a: { placeholder: { shape: 'rect', color: 0xf59e0b, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_laurenze_b: { placeholder: { shape: 'rect', color: 0xf59e0b, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_laurenze_c: { placeholder: { shape: 'rect', color: 0xf59e0b, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },

  portrait_trizy_a: { placeholder: { shape: 'rect', color: 0x06b6d4, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_trizy_b: { placeholder: { shape: 'rect', color: 0x06b6d4, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_trizy_c: { placeholder: { shape: 'rect', color: 0x06b6d4, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },

  portrait_jacob_a: { placeholder: { shape: 'rect', color: 0x22c55e, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_jacob_b: { placeholder: { shape: 'rect', color: 0x22c55e, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_jacob_c: { placeholder: { shape: 'rect', color: 0x22c55e, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },

  portrait_kyla_a: { placeholder: { shape: 'rect', color: 0xa855f7, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_kyla_b: { placeholder: { shape: 'rect', color: 0xa855f7, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_kyla_c: { placeholder: { shape: 'rect', color: 0xa855f7, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },

  portrait_professor_a: { placeholder: { shape: 'rect', color: 0xfbbf24, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_professor_b: { placeholder: { shape: 'rect', color: 0xfbbf24, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },
  portrait_professor_c: { placeholder: { shape: 'rect', color: 0xfbbf24, w: 52, h: 72 }, size: '104x144', tool: 'Imagen 3' },

  // ═══════════════════════════════════════════════════════
  //  BACKGROUNDS (tiling or full scene)
  // ═══════════════════════════════════════════════════════

  bg_level1: {
    placeholder: { shape: 'rect', color: 0x060d17, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix (azilbpixelmix + pixelbuildings LoRA)',
    // Mood: Surprised delight in a neon-lit city at night. Charming crash, curious citizens.
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, futuristic city plaza at night 2070s, deep blue-black sky with visible stars, small alien spacecraft crash-landed in a public fountain, warm amber steam and exhaust glow, neon-lit city skyline with amber and orange shop signs, rounded futuristic buildings with glowing windows and rooftop gardens, curious silhouetted citizens on balconies, amber streetlamps reflecting on wet plaza tiles, charming adventurous atmosphere, deep navy and amber neon color palette, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level2: {
    placeholder: { shape: 'rect', color: 0x0a1628, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Busy operations hub at night — serious but alive, warm amber against cool cyan.
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, atmospheric high-tech data center interior at night 2070s, dark ceiling with glowing cyan strip lights, tall walls of pulsing blue-teal server racks and monitor banks, floating holographic world maps and search algorithm displays, tidy workstations with personal touches, small cactus with grow-light, warm amber desk lamps contrasting cool cyan ambient, cozy details in a technical space, deep dark blue and cyan neon palette with amber warmth, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level3: {
    placeholder: { shape: 'rect', color: 0x061a0a, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Dark lab made magical by bioluminescent samples — fairy lights in jars.
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, atmospheric bioluminescent biology lab interior 2070s, dimmed overhead lights, benches covered in glowing green and teal sealed sample jars, bioluminescent plant specimens in glass chambers like magical lanterns, large glowing DNA double helix centerpiece, greenhouse windows with warm amber grow-light behind lush plants, whiteboard with colorful sorting diagrams, dark atmospheric lab with magical green glow, deep dark green and teal neon palette with warm amber grow-light accents, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level4: {
    placeholder: { shape: 'rect', color: 0x0d0a1f, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: The excitement of departure. Grand underground terminal, every platform lit like a stage.
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, grand futuristic underground train terminal at night 2070s, high arched dark ceiling, lavender and purple neon platform edge strips like runway guides, sleek bullet trains with warm amber glowing interiors, scrolling departure boards casting blue-white light, massive illuminated node-and-line route map on far wall, silhouetted travelers with hover luggage, electric midnight transit atmosphere, deep indigo and lavender neon palette with amber train window warmth, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level5: {
    placeholder: { shape: 'rect', color: 0x050b18, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Deep space above, warm festival below — the contrast makes both feel stronger.
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, futuristic space fair on an open plaza at night 2070s, upper half deep black starfield sky with crescent planet arc and pink aurora ribbons, lower half colorful neon fair kiosks in a row, amber cyan purple green canopy lights glowing warmly, string lights strung between booths, cheerful festive atmosphere, vivid neon palette against dark space sky, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level6: {
    placeholder: { shape: 'rect', color: 0x100518, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Cozy in the void. Warm amber inside, infinite black outside the portholes.
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, cozy space station interior 2070s, dark hull walls with industrial riveted panels, two large circular porthole windows showing blue-green Earth floating in black space, trailing green plants in wall-mounted holders, colorful sticky notes and personal mementos pinned on wall, stacked cargo crates on floor, warm amber wall lamps casting gentle glow, lived-in atmosphere in zero-gravity home, amber interior palette with blue-green Earth glow through portholes, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level7: {
    placeholder: { shape: 'rect', color: 0x081020, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: The beauty of a system at night — cables arc across dark sky like constellations.
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, outdoor network campus at night 2070s, deep indigo-purple night sky filling upper half, two tall illuminated communication towers rising from ground, glowing amber and lavender fiber optic cables arcing between towers like a spanning tree diagram, large building in background with enormous illuminated node-and-edge network graph projection on its wall, lit pathway with amber lamps along the ground, indigo sky with amber and lavender cable glow, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level8: {
    placeholder: { shape: 'rect', color: 0x0a0a1a, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Dark and grand but earned — graduation in a space cathedral, not a final boss.
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, grand dark ceremonial academy hall 2070s, tall dark stone columns with warm amber uplighting creating dramatic light shafts, five glowing neon banners in amber cyan green purple yellow with algorithm symbols, polished dark floor reflecting colored banner light, massive glowing archway at far end with stars and a gold-lit repaired spacecraft visible beyond, five illuminated podiums in guide colors, dark and grand but warm and triumphant atmosphere, deep charcoal and amber uplighting palette with multicolor neon banner accents, retro platformer background, crisp pixel edges, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  PLAYER SPRITE
  // ═══════════════════════════════════════════════════════

  // Note: Dodo emotion sprites (dodo_idle, dodo_happy, etc.) are defined at top.
  // The "player" key used by physics/movement is a separate world sprite.

  player: {
    placeholder: { shape: 'rect', color: 0x4ade80, w: 32, h: 48 },
    tool: 'Imagen 3', // use dodo_idle sprite — same asset, handled by Imagen 3 workflow
  },
  player_jump: {
    placeholder: { shape: 'rect', color: 0x86efac, w: 32, h: 48 },
    tool: 'Imagen 3', // use dodo_interact or dodo_celebrate sprite — handled by Imagen 3 workflow
  },

  // ═══════════════════════════════════════════════════════
  //  PARALLAX BACKGROUND LAYERS
  //  Generated separately so each layer can scroll at its own speed.
  //  Width should be worldWidth (2600–3400px). Height: 600px.
  //  Generate at 2× and downscale with nearest-neighbor.
  // ═══════════════════════════════════════════════════════

  // Shared star field — reused across all levels, scrollFactor 0.02–0.05
  parallax_stars: {
    placeholder: { shape: 'rect', color: 0x020810, w: 800, h: 600 },
    size: '2400x600',
    tool: 'Stability Matrix',
    prompt:
      'pixel art seamless starfield background layer, 16-bit style, deep space, scattered white and soft blue star dots of varying sizes, some larger brighter stars, dark near-black sky, subtle variation in star density, no foreground elements, retro game sky layer, crisp pixel edges, no smoothing, tileable horizontally',
  },

  // City far layer — distant dark silhouette skyline, levels 1–4, scrollFactor 0.20
  parallax_city_far: {
    placeholder: { shape: 'rect', color: 0x060e1c, w: 800, h: 600 },
    size: '2400x600',
    tool: 'Stability Matrix',
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art parallax background layer, 16-bit SNES style, very distant futuristic city silhouette at night, very dark navy building shapes against dark blue-black sky, tiny lit windows as single pixel dots, antenna spires with red blinking tips, no detail — pure dark silhouette with minimal window glow, retro game far background layer, crisp pixel edges, no smoothing',
  },

  // City near layer — closer buildings with neon, levels 1–4, scrollFactor 0.45
  parallax_city_near: {
    placeholder: { shape: 'rect', color: 0x081428, w: 800, h: 600 },
    size: '2400x600',
    tool: 'Stability Matrix',
    prompt:
      '<lora:pixelbuildings128-v2:1> pixel art parallax background layer, 16-bit SNES style, near futuristic city buildings at night, dark blue buildings with cyan and amber neon outlines and roof strips, varied building heights, lit windows in warm yellow and cool blue, neon signs as colored horizontal bars, holographic billboard panels, atmospheric depth, retro game mid background layer, crisp pixel edges, no smoothing',
  },

  // Space nebula layer — deep space backdrop, levels 5–8, scrollFactor 0.02
  parallax_space_nebula: {
    placeholder: { shape: 'rect', color: 0x040a18, w: 800, h: 600 },
    size: '2400x600',
    tool: 'Stability Matrix',
    prompt:
      'pixel art parallax background layer, 16-bit SNES style, full rectangular image filling entire canvas with no vignette no circle no crop, deep space, faint purple and teal nebula wisps spread across full width, scattered star dots, crescent planet arc at top edge, aurora ribbon of cyan and pink crossing diagonally across the full image, very dark blue-black background filling all corners, flat rectangular layer with content all the way to edges, retro game space background layer, crisp pixel edges, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  PLATFORM TILES (per level theme, 128×32px base tile)
  //  Scaled in-engine to fit each platform's scaleX/scaleY.
  // ═══════════════════════════════════════════════════════

  platform_city: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 64, h: 16 },
    tool: 'Code', // dark concrete surface, amber LED strip underneath — drawn via graphics()
  },
  platform_tech: {
    placeholder: { shape: 'rect', color: 0x0f2744, w: 64, h: 16 },
    tool: 'Code', // dark steel grating surface, cyan LED strip underneath — drawn via graphics()
  },
  platform_lab: {
    placeholder: { shape: 'rect', color: 0x0d2b12, w: 64, h: 16 },
    tool: 'Code', // dark lab bench surface, green LED strip underneath — drawn via graphics()
  },
  platform_train: {
    placeholder: { shape: 'rect', color: 0x120b2e, w: 64, h: 16 },
    tool: 'Code', // dark station platform surface, lavender LED strip underneath — drawn via graphics()
  },
  platform_space: {
    placeholder: { shape: 'rect', color: 0x1a0a2e, w: 64, h: 16 },
    tool: 'Code', // dark hull panel surface, amber warning strip underneath — drawn via graphics()
  },

  // ═══════════════════════════════════════════════════════
  //  UI PANELS & ELEMENTS
  // ═══════════════════════════════════════════════════════

  // Nine-slice dialogue box — rendered as hologram overlay in code
  ui_dialogue_panel: {
    placeholder: { shape: 'rect', color: 0x0f172a, w: 760, h: 144 },
    tool: 'Code', // hologram window — dark translucent fill + cyan neon border + scanlines
  },

  // Archive / overlay panel — rendered as hologram overlay in code
  ui_archive_panel: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 520, h: 380 },
    tool: 'Code', // hologram window — same treatment as dialogue panel
  },

  // Press E interaction prompt — rendered as hologram in code
  ui_key_e: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 28, h: 20 },
    tool: 'Code', // floating amber key prompt drawn with graphics()
  },

  // Algorithm unlocked notification card — rendered as hologram in code
  ui_unlock_card: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 420, h: 80 },
    tool: 'Code', // hologram banner sliding in from top
  },

  // Generic button — rendered as hologram in code
  ui_button: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 120, h: 40 },
    tool: 'Code', // neon bordered rectangle, cyan on hover
  },

  // Minigame tile — rendered as hologram in code
  ui_minigame_tile: {
    placeholder: { shape: 'rect', color: 0x1e4d7a, w: 64, h: 56 },
    tool: 'Code', // hologram tile states: default/active/sorted/wrong via tint + border color
  },

  // DP/grid cell — rendered as hologram in code
  ui_grid_cell: {
    placeholder: { shape: 'rect', color: 0x0f172a, w: 48, h: 48 },
    tool: 'Code', // hologram grid cell states: empty/filled/active via fill + border color
  },

  // Main menu background — full screen, title screen backdrop
  // ═══════════════════════════════════════════════════════
  //  LEVEL PROPS (environment decorations, placed as sprites)
  //  All currently drawn via graphics API — replace with sprites.
  // ═══════════════════════════════════════════════════════

  prop_street_lamp: {
    placeholder: { shape: 'rect', color: 0x334155, w: 16, h: 80 },
    tool: 'Code', // dark pole, amber glow at top — drawn via graphics()
  },
  prop_server_rack: {
    placeholder: { shape: 'rect', color: 0x0f2744, w: 32, h: 72 },
    tool: 'Code', // dark cabinet, LED dot rows, cyan ports — drawn via graphics()
  },
  prop_holographic_screen: {
    placeholder: { shape: 'rect', color: 0x0c3050, w: 72, h: 48 },
    tool: 'Code', // monitor frame, cyan hologram display — drawn via graphics()
  },
  prop_lab_bench: {
    placeholder: { shape: 'rect', color: 0x0d2b12, w: 80, h: 28 },
    tool: 'Code', // dark bench surface, glowing sample jars — drawn via graphics()
  },
  prop_dna_helix: {
    placeholder: { shape: 'rect', color: 0x14532d, w: 24, h: 80 },
    tool: 'Code', // green/teal intertwining helix dots — drawn via graphics()
  },
  prop_train_track: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 128, h: 16 },
    tool: 'Code', // parallel rails, purple energy glow between — drawn via graphics()
  },
  prop_departure_board: {
    placeholder: { shape: 'rect', color: 0x0c0c2e, w: 80, h: 48 },
    tool: 'Code', // dark panel, amber dot-matrix text rows, clock — drawn via graphics()
  },
  prop_cargo_container: {
    placeholder: { shape: 'rect', color: 0x1a1a3e, w: 56, h: 48 },
    tool: 'Code', // dark metallic box, rivets, colored stripe band — drawn via graphics()
  },
  prop_porthole: {
    placeholder: { shape: 'rect', color: 0x0a0a2e, w: 48, h: 48 },
    tool: 'Code', // circular ring frame, Earth + space inside — drawn via graphics()
  },
  prop_comm_tower: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 24, h: 120 },
    tool: 'Code', // lattice tower, dish, amber apex light — drawn via graphics()
  },
  prop_hologram_projector: {
    placeholder: { shape: 'rect', color: 0x0c2040, w: 20, h: 32 },
    tool: 'Code', // base unit, cyan beam triangle — drawn via graphics()
  },
  prop_noticeboard: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 64, h: 56 },
    tool: 'Code', // cork board, wooden frame, sticky notes — drawn via graphics()
  },

  // ═══════════════════════════════════════════════════════
  //  EFFECTS
  // ═══════════════════════════════════════════════════════

  fx_sparkle: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 16, h: 16 },
    tool: 'Code', // Phaser particle emitter — amber/gold burst on puzzle complete
  },
  fx_portal_glow: {
    placeholder: { shape: 'rect', color: 0x818cf8, w: 48, h: 64 },
    tool: 'Code', // hologram glow — indigo alpha pulse tween on portal graphics object
  },

  // ═══════════════════════════════════════════════════════
  //  MINIGAME ASSETS
  // ═══════════════════════════════════════════════════════

  // ShatteredPad (L1) — tiles handled procedurally via graphics, no sprite needed

  // GuestList (L2) — avatars handled procedurally, no sprite needed

  // BiologicalClearance (L3) — DNA blocks
  dna_block_A: {
    placeholder: { shape: 'rect', color: 0x22c55e, w: 32, h: 32 },
    tool: 'Code', // hologram tile — green fill + letter A drawn with graphics/text
  },
  dna_block_T: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 32 },
    tool: 'Code', // hologram tile — red fill + letter T drawn with graphics/text
  },
  dna_block_C: {
    placeholder: { shape: 'rect', color: 0x38bdf8, w: 32, h: 32 },
    tool: 'Code', // hologram tile — cyan fill + letter C
  },
  dna_block_G: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 32, h: 32 },
    tool: 'Code', // hologram tile — amber fill + letter G
  },

  // HyperTrain (L4) — subway station nodes
  station_node: {
    placeholder: { shape: 'circle', color: 0x38bdf8, w: 24, h: 24 },
    tool: 'Code', // hologram — cyan glowing circle drawn with graphics()
  },

  // CargoGrid (L6) — battery pickup
  battery_icon: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 24, h: 24 },
    tool: 'Code', // hologram — amber rectangle with charge bar drawn with graphics()
  },

  // ═══════════════════════════════════════════════════════
  //  WORLD OBJECTS
  // ═══════════════════════════════════════════════════════

  portal: {
    placeholder: { shape: 'rect', color: 0x818cf8, w: 36, h: 56 },
    tool: 'Code', // hologram portal — purple energy column drawn with graphics()
  },
  interactable: {
    placeholder: { shape: 'rect', color: 0x38bdf8, w: 28, h: 28 },
    tool: 'Code', // hologram orb — cyan pulsing circle drawn with graphics()
  },
  platform: {
    placeholder: { shape: 'rect', color: 0x334155, w: 64, h: 16 },
    tool: 'Code', // dark slate surface, cyan LED strip underneath — drawn via graphics()
  },
};
