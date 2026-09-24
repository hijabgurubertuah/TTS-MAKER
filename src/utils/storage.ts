import { PuzzleData } from '../types';
import { generateCrossword, parseRawInput } from './crosswordGenerator';
import { PRESETS } from './presets';

const STORAGE_KEY = 'crossword_maker_puzzles_v1';

export function getSavedPuzzles(): PuzzleData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with default preset
      const defaultPreset = PRESETS[0];
      const items = parseRawInput(defaultPreset.content);
      const layout = generateCrossword(items, 42);
      const initial: PuzzleData = {
        id: 'preset-sains-biologi',
        title: defaultPreset.title,
        rawInput: defaultPreset.content,
        privacy: '777',
        seed: 42,
        createdAt: Date.now(),
        layout,
      };
      savePuzzles([initial]);
      return [initial];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read puzzles from localStorage', e);
    return [];
  }
}

export function savePuzzles(puzzles: PuzzleData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
  } catch (e) {
    console.error('Failed to save puzzles to localStorage', e);
  }
}

export function saveSinglePuzzle(puzzle: PuzzleData): void {
  const all = getSavedPuzzles();
  const existingIdx = all.findIndex((p) => p.id === puzzle.id);
  if (existingIdx >= 0) {
    all[existingIdx] = puzzle;
  } else {
    all.unshift(puzzle);
  }
  savePuzzles(all);
}

export function deletePuzzle(id: string): PuzzleData[] {
  const all = getSavedPuzzles().filter((p) => p.id !== id);
  savePuzzles(all);
  return all;
}

// Compress / encode puzzle data to shareable string
export function encodePuzzleToParam(puzzle: Pick<PuzzleData, 'title' | 'rawInput' | 'seed'>): string {
  try {
    const data = JSON.stringify({
      t: puzzle.title,
      r: puzzle.rawInput,
      s: puzzle.seed,
    });
    return encodeURIComponent(btoa(unescape(encodeURIComponent(data))));
  } catch {
    return '';
  }
}

export function decodePuzzleFromParam(param: string): { title: string; rawInput: string; seed: number } | null {
  try {
    const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(param))));
    const parsed = JSON.parse(jsonStr);
    if (parsed.t && parsed.r) {
      return {
        title: parsed.t,
        rawInput: parsed.r,
        seed: typeof parsed.s === 'number' ? parsed.s : 1,
      };
    }
  } catch (e) {
    console.warn('Could not decode puzzle parameter', e);
  }
  return null;
}
