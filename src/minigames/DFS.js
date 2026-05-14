import MinigameBase from './MinigameBase.js';

// DFS through maintenance tunnels
// Graph: START → A → C (dead end), D → GOAL
//               B (never reached — still in stack when goal found)
// DFS stack (LIFO) order: START → A → C (dead end, backtrack) → D → GOAL
//
// Adjacency (directed for DFS order, first child explored first via stack push-in-reverse):
//   START: [A, B]
//   A:     [C, D]
//   B:     []       (dead end)
//   C:     []       (dead end)
//   D:     [GOAL]
//   GOAL:  []

const NODES = {
  START: { id: 'START', label: 'START', x: 130,  y: 270,  color: 0x1e4d7a, neighbors: ['A', 'B'] },
  A:     { id: 'A',     label: 'A',     x: 300,  y: 185,  color: 0x1e293b, neighbors: ['C', 'D'] },
  B:     { id: 'B',     label: 'B',     x: 300,  y: 355,  color: 0x1e293b, neighbors: []          },
  C:     { id: 'C',     label: 'C',     x: 460,  y: 150,  color: 0x1e293b, neighbors: []          },
  D:     { id: 'D',     label: 'D',     x: 460,  y: 265,  color: 0x1e293b, neighbors: ['GOAL']    },
  GOAL:  { id: 'GOAL',  label: 'GOAL',  x: 600,  y: 265,  color: 0x14532d, neighbors: []          },
};

const EDGES = [
  ['START','A'], ['START','B'],
  ['A','C'], ['A','D'],
  ['D','GOAL'],
];

// Predetermined DFS steps
const STEPS = [
  { action: 'visit',     node: 'START', stackAfter: ['A','B'],           msg: 'Visit START. Push neighbors A and B onto the stack.' },
  { action: 'visit',     node: 'A',     stackAfter: ['B','C','D'],        msg: 'Pop A (top). Visit A. Push neighbors C and D.' },
  { action: 'visit',     node: 'C',     stackAfter: ['B','D'],            msg: 'Pop C (top). Visit C. No unvisited neighbors — dead end! Backtrack.' },
  { action: 'visit',     node: 'D',     stackAfter: ['B','GOAL'],         msg: 'Pop D (top). Visit D. Push neighbor GOAL.' },
  { action: 'found',     node: 'GOAL',  stackAfter: ['B'],                msg: 'Pop GOAL (top). DESTINATION FOUND! Path: START → A → D → GOAL.' },
];

export default class DFS extends MinigameBase {
  constructor() {
    super('DFS');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.step      = 0;
    this.visited   = new Set();
    this.path      = [];
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'DFS');

