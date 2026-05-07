import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { EVENTS } from '../systems/events.js';

// Kruskal's Algorithm — Minimum Spanning Tree
// 5 docks (nodes): A, B, C, D, E
// 8 edges sorted by weight:
//   A-B:2, A-E:3, C-D:3, B-C:4, B-D:5, D-E:6, A-D:7, B-E:8
// MST (Kruskal's greedy, no cycles): A-B(2), A-E(3), C-D(3), B-C(4) → total weight 12
// B-D:5 skipped (B and D already connected via B-C-D)

const NODES = [
  { id: 'A', x: 200, y: 185, label: 'Alpha\nDock' },
  { id: 'B', x: 420, y: 140, label: 'Beta\nDock' },
  { id: 'C', x: 590, y: 265, label: 'Core\nDock' },
  { id: 'D', x: 440, y: 320, label: 'Delta\nDock' },
  { id: 'E', x: 210, y: 310, label: 'Echo\nDock' },
];

// Pre-sorted by weight
const EDGES = [
  { a: 0, b: 1, w: 2  },  // A-B
  { a: 0, b: 4, w: 3  },  // A-E
  { a: 2, b: 3, w: 3  },  // C-D
  { a: 1, b: 2, w: 4  },  // B-C
  { a: 1, b: 3, w: 5  },  // B-D  ← creates cycle after above 4
  { a: 3, b: 4, w: 6  },  // D-E
  { a: 0, b: 3, w: 7  },  // A-D
  { a: 1, b: 4, w: 8  },  // B-E
];

// Union-Find helpers
function makeUF(n) { return Array.from({ length: n }, (_, i) => i); }
function find(uf, x) { return uf[x] === x ? x : (uf[x] = find(uf, uf[x])); }
function union(uf, x, y) {
  x = find(uf, x); y = find(uf, y);
  if (x === y) return false;
  uf[x] = y; return true;
}

