import MinigameBase from './MinigameBase.js';

// Branch-and-Bound — Travelling Salesman on 4 stations (A,B,C,D), start/end at A
// Distance matrix:
//   A-B:4  A-C:2  A-D:6
//   B-C:3  B-D:5
//   C-D:1
//
// All routes from A:
//   A→B→C→D→A:  4+3+1+6 = 14
//   A→B→D→C→A:  4+5+1+2 = 12  ← optimal
//   A→C→B→D→A:  2+3+5+6 = 16
//   A→C→D→B→A:  2+1+5+4 = 12  ← also optimal
//   A→D→B→C→A:  6+5+3+2 = 16
//   A→D→C→B→A:  6+1+3+4 = 14
//
// Pre-scripted B&B decisions (5 steps):
//   1. Expand A→B  (cost=4, bound=9)  — bound < ∞, expand
//   2. Expand A→C  (cost=2, bound=7)  — bound < best(∞), expand
//   3. Prune  A→D  (cost=6, bound=10) — bound=10 > best after step 4 (=12)...
//      Actually reorder: we expand cheapest bound first.
//
// Simplified scripted sequence for clarity:
//   Card 1: [A→C]        cost=2,  bound=7   → Expand  (best=∞)
//   Card 2: [A→C→D]      cost=3,  bound=8   → Expand
//   Card 3: [A→C→D→B]    cost=8,  bound=12  → Complete route! best=12
//   Card 4: [A→B]        cost=4,  bound=9   → Expand (bound=9 < best=12)
//   Card 5: [A→B→D]      cost=9,  bound=14  → Prune  (bound=14 ≥ best=12)

const DECISIONS = [
  {
    route: 'A → C',
    cost: 2,
    bound: 7,
    bestBefore: '∞',
    action: 'expand',
    explanation: 'Bound 7 < best (∞) — worth exploring.',
  },
  {
    route: 'A → C → D',
    cost: 3,
    bound: 8,
    bestBefore: '∞',
    action: 'expand',
    explanation: 'Bound 8 < best (∞) — still promising.',
  },
  {
    route: 'A → C → D → B → A',
    cost: 12,
    bound: 12,
    bestBefore: '∞',
    action: 'complete',
    explanation: 'Complete tour! Cost = 12. New best = 12.',
  },
  {
    route: 'A → B',
    cost: 4,
    bound: 9,
    bestBefore: '12',
    action: 'expand',
    explanation: 'Bound 9 < best (12) — might beat current best.',
  },
  {
    route: 'A → B → D',
    cost: 9,
    bound: 14,
    bestBefore: '12',
    action: 'prune',
    explanation: 'Bound 14 ≥ best (12) — cannot improve. Prune!',
  },
];

export default class RouteOptimizer extends MinigameBase {
  constructor() { super('RouteOptimizer'); }

  init(data) {
    this.algorithm   = data.algorithm;
    this.solved      = false;
    this.stepIdx     = 0;
    this.bestRoute   = Infinity;
    this.waiting     = false;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'RouteOptimizer');

