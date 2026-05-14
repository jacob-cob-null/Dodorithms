import MinigameBase from './MinigameBase.js';

// Dijkstra's Algorithm — Shortest Path in a weighted graph
// Nodes: START, HUB_A, HUB_B, RELAY_1, RELAY_2, CORE
// Edges:
//   START  → HUB_A:  6
//   START  → HUB_B:  2
//   HUB_A  → CORE:   3   (2-hop path: 6+3=9)
//   HUB_B  → RELAY_1: 3
//   HUB_B  → RELAY_2: 7
//   RELAY_1→ CORE:   1   (3-hop path: 2+3+1=6) ← SHORTEST
//   RELAY_2→ CORE:   2
//
// Dijkstra steps (user must click min-dist unvisited each time):
//   Visit START(0)   → updates HUB_A=6, HUB_B=2
//   Visit HUB_B(2)   → updates RELAY_1=5, RELAY_2=9
//   Visit RELAY_1(5) → updates CORE=6
//   Visit CORE(6)    → FOUND!  path = START→HUB_B→RELAY_1→CORE

const NODE_POS = [
  { id: 'START',   x: 120, y: 250, label: 'START' },
  { id: 'HUB_A',  x: 310, y: 145, label: 'HUB A' },
  { id: 'HUB_B',  x: 310, y: 355, label: 'HUB B' },
  { id: 'RELAY_1',x: 500, y: 290, label: 'RELAY 1' },
  { id: 'RELAY_2',x: 500, y: 420, label: 'RELAY 2' },
  { id: 'CORE',   x: 630, y: 210, label: 'CORE' },
];

const EDGES = [
  { a: 0, b: 1, w: 6 },   // START → HUB_A
  { a: 0, b: 2, w: 2 },   // START → HUB_B
  { a: 1, b: 5, w: 3 },   // HUB_A → CORE
  { a: 2, b: 3, w: 3 },   // HUB_B → RELAY_1
  { a: 2, b: 4, w: 7 },   // HUB_B → RELAY_2
  { a: 3, b: 5, w: 1 },   // RELAY_1 → CORE
  { a: 4, b: 5, w: 2 },   // RELAY_2 → CORE
];

// Pre-scripted Dijkstra visit order (the correct node to click each step)
const CORRECT_VISIT_ORDER = [0, 2, 3, 5]; // START, HUB_B, RELAY_1, CORE
// After visiting START the initial state is set — user picks from remaining