export default class SpanningTree extends Phaser.Scene {
  constructor() { super('SpanningTree'); }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.edgeIdx   = 0;       // next edge to consider
    this.mstCount  = 0;       // edges added to MST
    this.uf        = makeUF(NODES.length);
    this.waiting   = false;
  }

  create() {
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x081020);

    this.add.text(W / 2, 28, 'Fiber-Optic Network — Minimum Spanning Tree', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 54, 'Connect all 5 docks using the least total wire. Add the cheapest edge that\ndoes not create a loop — that\'s Kruskal\'s Algorithm!', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    // ── Graph area ──────────────────────────────────────────────────────
    this.edgeG = this.add.graphics();
    this._drawAllEdges();

    // Node circles
    NODES.forEach((n, i) => {
      const g = this.add.graphics();
      g.fillStyle(0x1e293b, 1);
      g.fillCircle(n.x, n.y, 22);
      g.lineStyle(2, 0x38bdf8, 0.7);
      g.strokeCircle(n.x, n.y, 22);
      this.add.text(n.x, n.y - 4, n.id, {
        fontFamily: 'monospace', fontSize: '13px', color: '#38bdf8', fontStyle: 'bold',
      }).setOrigin(0.5);
    });

    // ── Sorted edge list (right panel) ──────────────────────────────────
    this.add.text(668, 92, 'Edges (sorted)', {
      fontFamily: 'monospace', fontSize: '11px', color: '#475569',
    }).setOrigin(0.5);

    this.edgeLabels = EDGES.map((e, i) => {
      const ey = 116 + i * 28;
      const bg = this.add.rectangle(668, ey, 130, 22, 0x1e293b).setStrokeStyle(1, 0x334155);
      const txt = this.add.text(668, ey,
        `${NODES[e.a].id}–${NODES[e.b].id}   w=${e.w}`, {
          fontFamily: 'monospace', fontSize: '11px', color: '#64748b',
        }).setOrigin(0.5);
      return { bg, txt };
    });

    // ── Status / formula ────────────────────────────────────────────────
    this.formulaText = this.add.text(W / 2, 396, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#38bdf8',
      align: 'center', wordWrap: { width: 700 },
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(W / 2, 424, `MST edges: 0 / ${NODES.length - 1}   |   Total weight: 0`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      align: 'center',
    }).setOrigin(0.5);

    // ── Button ──────────────────────────────────────────────────────────
    this.addBtn = this.add.text(W / 2, 468, '  Add Next Cheapest Edge  ', {
      fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
      backgroundColor: '#38bdf8', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.addBtn.on('pointerover', () => { if (!this.solved) this.addBtn.setStyle({ backgroundColor: '#7dd3fc' }); });
    this.addBtn.on('pointerout',  () => { if (!this.solved) this.addBtn.setStyle({ backgroundColor: '#38bdf8' }); });
    this.addBtn.on('pointerdown', () => { if (!this.solved && !this.waiting) this._tryNextEdge(); });

    this.weightText = this.add.text(W / 2, 512, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#4ade80',
    }).setOrigin(0.5);

    this.add.text(W - 10, H - 10, 'Skip', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#334155',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(false));

    this._totalWeight = 0;
  }

  _drawAllEdges() {
    this.edgeG.clear();
    EDGES.forEach((e, i) => {
      const a = NODES[e.a], b = NODES[e.b];
      this.edgeG.lineStyle(2, 0x1e3a5f, 0.7);
      this.edgeG.lineBetween(a.x, a.y, b.x, b.y);
      // Weight label at midpoint
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      this.edgeG.fillStyle(0x334155, 1);
      this.edgeG.fillRect(mx - 8, my - 8, 16, 14);
    });
    // Weight numbers (separate text objects created once)
    if (!this._weightTexts) {
      this._weightTexts = EDGES.map(e => {
        const a = NODES[e.a], b = NODES[e.b];
        return this.add.text((a.x + b.x) / 2, (a.y + b.y) / 2, String(e.w), {
          fontFamily: 'monospace', fontSize: '10px', color: '#475569',
        }).setOrigin(0.5);
      });
    }
  }

  _tryNextEdge() {
    if (this.edgeIdx >= EDGES.length) return;
    this.waiting = true;

    const e   = EDGES[this.edgeIdx];
    const la  = NODES[e.a].id, lb = NODES[e.b].id;
    const canAdd = union(this.uf, e.a, e.b);

    // Highlight edge label in list
    this.edgeLabels[this.edgeIdx].bg.setFillStyle(canAdd ? 0x14532d : 0x3b1515);
    this.edgeLabels[this.edgeIdx].txt.setStyle({ color: canAdd ? '#4ade80' : '#ef4444' });

    if (!canAdd) {
      // Cycle — flash red on graph edge
      const a = NODES[e.a], b = NODES[e.b];
      const flashG = this.add.graphics();
      flashG.lineStyle(3, 0xef4444, 0.8);
      flashG.lineBetween(a.x, a.y, b.x, b.y);
      this.formulaText.setText(`${la}–${lb} (w=${e.w}): would create a cycle! Skipping.`);
      this.formulaText.setStyle({ color: '#ef4444' });
      this.time.delayedCall(600, () => {
        flashG.destroy();
        this.edgeIdx++;
        this.waiting = false;
        this._tryNextEdge();
      });
      return;
    }

    // Add to MST — draw green edge
    const a = NODES[e.a], b = NODES[e.b];
    const mstG = this.add.graphics();
    mstG.lineStyle(3, 0x4ade80, 1);
    mstG.lineBetween(a.x, a.y, b.x, b.y);

    this._totalWeight += e.w;
    this.mstCount++;
    this.formulaText.setText(`Added ${la}–${lb} (w=${e.w}) ✓  No cycle — different components.`);
    this.formulaText.setStyle({ color: '#4ade80' });
    this.feedbackText.setText(`MST edges: ${this.mstCount} / ${NODES.length - 1}   |   Total weight: ${this._totalWeight}`);

    this.edgeIdx++;
    if (this.mstCount >= NODES.length - 1) {
      this.time.delayedCall(400, () => this._finish());
    } else {
      this.time.delayedCall(300, () => { this.waiting = false; });
    }
  }

  _finish() {
    this.solved = true;
    this.addBtn.setAlpha(0);
    this.weightText.setText(`MST complete! Total wire used: ${this._totalWeight} units  ✓`);
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 56, 189, 248);

    this.time.delayedCall(700, () => {
      this.add.text(400, 556, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

  finish(success) {
    EventBus.emit(EVENTS.PUZZLE_COMPLETE, { success, algorithm: this.algorithm });
    this.scene.resume('GameScene');
    this.scene.stop('SpanningTree');
  }
}
