import React, { useRef, useEffect } from 'react';
import { CrosswordLayout, Direction } from '../types';

interface CrosswordGridProps {
  layout: CrosswordLayout;
  userGrid: Record<string, string>;
  onCellChange?: (key: string, val: string) => void;
  activeCell?: { row: number; col: number } | null;
  activeDirection?: Direction;
  onSelectCell?: (row: number, col: number, forceDirection?: Direction) => void;
  checkStatus?: Record<string, 'correct' | 'incorrect'> | null;
  showAnswerKey?: boolean;
  readOnly?: boolean;
  compact?: boolean;
  highlightedWordId?: string | null;
}

export const CrosswordGrid: React.FC<CrosswordGridProps> = ({
  layout,
  userGrid,
  onCellChange,
  activeCell,
  activeDirection = 'across',
  onSelectCell,
  checkStatus,
  showAnswerKey = false,
  readOnly = false,
  compact = false,
  highlightedWordId = null,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { width, height, cells, placedWords } = layout;

  // Find active word ID if any
  const activeWord = placedWords.find((w) => {
    if (highlightedWordId && w.id === highlightedWordId) return true;
    if (!activeCell) return false;
    if (w.direction !== activeDirection) return false;
    if (w.direction === 'across') {
      return (
        w.row === activeCell.row &&
        activeCell.col >= w.col &&
        activeCell.col < w.col + w.word.length
      );
    } else {
      return (
        w.col === activeCell.col &&
        activeCell.row >= w.row &&
        activeCell.row < w.row + w.word.length
      );
    }
  });

  // Keep hidden input focused for mobile or desktop keyboard typing
  useEffect(() => {
    if (!readOnly && activeCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeCell, readOnly]);

  if (width === 0 || height === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-neutral-400 italic bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
        Belum ada kata yang tersusun. Masukkan kata &amp; petunjuk di samping.
      </div>
    );
  }

  const cellSize = compact ? 24 : 36; // px per cell

  // Move cursor forward
  const moveCursor = (forward: boolean) => {
    if (!activeCell || !onSelectCell) return;
    const delta = forward ? 1 : -1;
    let nextRow = activeCell.row;
    let nextCol = activeCell.col;

    if (activeDirection === 'across') {
      nextCol += delta;
    } else {
      nextRow += delta;
    }

    const nextKey = `${nextRow},${nextCol}`;
    if (cells[nextKey]) {
      onSelectCell(nextRow, nextCol, activeDirection);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly || !activeCell || !onSelectCell) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (activeDirection !== 'across') {
        onSelectCell(activeCell.row, activeCell.col, 'across');
      } else {
        const nextKey = `${activeCell.row},${activeCell.col + 1}`;
        if (cells[nextKey]) onSelectCell(activeCell.row, activeCell.col + 1, 'across');
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (activeDirection !== 'across') {
        onSelectCell(activeCell.row, activeCell.col, 'across');
      } else {
        const prevKey = `${activeCell.row},${activeCell.col - 1}`;
        if (cells[prevKey]) onSelectCell(activeCell.row, activeCell.col - 1, 'across');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeDirection !== 'down') {
        onSelectCell(activeCell.row, activeCell.col, 'down');
      } else {
        const nextKey = `${activeCell.row + 1},${activeCell.col}`;
        if (cells[nextKey]) onSelectCell(activeCell.row + 1, activeCell.col, 'down');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeDirection !== 'down') {
        onSelectCell(activeCell.row, activeCell.col, 'down');
      } else {
        const prevKey = `${activeCell.row - 1},${activeCell.col}`;
        if (cells[prevKey]) onSelectCell(activeCell.row - 1, activeCell.col, 'down');
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      const currentKey = `${activeCell.row},${activeCell.col}`;
      if (userGrid[currentKey]) {
        onCellChange?.(currentKey, '');
      } else {
        moveCursor(false);
        const prevKey =
          activeDirection === 'across'
            ? `${activeCell.row},${activeCell.col - 1}`
            : `${activeCell.row - 1},${activeCell.col}`;
        if (cells[prevKey]) {
          onCellChange?.(prevKey, '');
        }
      }
    } else if (e.key === ' ' || e.key === 'Tab') {
      e.preventDefault();
      // Toggle direction
      onSelectCell(
        activeCell.row,
        activeCell.col,
        activeDirection === 'across' ? 'down' : 'across'
      );
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const upper = e.key.toUpperCase();
      const currentKey = `${activeCell.row},${activeCell.col}`;
      onCellChange?.(currentKey, upper);
      moveCursor(true);
    }
  };

  return (
    <div
      className="relative select-none inline-block outline-none focus:outline-none"
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input to capture mobile keyboard typing */}
      {!readOnly && (
        <input
          ref={inputRef}
          type="text"
          className="sr-only"
          aria-hidden="true"
          value=""
          onChange={(e) => {
            const val = e.target.value;
            if (val && activeCell) {
              const char = val.slice(-1).toUpperCase();
              if (/^[A-Z]$/.test(char)) {
                onCellChange?.(`${activeCell.row},${activeCell.col}`, char);
                moveCursor(true);
              }
            }
          }}
        />
      )}

      <div
        className="grid gap-0 border-2 border-neutral-800 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 shadow-md rounded-sm overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
          width: width * cellSize,
          height: height * cellSize,
        }}
      >
        {Array.from({ length: height }).map((_, r) =>
          Array.from({ length: width }).map((_, c) => {
            const key = `${r},${c}`;
            const cell = cells[key];

            if (!cell) {
              return (
                <div
                  key={key}
                  className="bg-neutral-200/60 dark:bg-neutral-800/80 w-full h-full border border-neutral-200/40 dark:border-neutral-800/50"
                />
              );
            }

            const isSelected = activeCell?.row === r && activeCell?.col === c;

            // Check if cell belongs to currently active/highlighted word
            const isInActiveWord =
              activeWord &&
              (activeWord.direction === 'across'
                ? activeWord.row === r &&
                  c >= activeWord.col &&
                  c < activeWord.col + activeWord.word.length
                : activeWord.col === c &&
                  r >= activeWord.row &&
                  r < activeWord.row + activeWord.word.length);

            const userVal = userGrid[key] || '';
            const status = checkStatus ? checkStatus[key] : null;

            let bgColor = 'bg-white dark:bg-neutral-900';
            if (isSelected) {
              bgColor = 'bg-amber-300 dark:bg-amber-500/80 text-neutral-950';
            } else if (isInActiveWord) {
              bgColor = 'bg-amber-100 dark:bg-amber-900/40';
            }

            let statusColor = 'text-neutral-900 dark:text-neutral-100';
            if (status === 'correct') {
              bgColor = isSelected ? 'bg-emerald-300' : 'bg-emerald-100 dark:bg-emerald-950/60';
              statusColor = 'text-emerald-800 dark:text-emerald-300 font-bold';
            } else if (status === 'incorrect') {
              bgColor = isSelected ? 'bg-rose-300' : 'bg-rose-100 dark:bg-rose-950/60';
              statusColor = 'text-rose-700 dark:text-rose-300 font-bold';
            }

            const displayLetter = showAnswerKey ? cell.letter : userVal;

            return (
              <div
                key={key}
                onClick={() => {
                  if (readOnly || !onSelectCell) return;
                  if (isSelected) {
                    // Toggle direction if already clicked
                    onSelectCell(
                      r,
                      c,
                      activeDirection === 'across' ? 'down' : 'across'
                    );
                  } else {
                    onSelectCell(r, c);
                  }
                }}
                className={`relative flex items-center justify-center border-[0.5px] border-neutral-400 dark:border-neutral-700 transition-colors duration-100 ${bgColor} ${
                  readOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-90'
                }`}
                style={{ width: cellSize, height: cellSize }}
              >
                {/* Clue number */}
                {cell.number !== undefined && (
                  <span
                    className={`absolute top-[1px] left-[2px] font-mono leading-none select-none text-neutral-600 dark:text-neutral-400 ${
                      compact ? 'text-[7px]' : 'text-[9px]'
                    }`}
                  >
                    {cell.number}
                  </span>
                )}

                {/* Letter */}
                <span
                  className={`font-mono font-bold leading-none select-none uppercase ${
                    compact ? 'text-xs' : 'text-base'
                  } ${statusColor}`}
                >
                  {displayLetter}
                </span>

                {/* Answer key indicator if active */}
                {showAnswerKey && userVal && userVal !== cell.letter && (
                  <span className="absolute bottom-[1px] right-[2px] text-[8px] text-rose-500 font-mono line-through">
                    {userVal}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