export default class ServerRouting extends MinigameBase {
  constructor() { super('ServerRouting'); }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.waiting   = false;
    this.visitStep = 0; // index into CORRECT_VISIT_ORDER
    this.dist      = new Array(NODE_POS.length).fill(Infinity);
    this.prev      = new Array(NODE_POS.length).fill(-1);
    this.visited   = new Set();
    this.dist[0]   = 0;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'ServerRouting');

    this.add.text(W / 2, 28, 'Server Routing — Dijkstra\'s Algorithm', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(280, 55, 'Find the path with LOWEST total latency.\nClick the unvisited node with the smallest distance each step.', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 560 },
    }).setOrigin(0.5);

    // ── Graph edges (static) ────────────────────────────────────────────
    this.edgeG = this.add.graphics();
    EDGES.forEach(e => {
      const a = NODE_POS[e.a], b = NODE_POS[e.b];
      this.edgeG.lineStyle(2, 0x1e3a5f, 0.8);
      this.edgeG.lineBetween(a.x, a.y, b.x, b.y);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      this.add.text(mx, my - 10, String(e.w), {
        fontFamily: 'monospace', fontSize: '11px', color: '#f59e0b',
      }).setOrigin(0.5);
    });

    // Path highlight graphics
    this.pathG = this.add.graphics();

    // ── Node circles ────────────────────────────────────────────────────
    this.nodeGfx   = [];
    this.nodeTexts = [];
    NODE_POS.forEach((n, i) => {
      const g = this.add.graphics();
      this.nodeGfx.push(g);
      this.add.text(n.x, n.y + 32, n.label, {
        fontFamily: 'monospace', fontSize: '10px', color: '#475569',
      }).setOrigin(0.5);
      const distT = this.add.text(n.x, n.y - 6, i === 0 ? '0' : '∞', {
        fontFamily: 'monospace', fontSize: '13px', color: '#f8fafc', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.nodeTexts.push(distT);

      // Make nodes clickable
      const hitZone = this.add.circle(n.x, n.y, 26).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => { if (!this.solved && !this.waiting) this._visitNode(i); });
    });
    this._renderNodes();

    // ── Distance table (right panel) ────────────────────────────────────
    this.add.text(714, 92, 'Distance Table', {
      fontFamily: 'monospace', fontSize: '11px', color: '#475569',
    }).setOrigin(0.5);

    this.distRows = NODE_POS.map((n, i) => {
      const ry = 116 + i * 32;
      const bg = this.add.rectangle(714, ry, 148, 26, 0x1e293b).setStrokeStyle(1, 0x334155);
      const txt = this.add.text(714, ry, `${n.label}: ${i === 0 ? '0' : '∞'}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#64748b',
      }).setOrigin(0.5);
      return { bg, txt };
    });

    // ── Feedback / formula ──────────────────────────────────────────────
    this.formulaText = this.add.text(310, 460, 'START already visited (dist=0). Click the unvisited node with the smallest distance.', {
      fontFamily: 'monospace', fontSize: '11px', color: '#60a5fa',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(310, 492, 'Unvisited with min dist: HUB_B (dist=2)', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#a855f7',
      align: 'center',
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });

    // Auto-visit START
    this._processVisit(0);
  }

  _renderNodes() {
    NODE_POS.forEach((n, i) => {
      const g = this.nodeGfx[i];
      g.clear();
      let fill = 0x1e293b, stroke = 0x475569;
      if (this.visited.has(i))                              { fill = 0x1a3a4a; stroke = 0x38bdf8; }
      if (i === CORRECT_VISIT_ORDER[this.visitStep - 1])   { fill = 0x14532d; stroke = 0x4ade80; }
      if (i === 5 && this.solved)                           { fill = 0x14532d; stroke = 0x4ade80; }
      g.fillStyle(fill, 1);
      g.fillCircle(n.x, n.y, 26);
      g.lineStyle(2, stroke, 1);
      g.strokeCircle(n.x, n.y, 26);
    });
  }

  _visitNode(idx) {
    const expected = CORRECT_VISIT_ORDER[this.visitStep];
    if (idx === expected) {
      this._processVisit(idx);
    } else {
      // Wrong node — shake and hint
      this.cameras.main.shake(180, 0.005);
      const correctName = NODE_POS[expected].label;
      const correctDist = this.dist[expected];
      this.feedbackText.setText(`Not the minimum! ${correctName} has dist=${correctDist === Infinity ? '∞' : correctDist} — the smallest unvisited.`);
      this.feedbackText.setStyle({ color: '#ef4444' });
      // Flash the correct node
      const g = this.nodeGfx[expected];
      const n = NODE_POS[expected];
      g.clear();
      g.fillStyle(0x7f1d1d, 1);
      g.fillCircle(n.x, n.y, 26);
      g.lineStyle(2, 0xef4444, 1);
      g.strokeCircle(n.x, n.y, 26);
      this.time.delayedCall(500, () => this._renderNodes());
    }
  }

  _processVisit(idx) {
    this.waiting = true;
    this.visited.add(idx);
    this.visitStep++;

    // Relax neighbours
    EDGES.forEach(e => {
      let neighbour = -1;
      if (e.a === idx) neighbour = e.b;
      else if (e.b === idx) neighbour = e.a;
      if (neighbour === -1 || this.visited.has(neighbour)) return;
      const newDist = this.dist[idx] + e.w;
      if (newDist < this.dist[neighbour]) {
        this.dist[neighbour] = newDist;
        this.prev[neighbour] = idx;
      }
    });

    // Update distance table and node texts
    NODE_POS.forEach((n, i) => {
      const d = this.dist[i];
      const dStr = d === Infinity ? '∞' : String(d);
      this.nodeTexts[i].setText(dStr);
      this.distRows[i].txt.setText(`${n.label}: ${dStr}`);
      if (this.visited.has(i)) {
        this.distRows[i].bg.setFillStyle(0x1a2d1a);
        this.distRows[i].txt.setStyle({ color: '#4ade80' });
      } else if (d < Infinity) {
        this.distRows[i].bg.setFillStyle(0x1a1f35);
        this.distRows[i].txt.setStyle({ color: '#60a5fa' });
      }
    });

    this._renderNodes();

    const nodeName = NODE_POS[idx].label;
    this.formulaText.setText(`Visited ${nodeName} (dist=${this.dist[idx]}). Relaxed neighbours.`);
    this.formulaText.setStyle({ color: '#60a5fa' });

    if (idx === 5) {
      // Found CORE
      this.time.delayedCall(300, () => this._finish());
      return;
    }

    // Find next min
    let minDist = Infinity, minIdx = -1;
    NODE_POS.forEach((_, i) => {
      if (!this.visited.has(i) && this.dist[i] < minDist) {
        minDist = this.dist[i]; minIdx = i;
      }
    });

    if (minIdx !== -1) {
      this.feedbackText.setText(`Next: click ${NODE_POS[minIdx].label} (dist=${minDist}) — smallest unvisited.`);
      this.feedbackText.setStyle({ color: '#a855f7' });
    }

    this.time.delayedCall(200, () => { this.waiting = false; });
  }

  _finish() {
    this.solved = true;

    // Trace path back from CORE
    const path = [];
    let cur = 5;
    while (cur !== -1) { path.unshift(cur); cur = this.prev[cur]; }

    // Draw path in green
    this.pathG.lineStyle(3, 0x4ade80, 1);
    for (let i = 0; i < path.length - 1; i++) {
      const a = NODE_POS[path[i]], b = NODE_POS[path[i + 1]];
      this.pathG.lineBetween(a.x, a.y, b.x, b.y);
    }
    this._renderNodes();

    const pathStr = path.map(i => NODE_POS[i].label).join(' → ');
    this.formulaText.setText(`Shortest path: ${pathStr}  =  ${this.dist[5]} ms latency  ✓`);
    this.formulaText.setStyle({ color: '#4ade80' });
    this.feedbackText.setText('3 hops beat 2 hops! Lower edge weights = faster route despite more steps.');
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 245, 158, 11);

    this.time.delayedCall(800, () => {
      this.add.text(400, 556, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
