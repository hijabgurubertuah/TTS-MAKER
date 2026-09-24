import React from 'react';
import { CrosswordLayout, PlacedWord } from '../types';

interface WorksheetPaperProps {
  title: string;
  layout: CrosswordLayout;
  cellSize: number;
  acrossWords: PlacedWord[];
  downWords: PlacedWord[];
  showAnswerKey: boolean;
  isExportMode?: boolean;
  id?: string;
}

export const WorksheetPaper: React.FC<WorksheetPaperProps> = ({
  title,
  layout,
  cellSize,
  acrossWords,
  downWords,
  showAnswerKey,
  isExportMode = false,
  id,
}) => {
  const displayTitle = title.trim() || 'TEKA-TEKI SILANG';

  return (
    <div
      id={id}
      className={`bg-white text-black ${
        isExportMode
          ? 'p-8'
          : 'p-7 sm:p-8 rounded-2xl shadow-xl border border-neutral-300 print:!border-none print:!shadow-none print:!p-0 print:!m-0 print:!w-full print:!rounded-none'
      } flex flex-col justify-between`}
      style={{
        width: '794px',
        minHeight: '1123px',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* 1. Header: Judul & Kotak Nilai */}
      <div className="border-b-2 border-black pb-2.5 mb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-black min-h-[28px] leading-snug break-words">
              {displayTitle}
            </h1>
            {showAnswerKey && (
              <div className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">
                KUNCI JAWABAN
              </div>
            )}
          </div>
          {/* Kotak Nilai Kosong Standar Guru */}
          <div className="border-2 border-black rounded w-[72px] h-[52px] shrink-0 flex items-center justify-center bg-white" />
        </div>

        {/* Isian Identitas Siswa: Nama dan Kelas */}
        <div className="grid grid-cols-2 gap-4 mt-2.5 pt-2 border-t border-dashed border-neutral-400 text-xs font-semibold text-neutral-900">
          <div>Nama: ____________________________________</div>
          <div>Kelas: _________________</div>
        </div>
      </div>

      {/* 2. Crossword Grid Table */}
      <div className="flex justify-center my-3 overflow-hidden">
        {layout.width > 0 ? (
          <div
            className="grid gap-0 border-2 border-black bg-neutral-100"
            style={{
              gridTemplateColumns: `repeat(${layout.width}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${layout.height}, ${cellSize}px)`,
              backgroundColor: '#f3f4f6',
            }}
          >
            {Array.from({ length: layout.height }).map((_, r) =>
              Array.from({ length: layout.width }).map((_, c) => {
                const key = `${r},${c}`;
                const cell = layout.cells[key];

                if (!cell) {
                  return (
                    <div
                      key={key}
                      className="bg-neutral-200/60 w-full h-full border border-neutral-200/50"
                      style={{ backgroundColor: '#e5e7eb' }}
                    />
                  );
                }

                return (
                  <div
                    key={key}
                    className="relative bg-white border border-black flex items-center justify-center select-none"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: '#ffffff',
                      borderColor: '#000000',
                      borderWidth: '1.5px',
                    }}
                  >
                    {cell.number !== undefined && (
                      <span
                        className="absolute top-[1px] left-[2px] font-mono leading-none font-bold text-black select-none"
                        style={{
                          fontSize: `${Math.max(7, Math.floor(cellSize * 0.28))}px`,
                          color: '#000000',
                        }}
                      >
                        {cell.number}
                      </span>
                    )}
                    {showAnswerKey && (
                      <span
                        className="font-mono font-black text-black uppercase select-none"
                        style={{
                          fontSize: `${Math.max(11, Math.floor(cellSize * 0.55))}px`,
                          color: '#000000',
                        }}
                      >
                        {cell.letter}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="p-8 text-neutral-500 italic text-center text-xs">
            Masukkan kata jawaban dan petunjuk untuk menghasilkan kotak teka-teki silang.
          </div>
        )}
      </div>

      {/* 3. Clues Section: Mendatar & Menurun - 2 Kolom Rapi */}
      <div className="grid grid-cols-2 gap-6 mt-3 pt-2.5 border-t-2 border-black flex-1 overflow-hidden">
        {/* Mendatar (Across) */}
        <div>
          <h3 className="font-extrabold text-xs uppercase tracking-wider border-b-2 border-black pb-1 mb-2 flex items-center justify-between text-black">
            <span>Mendatar</span>
            <span className="text-[11px] font-semibold text-neutral-700">({acrossWords.length} Soal)</span>
          </h3>
          <ol className="space-y-1.5 text-[11px] leading-snug">
            {acrossWords.map((item) => (
              <li key={item.id} className="flex gap-1.5 items-start">
                <span className="font-bold min-w-[18px] text-black">{item.number}.</span>
                <div className="flex-1">
                  <span className="text-black break-words font-medium">{item.clue}</span>
                  {showAnswerKey && (
                    <span className="font-mono font-bold text-emerald-800 ml-1.5 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-300 text-[10px]">
                      [{item.word}]
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Menurun (Down) */}
        <div>
          <h3 className="font-extrabold text-xs uppercase tracking-wider border-b-2 border-black pb-1 mb-2 flex items-center justify-between text-black">
            <span>Menurun</span>
            <span className="text-[11px] font-semibold text-neutral-700">({downWords.length} Soal)</span>
          </h3>
          <ol className="space-y-1.5 text-[11px] leading-snug">
            {downWords.map((item) => (
              <li key={item.id} className="flex gap-1.5 items-start">
                <span className="font-bold min-w-[18px] text-black">{item.number}.</span>
                <div className="flex-1">
                  <span className="text-black break-words font-medium">{item.clue}</span>
                  {showAnswerKey && (
                    <span className="font-mono font-bold text-emerald-800 ml-1.5 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-300 text-[10px]">
                      [{item.word}]
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
