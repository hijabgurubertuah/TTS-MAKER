import React from 'react';
import { CrosswordLayout, PlacedWord } from '../types';
import { Scissors } from 'lucide-react';

interface TTSData {
  title: string;
  layout: CrosswordLayout;
  acrossWords: PlacedWord[];
  downWords: PlacedWord[];
}

interface WorksheetPaper2PerPageProps {
  topTTS: TTSData;
  bottomTTS: TTSData;
  showAnswerKey: boolean;
  isExportMode?: boolean;
  id?: string;
}

// Single Slot (Half A4 Page) Component
const SingleSlot: React.FC<{
  data: TTSData;
  showAnswerKey: boolean;
  slotLabel?: string;
}> = ({ data, showAnswerKey, slotLabel }) => {
  const { title, layout, acrossWords, downWords } = data;
  const displayTitle = title.trim() || 'TEKA-TEKI SILANG';

  // Dynamic cell size for half-page slot:
  // Left column width is ~370px, available height is ~340px
  const maxW = 370;
  const maxH = 340;
  const gridW = layout.width || 1;
  const gridH = layout.height || 1;
  const calcW = Math.floor(maxW / gridW);
  const calcH = Math.floor(maxH / gridH);
  const cellSize = Math.min(24, Math.max(14, Math.min(calcW, calcH)));

  return (
    <div
      className="flex flex-col justify-between h-[495px] overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Slot Header: Judul & Nilai & Identitas */}
      <div className="border-b-2 border-black pb-1.5">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight uppercase text-black leading-tight truncate">
                {displayTitle}
              </h2>
              {slotLabel && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-neutral-200 text-neutral-800 rounded">
                  {slotLabel}
                </span>
              )}
              {showAnswerKey && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-400 rounded text-[9px] font-bold uppercase">
                  KUNCI JAWABAN
                </span>
              )}
            </div>
          </div>
          {/* Kotak Nilai */}
          <div className="border-2 border-black rounded w-[56px] h-[34px] shrink-0 flex items-center justify-center bg-white">
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter">Nilai</span>
          </div>
        </div>

        {/* Isian Identitas Siswa */}
        <div className="grid grid-cols-2 gap-4 mt-1 pt-1 border-t border-dashed border-neutral-400 text-[10px] font-semibold text-neutral-900">
          <div>Nama: ______________________________</div>
          <div>Kelas: ____________</div>
        </div>
      </div>

      {/* Slot Body: 2 Kolom (Kiri: Grid TTS, Kanan: Soal Mendatar & Menurun) */}
      <div className="flex gap-4 items-start flex-1 mt-2 overflow-hidden">
        {/* Kolom Kiri (~55%): Grid TTS */}
        <div className="w-[370px] shrink-0 flex justify-center items-center h-full">
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
                        borderWidth: '1.2px',
                      }}
                    >
                      {cell.number !== undefined && (
                        <span
                          className="absolute top-[0.5px] left-[1.5px] font-mono leading-none font-bold text-black select-none"
                          style={{
                            fontSize: `${Math.max(6, Math.floor(cellSize * 0.28))}px`,
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
                            fontSize: `${Math.max(9, Math.floor(cellSize * 0.55))}px`,
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
            <div className="p-4 text-neutral-500 italic text-center text-[10px]">
              Kotak TTS kosong.
            </div>
          )}
        </div>

        {/* Kolom Kanan (~45%): Soal Mendatar & Menurun */}
        <div className="flex-1 flex flex-col gap-2 h-full overflow-hidden text-[10.5px] leading-tight">
          {/* Mendatar */}
          {acrossWords.length > 0 && (
            <div>
              <div className="font-extrabold text-[10px] uppercase tracking-wider border-b border-black pb-0.5 mb-1 flex items-center justify-between text-black">
                <span>Mendatar</span>
                <span className="text-[9px] font-semibold text-neutral-600">({acrossWords.length})</span>
              </div>
              <ol className="space-y-1">
                {acrossWords.map((item) => (
                  <li key={item.id} className="flex gap-1 items-start">
                    <span className="font-bold min-w-[14px] text-black shrink-0">{item.number}.</span>
                    <div className="flex-1">
                      <span className="text-black break-words font-medium">{item.clue}</span>
                      {showAnswerKey && (
                        <span className="font-mono font-bold text-emerald-800 ml-1 bg-emerald-50 px-0.5 rounded border border-emerald-300 text-[9px]">
                          [{item.word}]
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Menurun */}
          {downWords.length > 0 && (
            <div>
              <div className="font-extrabold text-[10px] uppercase tracking-wider border-b border-black pb-0.5 mb-1 flex items-center justify-between text-black">
                <span>Menurun</span>
                <span className="text-[9px] font-semibold text-neutral-600">({downWords.length})</span>
              </div>
              <ol className="space-y-1">
                {downWords.map((item) => (
                  <li key={item.id} className="flex gap-1 items-start">
                    <span className="font-bold min-w-[14px] text-black shrink-0">{item.number}.</span>
                    <div className="flex-1">
                      <span className="text-black break-words font-medium">{item.clue}</span>
                      {showAnswerKey && (
                        <span className="font-mono font-bold text-emerald-800 ml-1 bg-emerald-50 px-0.5 rounded border border-emerald-300 text-[9px]">
                          [{item.word}]
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const WorksheetPaper2PerPage: React.FC<WorksheetPaper2PerPageProps> = ({
  topTTS,
  bottomTTS,
  showAnswerKey,
  isExportMode = false,
  id,
}) => {
  return (
    <div
      id={id}
      className={`bg-white text-black ${
        isExportMode
          ? 'p-[30px]'
          : 'p-[30px] rounded-2xl shadow-xl border border-neutral-300 print:!border-none print:!shadow-none print:!p-0 print:!m-0 print:!w-full print:!rounded-none'
      } flex flex-col justify-between`}
      style={{
        width: '794px',
        height: '1123px',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Slot 1: Atas */}
      <SingleSlot
        data={topTTS}
        showAnswerKey={showAnswerKey}
      />

      {/* Garis Pemotong Kertas Tengah (Cut Line) */}
      <div className="relative my-2 py-1 flex items-center justify-center">
        <div className="w-full border-t-2 border-dashed border-neutral-400" />
        <div className="absolute bg-white px-2 text-[10px] text-neutral-500 font-mono flex items-center gap-1">
          <Scissors className="w-3 h-3 text-neutral-600 rotate-90" />
          <span>Gunting di sini</span>
        </div>
      </div>

      {/* Slot 2: Bawah */}
      <SingleSlot
        data={bottomTTS}
        showAnswerKey={showAnswerKey}
      />
    </div>
  );
};
