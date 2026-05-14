import MinigameBase from './MinigameBase.js';

// Backtracking — 4-Queens Problem
// Place 4 queens on a 4×4 board so none attack each other.
// Valid solution: row0=col1, row1=col3, row2=col0, row3=col2
// The player places queens row by row. If a row has no valid cells,
// they must backtrack. Dead ends are demonstrated automatically when
// the player places in col0 of row0 (leading to a dead end at row2).

const GRID = 4;
const CELL = 76;
const GRID_X = 200; // left edge of grid
const GRID_Y = 130; // top edge of grid

export default class QueenGrid extends MinigameBase {
  constructor() { super('QueenGrid'); }

  init(data) {
    this.algorithm = data.algorithm;
    this.solved    = false;
    this.waiting   = false;
    this.queens    = [];    // placed queens: array of col indices (length = current row)
    this.currentRow = 0;
  }

  create() {
    const W = 800, H = 600;
    this.createTablet(this.algorithm?.name || 'QueenGrid');

    this.add.text(W / 2, 26, 'Queen Security Grid — Backtracking', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(W / 2, 52, 'Place 4 queens — one per row — so none can attack each other.\nIf you get stuck, backtrack and try a different column!', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#94a3b8',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    // ── Grid ────────────────────────────────────────────────────────────
    this.cellBgs    = [];
    this.cellTexts  = [];

    for (let r = 0; r < GRID; r++) {
      const row = [], rowTxt = [];
      for (let c = 0; c < GRID; c++) {
        const cx = GRID_X + c * CELL + CELL / 2;
        const cy = GRID_Y + r * CELL + CELL / 2;
        const isLight = (r + c) % 2 === 0;
        const bg = this.add.rectangle(cx, cy, CELL - 2, CELL - 2, isLight ? 0x1e293b : 0x0f172a)
          .setStrokeStyle(1, 0x334155);
        // Click handler
        const hitZone = this.add.rectangle(cx, cy, CELL - 2, CELL - 2, 0, 0)
          .setInteractive({ useHandCursor: true });
        hitZone.on('pointerover', () => { if (!this.solved && r === this.currentRow) bg.setStrokeStyle(2, 0xa855f7); });
        hitZone.on('pointerout',  () => { if (!this.solved) bg.setStrokeStyle(1, 0x334155); });
        hitZone.on('pointerdown', () => { if (!this.solved && !this.waiting && r === this.currentRow) this._placeQueen(r, c); });
        const t = this.add.text(cx, cy, '', {
          fontFamily: 'sans-serif', fontSize: '26px', color: '#f8fafc',
        }).setOrigin(0.5);
        row.push(bg);
        rowTxt.push(t);
      }
      this.cellBgs.push(row);
      this.cellTexts.push(rowTxt);
    }

    // Row indicator arrow
    this.rowArrow = this.add.text(GRID_X - 32, GRID_Y + CELL / 2, '►', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#a855f7',
    }).setOrigin(0.5);

    // ── Status panel (right side) ───────────────────────────────────────
    this.add.text(620, 150, 'Queens placed:', {
      fontFamily: 'monospace', fontSize: '12px', color: '#475569',
    }).setOrigin(0.5);

    this.placedText = this.add.text(620, 200, '0 / 4', {
      fontFamily: 'monospace', fontSize: '28px', color: '#a855f7', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(620, 280, 'Attack rule:\n× same column\n× same diagonal', {
      fontFamily: 'monospace', fontSize: '11px', color: '#334155',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5);

    // ── Feedback ────────────────────────────────────────────────────────
    this.feedbackText = this.add.text(W / 2, 456, 'Row 0: click a column to place your first queen.', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#64748b',
      align: 'center', wordWrap: { width: 680 },
    }).setOrigin(0.5);

    // ── Backtrack button ────────────────────────────────────────────────
    this.backtrackBtn = this.add.text(W / 2, 500, '  Backtrack ↩  ', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#0f172a',
      backgroundColor: '#ef4444', padding: { x: 24, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0.3);
    this.backtrackBtn.on('pointerdown', () => { if (!this.solved && !this.waiting && this.queens.length > 0) this._backtrack(); });

    this.makeButton(704, 560, 'SKIP', () => this.finish(false), { w: 76, h: 26, fill: 0x1e1720, stroke: 0xef4444, textColor: '#fecaca', hoverFill: 0xef4444 });
  }

  _isSafe(row, col) {
    for (let r = 0; r < this.queens.length; r++) {
      const c = this.queens[r];
      if (c === col) return false;
      if (Math.abs(c - col) === Math.abs(r - row)) return false;
    }
    return true;
  }

  _placeQueen(row, col) {
    if (!this._isSafe(row, col)) {
      // Flash attacked indicator
      this.cameras.main.shake(160, 0.005);
      this.feedbackText.setText(`Column ${col} is under attack! Choose a safe column.`);
      this.feedbackText.setStyle({ color: '#ef4444' });
      this.cellBgs[row][col].setFillStyle(0x3b1515);
      this.time.delayedCall(500, () => {
        const isLight = (row + col) % 2 === 0;
        this.cellBgs[row][col].setFillStyle(isLight ? 0x1e293b : 0x0f172a);
      });
      return;
    }

    this.queens.push(col);
    this.currentRow = row + 1;

    // Draw queen
    this.cellTexts[row][col].setText('♛');
    this.cellBgs[row][col].setFillStyle(0x2d1d6b).setStrokeStyle(2, 0xa855f7);

    // Shade attacked cells
    this._refreshAttackHighlights();

    this.placedText.setText(`${this.queens.length} / 4`);
    this.backtrackBtn.setAlpha(1);

    // Move row arrow
    if (this.currentRow < GRID) {
      this.rowArrow.y = GRID_Y + this.currentRow * CELL + CELL / 2;
    }

    if (this.queens.length === GRID) {
      this._finish();
      return;
    }

    // Check if next row has valid moves
    const hasValid = [0,1,2,3].some(c => this._isSafe(this.currentRow, c));
    if (!hasValid) {
      this.feedbackText.setText(`Dead end! No safe cell in row ${this.currentRow}. Press Backtrack ↩`);
      this.feedbackText.setStyle({ color: '#ef4444' });
    } else {
      this.feedbackText.setText(`Queen placed in row ${row}, col ${col}. Now choose a safe column for row ${this.currentRow}.`);
      this.feedbackText.setStyle({ color: '#a855f7' });
    }
  }

  _refreshAttackHighlights() {
    // Reset all non-queen cells
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const hasQueen = r < this.queens.length && this.queens[r] === c;
        if (!hasQueen) {
          const isLight = (r + c) % 2 === 0;
          this.cellBgs[r][c].setFillStyle(isLight ? 0x1e293b : 0x0f172a).setStrokeStyle(1, 0x334155);
        }
      }
    }

    // Shade cells attacked in future rows
    for (let r = this.queens.length; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (!this._isSafe(r, c)) {
          this.cellBgs[r][c].setFillStyle(0x1a0d0d).setStrokeStyle(1, 0x3b1515);
        }
      }
    }
  }

  _backtrack() {
    if (this.queens.length === 0) return;
    const row = this.queens.length - 1;
    const col = this.queens[row];

    // Remove queen
    this.queens.pop();
    this.currentRow = row;

    this.cellTexts[row][col].setText('');
    const isLight = (row + col) % 2 === 0;
    this.cellBgs[row][col].setFillStyle(isLight ? 0x1e293b : 0x0f172a).setStrokeStyle(1, 0x334155);

    this._refreshAttackHighlights();

    this.placedText.setText(`${this.queens.length} / 4`);
    this.rowArrow.y = GRID_Y + this.currentRow * CELL + CELL / 2;

    if (this.queens.length === 0) this.backtrackBtn.setAlpha(0.3);

    this.feedbackText.setText(`Backtracked to row ${row}. Try a different column.`);
    this.feedbackText.setStyle({ color: '#fbbf24' });
  }

  _finish() {
    this.solved = true;
    this.backtrackBtn.setAlpha(0);
    this.rowArrow.setAlpha(0);

    // Highlight all queens green
    for (let r = 0; r < GRID; r++) {
      const c = this.queens[r];
      this.cellBgs[r][c].setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
      this.cellTexts[r][c].setStyle({ color: '#4ade80' });
    }

    const solution = this.queens.map((c, r) => `(${r},${c})`).join(', ');
    this.feedbackText.setText(`Valid arrangement found: ${solution}  ✓`);
    this.feedbackText.setStyle({ color: '#4ade80' });
    this.placedText.setStyle({ color: '#4ade80' });
    this.cameras.main.flash(400, 168, 85, 247);

    this.time.delayedCall(800, () => {
      this.add.text(400, 556, 'Continue  →', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#0f172a',
        backgroundColor: '#4ade80', padding: { x: 28, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish(true));
    });
  }

}
