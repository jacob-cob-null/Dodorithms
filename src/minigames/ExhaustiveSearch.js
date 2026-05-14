import MinigameBase from './MinigameBase.js';

// 4 cities — find shortest route visiting each once
const CITIES = ['Paris', 'Neo-Manila', 'New York', 'Tokyo'];
const ICONS  = ['🗼', '🌴', '🗽', '⛩'];

// Distance matrix (km) — symmetric
const D = [
  [0,     10700, 5800,  9700 ], // Paris
  [10700, 0,     13700, 3000 ], // Neo-Manila
  [5800,  13700, 0,     10800], // New York
  [9700,  3000,  10800, 0    ], // Tokyo
];

// Generate all 4! = 24 permutations
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    permutations(rest).forEach(p => result.push([arr[i], ...p]));
  }
  return result;
}

function routeDist(perm) {
  let d = 0;
  for (let i = 0; i < perm.length - 1; i++) d += D[perm[i]][perm[i + 1]];
  return d;
}

const ALL_ROUTES = permutations([0, 1, 2, 3]);
const BEST_IDX   = ALL_ROUTES.reduce((bi, r, i) => routeDist(r) < routeDist(ALL_ROUTES[bi]) ? i : bi, 0);
const BEST_DIST  = routeDist(ALL_ROUTES[BEST_IDX]);

export default class ExhaustiveSearch extends MinigameBase {
  constructor() {
    super('ExhaustiveSearch');
  }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.routeIdx  = 0;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'ExhaustiveSearch');

    this.add.text(W / 2, 34, 'Tour Routing — Exhaustive Search', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 64, `4 cities = 4! = 24 possible routes. Try every single one to guarantee the shortest.`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center',
    }).setOrigin(0.5);

    // City nodes on a mini-map
    const NODE_POS = [
      { x: 200, y: 200 }, // Paris
      { x: 590, y: 270 }, // Neo-Manila
      { x: 170, y: 320 }, // New York
      { x: 600, y: 150 }, // Tokyo
    ];

    this.cityNodes = NODE_POS;

    // Route line graphics
    this.routeG = this.add.graphics();

    // Draw city nodes
    NODE_POS.forEach((pos, i) => {
      const g = this.add.graphics();
      g.fillStyle(0x1e4d7a, 1);
      g.fillCircle(pos.x, pos.y, 18);
      g.lineStyle(2, 0x38bdf8, 0.7);
      g.strokeCircle(pos.x, pos.y, 18);
      this.add.text(pos.x, pos.y, ICONS[i], {
        fontFamily: 'sans-serif', fontSize: '16px',
      }).setOrigin(0.5);
      this.add.text(pos.x, pos.y + 28, CITIES[i], {
        fontFamily: 'sans-serif', fontSize: '11px', color: '#94a3b8',
      }).setOrigin(0.5);
    });

    // Route counter
    this.add.text(W / 2, 378, 'Routes tried:', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#64748b',
    }).setOrigin(0.5);

    this.counterText = this.add.text(W / 2, 400, '0 / 24', {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#38bdf8', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Current route + distance
    this.routeText = this.add.text(W / 2, 432, '—', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8',
      align: 'center',
    }).setOrigin(0.5);

    this.bestText = this.add.text(W / 2, 456, 'Best so far: —', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#fbbf24',
    }).setOrigin(0.5);
    this.bestDist = Infinity;
    this.bestRoute = null;

    // Try Route button
    this.tryBtn = this.add.text(W / 2, 496, '  Try Next Route  ', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#0f172a',
      backgroundColor: '#38bdf8', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tryBtn.on('pointerover', () => { if (!this.solved) this.tryBtn.setStyle({ backgroundColor: '#7dd3fc' }); });
    this.tryBtn.on('pointerout',  () => { if (!this.solved) this.tryBtn.setStyle({ backgroundColor: '#38bdf8' }); });
    this.tryBtn.on('pointerdown', () => { if (!this.solved) this.tryNextRoute(); });

    // Auto-complete button (appears after 5 manual routes)
    this.autoBtn = this.add.text(W / 2, 544, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#818cf8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.autoBtn.on('pointerdown', () => {
      if (!this.solved && this.routeIdx >= 5) this.autoComplete();
    });

    this.feedbackText = this.add.text(W / 2, 574, 'Click "Try Next Route" to test each permutation.', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#64748b',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });
  }

  tryNextRoute() {
    if (this.routeIdx >= ALL_ROUTES.length) {
      this._showResult();
      return;
    }
    this._testRoute(this.routeIdx);
    this.routeIdx++;

    if (this.routeIdx === 5) {
      this.autoBtn.setText(`  Auto-complete remaining ${ALL_ROUTES.length - 5} routes  `);
    }
    if (this.routeIdx >= ALL_ROUTES.length) {
      this._showResult();
    }
  }

  _testRoute(idx) {
    const perm = ALL_ROUTES[idx];
    const dist = routeDist(perm);
    const names = perm.map(i => CITIES[i]).join(' → ');

    this.counterText.setText(`${idx + 1} / ${ALL_ROUTES.length}`);
    this.routeText.setText(`${names}  =  ${dist.toLocaleString()} km`);

    // Draw route on map
    this.routeG.clear();
    for (let i = 0; i < perm.length - 1; i++) {
      const a = this.cityNodes[perm[i]];
      const b = this.cityNodes[perm[i + 1]];
      this.routeG.lineStyle(2, dist === BEST_DIST ? 0x4ade80 : 0x38bdf8, 0.6);
      this.routeG.lineBetween(a.x, a.y, b.x, b.y);
    }

    if (dist < this.bestDist) {
      this.bestDist  = dist;
      this.bestRoute = names;
      this.bestText.setText(`Best so far: ${names}  (${dist.toLocaleString()} km)`);
    }
  }

  autoComplete() {
    if (this.solved) return;
    this.autoBtn.setText('');

    // Run remaining routes quickly
    let i = this.routeIdx;
    const tick = () => {
      if (i >= ALL_ROUTES.length) {
        this._showResult();
        return;
      }
      this._testRoute(i);
      i++;
      this.routeIdx = i;
      this.time.delayedCall(60, tick);
    };
    tick();
  }

  _showResult() {
    this.solved = true;
    this.tryBtn.setAlpha(0);
    this.autoBtn.setText('');

    const best = ALL_ROUTES[BEST_IDX];
    this._testRoute(BEST_IDX); // draw best route in green

    this.routeG.clear();
    for (let i = 0; i < best.length - 1; i++) {
      const a = this.cityNodes[best[i]];
      const b = this.cityNodes[best[i + 1]];
      this.routeG.lineStyle(3, 0x4ade80, 0.9);
      this.routeG.lineBetween(a.x, a.y, b.x, b.y);
    }

    this.counterText.setText(`24 / 24`);
    this.bestText.setStyle({ color: '#4ade80', fontSize: '14px' });
    this.bestText.setText(`Shortest: ${best.map(i => CITIES[i]).join(' → ')}  (${BEST_DIST.toLocaleString()} km)`);

    this.feedbackText.setText(`All 24 routes checked. Optimal found! With 5 cities: 5! = 120 routes. With 10: 3,628,800.`);
    this.feedbackText.setStyle({ color: '#94a3b8' });
    this.cameras.main.flash(400, 74, 222, 128);

    this.time.delayedCall(800, () => {
      this.add.text(400, 574, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
