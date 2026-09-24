import React, { useState } from 'react';
import { Printer, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { PuzzleData } from '../types';

interface PrintWorksheetProps {
  puzzle: PuzzleData;
  onBack: () => void;
}

export const PrintWorksheet: React.FC<PrintWorksheetProps> = ({ puzzle, onBack }) => {
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const { layout } = puzzle;
  const { width, height, cells, placedWords } = layout;

  const acrossWords = placedWords.filter((w) => w.direction === 'across');
  const downWords = placedWords.filter((w) => w.direction === 'down');

  const cellSize = 30; // standard print size in px

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action bar - Hidden when printing */}
      <div className="print:hidden flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Permainan
        </button>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs md:text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAnswerKey}
              onChange={(e) => setIncludeAnswerKey(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            {includeAnswerKey ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4" />}
            <span>Tampilkan Kunci Jawaban</span>
          </label>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-neutral-950 font-bold text-xs md:text-sm rounded-lg shadow transition"
          >
            <Printer className="w-4 h-4" /> Cetak Lembar Kerja / Simpan PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white text-black p-8 md:p-12 rounded-xl shadow-lg border border-neutral-200 print:border-none print:shadow-none print:p-0 print:m-0 max-w-4xl mx-auto">
        {/* Student Exam / Quiz Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight uppercase">
                {puzzle.title}
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Lembar Kerja Teka-Teki Silang &bull; Isilah kotak dengan jawaban yang tepat
              </p>
            </div>
            <div className="text-right text-xs border border-black p-2 rounded min-w-[120px]">
              <div className="font-bold">NILAI / SKOR:</div>
              <div className="text-lg font-bold mt-1 text-center">_____ / 100</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 border-t border-dashed border-neutral-400 text-xs">
            <div>Nama: ____________________</div>
            <div>Kelas: ___________</div>
            <div>No. Absen: _______</div>
            <div>Tanggal: _________</div>
          </div>
        </div>

        {/* Crossword Grid Container */}
        <div className="flex justify-center my-6 overflow-hidden">
          <div
            className="grid gap-0 border-2 border-black bg-black"
            style={{
              gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
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
                      className="bg-black w-full h-full"
                    />
                  );
                }

                return (
                  <div
                    key={key}
                    className="relative bg-white border border-neutral-800 flex items-center justify-center"
                    style={{ width: cellSize, height: cellSize }}
                  >
                    {cell.number !== undefined && (
                      <span className="absolute top-[1px] left-[2px] text-[8px] font-mono leading-none font-bold text-neutral-800">
                        {cell.number}
                      </span>
                    )}
                    {includeAnswerKey && (
                      <span className="font-mono font-bold text-sm text-neutral-900 uppercase">
                        {cell.letter}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Clues Section in 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-4 border-t-2 border-black">
          {/* Mendatar (Across) */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider border-b border-black pb-1 mb-3 flex items-center justify-between">
              <span>Mendatar</span>
              <span className="text-xs font-normal">({acrossWords.length} pertanyaan)</span>
            </h3>
            <ol className="space-y-2 text-xs leading-relaxed">
              {acrossWords.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span className="font-bold min-w-[20px]">{item.number}.</span>
                  <span>{item.clue}</span>
                  {includeAnswerKey && (
                    <span className="font-mono font-bold text-emerald-700 ml-1">
                      [{item.word}]
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Menurun (Down) */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider border-b border-black pb-1 mb-3 flex items-center justify-between">
              <span>Menurun</span>
              <span className="text-xs font-normal">({downWords.length} pertanyaan)</span>
            </h3>
            <ol className="space-y-2 text-xs leading-relaxed">
              {downWords.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span className="font-bold min-w-[20px]">{item.number}.</span>
                  <span>{item.clue}</span>
                  {includeAnswerKey && (
                    <span className="font-mono font-bold text-emerald-700 ml-1">
                      [{item.word}]
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
