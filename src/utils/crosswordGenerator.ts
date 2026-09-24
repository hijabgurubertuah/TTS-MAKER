import { CrosswordLayout, Direction, GridCell, PlacedWord, WordClue } from '../types';

// Simple deterministic random generator based on numeric seed
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function parseRawInput(raw: string): WordClue[] {
  const lines = raw.split('\n');
  const items: WordClue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Format: ANSWER clue text...
    // Support either space separator or tab or pipe
    const firstSpace = trimmed.search(/\s/);
    if (firstSpace === -1) {
      // Single word without clue
      const word = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (word.length >= 2) {
        items.push({
          id: `w-${i}-${word}`,
          word,
          clue: `Kata: ${word}`,
        });
      }
    } else {
      const rawWord = trimmed.slice(0, firstSpace);
      const rawClue = trimmed.slice(firstSpace).trim();
      const word = rawWord.replace(/[^a-zA-Z]/g, '').toUpperCase();
      if (word.length >= 2 && rawClue.length > 0) {
        items.push({
          id: `w-${i}-${word}`,
          word,
          clue: rawClue,
        });
      }
    }
  }

  return items;
}

interface TempPlacedWord {
  id: string;
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: Direction;
}

export function generateCrossword(items: WordClue[], seed: number = 1): CrosswordLayout {
  if (items.length === 0) {
    return {
      width: 0,
      height: 0,
      cells: {},
      placedWords: [],
      unplacedWords: [],
      seed,
    };
  }

  const rng = pseudoRandom(seed);

  // Shuffle items slightly based on seed while giving priority to longer words
  const sorted = [...items].sort((a, b) => {
    const diff = b.word.length - a.word.length;
    if (diff !== 0) return diff;
    return rng() - 0.5;
  });

  const placed: TempPlacedWord[] = [];
  const unplaced: WordClue[] = [];
  const grid = new Map<string, string>(); // "row,col" => letter

  // Helper to get letter at
  const getAt = (r: number, c: number) => grid.get(`${r},${c}`);

  // Place first word horizontally at center
  const first = sorted[0];
  placed.push({
    id: first.id,
    word: first.word,
    clue: first.clue,
    row: 0,
    col: 0,
    direction: 'across',
  });
  for (let c = 0; c < first.word.length; c++) {
    grid.set(`0,${c}`, first.word[c]);
  }

  // Attempt to place remaining words
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const bestPositions: {
      row: number;
      col: number;
      direction: Direction;
      intersections: number;
      score: number;
    }[] = [];

    // Find all intersections with already placed words
    for (const p of placed) {
      for (let pi = 0; pi < p.word.length; pi++) {
        const pLetter = p.word[pi];

        for (let ci = 0; ci < current.word.length; ci++) {
          if (current.word[ci] !== pLetter) continue;

          // Perpendicular direction
          const candidateDir: Direction = p.direction === 'across' ? 'down' : 'across';
          let candRow = 0;
          let candCol = 0;

          if (candidateDir === 'down') {
            // Intersects p (across) at (p.row, p.col + pi)
            candRow = p.row - ci;
            candCol = p.col + pi;
          } else {
            // Intersects p (down) at (p.row + pi, p.col)
            candRow = p.row + pi;
            candCol = p.col - ci;
          }

          // Check if candidate placement is valid
          let isValid = true;
          let intersections = 0;

          // Before start cell must be empty
          if (candidateDir === 'across') {
            if (getAt(candRow, candCol - 1) !== undefined) isValid = false;
            if (getAt(candRow, candCol + current.word.length) !== undefined) isValid = false;
          } else {
            if (getAt(candRow - 1, candCol) !== undefined) isValid = false;
            if (getAt(candRow + current.word.length, candCol) !== undefined) isValid = false;
          }

          if (!isValid) continue;

          for (let k = 0; k < current.word.length; k++) {
            const r = candidateDir === 'across' ? candRow : candRow + k;
            const c = candidateDir === 'across' ? candCol + k : candCol;
            const existing = getAt(r, c);

            if (existing !== undefined) {
              if (existing !== current.word[k]) {
                isValid = false;
                break;
              }
              intersections++;
            } else {
              // If empty cell, ensure perpendicular neighbors are empty so words don't run parallel
              if (candidateDir === 'across') {
                if (getAt(r - 1, c) !== undefined || getAt(r + 1, c) !== undefined) {
                  isValid = false;
                  break;
                }
              } else {
                if (getAt(r, c - 1) !== undefined || getAt(r, c + 1) !== undefined) {
                  isValid = false;
                  break;
                }
              }
            }
          }

          if (isValid && intersections > 0) {
            // Score candidate based on bounding box compactness and intersection count
            // Calculate hypothetical bounding box
            let minR = candRow;
            let maxR = candidateDir === 'down' ? candRow + current.word.length - 1 : candRow;
            let minC = candCol;
            let maxC = candidateDir === 'across' ? candCol + current.word.length - 1 : candCol;

            for (const item of placed) {
              minR = Math.min(minR, item.row);
              maxR = Math.max(maxR, item.direction === 'down' ? item.row + item.word.length - 1 : item.row);
              minC = Math.min(minC, item.col);
              maxC = Math.max(maxC, item.direction === 'across' ? item.col + item.word.length - 1 : item.col);
            }

            const w = maxC - minC + 1;
            const h = maxR - minR + 1;
            const area = w * h;
            const ratioDiff = Math.abs(w / h - 1.0);

            // Higher score = better
            const score = intersections * 100 - area * 0.5 - ratioDiff * 50 + rng() * 5;

            bestPositions.push({
              row: candRow,
              col: candCol,
              direction: candidateDir,
              intersections,
              score,
            });
          }
        }
      }
    }

    if (bestPositions.length > 0) {
      bestPositions.sort((a, b) => b.score - a.score);
      const chosen = bestPositions[0];

      placed.push({
        id: current.id,
        word: current.word,
        clue: current.clue,
        row: chosen.row,
        col: chosen.col,
        direction: chosen.direction,
      });

      // Write to grid
      for (let k = 0; k < current.word.length; k++) {
        const r = chosen.direction === 'across' ? chosen.row : chosen.row + k;
        const c = chosen.direction === 'across' ? chosen.col + k : chosen.col;
        grid.set(`${r},${c}`, current.word[k]);
      }
    } else {
      unplaced.push(current);
    }
  }

  // Normalize grid bounds
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  for (const p of placed) {
    minRow = Math.min(minRow, p.row);
    minCol = Math.min(minCol, p.col);
    if (p.direction === 'across') {
      maxRow = Math.max(maxRow, p.row);
      maxCol = Math.max(maxCol, p.col + p.word.length - 1);
    } else {
      maxRow = Math.max(maxRow, p.row + p.word.length - 1);
      maxCol = Math.max(maxCol, p.col);
    }
  }

  if (placed.length === 0) {
    return {
      width: 0,
      height: 0,
      cells: {},
      placedWords: [],
      unplacedWords: sorted,
      seed,
    };
  }

  const width = maxCol - minCol + 1;
  const height = maxRow - minRow + 1;

  // Shift all placed words to 0-indexed coords
  const shiftedWords: TempPlacedWord[] = placed.map((w) => ({
    ...w,
    row: w.row - minRow,
    col: w.col - minCol,
  }));

  // Build cell map and assign clue numbers
  const cells: Record<string, GridCell> = {};

  for (const pw of shiftedWords) {
    for (let k = 0; k < pw.word.length; k++) {
      const r = pw.direction === 'across' ? pw.row : pw.row + k;
      const c = pw.direction === 'across' ? pw.col + k : pw.col;
      const key = `${r},${c}`;

      if (!cells[key]) {
        cells[key] = {
          row: r,
          col: c,
          letter: pw.word[k],
        };
      }

      if (pw.direction === 'across') {
        cells[key].acrossWordId = pw.id;
        cells[key].acrossIndex = k;
      } else {
        cells[key].downWordId = pw.id;
        cells[key].downIndex = k;
      }
    }
  }

  // Assign numbers row by row, col by col
  let clueNumber = 1;
  const wordNumberMap = new Map<string, number>();

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const key = `${r},${c}`;
      const cell = cells[key];
      if (!cell) continue;

      let isStartOfAnyWord = false;

      // Check if starts across word
      const acrossStartWord = shiftedWords.find(
        (w) => w.direction === 'across' && w.row === r && w.col === c
      );
      if (acrossStartWord) {
        wordNumberMap.set(acrossStartWord.id, clueNumber);
        isStartOfAnyWord = true;
      }

      // Check if starts down word
      const downStartWord = shiftedWords.find(
        (w) => w.direction === 'down' && w.row === r && w.col === c
      );
      if (downStartWord) {
        wordNumberMap.set(downStartWord.id, clueNumber);
        isStartOfAnyWord = true;
      }

      if (isStartOfAnyWord) {
        cell.number = clueNumber;
        clueNumber++;
      }
    }
  }

  const finalPlacedWords: PlacedWord[] = shiftedWords.map((pw) => ({
    ...pw,
    number: wordNumberMap.get(pw.id) || 1,
  }));

  // Sort placed words by clue number
  finalPlacedWords.sort((a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1));

  return {
    width,
    height,
    cells,
    placedWords: finalPlacedWords,
    unplacedWords: unplaced,
    seed,
  };
}

