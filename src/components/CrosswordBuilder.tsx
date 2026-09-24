import React, { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Sparkles, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import { generateCrossword, parseRawInput } from '../utils/crosswordGenerator';
import { CrosswordLayout, PrivacySetting, PuzzleData } from '../types';
import { PRESETS } from '../utils/presets';
import { CrosswordGrid } from './CrosswordGrid';

interface CrosswordBuilderProps {
  initialPuzzle?: PuzzleData | null;
  onSave: (puzzle: PuzzleData) => void;
  onCancel?: () => void;
}

export const CrosswordBuilder: React.FC<CrosswordBuilderProps> = ({
  initialPuzzle,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialPuzzle?.title || '');
  const [rawWords, setRawWords] = useState(
    initialPuzzle?.rawInput || PRESETS[0].content
  );
  const [passcode, setPasscode] = useState(initialPuzzle?.passcode || '');
  const [showPasscode, setShowPasscode] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacySetting>(
    initialPuzzle?.privacy || '777'
  );
  const [seed, setSeed] = useState<number>(initialPuzzle?.seed || 42);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  // Parse and generate layout whenever rawWords or seed changes
  const parsedItems = useMemo(() => parseRawInput(rawWords), [rawWords]);

  const layout: CrosswordLayout = useMemo(() => {
    return generateCrossword(parsedItems, seed);
  }, [parsedItems, seed]);

  const handleNextSeed = () => setSeed((prev) => prev + 1);
  const handlePrevSeed = () => setSeed((prev) => (prev > 1 ? prev - 1 : 9999));

  const handleLoadPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = PRESETS[index];
    setTitle(preset.title);
    setRawWords(preset.content);
    setSeed(Math.floor(Math.random() * 500) + 1);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Silakan masukkan judul teka-teki silang terlebih dahulu.');
      return;
    }
    if (parsedItems.length === 0 || layout.placedWords.length === 0) {
      alert('Silakan masukkan minimal 2 kata dan petunjuk.');
      return;
    }

    const newPuzzle: PuzzleData = {
      id: initialPuzzle?.id || `puzzle-${Date.now()}`,
      title: title.trim(),
      rawInput: rawWords,
      passcode: passcode.trim() || undefined,
      privacy,
      seed,
      createdAt: initialPuzzle?.createdAt || Date.now(),
      layout,
    };

    onSave(newPuzzle);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {initialPuzzle ? 'Edit Teka-Teki Silang' : 'Buat Teka-Teki Silang Baru'}
            </h2>
            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Ketikkan kata jawaban diikuti spasi dan petunjuk/pertanyaan (1 baris per kata).
            </p>
          </div>

          {/* Quick preset selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Contoh Tema:
            </span>
            <select
              value={selectedPresetIndex}
              onChange={(e) => handleLoadPreset(Number(e.target.value))}
              className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {PRESETS.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title Input */}
        <div className="mt-5 space-y-1.5">
          <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Judul Teka-Teki Silang <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Teka-Teki Silang IPA Biologi Kelas 8"
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
          />
        </div>

        {/* Input Textarea and Preview Side by Side */}
        <div className="mt-5 grid lg:grid-cols-12 gap-6">
          {/* Left Column: Word & Clues input */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Daftar Kata Jawaban &amp; Petunjuk
                </label>
                <span className="text-xs text-neutral-500 font-mono">
                  {parsedItems.length} pasangan kata
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                Format: <code>JAWABAN Petunjuk pertanyaan...</code> (pisahkan dengan spasi).
              </p>
              <textarea
                rows={12}
                value={rawWords}
                onChange={(e) => setRawWords(e.target.value)}
                placeholder="FOTOSINTESIS Pembuatan makanan pada tumbuhan&#10;KLOROFIL Zat hijau daun&#10;OKSIGEN Gas hasil fotosintesis"
                className="w-full font-mono text-xs md:text-sm p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition resize-y leading-relaxed"
              />
            </div>

            {/* Passcode Protection */}
            <div className="bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2">
              <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Kode Sandi (Opsional)
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Kode sandi untuk mengedit atau melihat kunci"
                  className="w-full px-3 py-2 pr-10 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Melindungi kunci jawaban agar murid atau peserta tidak bisa langsung melihat solusi.
              </p>
            </div>

            {/* Privacy Radio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Pengaturan Privasi
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    value="777"
                    checked={privacy === '777'}
                    onChange={() => setPrivacy('777')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">Publik (Gratis &amp; Terbuka)</span>
                    <p className="text-[11px] text-neutral-500">
                      Bisa dimainkan dan di-embed oleh siapapun tanpa batasan akses.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    value="770"
                    checked={privacy === '770'}
                    onChange={() => setPrivacy('770')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">Tersembunyi (Hanya yang Punya Link)</span>
                    <p className="text-[11px] text-neutral-500">
                      Hanya orang yang memiliki link langsung atau kode embed yang dapat mengakses.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Live Grid Preview */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Pratinjau Tata Letak
                </span>
                <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded font-mono">
                  {layout.width}x{layout.height} kotak
                </span>
              </div>

              {/* Seed Switcher (Left / Right Layout generator buttons like CrosswordLabs!) */}
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={handlePrevSeed}
                  title="Susunan Layout Sebelumnya"
                  className="p-1 rounded hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-medium px-1 text-neutral-600 dark:text-neutral-400">
                  Variasi #{seed}
                </span>
                <button
                  type="button"
                  onClick={handleNextSeed}
                  title="Susunan Layout Berikutnya"
                  className="p-1 rounded hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Layout Status */}
            <div className="mb-3">
              {layout.unplacedWords.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Semua kata (<strong>{layout.placedWords.length} kata</strong>) berhasil disusun saling menyilang!
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>
                      {layout.placedWords.length} dari {parsedItems.length} kata tersusun. Ada {layout.unplacedWords.length} kata belum terhubung:
                    </span>
                    <div className="mt-1 font-mono text-[11px] font-semibold">
                      {layout.unplacedWords.map((u) => u.word).join(', ')}
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Tip: Tekan tombol panah ◀ ▶ untuk mencoba variasi layout lain, atau tambahkan kata yang memiliki huruf sama.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Grid Canvas Preview */}
            <div className="flex-1 min-h-[340px] flex items-center justify-center p-4 bg-neutral-100 dark:bg-neutral-950/80 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-auto">
              <CrosswordGrid
                layout={layout}
                userGrid={{}}
                showAnswerKey={true}
                readOnly={true}
                compact={layout.width > 16 || layout.height > 16}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold rounded-lg shadow transition flex items-center gap-2 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Simpan &amp; Buat Kode Embed
          </button>
        </div>
      </div>
    </form>
  );
};
