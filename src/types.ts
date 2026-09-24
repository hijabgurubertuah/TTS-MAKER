export type Direction = 'across' | 'down';

export interface WordClue {
  id: string;
  word: string;
  clue: string;
}

export interface PlacedWord {
  id: string;
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: Direction;
  number: number;
}

export interface GridCell {
  row: number;
  col: number;
  letter: string;
  number?: number;
  acrossWordId?: string;
  downWordId?: string;
  acrossIndex?: number;
  downIndex?: number;
}

export interface CrosswordLayout {
  width: number;
  height: number;
  cells: Record<string, GridCell>; // key: `${row},${col}`
  placedWords: PlacedWord[];
  unplacedWords: WordClue[];
  seed: number;
}

export type PrivacySetting = '777' | '770' | '700'; // 777 = Public, 770 = Hidden, 700 = Private

export interface PuzzleData {
  id: string;
  title: string;
  rawInput: string;
  passcode?: string;
  privacy: PrivacySetting;
  seed: number;
  createdAt: number;
  layout: CrosswordLayout;
}
