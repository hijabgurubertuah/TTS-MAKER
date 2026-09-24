import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  RotateCcw,
  KeyRound,
  Eye,
  EyeOff,
  HelpCircle,
  Timer,
  Trophy,
  Share2,
  Printer,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Direction, PlacedWord, PuzzleData } from '../types';
import { CrosswordGrid } from './CrosswordGrid';

interface CrosswordSolverProps {
  puzzle: PuzzleData;
  onOpenEmbed: () => void;
  onOpenPrint: () => void;
  isEmbedView?: boolean;
}

export const CrosswordSolver: React.FC<CrosswordSolverProps> = ({
  puzzle,
  onOpenEmbed,
  onOpenPrint,
  isEmbedView = false,
}) => {
  const { layout } = puzzle;
  const { cells, placedWords } = layout;

  const [userGrid, setUserGrid] = useState<Record<string, string>>({});
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>('across');
  const [checkStatus, setCheckStatus] = useState<Record<string, 'correct' | 'incorrect'> | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);
  const [passcodePromptOpen, setPasscodePromptOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const acrossWords = placedWords.filter((w) => w.direction === 'across');
  const downWords = placedWords.filter((w) => w.direction === 'down');

  // Initialize active cell to the first word's start
  useEffect(() => {
    if (placedWords.length > 0 && !activeCell) {
      const first = placedWords[0];
      setActiveCell({ row: first.row, col: first.col });
      setActiveDirection(first.direction);
    }
  }, [placedWords]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && !isCompleted) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isCompleted]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellChange = (key: string, val: string) => {
    setUserGrid((prev) => {
      const next = { ...prev, [key]: val };
      return next;
    });

    // Clear check status on modify
    if (checkStatus) {
      setCheckStatus(null);
    }
  };

  const handleSelectCell = (row: number, col: number, forceDir?: Direction) => {
    setActiveCell({ row, col });
    if (forceDir) {
      setActiveDirection(forceDir);
    }
  };

  const handleSelectWord = (word: PlacedWord) => {
    setActiveCell({ row: word.row, col: word.col });
    setActiveDirection(word.direction);
  };

  // Find currently active word
  const activeWord = placedWords.find((w) => {
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

  // Check answers
  const handleCheck = () => {
    const newStatus: Record<string, 'correct' | 'incorrect'> = {};
    let totalCells = 0;
    let correctCells = 0;
    let filledCells = 0;

    for (const [key, cell] of Object.entries(cells)) {
      totalCells++;
      const userVal = userGrid[key] || '';
      if (userVal) filledCells++;
      if (userVal === cell.letter) {
        newStatus[key] = 'correct';
        correctCells++;
      } else if (userVal) {
        newStatus[key] = 'incorrect';
      }
    }

    setCheckStatus(newStatus);

    if (correctCells === totalCells) {
      setIsCompleted(true);
      setIsTimerRunning(false);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Reveal active single cell
  const handleRevealCell = () => {
    if (!activeCell) return;
    const key = `${activeCell.row},${activeCell.col}`;
    const cell = cells[key];
    if (cell) {
      handleCellChange(key, cell.letter);
    }
  };

  // Reveal entire active word
  const handleRevealWord = () => {
    if (!activeWord) return;
    const updates: Record<string, string> = {};
    for (let k = 0; k < activeWord.word.length; k++) {
      const r = activeWord.direction === 'across' ? activeWord.row : activeWord.row + k;
      const c = activeWord.direction === 'across' ? activeWord.col + k : activeWord.col;
      const key = `${r},${c}`;
      updates[key] = activeWord.word[k];
    }
    setUserGrid((prev) => ({ ...prev, ...updates }));
    if (checkStatus) setCheckStatus(null);
  };

  // Reset
  const handleReset = () => {
    if (window.confirm('Yakin ingin mengosongkan semua jawaban yang sudah Anda isi?')) {
      setUserGrid({});
      setCheckStatus(null);
      setIsCompleted(false);
      setSeconds(0);
    }
  };

  // Toggle answer key (passcode protected if set)
  const handleToggleAnswerKey = () => {
    if (showAnswerKey) {
      setShowAnswerKey(false);
      return;
    }

    if (puzzle.passcode) {
      setPasscodePromptOpen(true);
      setPasscodeError('');
      setPasscodeInput('');
    } else {
      setShowAnswerKey(true);
    }
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === puzzle.passcode) {
      setShowAnswerKey(true);
      setPasscodePromptOpen(false);
    } else {
      setPasscodeError('Kode sandi salah!');
    }
  };

  // Completion calculation
  const totalCells = Object.keys(cells).length;
  const filledCount = Object.keys(cells).filter((k) => !!userGrid[k]).length;
  const progressPercent = totalCells > 0 ? Math.round((filledCount / totalCells) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top Header / Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            {puzzle.title}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {layout.placedWords.length} pertanyaan &bull; Terisi {filledCount} dari {totalCells} kotak ({progressPercent}%)
          </p>
        </div>

        {/* Timer & Main Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timer badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">
            <Timer className="w-3.5 h-3.5 text-amber-500" />
            <span>{formatTime(seconds)}</span>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleCheck}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Check className="w-3.5 h-3.5" /> Cek Jawaban
          </button>

          <button
            onClick={handleRevealCell}
            title="Buka satu huruf yang sedang dipilih"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs transition"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Buka Huruf
          </button>

          <button
            onClick={handleRevealWord}
            title="Buka satu kata yang sedang aktif"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Buka Kata
          </button>

          <button
            onClick={handleToggleAnswerKey}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition ${
              showAnswerKey
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {puzzle.passcode && <Lock className="w-3 h-3 text-neutral-400" />}
            {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showAnswerKey ? 'Sembunyikan Kunci' : 'Kunci'}</span>
          </button>

          <button
            onClick={handleReset}
            title="Kosongkan jawaban"
            className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {!isEmbedView && (
            <>
              <div className="h-4 w-px bg-neutral-200 dark:border-neutral-700" />
              <button
                onClick={onOpenEmbed}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-lg text-xs transition shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" /> Embed &amp; Bagikan
              </button>

              <button
                onClick={onOpenPrint}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-xs transition shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Soal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Solver Area: Grid on left/top, Clues on right */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Grid */}
        <div className="lg:col-span-7 flex flex-col items-center justify-start bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 md:p-6 shadow-sm overflow-hidden">
          {/* Active Word Clue Banner */}
          <div className="w-full mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg flex items-center justify-between text-xs">
            {activeWord ? (
              <div className="flex items-start gap-2">
                <span className="font-bold px-1.5 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded font-mono">
                  {activeWord.number} {activeWord.direction === 'across' ? 'Mendatar' : 'Menurun'}
                </span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200 text-xs md:text-sm">
                  {activeWord.clue}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">
                  ({activeWord.word.length} huruf)
                </span>
              </div>
            ) : (
              <span className="text-neutral-500 italic">
                Klik salah satu kotak atau daftar petunjuk di samping untuk mulai menjawab.
              </span>
            )}

            {/* Keyboard shortcut hint */}
            <span className="hidden md:inline-block text-[10px] text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
              Spasi / Tab: Ganti Arah
            </span>
          </div>

          {/* Grid Canvas */}
          <div className="w-full flex items-center justify-center overflow-auto p-2 min-h-[360px]">
            <CrosswordGrid
              layout={layout}
              userGrid={userGrid}
              onCellChange={handleCellChange}
              activeCell={activeCell}
              activeDirection={activeDirection}
              onSelectCell={handleSelectCell}
              checkStatus={checkStatus}
              showAnswerKey={showAnswerKey}
            />
          </div>
        </div>

        {/* Right Column: Clue Lists */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 md:p-5 shadow-sm flex flex-col h-[580px]">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider pb-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span>Petunjuk Pertanyaan</span>
            <span className="text-xs font-normal text-neutral-500">
              {placedWords.length} Total
            </span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-6 pt-3 pr-1">
            {/* Across Clues */}
            <div>
              <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center justify-between mb-2">
                <span>Mendatar ({acrossWords.length})</span>
              </h3>
              <div className="space-y-1">
                {acrossWords.map((item) => {
                  const isCurrent = activeWord?.id === item.id;
                  // Check if filled
                  let isAllFilled = true;
                  for (let k = 0; k < item.word.length; k++) {
                    if (!userGrid[`${item.row},${item.col + k}`]) {
                      isAllFilled = false;
                      break;
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectWord(item)}
                      className={`p-2 rounded-lg text-xs cursor-pointer transition flex items-start gap-2 ${
                        isCurrent
                          ? 'bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/80 font-medium'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <span className="font-bold min-w-[20px] font-mono text-neutral-700 dark:text-neutral-300">
                        {item.number}.
                      </span>
                      <div className="flex-1 text-neutral-800 dark:text-neutral-200 leading-snug">
                        {item.clue}
                      </div>
                      {isAllFilled && (
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Down Clues */}
            <div>
              <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center justify-between mb-2">
                <span>Menurun ({downWords.length})</span>
              </h3>
              <div className="space-y-1">
                {downWords.map((item) => {
                  const isCurrent = activeWord?.id === item.id;
                  let isAllFilled = true;
                  for (let k = 0; k < item.word.length; k++) {
                    if (!userGrid[`${item.row + k},${item.col}`]) {
                      isAllFilled = false;
                      break;
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectWord(item)}
                      className={`p-2 rounded-lg text-xs cursor-pointer transition flex items-start gap-2 ${
                        isCurrent
                          ? 'bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/80 font-medium'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <span className="font-bold min-w-[20px] font-mono text-neutral-700 dark:text-neutral-300">
                        {item.number}.
                      </span>
                      <div className="flex-1 text-neutral-800 dark:text-neutral-200 leading-snug">
                        {item.clue}
                      </div>
                      {isAllFilled && (
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Passcode Modal */}
      {passcodePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handlePasscodeSubmit}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 w-full max-w-sm shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-base">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Masukkan Kode Sandi</span>
            </div>
            <p className="text-xs text-neutral-500">
              Kunci jawaban teka-teki silang ini dilindungi oleh pembuatnya.
            </p>
            <input
              type="password"
              autoFocus
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="Masukkan kode sandi..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            {passcodeError && (
              <p className="text-xs text-rose-500 font-medium">{passcodeError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasscodePromptOpen(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg shadow"
              >
                Buka Kunci
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Completion Modal */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-center space-y-4">
            <div className="inline-flex p-3 bg-amber-100 dark:bg-amber-950 text-amber-500 rounded-full">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Luar Biasa! Selesai!
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Anda berhasil menyelesaikan teka-teki silang <strong>&quot;{puzzle.title}&quot;</strong> dengan sempurna.
            </p>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex justify-around text-xs font-mono">
              <div>
                <span className="text-neutral-500 block">Waktu</span>
                <span className="font-bold text-base text-neutral-900 dark:text-white">
                  {formatTime(seconds)}
                </span>
              </div>
              <div className="w-px bg-neutral-300 dark:bg-neutral-700" />
              <div>
                <span className="text-neutral-500 block">Akurasi</span>
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                  100%
                </span>
              </div>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setIsCompleted(false)}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg shadow transition"
              >
                Tutup &amp; Lihat Hasil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
