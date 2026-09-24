import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  School,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { PuzzleData } from '../types';
import { encodePuzzleToParam } from '../utils/storage';

interface EmbedTabProps {
  puzzle: PuzzleData;
  onGoToBuilder: () => void;
}

export const EmbedTab: React.FC<EmbedTabProps> = ({ puzzle, onGoToBuilder }) => {
  const [copied, setCopied] = useState(false);
  const [embedWidth, setEmbedWidth] = useState('100%');
  const [embedHeight, setEmbedHeight] = useState('650');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Generate URL for embedding
  const encodedParam = encodePuzzleToParam({
    title: puzzle.title,
    rawInput: puzzle.rawInput,
    seed: puzzle.seed,
  });

  const baseUrl = window.location.origin + window.location.pathname;
  const embedUrl = `${baseUrl}?embed=1&puzzleData=${encodedParam}`;

  const iframeSnippet = `<iframe
  src="${embedUrl}"
  width="${embedWidth}"
  height="${embedHeight}"
  style="border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);"
  title="${puzzle.title}"
  allow="clipboard-write"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Explanation Banner: Answering the user's question directly */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              <span>Solusi Embed Website</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white mt-1">
              Kode Embed Iframe untuk &quot;{puzzle.title}&quot;
            </h2>
          </div>
          <button
            onClick={onGoToBuilder}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 self-start md:self-auto"
          >
            &larr; Ubah Kata atau Judul di Tab Buat Teka-Teki
          </button>
        </div>

        {/* Why raw HTML form doesn't work vs why iframe works */}
        <div className="grid md:grid-cols-2 gap-4 mt-4 text-xs">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 mb-1">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <span>Kenapa kode form HTML mentah tidak bisa di-embed:</span>
            </div>
            <p className="text-rose-700 dark:text-rose-300/80 leading-relaxed">
              Form <code>&lt;form id=&quot;build-crossword&quot;&gt;</code> dari CrosswordLabs hanyalah formulir ketik tanpa script JavaScript penyusun grid, tanpa CSS, dan tombol submit-nya ditolak server luar.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 mb-1">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Solusi resmi &amp; bekerja: Gunakan tag &lt;iframe&gt; di bawah ini</span>
            </div>
            <p className="text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
              Kode <code>&lt;iframe&gt;</code> di bawah memuat game teka-teki silang yang sudah jadi, interaktif, responsif, dan siap dimainkan di website Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Generator & Code Snippet Box */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Salin Kode Iframe Siap Pakai
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tempelkan kode ini ke dalam halaman website Anda (WordPress, Google Sites, LMS Moodle, dsb.)
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold rounded-lg transition text-xs shadow-md shadow-amber-500/10"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Kode Berhasil Disalin!' : 'Salin Kode Embed'}</span>
          </button>
        </div>

        {/* Dimension Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 font-semibold mb-1">
              Lebar (Width)
            </label>
            <input
              type="text"
              value={embedWidth}
              onChange={(e) => setEmbedWidth(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
              placeholder="100% atau 700px"
            />
          </div>
          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 font-semibold mb-1">
              Tinggi (Height)
            </label>
            <input
              type="text"
              value={embedHeight}
              onChange={(e) => setEmbedHeight(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
              placeholder="650"
            />
          </div>
          <div className="col-span-2 flex items-end">
            <span className="text-[11px] text-neutral-500 pb-1">
              Tautan embed sudah otomatis menyertakan seluruh {puzzle.layout.placedWords.length} kata dan petunjuk tanpa perlu database!
            </span>
          </div>
        </div>

        {/* Code Block */}
        <div className="relative">
          <pre className="p-4 bg-neutral-900 text-amber-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
            {iframeSnippet}
          </pre>
        </div>

        {/* How to use on different platforms */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <h4 className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mb-3">
            <School className="w-4 h-4 text-indigo-500" />
            Panduan Cara Pasang di Berbagai Platform Web:
          </h4>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-neutral-600 dark:text-neutral-300">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <strong className="text-neutral-900 dark:text-neutral-100 block mb-1">
                🌐 WordPress:
              </strong>
              Buka editor halaman/postingan &rarr; Tambah blok &rarr; Cari blok &quot;<strong>Custom HTML</strong>&quot; &rarr; Paste kode di atas &rarr; Simpan.
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <strong className="text-neutral-900 dark:text-neutral-100 block mb-1">
                📄 Google Sites:
              </strong>
              Klik menu kanan &quot;<strong>Sisipkan (Insert)</strong>&quot; &rarr; Pilih &quot;<strong>Sematkan (Embed)</strong>&quot; &rarr; Pilih tab &quot;<strong>Sematkan kode</strong>&quot; &rarr; Paste kode &rarr; Klik Sisipkan.
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <strong className="text-neutral-900 dark:text-neutral-100 block mb-1">
                🎓 Moodle / LMS Sekolah:
              </strong>
              Buat Aktivitas/Page baru &rarr; Pada toolbar teks klik tanda panah bawah &rarr; Klik tombol &quot;<strong>HTML (&lt;/&gt;)</strong>&quot; &rarr; Paste kode &rarr; Simpan.
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <strong className="text-neutral-900 dark:text-neutral-100 block mb-1">
                💻 Web HTML Biasa / Blog:
              </strong>
              Cukup tempelkan baris kode <code>&lt;iframe ...&gt;&lt;/iframe&gt;</code> ke dalam tag <code>&lt;body&gt;</code> di posisi yang Anda inginkan.
            </div>
          </div>
        </div>
      </div>

      {/* Live Sandbox Preview */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Uji Coba Pratinjau Embed Langsung (Live Sandbox)
            </h3>
          </div>

          {/* Device Switcher */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition ${
                previewDevice === 'desktop'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop (100%)
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition ${
                previewDevice === 'tablet'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" /> Tablet (720px)
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition ${
                previewDevice === 'mobile'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> HP (420px)
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Di bawah ini adalah simulasi nyata bagaimana teka-teki silang Anda berjalan di dalam iframe pada website yang Anda pasang. Anda bisa langsung mencoba mengetik dan menjawabnya!
        </p>

        {/* Frame container */}
        <div className="flex justify-center bg-neutral-100 dark:bg-neutral-950 p-4 rounded-xl overflow-auto border border-neutral-200 dark:border-neutral-800">
          <div
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden transition-all duration-300"
            style={{
              width:
                previewDevice === 'mobile'
                  ? '420px'
                  : previewDevice === 'tablet'
                  ? '720px'
                  : '100%',
              height: '620px',
            }}
          >
            <iframe
              src={embedUrl}
              title={puzzle.title}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
