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
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, facing forward, idle neutral stance, retro game sprite, pixelated, no smoothing',
  },
  dodo_happy: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, facing forward, big pixel smile, eyes curved upward, one arm raised in excitement, retro game sprite, pixelated, no smoothing',
  },
  dodo_confused: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, facing forward, one eyebrow raised, head tilted, hand on chin thinking pose, retro game sprite, pixelated, no smoothing',
  },
  dodo_surprised: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, facing forward, mouth open wide, eyes very large, leaning back slightly, retro game sprite, pixelated, no smoothing',
  },
  dodo_celebrate: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, both arms raised in victory, big grin, facing forward, retro game sprite, pixelated, no smoothing',
  },
  dodo_interact: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, leaning forward, one arm reaching out toward an object, curious expression, facing forward, retro game sprite, pixelated, no smoothing',
  },

  // Walk frames — use NanoBanana Pro (Imagen 3) with dodo reference image as img2img
  dodo_walk_r1: {
    placeholder: { shape: 'rect', color: 0xdc2626, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, side profile facing RIGHT, RIGHT leg planted on ground bearing weight, LEFT leg raised and kicked forward in front of body, clear stride gap between legs, retro game sprite, pixelated, no smoothing',
  },
  dodo_walk_r2: {
    placeholder: { shape: 'rect', color: 0xdc2626, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, side profile facing RIGHT, LEFT leg planted on ground bearing weight, RIGHT leg raised and kicked forward in front of body, clear stride gap between legs, opposite of walk_r1, retro game sprite, pixelated, no smoothing',
  },
  dodo_walk_l1: {
    placeholder: { shape: 'rect', color: 0xdc2626, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, side profile facing LEFT, LEFT leg planted on ground bearing weight, RIGHT leg raised and kicked forward in front of body, clear stride gap between legs, retro game sprite, pixelated, no smoothing',
  },
  dodo_walk_l2: {
    placeholder: { shape: 'rect', color: 0xdc2626, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, side profile facing LEFT, RIGHT leg planted on ground bearing weight, LEFT leg raised and kicked forward in front of body, clear stride gap between legs, opposite of walk_l1, retro game sprite, pixelated, no smoothing',
  },
  dodo_idle_bounce1: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, facing forward, slightly crouched downward, idle bounce frame 1, retro game sprite, pixelated, no smoothing',
  },
  dodo_idle_bounce2: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 48 },
    size: '64x96',
    tool: 'Imagen 3 (img2img from dodo reference)',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, hard edges, no anti-aliasing, no gradients, transparent background, chibi red dragon with yellow striped belly, pink bat wings with purple trim, yellow crown horn, rosy cheeks, small white fangs, holding a smartphone, facing forward, slightly stretched upward, idle bounce frame 2, retro game sprite, pixelated, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  NPC WORLD SPRITES
  // ═══════════════════════════════════════════════════════

  npc_laurenze: {
    placeholder: { shape: 'rect', color: 0xf59e0b, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art game sprite, 16-bit style, visible square pixels, transparent background, friendly adult male researcher, dark jacket with amber-orange glowing badge and trim, short dark hair, kind expression, full body facing forward, standing idle, retro game sprite, crisp pixel edges, no smoothing',
  },
  npc_trizy: {
    placeholder: { shape: 'rect', color: 0x06b6d4, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art game sprite, 16-bit style, visible square pixels, transparent background, friendly adult female technician, dark uniform with cyan-glowing collar and teal trim, neat hair, bright expression, full body facing forward, standing idle, retro game sprite, crisp pixel edges, no smoothing',
  },
  npc_jacob: {
    placeholder: { shape: 'rect', color: 0x22c55e, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art game sprite, 16-bit style, visible square pixels, transparent background, friendly young adult male biologist, dark lab coat with green glowing trim, glasses, messy hair, warm smile, full body facing forward, standing idle, retro game sprite, crisp pixel edges, no smoothing',
  },
  npc_kyla: {
    placeholder: { shape: 'rect', color: 0xa855f7, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art game sprite, 16-bit style, visible square pixels, transparent background, friendly young adult female engineer, dark jacket with lavender neon trim and purple badge, ponytail, energetic expression, full body facing forward, standing idle, retro game sprite, crisp pixel edges, no smoothing',
  },
  npc_professor: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art game sprite, 16-bit style, visible square pixels, transparent background, friendly older male professor, dark cardigan with warm yellow glowing trim and lapel pin, white hair, round glasses, wise smile, full body facing forward, standing idle, retro game sprite, crisp pixel edges, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  NPC DIALOGUE PORTRAITS
  // ═══════════════════════════════════════════════════════

  portrait_laurenze: {
    placeholder: { shape: 'rect', color: 0xf59e0b, w: 52, h: 72 },
    size: '104x144',
    tool: 'Stability Matrix',
    prompt: 'pixel art character portrait, 16-bit style, visible square pixels, friendly adult male researcher, amber and orange jacket with glowing orange badge, short dark hair, kind confident expression, slight right-facing angle, bust shot, dark background with subtle amber glow, retro game sprite, crisp pixel edges, no smoothing',
  },
  portrait_trizy: {
    placeholder: { shape: 'rect', color: 0x06b6d4, w: 52, h: 72 },
    size: '104x144',
    tool: 'Stability Matrix',
    prompt: 'pixel art character portrait, 16-bit style, visible square pixels, friendly adult female technician, dark uniform with cyan-glowing collar and teal badge, neat hair, bright enthusiastic expression, slight right-facing angle, bust shot, dark background with subtle cyan glow, retro game sprite, crisp pixel edges, no smoothing',
  },
  portrait_jacob: {
    placeholder: { shape: 'rect', color: 0x22c55e, w: 52, h: 72 },
    size: '104x144',
    tool: 'Stability Matrix',
    prompt: 'pixel art character portrait, 16-bit style, visible square pixels, friendly young adult male biologist, dark lab coat with green glowing trim, glasses, messy hair, curious warm smile, slight right-facing angle, bust shot, dark background with subtle green glow, retro game sprite, crisp pixel edges, no smoothing',
  },
  portrait_kyla: {
    placeholder: { shape: 'rect', color: 0xa855f7, w: 52, h: 72 },
    size: '104x144',
    tool: 'Stability Matrix',
    prompt: 'pixel art character portrait, 16-bit style, visible square pixels, friendly young adult female engineer, dark jacket with lavender neon trim and purple badge, ponytail, energetic cheerful expression, slight right-facing angle, bust shot, dark background with subtle lavender glow, retro game sprite, crisp pixel edges, no smoothing',
  },
  portrait_professor: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 52, h: 72 },
    size: '104x144',
    tool: 'Stability Matrix',
    prompt: 'pixel art character portrait, 16-bit style, visible square pixels, friendly older male professor, dark cardigan with warm yellow trim and glowing yellow lapel pin, white hair, round glasses, wise enthusiastic smile, slight right-facing angle, bust shot, dark background with subtle warm yellow glow, retro game sprite, crisp pixel edges, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  BACKGROUNDS (tiling or full scene)
  // ═══════════════════════════════════════════════════════

  bg_level1: {
    placeholder: { shape: 'rect', color: 0x060d17, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix (azilbpixelmix + pixelbuildings LoRA)',
    // Mood: Surprised delight in a neon-lit city at night. Charming crash, curious citizens.
    prompt: '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, futuristic city plaza at night 2070s, deep blue-black sky with visible stars, small alien spacecraft crash-landed in a public fountain, warm amber steam and exhaust glow, neon-lit city skyline with amber and orange shop signs, rounded futuristic buildings with glowing windows and rooftop gardens, curious silhouetted citizens on balconies, amber streetlamps reflecting on wet plaza tiles, charming adventurous atmosphere, deep navy and amber neon color palette, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level2: {
    placeholder: { shape: 'rect', color: 0x0a1628, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Busy operations hub at night — serious but alive, warm amber against cool cyan.
    prompt: '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, atmospheric high-tech data center interior at night 2070s, dark ceiling with glowing cyan strip lights, tall walls of pulsing blue-teal server racks and monitor banks, floating holographic world maps and search algorithm displays, tidy workstations with personal touches, small cactus with grow-light, warm amber desk lamps contrasting cool cyan ambient, cozy details in a technical space, deep dark blue and cyan neon palette with amber warmth, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level3: {
    placeholder: { shape: 'rect', color: 0x061a0a, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Dark lab made magical by bioluminescent samples — fairy lights in jars.
    prompt: '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, atmospheric bioluminescent biology lab interior 2070s, dimmed overhead lights, benches covered in glowing green and teal sealed sample jars, bioluminescent plant specimens in glass chambers like magical lanterns, large glowing DNA double helix centerpiece, greenhouse windows with warm amber grow-light behind lush plants, whiteboard with colorful sorting diagrams, dark atmospheric lab with magical green glow, deep dark green and teal neon palette with warm amber grow-light accents, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level4: {
    placeholder: { shape: 'rect', color: 0x0d0a1f, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: The excitement of departure. Grand underground terminal, every platform lit like a stage.
    prompt: '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, grand futuristic underground train terminal at night 2070s, high arched dark ceiling, lavender and purple neon platform edge strips like runway guides, sleek bullet trains with warm amber glowing interiors, scrolling departure boards casting blue-white light, massive illuminated node-and-line route map on far wall, silhouetted travelers with hover luggage, electric midnight transit atmosphere, deep indigo and lavender neon palette with amber train window warmth, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level5: {
    placeholder: { shape: 'rect', color: 0x050b18, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Deep space above, warm festival below — the contrast makes both feel stronger.
    prompt: '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, vast futuristic galactic census fair platform in deep space 2070s, infinite dark starfield above with crescent planet arc and teal and pink aurora ribbons, colorful neon-lit census kiosks below like a space fair, amber cyan purple green yellow booth canopy lights, warm string lights strung between booths, giant glowing orbital ring in far background, dramatic contrast of vast dark space above and warm festival glow below, deep space blue and multicolor neon festival palette, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level6: {
    placeholder: { shape: 'rect', color: 0x100518, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Cozy in the void. Warm amber inside, infinite black outside the portholes.
    prompt: '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, cozy lived-in orbital space station interior 2070s, dark curved hull walls with warm amber mounted lighting, large circular porthole windows showing glowing blue-green Earth in black space, zero-g plant holders with trailing green plants, community noticeboard covered in colorful sticky notes, neatly labeled cargo crates, friendly mechanical robot arm sorting packages, warm amber interior contrasting with deep space black through portholes, homey personal atmosphere, amber and warm white interior palette with blue-green Earth glow accents, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level7: {
    placeholder: { shape: 'rect', color: 0x081020, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: The beauty of a system at night — cables arc across dark sky like constellations.
    prompt: '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, futuristic network operations campus at night 2070s, deep blue-purple night sky, tall communication towers with glowing amber and lavender fiber cables arcing between them in spanning tree patterns, transparent hub building with illuminated node-and-edge graph glowing inside, tidy lit campus pathways, small maintenance vehicle with rotating amber hazard light, beautiful geometric cable patterns against dark sky, deep indigo sky with amber and lavender cable glow palette, retro platformer background, crisp pixel edges, no smoothing',
  },
  bg_level8: {
    placeholder: { shape: 'rect', color: 0x0a0a1a, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    // Mood: Dark and grand but earned — graduation in a space cathedral, not a final boss.
    prompt: '<lora:pixelbuildings128-v2:1> pixel art side-scrolling game background, 16-bit SNES style, grand dark ceremonial academy hall 2070s, tall dark stone columns with warm amber uplighting creating dramatic light shafts, five glowing neon banners in amber cyan green purple yellow with algorithm symbols, polished dark floor reflecting colored banner light, massive glowing archway at far end with stars and a gold-lit repaired spacecraft visible beyond, five illuminated podiums in guide colors, dark and grand but warm and triumphant atmosphere, deep charcoal and amber uplighting palette with multicolor neon banner accents, retro platformer background, crisp pixel edges, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  PLAYER SPRITE
  // ═══════════════════════════════════════════════════════

  // Note: Dodo emotion sprites (dodo_idle, dodo_happy, etc.) are defined at top.
  // The "player" key used by physics/movement is a separate world sprite.

  player: {
    placeholder: { shape: 'rect', color: 0x4ade80, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    // Use dodo_idle as img2img reference. This is the in-world movement sprite.
    prompt: 'pixel art game sprite, 16-bit style, visible square pixels, transparent background, small friendly chibi red dragon, warm orange-gold scales, large expressive eyes, small rounded horns, tiny folded wings, compact body, standing neutral pose facing right, full body, retro platformer sprite, crisp pixel edges, no smoothing',
  },
  player_jump: {
    placeholder: { shape: 'rect', color: 0x86efac, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art game sprite, 16-bit style, visible square pixels, transparent background, small friendly chibi red dragon, warm orange-gold scales, large expressive eyes, small rounded horns, tiny wings spread outward, compact body, airborne jump pose legs tucked, facing right, full body, retro platformer sprite, crisp pixel edges, no smoothing',
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
    size: '1600x600',
    tool: 'Stability Matrix',
    prompt: 'pixel art seamless starfield background layer, 16-bit style, deep space, scattered white and soft blue star dots of varying sizes, some larger brighter stars, dark near-black sky, subtle variation in star density, no foreground elements, retro game sky layer, crisp pixel edges, no smoothing, tileable horizontally',
  },

  // City far layer — distant dark silhouette skyline, levels 1–4, scrollFactor 0.20
  parallax_city_far: {
    placeholder: { shape: 'rect', color: 0x060e1c, w: 800, h: 600 },
    size: '1600x600',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> pixel art parallax background layer, 16-bit SNES style, very distant futuristic city silhouette at night, very dark navy building shapes against dark blue-black sky, tiny lit windows as single pixel dots, antenna spires with red blinking tips, no detail — pure dark silhouette with minimal window glow, retro game far background layer, crisp pixel edges, no smoothing',
  },

  // City near layer — closer buildings with neon, levels 1–4, scrollFactor 0.45
  parallax_city_near: {
    placeholder: { shape: 'rect', color: 0x081428, w: 800, h: 600 },
    size: '1600x600',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> pixel art parallax background layer, 16-bit SNES style, near futuristic city buildings at night, dark blue buildings with cyan and amber neon outlines and roof strips, varied building heights, lit windows in warm yellow and cool blue, neon signs as colored horizontal bars, holographic billboard panels, atmospheric depth, retro game mid background layer, crisp pixel edges, no smoothing',
  },

  // Space nebula layer — deep space backdrop, levels 5–8, scrollFactor 0.02
  parallax_space_nebula: {
    placeholder: { shape: 'rect', color: 0x040a18, w: 800, h: 600 },
    size: '1600x600',
    tool: 'Stability Matrix',
    prompt: 'pixel art parallax background layer, 16-bit SNES style, deep space nebula, faint purple and teal cloud wisps at very low opacity, scattered star field, one distant planet silhouette visible, crescent planet arc at upper edge, aurora ribbon of cyan and pink crossing diagonally, dark blue-black base, retro game space background layer, crisp pixel edges, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  PLATFORM TILES (per level theme, 128×32px base tile)
  //  Scaled in-engine to fit each platform's scaleX/scaleY.
  // ═══════════════════════════════════════════════════════

  platform_city: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 64, h: 16 },
    size: '128x32',
    tool: 'Stability Matrix',
    prompt: 'pixel art platform tile, 16-bit SNES style, futuristic city street segment, dark concrete surface with amber neon edge strip, worn surface detail, tileable horizontally, retro platformer tile, crisp pixel edges, no smoothing, transparent background',
  },
  platform_tech: {
    placeholder: { shape: 'rect', color: 0x0f2744, w: 64, h: 16 },
    size: '128x32',
    tool: 'Stability Matrix',
    prompt: 'pixel art platform tile, 16-bit SNES style, high-tech metal grating walkway, dark steel with cyan edge lighting strip, small bolt details, hexagonal mesh pattern, tileable horizontally, retro platformer tile, crisp pixel edges, no smoothing, transparent background',
  },
  platform_lab: {
    placeholder: { shape: 'rect', color: 0x0d2b12, w: 64, h: 16 },
    size: '128x32',
    tool: 'Stability Matrix',
    prompt: 'pixel art platform tile, 16-bit SNES style, laboratory bench surface, dark grey-green material, green neon edge trim, subtle grid lines, clean lab surface, tileable horizontally, retro platformer tile, crisp pixel edges, no smoothing, transparent background',
  },
  platform_train: {
    placeholder: { shape: 'rect', color: 0x120b2e, w: 64, h: 16 },
    size: '128x32',
    tool: 'Stability Matrix',
    prompt: 'pixel art platform tile, 16-bit SNES style, train station platform edge, dark surface with lavender purple neon safety strip and warning line, tactile paving bumps, tileable horizontally, retro platformer tile, crisp pixel edges, no smoothing, transparent background',
  },
  platform_space: {
    placeholder: { shape: 'rect', color: 0x1a0a2e, w: 64, h: 16 },
    size: '128x32',
    tool: 'Stability Matrix',
    prompt: 'pixel art platform tile, 16-bit SNES style, space station hull panel walkway, dark charcoal surface, amber warning strip on edge, panel lines and rivets, tileable horizontally, retro platformer tile, crisp pixel edges, no smoothing, transparent background',
  },

  // ═══════════════════════════════════════════════════════
  //  UI PANELS & ELEMENTS
  // ═══════════════════════════════════════════════════════

  // Nine-slice dialogue box — 760×144px, rendered behind speaker portrait + text
  ui_dialogue_panel: {
    placeholder: { shape: 'rect', color: 0x0f172a, w: 760, h: 144 },
    size: '228x144',   // 3×1 grid: left cap 76px, center 76px, right cap 76px
    tool: 'Stability Matrix',
    // Generate as 3-slice (left | center | right). Center is horizontally stretchable.
    prompt: 'pixel art UI dialogue box panel, 16-bit SNES style, dark navy background with thin cyan border, subtle inner shadow, slightly rounded corners, no text or icons inside, clean RPG-style dialogue window, retro game UI element, crisp pixel edges, no smoothing, transparent outside border',
  },

  // Archive / overlay panel background — nine-slice, 520×380px rendered size
  ui_archive_panel: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 520, h: 380 },
    size: '192x192',   // 3×3 nine-slice grid, 64px per cell
    tool: 'Stability Matrix',
    prompt: 'pixel art UI inventory panel, 16-bit SNES style, 3x3 nine-slice tileable panel, dark slate interior, cyan glowing border, subtle circuit pattern in corners, clean futuristic inventory window, retro game UI element, crisp pixel edges, no smoothing, transparent outside',
  },

  // Press E interaction prompt — floats above interactables
  ui_key_e: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 28, h: 20 },
    size: '56x40',
    tool: 'Imagen 3',
    prompt: 'pixel art UI keyboard key icon, 16-bit style, visible square pixels, transparent background, small golden keyboard key showing letter E, glowing amber outline, press prompt button icon, retro game UI element, crisp pixel edges, no smoothing',
  },

  // Algorithm unlocked notification card — slides in from top
  ui_unlock_card: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 420, h: 80 },
    size: '420x80',
    tool: 'Stability Matrix',
    prompt: 'pixel art UI notification banner, 16-bit SNES style, wide horizontal card, dark slate background with thin cyan border and subtle glow, star icon on left side, space for text on right, futuristic achievement unlock banner, retro game UI element, crisp pixel edges, no smoothing',
  },

  // Generic button — used for swap/keep/skip/continue across minigames
  ui_button: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 120, h: 40 },
    size: '120x40',
    tool: 'Stability Matrix',
    // Generate two states in one sheet: top half = normal, bottom half = pressed/hover
    prompt: 'pixel art UI button sprite sheet, 16-bit SNES style, two button states stacked vertically, top: dark slate button with cyan border normal state, bottom: slightly lighter slate with bright cyan border hover state, retro game button element, crisp pixel edges, no smoothing, transparent background',
  },

  // Minigame tile — generic interactive tile used in sort/search minigames
  ui_minigame_tile: {
    placeholder: { shape: 'rect', color: 0x1e4d7a, w: 64, h: 56 },
    size: '64x56',
    tool: 'Stability Matrix',
    // States: normal (dark blue), active (gold border), sorted (green), wrong (red)
    // Generate as 4-tile horizontal sprite sheet: normal | active | sorted | wrong
    prompt: 'pixel art UI tile sprite sheet, 16-bit SNES style, four tile states in a horizontal row, each 64x56px: 1. dark blue tile with subtle border (normal), 2. dark blue tile with gold glowing border (active/selected), 3. dark green tile with green border (sorted/correct), 4. dark red tile with red border (wrong/error), retro game UI tile, crisp pixel edges, no smoothing, transparent background',
  },

  // DP/grid cell — used in CargoGrid, ChangeMaking, QueenGrid
  ui_grid_cell: {
    placeholder: { shape: 'rect', color: 0x0f172a, w: 48, h: 48 },
    size: '48x48',
    tool: 'Stability Matrix',
    // States: 3-tile sheet — empty | filled | active
    prompt: 'pixel art UI grid cell sprite sheet, 16-bit SNES style, three cell states in a horizontal row, each 48x48px: 1. dark near-black cell with thin gray border (empty), 2. dark green cell with green border (filled/correct), 3. dark purple cell with purple border (active/current), retro game grid cell, crisp pixel edges, no smoothing, transparent background',
  },

  // Main menu background — full screen, title screen backdrop
  bg_menu: {
    placeholder: { shape: 'rect', color: 0x0d1117, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> pixel art main menu background, 16-bit SNES style, futuristic Earth city at night seen from elevated viewpoint, deep blue-black sky with stars, city lights stretching into distance, neon signs and amber streetlamps, one large glowing portal or archway in center background suggesting space travel, warm and adventurous atmosphere, dark navy and amber neon color palette, retro game title screen background, crisp pixel edges, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  LEVEL PROPS (environment decorations, placed as sprites)
  //  All currently drawn via graphics API — replace with sprites.
  // ═══════════════════════════════════════════════════════

  prop_street_lamp: {
    placeholder: { shape: 'rect', color: 0x334155, w: 16, h: 80 },
    size: '32x160',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, futuristic street lamp, dark metal pole with crossbar, warm amber glowing light at top, soft glow halo, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_server_rack: {
    placeholder: { shape: 'rect', color: 0x0f2744, w: 32, h: 72 },
    size: '64x144',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, futuristic server rack unit, dark metal cabinet, rows of drive bays with green and amber status LEDs, cyan cable port strips, glowing rack unit, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_holographic_screen: {
    placeholder: { shape: 'rect', color: 0x0c3050, w: 72, h: 48 },
    size: '144x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, floating holographic display screen, dark frame with glowing cyan projection showing data chart lines, subtle scan line effect, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_lab_bench: {
    placeholder: { shape: 'rect', color: 0x0d2b12, w: 80, h: 28 },
    size: '160x56',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, futuristic laboratory bench, dark surface with three small glowing green sample jars on top, clean lab equipment, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_dna_helix: {
    placeholder: { shape: 'rect', color: 0x14532d, w: 24, h: 80 },
    size: '48x160',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, decorative DNA double helix column, two intertwining strands in green and teal pixel dots, glowing softly, tall vertical prop, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_train_track: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 128, h: 16 },
    size: '256x32',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, futuristic magnetic train track segment, two parallel dark rails with purple energy glow line between them, cross-tie sleepers, tileable horizontally, transparent background, retro game prop tile, crisp pixel edges, no smoothing',
  },
  prop_departure_board: {
    placeholder: { shape: 'rect', color: 0x0c0c2e, w: 80, h: 48 },
    size: '160x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, futuristic train departure board, dark panel with scrolling destination lines in amber dot-matrix text, clock display in corner, mounted on a short pole, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_cargo_container: {
    placeholder: { shape: 'rect', color: 0x1a1a3e, w: 56, h: 48 },
    size: '112x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, space station cargo container, dark metal box with rivets, colored stripe label band, glowing inventory tag on side, stacked storage crate, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_porthole: {
    placeholder: { shape: 'rect', color: 0x0a0a2e, w: 48, h: 48 },
    size: '96x96',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, circular space station porthole window, dark metal ring frame with bolts, interior shows glowing blue-green Earth in black space, warm amber light reflection on frame edge, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_comm_tower: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 24, h: 120 },
    size: '48x240',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, futuristic communication tower, dark lattice structure, satellite dish on upper section, amber warning light at apex, glowing fiber cable connections at base, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_hologram_projector: {
    placeholder: { shape: 'rect', color: 0x0c2040, w: 20, h: 32 },
    size: '40x64',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, small futuristic hologram projector device, dark base unit with cyan beam projecting upward as a triangle of light, tech gadget prop, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },
  prop_noticeboard: {
    placeholder: { shape: 'rect', color: 0x1e293b, w: 64, h: 56 },
    size: '128x112',
    tool: 'Stability Matrix',
    prompt: 'pixel art environment prop, 16-bit style, wall-mounted space station notice board, dark frame with colorful sticky notes pinned on surface, yellow pink and blue note squares, one paper has a small drawing, homey lived-in detail, transparent background, retro game prop sprite, crisp pixel edges, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  EFFECTS
  // ═══════════════════════════════════════════════════════

  fx_sparkle: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 16, h: 16 },
    size: '128x16',
    tool: 'Imagen 3',
    // 8-frame horizontal sprite sheet, 16×16 each — sparkle burst animation
    prompt: '2D pixel art sprite sheet, 16-bit style, 8 frames horizontal, each frame 16x16px, sparkle burst animation sequence from small to large to fade, gold and white star sparkle, transparent background, retro game effect sprite, crisp pixel edges, no smoothing',
  },
  fx_portal_glow: {
    placeholder: { shape: 'rect', color: 0x818cf8, w: 48, h: 64 },
    size: '96x128',
    tool: 'Imagen 3',
    prompt: '2D pixel art sprite, 16-bit style, visible square pixels, transparent background, glowing portal energy overlay, indigo and violet light rays emanating upward, soft pulsing aura effect, layered over portal pillar, retro game effect sprite, crisp pixel edges, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  MINIGAME ASSETS
  // ═══════════════════════════════════════════════════════

  // ShatteredPad (L1) — tiles handled procedurally via graphics, no sprite needed

  // GuestList (L2) — avatars handled procedurally, no sprite needed

  // BiologicalClearance (L3) — DNA blocks
  dna_block_A: {
    placeholder: { shape: 'rect', color: 0x22c55e, w: 32, h: 32 },
    size: '32x32',
    tool: 'Imagen 3',
    prompt: '2D pixel art 32x32 icon, 16-bit style, visible square pixels, transparent background, green DNA letter block "A", retro game tile, pixelated, no smoothing',
  },
  dna_block_T: {
    placeholder: { shape: 'rect', color: 0xef4444, w: 32, h: 32 },
    size: '32x32',
    tool: 'Imagen 3',
    prompt: '2D pixel art 32x32 icon, 16-bit style, visible square pixels, transparent background, red DNA letter block "T", retro game tile, pixelated, no smoothing',
  },
  dna_block_C: {
    placeholder: { shape: 'rect', color: 0x38bdf8, w: 32, h: 32 },
    size: '32x32',
    tool: 'Imagen 3',
    prompt: '2D pixel art 32x32 icon, 16-bit style, visible square pixels, transparent background, blue DNA letter block "C", retro game tile, pixelated, no smoothing',
  },
  dna_block_G: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 32, h: 32 },
    size: '32x32',
    tool: 'Imagen 3',
    prompt: '2D pixel art 32x32 icon, 16-bit style, visible square pixels, transparent background, yellow DNA letter block "G", retro game tile, pixelated, no smoothing',
  },

  // HyperTrain (L4) — subway station nodes
  station_node: {
    placeholder: { shape: 'circle', color: 0x38bdf8, w: 24, h: 24 },
    size: '48x48',
    tool: 'Imagen 3',
    prompt: '2D pixel art 48x48 icon, 16-bit style, visible square pixels, transparent background, glowing circular subway station node, cyan neon ring, retro game UI element, pixelated, no smoothing',
  },

  // CargoGrid (L6) — battery pickup
  battery_icon: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 24, h: 24 },
    size: '48x48',
    tool: 'Imagen 3',
    prompt: '2D pixel art 48x48 icon, 16-bit style, visible square pixels, transparent background, small yellow battery icon, pixelated, no smoothing, retro game pickup item',
  },

  // ═══════════════════════════════════════════════════════
  //  WORLD OBJECTS
  // ═══════════════════════════════════════════════════════

  portal: {
    placeholder: { shape: 'rect', color: 0x818cf8, w: 36, h: 56 },
    size: '72x112',
    tool: 'Imagen 3',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, transparent background, glowing portal pillar, purple-indigo energy swirl, exit door effect, retro game sprite, pixelated, no smoothing',
  },
  interactable: {
    placeholder: { shape: 'rect', color: 0x38bdf8, w: 28, h: 28 },
    size: '56x56',
    tool: 'Imagen 3',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, transparent background, glowing cyan exclamation orb, interactive game object, retro game sprite, pixelated, no smoothing',
  },
  platform: {
    placeholder: { shape: 'rect', color: 0x334155, w: 64, h: 16 },
    size: '128x32',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> 2D pixel art platform tile, 16-bit style, visible square pixels, transparent background, futuristic metal walkway panel, dark slate with edge lighting, tileable, retro game platform, pixelated, no smoothing',
  },
};
