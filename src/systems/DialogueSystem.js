import Phaser from "phaser";
import EventBus from "./EventBus.js";
import { EVENTS } from "./events.js";

const PORTRAIT_COLORS = {
  'Laurenze':    0xf59e0b,
  'Trizy':       0x06b6d4,
  'Jacob':       0x22c55e,
  'Kyla':        0xa855f7,
  'Prof. Andrew':0xfbbf24,
  'Dodo':        0xef4444,
};
const DEFAULT_COLOR = 0x64748b;

export default class DialogueSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.lines = [];
    this.index = 0;
    this.onComplete = null;

    // Background box — spans x:20→780, y:448→592
    this.dialogueBg = scene.add
      .rectangle(400, 520, 760, 144, 0x0f172a, 0.94)
      .setStrokeStyle(2, 0x334155, 1)
      .setVisible(false);

    // Portrait placeholder (left side)
    this.portrait = scene.add
      .rectangle(50, 516, 52, 72, DEFAULT_COLOR, 1)
      .setStrokeStyle(1, 0xffffff, 0.2)
      .setVisible(false);

    // Speaker name
    this.speakerText = scene.add
      .text(84, 458, '', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#fbbf24',
        fontStyle: 'bold',
      })
      .setVisible(false);

    // Main dialogue text
    this.dialogueText = scene.add
      .text(84, 476, '', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        color: '#e2e8f0',
        wordWrap: { width: 680 },
        lineSpacing: 4,
      })
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

    this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

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
      this.startDialogue(payload.lines, payload.speaker || '', payload.onComplete || null);
    });

    scene.events.on('update', this.update, this);
  }

  startDialogue(lines, speaker, onComplete) {
    this.active     = true;
    this.lines      = lines;
    this.index      = 0;
    this.onComplete = onComplete;

    this.promptText.setVisible(false);

    // Portrait color
    const color = PORTRAIT_COLORS[speaker] ?? DEFAULT_COLOR;
    this.portrait.setFillStyle(color, 1);

    this.speakerText.setText(speaker.toUpperCase());
    this.speakerText.setStyle({ color: `#${color.toString(16).padStart(6, '0')}` });

    this.dialogueBg.setVisible(true);
    this.portrait.setVisible(true);
    this.speakerText.setVisible(true);
    this.hintText.setVisible(true);
    this.dialogueText.setVisible(true);
    this.dialogueText.setText(this.lines[this.index]);
  }

  endDialogue() {
    this.active = false;
    this.lines  = [];
    this.index  = 0;

    this.dialogueBg.setVisible(false);
    this.portrait.setVisible(false);
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
        this.dialogueText.setText(this.lines[this.index]);
      }
    }
  }
}
