import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

// Huffman Coding — greedy data compression
// Characters: A(freq=4), B(freq=3), C(freq=2), D(freq=1)
// Build min-heap, merge lowest two each step:
//   Step 1: D(1)+C(2) → DC(3)
//   Step 2: DC(3)+B(3) → DCB(6)
//   Step 3: A(4)+DCB(6) → root(10)
// Final codes: A→1, B→01, C→001, D→000

const INITIAL_NODES = [
  { label: 'D', freq: 1, color: 0x7c3aed },
  { label: 'C', freq: 2, color: 0x1d4ed8 },
  { label: 'B', freq: 3, color: 0x065f46 },
  { label: 'A', freq: 4, color: 0x92400e },
];

// Pre-scripted merge steps
const MERGES = [
  { leftIdx: 0, rightIdx: 1, newLabel: 'DC', newFreq: 3, newColor: 0x4c1d95 },
  { leftIdx: 0, rightIdx: 1, newLabel: 'DCB', newFreq: 6, newColor: 0x1e3a5f },
  { leftIdx: 1, rightIdx: 0, newLabel: 'root', newFreq: 10, newColor: 0x14532d },
];

// Resulting codes after tree is built
const CODES = [
  { char: 'A', freq: 4, code: '1',   bits: 1 },
  { char: 'B', freq: 3, code: '01',  bits: 2 },
  { char: 'C', freq: 2, code: '001', bits: 3 },
  { char: 'D', freq: 1, code: '000', bits: 3 },
];

export default class HuffmanCode extends Phaser.Scene {
  constructor() { super('HuffmanCode'); }

  init(data) {
    this.algorithm  = data.algorithm;
    this.solved     = false;
    this.mergeStep  = 0;
    this.waiting    = false;
    // Working queue — clone of INITIAL_NODES
    this.queue = INITIAL_NODES.map(n => ({ ...n }));
  }

  create() {
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x081020);