/**
 * Searches across multiple seeds (1 to 60) to find the most compact, best-interlocking crossword layout.
 * Specifically tuned to optimize empty space utilization for 1_per_page and 2_per_page layouts.
 */
export function findOptimalSeedForLayout(
  items: WordClue[],
  layoutType: '1_per_page' | '2_per_page',
  currentSeed: number = 1
): number {
  if (items.length === 0) return 42;
  let bestSeed = currentSeed;
  let bestScore = -Infinity;

  for (let s = 1; s <= 60; s++) {
    const res = generateCrossword(items, s);
    const unplaced = res.unplacedWords.length;
    const w = res.width || 1;
    const h = res.height || 1;
    const area = w * h;

    if (layoutType === '2_per_page') {
      // 2 per page (half A4 slot):
      // 1. Zero unplaced words is top priority
      // 2. Tighter compact area
      // 3. Aspect ratio between 1.0 and 1.25 fits side-by-side slot perfectly
      const ratio = w / h;
      const ratioPenalty = Math.abs(ratio - 1.15) * 35;
      const dimPenalty = (w > 18 ? (w - 18) * 80 : 0) + (h > 15 ? (h - 15) * 80 : 0);
      const score = 10000 - unplaced * 2500 - area * 2 - ratioPenalty - dimPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestSeed = s;
      }
    } else {
      // 1 per page:
      const ratio = w / h;
      const ratioPenalty = Math.abs(ratio - 1.0) * 25;
      const score = 10000 - unplaced * 2500 - area - ratioPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestSeed = s;
      }
    }
  }

  return bestSeed;
}

