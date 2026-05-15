import Phaser from 'phaser';
import EventBus from './EventBus.js';
import { EVENTS } from './events.js';

const PORTRAIT_COLORS = {
  Laurenze: 0xf59e0b,
  Trizy: 0x06b6d4,
  Jacob: 0x22c55e,
  Kyla: 0xa855f7,
  'Prof. Andrew': 0xfbbf24,
  Dodo: 0xef4444,
};
const DEFAULT_COLOR = 0x64748b;

const PORTRAIT_KEYS = {
  Laurenze: [
    'portrait_laurenze_a',
    'portrait_laurenze_b',
    'portrait_laurenze_c',
  ],
  Trizy: ['portrait_trizy_a', 'portrait_trizy_b', 'portrait_trizy_c'],
  Jacob: ['portrait_jacob_a', 'portrait_jacob_b', 'portrait_jacob_c'],
  Kyla: ['portrait_kyla_a', 'portrait_kyla_b', 'portrait_kyla_c'],
  'Prof. Andrew': [
    'portrait_professor_a',
    'portrait_professor_b',
    'portrait_professor_c',
  ],
};

const PANEL = {
  x: 20,
  y: 448,
  width: 760,
  height: 144,
};
const PORTRAIT_SLOT = {
  x: 30,
  y: 398,
  width: 188,
  height: 400,
};
const PORTRAIT_BUST_CROP_HEIGHT = 0.54;
const TEXT = {
  x: 228,
  speakerY: 458,
  y: 480,
  rightPadding: 28,
};
const TEXT_WRAP_WIDTH = PANEL.x + PANEL.width - TEXT.x - TEXT.rightPadding;

export default class DialogueSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.lines = [];
    this.index = 0;
    this.onComplete = null;
    this._currentSpeaker = '';
    this._availablePortraits = [];

    // Background box — spans x:20→780, y:448→592
    this.dialogueBg = scene.add
      .rectangle(
        PANEL.x + PANEL.width / 2,
        PANEL.y + PANEL.height / 2,
        PANEL.width,
        PANEL.height,
        0x0f172a,
        0.94,
      )
      .setStrokeStyle(2, 0x334155, 1)
      .setVisible(false);

    // Coloured rect fallback
    this.portrait = scene.add
      .rectangle(
        PORTRAIT_SLOT.x + PORTRAIT_SLOT.width / 2,
        PORTRAIT_SLOT.y + PORTRAIT_SLOT.height / 2,
        PORTRAIT_SLOT.width,
        PORTRAIT_SLOT.height,
        DEFAULT_COLOR,
        1,
      )
      .setStrokeStyle(1, 0xffffff, 0.2)
      .setDepth(11)
      .setVisible(false);

    // Portrait image — fixed slot so every speaker uses the same dialogue-box footprint.
    this.portraitImg = scene.add
      .image(PORTRAIT_SLOT.x, PORTRAIT_SLOT.y, 'portrait_laurenze_a')
      .setOrigin(0, 0)
      .setFlipX(true)
      .setDisplaySize(PORTRAIT_SLOT.width, PORTRAIT_SLOT.height)
      .setDepth(11)
      .setVisible(false);

    // Speaker name
    this.speakerText = scene.add
      .text(TEXT.x, TEXT.speakerY, '', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#fbbf24',
        fontStyle: 'bold',
      })
      .setDepth(10)
      .setVisible(false);

    // Main dialogue text
    this.dialogueText = scene.add
      .text(TEXT.x, TEXT.y, '', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        color: '#e2e8f0',
        wordWrap: { width: TEXT_WRAP_WIDTH },
        lineSpacing: 4,
      })
      .setDepth(10)
      .setVisible(false);

    // "Press ENTER" hint
    this.hintText = scene.add
      .text(770, 582, 'ENTER  ▶', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#475569',
      })
      .setOrigin(1, 1)
      .setVisible(false);

    // Interaction prompt ("Press E")
    this.promptText = scene.add
      .text(16, 548, '', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#fbbf24',
      })
      .setVisible(false);

    this.enterKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );

    EventBus.on(EVENTS.SHOW_PROMPT, (payload) => {
      if (this.active || !payload) return;
      this.promptText.setText(payload.text || 'Press E');
      this.promptText.setVisible(true);
    });

    EventBus.on(EVENTS.HIDE_PROMPT, () => {
      this.promptText.setVisible(false);
    });

    EventBus.on(EVENTS.START_DIALOGUE, (payload) => {
      if (!payload?.lines?.length) return;
      this.startDialogue(
        payload.lines,
        payload.speaker || '',
        payload.onComplete || null,
      );
    });

    scene.events.on('update', this.update, this);
  }

  // Pick a random variant and render it in the shared portrait slot.
  _refreshPortrait() {
    if (!this._availablePortraits.length) {
      const color = PORTRAIT_COLORS[this._currentSpeaker] ?? DEFAULT_COLOR;
      this.portrait.setFillStyle(color, 1).setVisible(true);
      this.portraitImg.setVisible(false);
      return;
    }

    const key =
      this._availablePortraits[
        Math.floor(Math.random() * this._availablePortraits.length)
      ];
    const src = this.scene.textures.get(key).source[0];
    const cropHeight = Math.round(src.height * PORTRAIT_BUST_CROP_HEIGHT);

    this.portrait.setVisible(false);
    this.portraitImg
      .setTexture(key)
      .setCrop(0, 0, src.width, cropHeight)
      .setPosition(PORTRAIT_SLOT.x, PORTRAIT_SLOT.y)
      .setDisplaySize(PORTRAIT_SLOT.width, PORTRAIT_SLOT.height)
      .setVisible(true);
  }

  startDialogue(lines, speaker, onComplete) {
    this.active = true;
    this.lines = lines;
    this.index = 0;
    this.onComplete = onComplete;
    this._currentSpeaker = speaker;

    this.promptText.setVisible(false);

    const keys = PORTRAIT_KEYS[speaker] ?? [];
    this._availablePortraits = keys.filter(
      (k) =>
        this.scene.textures.exists(k) &&
        this.scene.textures.get(k).key !== '__MISSING',
    );

    this._refreshPortrait();

    const color = PORTRAIT_COLORS[speaker] ?? DEFAULT_COLOR;
    this.speakerText.setText(speaker.toUpperCase());
    this.speakerText.setStyle({
      color: `#${color.toString(16).padStart(6, '0')}`,
    });

    this.dialogueBg.setVisible(true);
    this.speakerText.setVisible(true);
    this.hintText.setVisible(true);
    this.dialogueText.setVisible(true);
    this.dialogueText.setText(this.lines[this.index]);
  }

  endDialogue() {
    this.active = false;
    this.lines = [];
    this.index = 0;

    this.dialogueBg.setVisible(false);
    this.portrait.setVisible(false);
    this.portraitImg.setVisible(false);
    this.speakerText.setVisible(false);
    this.hintText.setVisible(false);
    this.dialogueText.setVisible(false);

    const cb = this.onComplete;
    this.onComplete = null;

    EventBus.emit(EVENTS.END_DIALOGUE);
    if (cb) cb();
  }

  update() {
    if (!this.active) return;
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.index += 1;
      if (this.index >= this.lines.length) {
        this.endDialogue();
      } else {
        this._refreshPortrait();
        this.dialogueText.setText(this.lines[this.index]);
      }
    }
  }
}
