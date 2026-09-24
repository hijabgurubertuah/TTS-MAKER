import React, { useState, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { generateCrossword, parseRawInput } from '../utils/crosswordGenerator';
import { CrosswordLayout } from '../types';

export const WorksheetGenerator: React.FC = () => {
  const [title, setTitle] = useState('');
  const [rawWords, setRawWords] = useState('');
  const [seed, setSeed] = useState(42);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const chatGptPrompt =
    'Jadilah Ahli dalam membuat Jawaban dan soal TTS mata pelajaran ...  kelas.... Buatkan soal dan jawaban untuk dijadikan teka teki silang dengan jawaban hanya berupa satu kata atau istilah penting untuk materi....... Dengan format JAWABAN[spasi]PETUNJUK atau SOAL, satu soal per baris.';

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(chatGptPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = chatGptPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const worksheetRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea agar kata-kata tidak tertutupi
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight + 4, 180)}px`;
    }
  }, [rawWords]);

  // Parse items and generate crossword
  const parsedItems = useMemo(() => parseRawInput(rawWords), [rawWords]);

  const layout: CrosswordLayout = useMemo(() => {
    return generateCrossword(parsedItems, seed);
  }, [parsedItems, seed]);

  const handleNextSeed = () => setSeed((prev) => prev + 1);
  const handlePrevSeed = () => setSeed((prev) => (prev > 1 ? prev - 1 : 9999));

  const acrossWords = layout.placedWords.filter((w) => w.direction === 'across');
  const downWords = layout.placedWords.filter((w) => w.direction === 'down');

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export as PNG image using html2canvas
  const handleExportImage = async () => {
    if (!worksheetRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(worksheetRef.current, {
        scale: 2, // High resolution for crisp printing
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeTitle = title.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'teka-teki-silang';
      link.download = `${safeTitle}${showAnswerKey ? '_kunci_jawaban' : ''}.png`;
      link.href = dataUrl;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Gagal mengekspor gambar. Silakan gunakan tombol Download PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const cellSize = 32; // Standard cell size in px

  return (
    <div className="space-y-6">
      {/* Top Input Card: Judul dan Daftar Kata Jawaban (Hidden when printing) */}
      <div className="print:hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
            Judul
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masukkan judul lembar kerja..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
              JAWABAN &lt;spasi&gt; Soal
            </label>
            <span className="text-xs text-neutral-500 font-mono">
              {parsedItems.length} Kata terdeteksi
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={rawWords}
            onChange={(e) => setRawWords(e.target.value)}
            wrap="off"
            placeholder="JAWABAN Petunjuk pertanyaan...&#10;JAWABAN2 Petunjuk pertanyaan kedua..."
            className="w-full font-mono text-xs md:text-sm p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed shadow-2xs whitespace-pre overflow-x-auto overflow-y-hidden resize-y transition-[height] duration-75"
            style={{ minHeight: '180px' }}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-neutral-500 mt-1 gap-1">
            <span>Format: <code>JAWABAN Petunjuk pertanyaan</code> (pisahkan dengan spasi, 1 baris per kata)</span>
            {layout.unplacedWords.length > 0 && (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {layout.unplacedWords.length} kata belum bersilangan (coba ganti variasi di bawah)
              </span>
            )}
          </div>

          {/* Petunjuk Pembuatan Jawaban & Soal TTS Menggunakan ChatGPT */}
          <div className="mt-3 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <span>💡</span> Petunjuk pembuatan jawaban dan soal TTS menggunakan ChatGPT:
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                title="Salin prompt untuk ChatGPT"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold rounded-lg transition text-xs cursor-pointer shadow-2xs"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Prompt</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700/70 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] sm:text-xs leading-relaxed select-all">
              {chatGptPrompt}
            </div>
          </div>
        </div>
      </div>

      {/* Pratinjau Lembar Kerja (Worksheet) */}
      <div
        ref={worksheetRef}
        className="bg-white text-black p-8 md:p-12 rounded-2xl shadow-xl border border-neutral-300 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full"
        style={{ minHeight: '950px' }}
      >
        {/* Header Soal Siswa */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-black min-h-[36px]">
                {title.trim()}
              </h1>
            </div>
            {/* Kotak Nilai Kosong Tanpa Tulisan */}
            <div className="border-2 border-black rounded w-[85px] h-[65px]" />
          </div>

          {/* Isian Identitas Siswa: Hanya Nama dan Kelas */}
          <div className="grid grid-cols-2 gap-6 mt-4 pt-3 border-t border-dashed border-neutral-500 text-xs font-semibold">
            <div>Nama: ____________________________________</div>
            <div>Kelas: _________________</div>
          </div>
        </div>

        {/* Crossword Grid Table dengan latar abu-abu pucat */}
        <div className="flex justify-center my-6 overflow-hidden">
          {layout.width > 0 ? (
            <div
              className="grid gap-0 border-2 border-neutral-900 bg-neutral-100 shadow-xs"
              style={{
                gridTemplateColumns: `repeat(${layout.width}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${layout.height}, ${cellSize}px)`,
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
                      />
                    );
                  }

                  return (
                    <div
                      key={key}
                      className="relative bg-white border border-neutral-900 flex items-center justify-center"
                      style={{ width: cellSize, height: cellSize }}
                    >
                      {cell.number !== undefined && (
                        <span className="absolute top-[1px] left-[2px] text-[8px] font-mono leading-none font-bold text-neutral-900 select-none">
                          {cell.number}
                        </span>
                      )}
                      {showAnswerKey && (
                        <span className="font-mono font-black text-sm text-black uppercase select-none">
                          {cell.letter}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="p-8 text-neutral-500 italic text-center">
              Masukkan kata jawaban dan petunjuk untuk menghasilkan kotak teka-teki silang.
            </div>
          )}
        </div>

        {/* Clues Section: Mendatar & Menurun */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-4 border-t-2 border-black">
          {/* Mendatar (Across) */}
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider border-b-2 border-black pb-1 mb-3 flex items-center justify-between text-black">
              <span>Mendatar</span>
              <span className="text-xs font-semibold text-neutral-700">({acrossWords.length} Soal)</span>
            </h3>
            <ol className="space-y-2 text-xs leading-relaxed">
              {acrossWords.map((item) => (
                <li key={item.id} className="flex gap-2 items-start">
                  <span className="font-black min-w-[22px] text-neutral-900">{item.number}.</span>
                  <div className="flex-1">
                    <span className="text-black">{item.clue}</span>
                    {showAnswerKey && (
                      <span className="font-mono font-bold text-emerald-800 ml-1.5 bg-emerald-50 px-1 rounded border border-emerald-300">
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
            <h3 className="font-extrabold text-sm uppercase tracking-wider border-b-2 border-black pb-1 mb-3 flex items-center justify-between text-black">
              <span>Menurun</span>
              <span className="text-xs font-semibold text-neutral-700">({downWords.length} Soal)</span>
            </h3>
            <ol className="space-y-2 text-xs leading-relaxed">
              {downWords.map((item) => (
                <li key={item.id} className="flex gap-2 items-start">
                  <span className="font-black min-w-[22px] text-neutral-900">{item.number}.</span>
                  <div className="flex-1">
                    <span className="text-black">{item.clue}</span>
                    {showAnswerKey && (
                      <span className="font-mono font-bold text-emerald-800 ml-1.5 bg-emerald-50 px-1 rounded border border-emerald-300">
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

      {/* Tombol Kontrol & Aksi (Diletakkan di Bawah Pratinjau, Hidden saat Print) */}
      <div className="print:hidden max-w-4xl mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl shadow-md">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {/* Tombol Sebelumnya */}
          <button
            type="button"
            onClick={handlePrevSeed}
            title="Susunan Layout Sebelumnya"
            className="h-11 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1 text-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Sebelumnya</span>
          </button>

          {/* Kolom Variasi */}
          <div className="h-11 px-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-xs flex items-center justify-center text-center">
            <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
              Variasi {seed}
            </span>
          </div>

          {/* Tombol Berikutnya */}
          <button
            type="button"
            onClick={handleNextSeed}
            title="Susunan Layout Berikutnya"
            className="h-11 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1 text-xs cursor-pointer"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Checkbox Kunci Jawaban */}
          <label className="h-11 px-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:border-amber-400 transition text-xs font-bold text-neutral-800 dark:text-neutral-200 select-none">
            <input
              type="checkbox"
              checked={showAnswerKey}
              onChange={(e) => setShowAnswerKey(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-[11px] sm:text-xs">Kunci Jawaban</span>
          </label>

          {/* Tombol Download PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="h-11 px-3 bg-neutral-900 hover:bg-black text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-neutral-950 font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          {/* Tombol Download Gambar */}
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isExporting}
            className="h-11 px-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-neutral-950" />
                <span>Tersimpan!</span>
              </>
            ) : isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>Download Gambar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
