import MinigameBase from './MinigameBase.js';

// BFS through the HyperTrain network — find shortest path from Central to Terminal
//
// Graph:  Central → Northside, Westpark
//         Northside → Eastgate
//         Westpark  → Downtown
//         Eastgate  → Terminal
//         Downtown  → Terminal
//
// BFS explores level by level:
//   L0: [Central]
//   L1: [Northside, Westpark]
//   L2: [Eastgate, Downtown]
//   L3: [Terminal]  ← FOUND at distance 3

const STATIONS = {
  Central:   { id: 'Central',   label: 'Central',   x: 155,  y: 270, neighbors: ['Northside','Westpark'] },
  Northside: { id: 'Northside', label: 'Northside', x: 330,  y: 175, neighbors: ['Eastgate']              },
  Westpark:  { id: 'Westpark',  label: 'Westpark',  x: 330,  y: 365, neighbors: ['Downtown']              },
  Eastgate:  { id: 'Eastgate',  label: 'Eastgate',  x: 490,  y: 145, neighbors: ['Terminal']              },
  Downtown:  { id: 'Downtown',  label: 'Downtown',  x: 490,  y: 375, neighbors: ['Terminal']              },
  Terminal:  { id: 'Terminal',  label: 'Terminal',  x: 625,  y: 270, neighbors: []                        },
};

const EDGES = [
  ['Central','Northside'], ['Central','Westpark'],
  ['Northside','Eastgate'],
  ['Westpark','Downtown'],
  ['Eastgate','Terminal'],
  ['Downtown','Terminal'],
];

// Predetermined BFS steps
const STEPS = [
  {
    dequeue: 'Central',
    enqueue: ['Northside','Westpark'],
    parent:  { Northside: 'Central', Westpark: 'Central' },
    queueAfter: ['Northside','Westpark'],
    msg: 'Dequeue Central. Enqueue its neighbours: Northside, Westpark.',
    level: 0,
  },
  {
    dequeue: 'Northside',
    enqueue: ['Eastgate'],
    parent:  { Eastgate: 'Northside' },
    queueAfter: ['Westpark','Eastgate'],
    msg: 'Dequeue Northside. Enqueue neighbour: Eastgate.',
    level: 1,
  },
  {
    dequeue: 'Westpark',
    enqueue: ['Downtown'],
    parent:  { Downtown: 'Westpark' },
    queueAfter: ['Eastgate','Downtown'],
    msg: 'Dequeue Westpark. Enqueue neighbour: Downtown.',
    level: 1,
  },
  {
    dequeue: 'Eastgate',
    enqueue: ['Terminal'],
    parent:  { Terminal: 'Eastgate' },
    queueAfter: ['Downtown','Terminal'],
    msg: 'Dequeue Eastgate. Enqueue neighbour: Terminal.',
    level: 2,
  },
  {
    dequeue: 'Downtown',
    enqueue: [],
    parent:  {},
    queueAfter: ['Terminal'],
    msg: 'Dequeue Downtown. Terminal already queued — skip.',
    level: 2,
  },
  {
    dequeue: 'Terminal',
    enqueue: [],
    parent:  {},
    queueAfter: [],
    msg: 'Dequeue Terminal — DESTINATION REACHED!  Shortest path = 3 stops.',
    level: 3,
    found: true,
  },
];

export default class HyperTrain extends MinigameBase {
  constructor() {
    super('HyperTrain');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.step      = 0;
    this.visited   = new Set(['Central']);
    this.parent    = {};
    this.inQueue   = new Set(['Central']);
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'HyperTrain');