    this.add.text(W / 2, 34, 'Maintenance Tunnels — Depth-First Search', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 62, `Navigate the tunnel network to reach GOAL.\nDFS goes deep first — exploring every dead end before backtracking.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Draw edges
    const edgeG = this.add.graphics();
    EDGES.forEach(([a, b]) => {
      edgeG.lineStyle(2, 0x334155, 0.8);
      edgeG.lineBetween(NODES[a].x, NODES[a].y, NODES[b].x, NODES[b].y);
    });

    // Node circles and labels
    this.nodeGfx    = {};
    this.nodeLabels = {};
    Object.values(NODES).forEach(n => {
      const g = this.add.graphics();
      g.fillStyle(n.color, 1);
      g.fillCircle(n.x, n.y, 28);
      g.lineStyle(2, 0x475569, 1);
      g.strokeCircle(n.x, n.y, 28);
      this.nodeGfx[n.id] = g;

      this.nodeLabels[n.id] = this.add.text(n.x, n.y, n.label, {
        fontFamily: 'sans-serif', fontSize: n.label.length > 1 ? '13px' : '18px',
        color: '#e2e8f0', fontStyle: 'bold',
      }).setOrigin(0.5);
    });

    // Stack panel
    this.add.text(680, 100, 'Stack (LIFO)', {
      fontFamily: 'monospace', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);
    this.stackBox = this.add.rectangle(680, 220, 130, 230, 0x1e293b).setStrokeStyle(1, 0x334155);
    this.stackText = this.add.text(680, 135, '—', {
      fontFamily: 'monospace', fontSize: '13px', color: '#94a3b8',
      align: 'center',
    }).setOrigin(0.5, 0);

    // Current node indicator
    this.add.text(W / 2, 350, 'Current:', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);
    this.currentText = this.add.text(W / 2, 370, '—', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#a855f7',
    }).setOrigin(0.5);

    // Step message
    this.msgText = this.add.text(W / 2, 406, 'Click "Next Step" to start the DFS.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 630 }, align: 'center',
    }).setOrigin(0.5);

    // Next Step button
    this.nextBtn = this.add.text(W / 2, 450, '  Next Step  ', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#0f172a',
      backgroundColor: '#a855f7', padding: { x: 32, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.nextBtn.on('pointerover', () => { if (!this.solved) this.nextBtn.setStyle({ backgroundColor: '#c084fc' }); });
    this.nextBtn.on('pointerout',  () => { if (!this.solved) this.nextBtn.setStyle({ backgroundColor: '#a855f7' }); });
    this.nextBtn.on('pointerdown', () => { if (!this.solved) this.advanceStep(); });

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });
  }

  _redrawNode(id, fillColor, strokeColor) {
    const n = NODES[id];
    const g = this.nodeGfx[id];
    g.clear();
    g.fillStyle(fillColor, 1);
    g.fillCircle(n.x, n.y, 28);
    g.lineStyle(3, strokeColor, 1);
    g.strokeCircle(n.x, n.y, 28);
  }

  advanceStep() {
    if (this.step >= STEPS.length) return;

    const s = STEPS[this.step];
    this.step++;

    // Reset previously active node highlight (keep visited as grey)
    this.visited.forEach(id => {
      this._redrawNode(id, id === 'GOAL' ? 0x14532d : 0x2d3748, id === 'GOAL' ? 0x4ade80 : 0x475569);
    });

    // Mark current node as visiting (blue)
    this.visited.add(s.node);
    if (s.action === 'found') {
      this._redrawNode(s.node, 0x14532d, 0x4ade80);
    } else if (s.action === 'visit' && NODES[s.node].neighbors.length === 0 && s.node !== 'START') {
      this._redrawNode(s.node, 0x7f1d1d, 0xef4444); // dead end = red
    } else {
      this._redrawNode(s.node, 0x2d1d6b, 0xa855f7);
    }

    // Update stack display
    const stackItems = s.stackAfter.length
      ? [...s.stackAfter].reverse().map((id, i) => i === 0 ? `► ${id}` : `  ${id}`).join('\n')
      : '(empty)';
    this.stackText.setText(stackItems);

    // Current node label
    this.currentText.setText(s.node);

    // Message
    this.msgText.setText(s.msg);
    this.msgText.setStyle({ color: s.action === 'found' ? '#4ade80' : s.action === 'visit' && NODES[s.node].neighbors.length === 0 && s.node !== 'START' ? '#ef4444' : '#fbbf24' });

    if (s.action === 'found') {
      this.solved = true;
      this.nextBtn.setAlpha(0);

      // Draw path edges in green
      const pathG = this.add.graphics();
      const pathNodes = ['START', 'A', 'D', 'GOAL'];
      for (let i = 0; i < pathNodes.length - 1; i++) {
        const a = NODES[pathNodes[i]], b = NODES[pathNodes[i + 1]];
        pathG.lineStyle(4, 0x4ade80, 0.9);
        pathG.lineBetween(a.x, a.y, b.x, b.y);
      }

      this.cameras.main.flash(400, 168, 85, 247);
      this.time.delayedCall(800, () => {
        this.add.text(400, 520, 'Continue  →', {
          fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
          backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.finish(true));
      });
    }
  }

}