    this.add.text(W / 2, 28, 'Distress Signal — Huffman Coding', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 54, 'Compress the ship signature by giving frequent characters shorter bit-codes.\nRepeatedly merge the two lowest-frequency nodes into one parent.', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    // ── Queue display (top row of nodes) ───────────────────────────────
    this.add.text(W / 2, 92, 'Priority Queue  (sorted by frequency ↑)', {
      fontFamily: 'monospace', fontSize: '11px', color: '#475569',
    }).setOrigin(0.5);

    this.nodeObjs = []; // array of { bg, freqTxt, labelTxt, x, y }
    this._buildQueueDisplay();

    // ── Tree graphics (edges drawn as merges happen) ────────────────────
    this.treeG = this.add.graphics();

    // Parent nodes placed progressively higher
    this.parentNodes = [];

    // ── Formula ────────────────────────────────────────────────────────
    this.formulaText = this.add.text(W / 2, 370, 'Pick the two nodes with the lowest frequency and merge them.', {
      fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa',
      align: 'center', wordWrap: { width: 700 },
    }).setOrigin(0.5);

    // ── Code table (revealed at end) ───────────────────────────────────
    this.codeTable = this.add.text(W / 2, 415, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#4ade80',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5);

    // ── Feedback ───────────────────────────────────────────────────────
    this.feedbackText = this.add.text(W / 2, 480, `Step 1 of ${MERGES.length}: merge D(1) + C(2) → DC(3)`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#a855f7',
      align: 'center',
    }).setOrigin(0.5);

    // ── Button ─────────────────────────────────────────────────────────
    this.mergeBtn = this.add.text(W / 2, 524, '  Merge Two Lowest  ', {
      fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
      backgroundColor: '#a855f7', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.mergeBtn.on('pointerover', () => { if (!this.solved) this.mergeBtn.setStyle({ backgroundColor: '#c084fc' }); });
    this.mergeBtn.on('pointerout',  () => { if (!this.solved) this.mergeBtn.setStyle({ backgroundColor: '#a855f7' }); });
    this.mergeBtn.on('pointerdown', () => { if (!this.solved && !this.waiting) this._doMerge(); });

    this.add.text(W - 10, H - 10, 'Skip', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#334155',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(false));
  }

  _buildQueueDisplay() {
    // Destroy old objects
    this.nodeObjs.forEach(o => { o.bg.destroy(); o.labelTxt.destroy(); o.freqTxt.destroy(); });
    this.nodeObjs = [];

    const n = this.queue.length;
    const spacing = 120;
    const startX = 400 - (n - 1) * spacing / 2;

    this.queue.forEach((node, i) => {
      const cx = startX + i * spacing;
      const cy = 170;
      const bg = this.add.graphics();
      bg.fillStyle(node.color, 0.35);
      bg.fillCircle(cx, cy, 28);
      bg.lineStyle(2, node.color, 0.8);
      bg.strokeCircle(cx, cy, 28);
      const labelTxt = this.add.text(cx, cy - 7, node.label, {
        fontFamily: 'monospace', fontSize: '13px', color: '#f8fafc', fontStyle: 'bold',
      }).setOrigin(0.5);
      const freqTxt = this.add.text(cx, cy + 10, String(node.freq), {
        fontFamily: 'monospace', fontSize: '12px', color: '#fbbf24',
      }).setOrigin(0.5);
      this.nodeObjs.push({ bg, labelTxt, freqTxt, x: cx, y: cy });
    });
  }

  _doMerge() {
    if (this.mergeStep >= MERGES.length) return;
    this.waiting = true;

    const m    = MERGES[this.mergeStep];
    const left = this.queue[m.leftIdx];
    const right = this.queue[m.rightIdx];
    const leftObj  = this.nodeObjs[m.leftIdx];
    const rightObj = this.nodeObjs[m.rightIdx];

    // Highlight the two being merged
    leftObj.bg.clear();
    leftObj.bg.fillStyle(m.newColor, 0.6);
    leftObj.bg.fillCircle(leftObj.x, leftObj.y, 28);
    leftObj.bg.lineStyle(2, 0xfbbf24, 1);
    leftObj.bg.strokeCircle(leftObj.x, leftObj.y, 28);

    rightObj.bg.clear();
    rightObj.bg.fillStyle(m.newColor, 0.6);
    rightObj.bg.fillCircle(rightObj.x, rightObj.y, 28);
    rightObj.bg.lineStyle(2, 0xfbbf24, 1);
    rightObj.bg.strokeCircle(rightObj.x, rightObj.y, 28);

    this.formulaText.setText(
      `Merge ${left.label}(${left.freq}) + ${right.label}(${right.freq}) = ${m.newLabel}(${m.newFreq})`
    );
    this.formulaText.setStyle({ color: '#fbbf24' });

    this.time.delayedCall(400, () => {
      // Draw tree edge lines to parent
      const parentY = 230 + this.mergeStep * 52;
      const parentX = (leftObj.x + rightObj.x) / 2;

      this.treeG.lineStyle(2, m.newColor, 0.6);
      this.treeG.lineBetween(leftObj.x, leftObj.y + 28, parentX, parentY - 24);
      this.treeG.lineBetween(rightObj.x, rightObj.y + 28, parentX, parentY - 24);

      // Draw parent node
      const pg = this.add.graphics();
      pg.fillStyle(m.newColor, 0.45);
      pg.fillCircle(parentX, parentY, 26);
      pg.lineStyle(2, m.newColor, 0.9);
      pg.strokeCircle(parentX, parentY, 26);
      this.add.text(parentX, parentY - 7, m.newLabel, {
        fontFamily: 'monospace', fontSize: '11px', color: '#f8fafc', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(parentX, parentY + 8, String(m.newFreq), {
        fontFamily: 'monospace', fontSize: '11px', color: '#fbbf24',
      }).setOrigin(0.5);

      this.parentNodes.push({ x: parentX, y: parentY });

      // Update queue: remove merged pair, add new node
      this.queue.splice(Math.max(m.leftIdx, m.rightIdx), 1);
      this.queue.splice(Math.min(m.leftIdx, m.rightIdx), 1);
      this.queue.push({ label: m.newLabel, freq: m.newFreq, color: m.newColor });
      this.queue.sort((a, b) => a.freq - b.freq);

      this.mergeStep++;

      if (this.mergeStep >= MERGES.length) {
        this.time.delayedCall(300, () => this._finish());
      } else {
        const next = MERGES[this.mergeStep];
        const ql = this.queue[next.leftIdx], qr = this.queue[next.rightIdx];
        this.feedbackText.setText(`Step ${this.mergeStep + 1} of ${MERGES.length}: merge ${ql.label}(${ql.freq}) + ${qr.label}(${qr.freq}) → ${next.newLabel}(${next.newFreq})`);
        this._buildQueueDisplay();
        this.waiting = false;
      }
    });
  }

  _finish() {
    this.solved = true;
    this.mergeBtn.setAlpha(0);

    const codeLines = CODES.map(c =>
      `${c.char}  freq=${c.freq}  code=${c.code.padEnd(4,' ')}  (${c.bits} bit${c.bits > 1 ? 's' : ''})`
    ).join('\n');

    this.codeTable.setText('Huffman codes:\n' + codeLines + '\n\nMost common → shortest code! A needs only 1 bit.');
    this.formulaText.setText('Tree complete — decode by following left(0) / right(1) from root.');
    this.formulaText.setStyle({ color: '#4ade80' });
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 168, 85, 247);

    this.time.delayedCall(800, () => {
      this.add.text(400, 568, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

  finish(success) {
    EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
    this.scene.resume('GameScene');
    this.scene.stop('HuffmanCode');
  }
}
