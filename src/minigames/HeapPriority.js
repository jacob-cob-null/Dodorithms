import MinigameBase from './MinigameBase.js';

// Max-Heap priority queue — treat patients highest severity first
// Initial heap (array): [9, 7, 4, 3, 1]
// Names mapped to severities: Nebb=9, Blorp=7, Quell=4, Zyx=3, Krix=1

const HEAP_STATES = [
  [{ n:'Nebb',  s:9 },{ n:'Blorp', s:7 },{ n:'Quell', s:4 },{ n:'Zyx', s:3 },{ n:'Krix', s:1 }],
  [{ n:'Blorp', s:7 },{ n:'Zyx',   s:3 },{ n:'Quell', s:4 },{ n:'Krix',s:1 }],
  [{ n:'Quell', s:4 },{ n:'Zyx',   s:3 },{ n:'Krix',  s:1 }],
  [{ n:'Zyx',   s:3 },{ n:'Krix',  s:1 }],
  [{ n:'Krix',  s:1 }],
  [],
];

// Tree positions for up to 5 nodes (root, L1-left, L1-right, L2-left, L2-right)
const NODE_POS = [
  { x: 400, y: 155 },   // root
  { x: 258, y: 230 },   // left child
  { x: 542, y: 230 },   // right child
  { x: 185, y: 305 },   // left-left
  { x: 330, y: 305 },   // left-right
];

const EDGE_PAIRS = [[0,1],[0,2],[1,3],[1,4]];

export default class HeapPriority extends MinigameBase {
  constructor() { super('HeapPriority'); }

  init(data) {
    this.algorithm  = data.algorithm;
    this.solved     = false;
    this.stateIdx   = 0;
    this.treated    = [];
    this.waiting    = false;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'HeapPriority');

    this.add.text(W / 2, 32, 'Medical Bay — Priority Queue', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 60, `Treat patients by SEVERITY — always the highest first.\nThe max-heap keeps the worst case at the root.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);

    // Heap label
    this.add.text(W / 2, 98, 'Max-Heap (root = highest priority)', {
      fontFamily: 'monospace', fontSize: '11px', color: '#475569',
    }).setOrigin(0.5);

    // Edge graphics (redrawn each state)
    this.edgeG = this.add.graphics();

    // Node containers
    this.nodeGfx    = [];
    this.nodeLabels = [];
    for (let i = 0; i < NODE_POS.length; i++) {
      const g = this.add.graphics();
      const name = this.add.text(NODE_POS[i].x, NODE_POS[i].y - 6, '', {
        fontFamily: 'sans-serif', fontSize: '13px', color: '#f8fafc', fontStyle: 'bold',
      }).setOrigin(0.5);
      const sev = this.add.text(NODE_POS[i].x, NODE_POS[i].y + 11, '', {
        fontFamily: 'monospace', fontSize: '11px', color: '#fbbf24',
      }).setOrigin(0.5);
      this.nodeGfx.push(g);
      this.nodeLabels.push({ name, sev });
    }

    // Treated list panel
    this.add.text(680, 152, 'Treated', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);
    this.add.rectangle(680, 230, 120, 160, 0x1e293b).setStrokeStyle(1, 0x334155);
    this.treatedText = this.add.text(680, 160, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#4ade80',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0);

    // Array representation label
    this.arrayText = this.add.text(W / 2, 360, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#60a5fa',
      align: 'center',
    }).setOrigin(0.5);

    // Message
    this.msgText = this.add.text(W / 2, 392, 'The root is always the highest severity patient.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      wordWrap: { width: 680 }, align: 'center',
    }).setOrigin(0.5);

    // Treat button
    this.treatBtn = this.add.text(W / 2, 438, '  Treat Next Patient  ', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#0f172a',
      backgroundColor: '#ef4444', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.treatBtn.on('pointerover', () => { if (!this.solved) this.treatBtn.setStyle({ backgroundColor: '#fca5a5' }); });
    this.treatBtn.on('pointerout',  () => { if (!this.solved) this.treatBtn.setStyle({ backgroundColor: '#ef4444' }); });
    this.treatBtn.on('pointerdown', () => { if (!this.solved && !this.waiting) this.treatNext(); });

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });

    this._renderState();
  }

  _renderState() {
    const heap = HEAP_STATES[this.stateIdx];
    this.edgeG.clear();

    // Hide all nodes first
    this.nodeGfx.forEach(g => g.clear());
    this.nodeLabels.forEach(l => { l.name.setText(''); l.sev.setText(''); });

    // Draw edges for existing nodes
    EDGE_PAIRS.forEach(([a, b]) => {
      if (a < heap.length && b < heap.length) {
        const pa = NODE_POS[a], pb = NODE_POS[b];
        this.edgeG.lineStyle(2, 0x334155, 0.8);
        this.edgeG.lineBetween(pa.x, pa.y, pb.x, pb.y);
      }
    });

    // Draw nodes
    heap.forEach((patient, i) => {
      const pos  = NODE_POS[i];
      const isRoot = i === 0;
      const g    = this.nodeGfx[i];
      g.fillStyle(isRoot ? 0x7f1d1d : 0x1e293b, 1);
      g.fillCircle(pos.x, pos.y, 28);
      g.lineStyle(2, isRoot ? 0xef4444 : 0x475569, 1);
      g.strokeCircle(pos.x, pos.y, 28);
      this.nodeLabels[i].name.setText(patient.n);
      this.nodeLabels[i].sev.setText(`sev:${patient.s}`);
    });

    // Array repr
    const arrStr = heap.length
      ? `[ ${heap.map(p => p.s).join(', ')} ]`
      : '[ empty ]';
    this.arrayText.setText(`Array: ${arrStr}`);

    // Treated list
    this.treatedText.setText(
      this.treated.map(p => `${p.n} (${p.s})`).join('\n') || '—'
    );
    this.treatedText.y = 162;

    if (heap.length > 0) {
      this.msgText.setText(`Root: ${heap[0].n} — severity ${heap[0].s} (highest). Click to treat.`);
    }
  }

  treatNext() {
    const heap = HEAP_STATES[this.stateIdx];
    if (heap.length === 0) return;

    this.waiting = true;
    const patient = heap[0];
    this.treated.push(patient);

    // Flash root red
    const rootG = this.nodeGfx[0];
    rootG.clear();
    rootG.fillStyle(0xef4444, 1);
    rootG.fillCircle(NODE_POS[0].x, NODE_POS[0].y, 28);

    this.msgText.setText(`Treating ${patient.n} (severity ${patient.s}). Heap re-heapifies…`);
    this.msgText.setStyle({ color: '#ef4444' });

    this.time.delayedCall(600, () => {
      this.stateIdx++;
      this.msgText.setStyle({ color: '#64748b' });

      if (this.stateIdx >= HEAP_STATES.length - 1) {
        this._renderState();
        this._finish();
      } else {
        this._renderState();
        this.waiting = false;
      }
    });
  }

  _finish() {
    this.solved = true;
    this.treatBtn.setAlpha(0);
    this.arrayText.setText('[ empty ] — all patients treated in priority order!');
    this.arrayText.setStyle({ color: '#4ade80' });
    this.msgText.setText(`All patients treated! Order: ${this.treated.map(p => `${p.n}(${p.s})`).join(' → ')}.`);
    this.msgText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 239, 68, 68);

    this.time.delayedCall(700, () => {
      this.add.text(400, 500, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