    this.add.text(W / 2, 26, 'Emergency Route Optimizer — Branch-and-Bound', {
      fontFamily: 'sans-serif', fontSize: '19px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 52, 'Find the cheapest fuel route A→?→?→?→A.\nFor each partial route: Expand if it might beat the best; Prune if it cannot.', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    // ── Station map (left) ───────────────────────────────────────────────
    const stations = [
      { label: 'A', x: 140, y: 220 },
      { label: 'B', x: 260, y: 155 },
      { label: 'C', x: 260, y: 290 },
      { label: 'D', x: 360, y: 220 },
    ];
    const mapEdges = [
      [0,1,4],[0,2,2],[0,3,6],[1,2,3],[1,3,5],[2,3,1],
    ];
    const mapG = this.add.graphics();
    mapEdges.forEach(([a,b,w]) => {
      mapG.lineStyle(1, 0x334155, 0.8);
      mapG.lineBetween(stations[a].x, stations[a].y, stations[b].x, stations[b].y);
      const mx = (stations[a].x + stations[b].x) / 2;
      const my = (stations[a].y + stations[b].y) / 2;
      this.add.text(mx, my - 8, String(w), {
        fontFamily: 'monospace', fontSize: '10px', color: '#f59e0b',
      }).setOrigin(0.5);
    });
    stations.forEach(s => {
      const sg = this.add.graphics();
      sg.fillStyle(0x1e293b, 1);
      sg.fillCircle(s.x, s.y, 18);
      sg.lineStyle(2, 0x475569, 0.8);
      sg.strokeCircle(s.x, s.y, 18);
      this.add.text(s.x, s.y, s.label, {
        fontFamily: 'monospace', fontSize: '14px', color: '#f8fafc', fontStyle: 'bold',
      }).setOrigin(0.5);
    });

    // ── Best route tracker ───────────────────────────────────────────────
    this.add.text(500, 100, 'Best known:', {
      fontFamily: 'monospace', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);
    this.bestText = this.add.text(500, 130, '∞', {
      fontFamily: 'monospace', fontSize: '32px', color: '#fbbf24', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Progress
    this.progressText = this.add.text(500, 165, `Step 1 / ${DECISIONS.length}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#475569',
    }).setOrigin(0.5);

    // ── Active decision card ─────────────────────────────────────────────
    this.add.text(W / 2, 348, 'Current partial route:', {
      fontFamily: 'monospace', fontSize: '11px', color: '#475569',
    }).setOrigin(0.5);

    const cardBg = this.add.rectangle(W / 2, 388, 600, 62, 0x1e293b).setStrokeStyle(1, 0x475569);
    this.cardRoute = this.add.text(W / 2, 376, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#f8fafc', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.cardMeta = this.add.text(W / 2, 398, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8',
    }).setOrigin(0.5);

    // ── Buttons ──────────────────────────────────────────────────────────
    this.expandBtn = this.add.text(300, 456, '  Expand 🔍  ', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#0f172a',
      backgroundColor: '#38bdf8', padding: { x: 22, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.expandBtn.on('pointerdown', () => { if (!this.solved && !this.waiting) this._decide('expand'); });

    this.pruneBtn = this.add.text(500, 456, '  Prune ✂  ', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#0f172a',
      backgroundColor: '#ef4444', padding: { x: 22, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.pruneBtn.on('pointerdown', () => { if (!this.solved && !this.waiting) this._decide('prune'); });

    // ── Feedback ─────────────────────────────────────────────────────────
    this.feedbackText = this.add.text(W / 2, 502, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });

    this._showStep();
  }

  _showStep() {
    if (this.stepIdx >= DECISIONS.length) { this._finish(); return; }
    const d = DECISIONS[this.stepIdx];
    this.cardRoute.setText(d.route);
    this.cardMeta.setText(`cost so far: ${d.cost}   |   lower bound: ${d.bound}   |   best known: ${d.bestBefore}`);
    this.progressText.setText(`Step ${this.stepIdx + 1} / ${DECISIONS.length}`);

    if (d.action === 'complete') {
      // Auto-handle complete routes — no expand/prune choice
      this.expandBtn.setAlpha(0.3);
      this.pruneBtn.setAlpha(0.3);
      this.feedbackText.setText('Complete tour found! Recording as new best. Click to continue.');
      this.feedbackText.setStyle({ color: '#4ade80' });
      // Provide a continue-style click
      const anyBtn = this.add.text(400, 530, 'Record Best  →', {
        fontFamily: 'sans-serif', fontSize: '15px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 20, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      anyBtn.on('pointerdown', () => {
        if (this.waiting) return;
        this.waiting = true;
        this.bestRoute = 12;
        this.bestText.setText('12');
        this.bestText.setStyle({ color: '#4ade80' });
        anyBtn.destroy();
        this.expandBtn.setAlpha(1);
        this.pruneBtn.setAlpha(1);
        this.stepIdx++;
        this.waiting = false;
        this._showStep();
      });
    } else {
      this.expandBtn.setAlpha(1);
      this.pruneBtn.setAlpha(1);
      this.feedbackText.setText('Should we explore this route further, or is it already too costly?');
      this.feedbackText.setStyle({ color: '#64748b' });
    }
  }

  _decide(choice) {
    if (this.stepIdx >= DECISIONS.length) return;
    this.waiting = true;
    const d = DECISIONS[this.stepIdx];
    const correct = d.action === choice;

    if (!correct) {
      this.playIncorrectSfx();
      this.cameras.main.shake(180, 0.005);
      const hint = d.action === 'prune'
        ? `Bound (${d.bound}) ≥ best (${d.bestBefore}) — no improvement possible. Prune it!`
        : `Bound (${d.bound}) < best (${d.bestBefore}) — still promising. Expand it!`;
      this.feedbackText.setText(hint);
      this.feedbackText.setStyle({ color: '#ef4444' });
      this.waiting = false;
      return;
    }

    // Correct
    const btn = choice === 'expand' ? this.expandBtn : this.pruneBtn;
    const color = choice === 'expand' ? 0x14532d : 0x3b1515;
    // Flash the chosen button
    this.feedbackText.setText(d.explanation);
    this.feedbackText.setStyle({ color: '#4ade80' });

    this.time.delayedCall(400, () => {
      this.stepIdx++;
      this.waiting = false;
      this._showStep();
    });
  }

  _finish() {
    this.solved = true;
    this.expandBtn.setAlpha(0);
    this.pruneBtn.setAlpha(0);

    this.cardRoute.setText('Optimal route: A → C → D → B → A  (or A → B → D → C → A)');
    this.cardMeta.setText('Total cost: 12  ✓  Found by exploring promising branches, pruning the rest.');
    this.feedbackText.setText('Branch-and-Bound avoided checking all 6 routes — only the promising ones!');
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 168, 85, 247);

    this.time.delayedCall(700, () => {
      this.add.text(400, 556, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
