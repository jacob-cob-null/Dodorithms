/**
 * ASSET MANIFEST — Single source of truth for all game assets.
 *
 * Each entry:
 *   key          → used in Phaser (this.add.image / this.add.sprite / texture key)
 *   placeholder  → procedurally generated in BootScene until real art arrives
 *   size         → target resolution for Imagen 3 generation
 *   prompt       → ready-to-paste Imagen 3 prompt
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
    tool: 'Stability Matrix (azilbpixelmix + pixelbuildings LoRA)',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, transparent background, friendly young woman, short hair, futuristic casual outfit orange tones, full body facing forward, standing idle, retro game sprite, pixelated, no smoothing',
  },
  npc_trizy: {
    placeholder: { shape: 'rect', color: 0x06b6d4, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, transparent background, young woman cyber-analyst, techwear cyan accent, full body facing forward, standing idle, retro game sprite, pixelated, no smoothing',
  },
  npc_jacob: {
    placeholder: { shape: 'rect', color: 0x22c55e, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, transparent background, young man engineer, green work shirt with gears, full body facing forward, standing idle, retro game sprite, pixelated, no smoothing',
  },
  npc_kyla: {
    placeholder: { shape: 'rect', color: 0xa855f7, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, transparent background, young woman urban explorer, purple streetwear, neon city vibe, full body facing forward, standing idle, retro game sprite, pixelated, no smoothing',
  },
  npc_professor: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 32, h: 48 },
    size: '64x96',
    tool: 'Stability Matrix',
    prompt: '2D pixel art game sprite, 16-bit style, visible square pixels, transparent background, holographic professor figure, golden glow outline, lab coat, full body facing forward, standing idle, retro game sprite, pixelated, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  NPC DIALOGUE PORTRAITS
  // ═══════════════════════════════════════════════════════

  portrait_laurenze: {
    placeholder: { shape: 'rect', color: 0xf59e0b, w: 52, h: 72 },
    size: '104x144',
    tool: 'Imagen 3',
    prompt: '2D pixel art character portrait, 16-bit style, visible square pixels, transparent background, friendly young woman, short hair, futuristic casual outfit warm orange tones, smiling expression, bust shot facing slightly right, retro game sprite, pixelated, no smoothing',
  },
  portrait_trizy: {
    placeholder: { shape: 'rect', color: 0x06b6d4, w: 52, h: 72 },
    size: '104x144',
    tool: 'Imagen 3',
    prompt: '2D pixel art character portrait, 16-bit style, visible square pixels, transparent background, young woman cyber-analyst, techwear outfit cyan accent colors, confident expression, short dark hair with cyan streak, bust shot facing slightly right, retro game sprite, pixelated, no smoothing',
  },
  portrait_jacob: {
    placeholder: { shape: 'rect', color: 0x22c55e, w: 52, h: 72 },
    size: '104x144',
    tool: 'Imagen 3',
    prompt: '2D pixel art character portrait, 16-bit style, visible square pixels, transparent background, young man engineer, casual green work shirt, surrounded by gears, friendly analytical expression, bust shot facing slightly right, retro game sprite, pixelated, no smoothing',
  },
  portrait_kyla: {
    placeholder: { shape: 'rect', color: 0xa855f7, w: 52, h: 72 },
    size: '104x144',
    tool: 'Imagen 3',
    prompt: '2D pixel art character portrait, 16-bit style, visible square pixels, transparent background, young woman urban explorer, purple-accent streetwear, energetic fast-talking expression, neon city lights reflected, bust shot facing slightly right, retro game sprite, pixelated, no smoothing',
  },
  portrait_professor: {
    placeholder: { shape: 'rect', color: 0xfbbf24, w: 52, h: 72 },
    size: '104x144',
    tool: 'Imagen 3',
    prompt: '2D pixel art character portrait, 16-bit style, visible square pixels, transparent background, older male professor, holographic projection appearance, golden glow outline, wise enthusiastic expression, lab coat, bust shot facing slightly right, retro game sprite, pixelated, no smoothing',
  },

  // ═══════════════════════════════════════════════════════
  //  BACKGROUNDS (tiling or full scene)
  // ═══════════════════════════════════════════════════════

  bg_level1: {
    placeholder: { shape: 'rect', color: 0x0d1117, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix (azilbpixelmix + pixelbuildings LoRA)',
    prompt: '<lora:pixelbuildings128-v2:1> 2D pixel art side-scrolling game background, 16-bit style, futuristic Earth plaza 2070s, crash-landed alien spaceship on left, damaged landing pad, neon-lit city skyline at night, stars visible, dark blue-black sky, retro game background, pixelated, no smoothing',
  },
  bg_level2: {
    placeholder: { shape: 'rect', color: 0x0a1628, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> 2D pixel art side-scrolling game background, 16-bit style, high-tech data center interior 2070s, glowing server racks, holographic displays, blue-teal lighting, futuristic command center aesthetic, retro game background, pixelated, no smoothing',
  },
  bg_level3: {
    placeholder: { shape: 'rect', color: 0x111a10, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> 2D pixel art side-scrolling game background, 16-bit style, retro industrial factory interior 2070s, analog machinery, gears and conveyor belts, warm dim lighting, steam vents, paper stacks, retro game background, pixelated, no smoothing',
  },
  bg_level4: {
    placeholder: { shape: 'rect', color: 0x0d0d1a, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> 2D pixel art side-scrolling game background, 16-bit style, neon-lit urban slums 2070s, crowded lower city, glowing signs in multiple colors, dark alleyways, futuristic street market, blackout lighting, retro game background, pixelated, no smoothing',
  },
  bg_level5: {
    placeholder: { shape: 'rect', color: 0x0a0a1f, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> 2D pixel art side-scrolling game background, 16-bit style, grand server library 2070s, massive glowing data towers, holographic bookshelves of data, deep blue lighting, central data hub aesthetic, retro game background, pixelated, no smoothing',
  },
  bg_level6: {
    placeholder: { shape: 'rect', color: 0x0d1a0d, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> 2D pixel art side-scrolling game background, 16-bit style, bustling futuristic spaceport 2070s, ships taking off, cargo bays, launch pads, orange-green lighting, busy mechanical atmosphere, retro game background, pixelated, no smoothing',
  },
  bg_level7: {
    placeholder: { shape: 'rect', color: 0x0d0d1f, w: 800, h: 600 },
    size: '800x600',
    tool: 'Stability Matrix',
    prompt: '<lora:pixelbuildings128-v2:1> 2D pixel art side-scrolling game background, 16-bit style, network grid command booth 2070s, communication towers, glowing network nodes, dark sky with signal beams, launchpad visible in background, retro game background, pixelated, no smoothing',
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