    this.add.text(W / 2, 32, 'HyperTrain — Breadth-First Search', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 60, `Find the shortest route from Central to Terminal.\nBFS explores every station at the current distance before going further.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Rail lines
    const railG = this.add.graphics();
    EDGES.forEach(([a, b]) => {
      railG.lineStyle(3, 0x1e3a5f, 1);
      railG.lineBetween(STATIONS[a].x, STATIONS[a].y, STATIONS[b].x, STATIONS[b].y);
    });
    this.railG = railG;

    // Station nodes
    this.nodeGfx    = {};
    this.nodeLabels = {};
    Object.values(STATIONS).forEach(s => {
      const isStart = s.id === 'Central';
      const isEnd   = s.id === 'Terminal';

      const g = this.add.graphics();
      g.fillStyle(isStart ? 0x1d4ed8 : isEnd ? 0x14532d : 0x1e293b, 1);
      g.fillCircle(s.x, s.y, 26);
      g.lineStyle(2, isStart ? 0x60a5fa : isEnd ? 0x4ade80 : 0x334155, 1);
      g.strokeCircle(s.x, s.y, 26);
      this.nodeGfx[s.id] = g;

      this.nodeLabels[s.id] = this.add.text(s.x, s.y + 34, s.label, {
        fontFamily: 'sans-serif', fontSize: '11px', color: '#94a3b8',
      }).setOrigin(0.5);
    });

    // Legend
    const leg = [
      [0x1d4ed8, 0x60a5fa, 'Start'],
      [0x14532d, 0x4ade80, 'Goal'],
      [0xfbbf24, 0xf59e0b, 'In queue'],
      [0x2d1d6b, 0xa855f7, 'Processing'],
      [0x334155, 0x475569, 'Visited'],
    ];
    leg.forEach(([fill, stroke, label], i) => {
      const lx = 700, ly = 105 + i * 26;
      this.add.graphics().fillStyle(fill, 1).fillCircle(lx, ly, 9).lineStyle(2, stroke, 1).strokeCircle(lx, ly, 9);
      this.add.text(lx + 14, ly, label, { fontFamily: 'sans-serif', fontSize: '11px', color: '#64748b' }).setOrigin(0, 0.5);
    });

    // Queue display
    this.add.text(W / 2, 450, 'Queue (FIFO):',{
      fontFamily: 'monospace', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);
    this.queueText = this.add.text(W / 2, 472, '[ Central ]', {
      fontFamily: 'monospace', fontSize: '14px', color: '#60a5fa',
      align: 'center',
    }).setOrigin(0.5);

    // Message
    this.msgText = this.add.text(W / 2, 500, 'Click "Process Next Station" to begin BFS.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    // Process Next button
    this.nextBtn = this.add.text(W / 2, 538, '  Process Next Station  ', {
      fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
      backgroundColor: '#a855f7', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.nextBtn.on('pointerover', () => { if (!this.solved) this.nextBtn.setStyle({ backgroundColor: '#c084fc' }); });
    this.nextBtn.on('pointerout',  () => { if (!this.solved) this.nextBtn.setStyle({ backgroundColor: '#a855f7' }); });
    this.nextBtn.on('pointerdown', () => { if (!this.solved) this.processNext(); });

    // Mark Central as in-queue
    this._redrawNode('Central', 0xfbbf24, 0xf59e0b);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });
  }

  _redrawNode(id, fillColor, strokeColor) {
    const s = STATIONS[id];
    const g = this.nodeGfx[id];
    g.clear();
    g.fillStyle(fillColor, 1);
    g.fillCircle(s.x, s.y, 26);
    g.lineStyle(2, strokeColor, 1);
    g.strokeCircle(s.x, s.y, 26);
  }

  processNext() {
    if (this.step >= STEPS.length) return;
    const s = STEPS[this.step];
    this.step++;

    // Mark dequeued as "processing"
    this._redrawNode(s.dequeue, 0x2d1d6b, 0xa855f7);
    this.visited.add(s.dequeue);

    // Enqueue new nodes
    s.enqueue.forEach(id => {
      if (!this.inQueue.has(id) && !this.visited.has(id)) {
        this.inQueue.add(id);
        this.parent[id] = s.dequeue;
        this._redrawNode(id, 0xfbbf24, 0xf59e0b);
      }
    });

    // After brief delay, mark dequeued as visited (grey, or green if found)
    this.time.delayedCall(300, () => {
      if (s.found) {
        this._redrawNode(s.dequeue, 0x14532d, 0x4ade80);
      } else {
        this._redrawNode(s.dequeue, 0x1e3a5f, 0x475569);
      }
    });

    // Update queue display
    const qDisplay = s.queueAfter.length
      ? `[ ${s.queueAfter.join('  ,  ')} ]`
      : '[ empty ]';
    this.queueText.setText(qDisplay);
    this.queueText.setStyle({ color: s.queueAfter.length ? '#60a5fa' : '#475569' });

    this.msgText.setText(s.msg);
    this.msgText.setStyle({ color: s.found ? '#4ade80' : '#fbbf24' });

    if (s.found) {
      this.solved = true;
      this.nextBtn.setAlpha(0);

      // Trace shortest path back using parent map and draw in green
      const pathG = this.add.graphics();
      const fullParent = { ...this.parent, ...s.parent };
      const path = ['Terminal'];
      while (path[path.length - 1] !== 'Central') {
        path.push(fullParent[path[path.length - 1]]);
      }
      path.reverse();

      for (let i = 0; i < path.length - 1; i++) {
        const a = STATIONS[path[i]], b = STATIONS[path[i + 1]];
        pathG.lineStyle(5, 0x4ade80, 0.9);
        pathG.lineBetween(a.x, a.y, b.x, b.y);
      }
      path.forEach(id => this._redrawNode(id, 0x14532d, 0x4ade80));

      this.cameras.main.flash(400, 168, 85, 247);

      this.time.delayedCall(800, () => {
        this.add.text(400, 583, 'Continue  →', {
          fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
          backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.finish(true));
      });
    }
  }

}
