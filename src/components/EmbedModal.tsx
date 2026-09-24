import React, { useState } from 'react';
import { X, Copy, Check, Code, Eye, Monitor, Tablet, Smartphone, Globe, School } from 'lucide-react';
import { PuzzleData } from '../types';
import { encodePuzzleToParam } from '../utils/storage';

interface EmbedModalProps {
  puzzle: PuzzleData;
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({ puzzle, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [embedWidth, setEmbedWidth] = useState('100%');
  const [embedHeight, setEmbedHeight] = useState('680');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  if (!isOpen) return null;

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
  style="border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);"
  title="${puzzle.title}"
  allow="clipboard-write"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-lg">
                Sematkan ke Website (Embed Iframe)
              </h3>
              <p className="text-xs text-neutral-500">
                Pasang teka-teki silang &quot;{puzzle.title}&quot; di situs Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-neutral-100 dark:border-neutral-800 text-sm">
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Code className="w-4 h-4" /> Kode &amp; Panduan Pemasangan
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Eye className="w-4 h-4" /> Uji Coba Pratinjau (Live Sandbox)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'code' ? (
            <>
              {/* Settings */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Lebar (Width)
                  </label>
                  <input
                    type="text"
                    value={embedWidth}
                    onChange={(e) => setEmbedWidth(e.target.value)}
                    placeholder="100% atau 600px"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tinggi (Height)
                  </label>
                  <input
                    type="text"
                    value={embedHeight}
                    onChange={(e) => setEmbedHeight(e.target.value)}
                    placeholder="680"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>

              {/* Code Snippet Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Salin Kode HTML Iframe Ini:
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold rounded-lg transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Berhasil Disalin!' : 'Salin Kode Embed'}
                  </button>
                </div>
                <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
                  {iframeSnippet}
                </pre>
              </div>

              {/* Step by step installation guides */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-indigo-500" />
                  Cara Pasang di Berbagai Platform Web:
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-xs text-neutral-600 dark:text-neutral-300">
                  <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg">
                    <strong className="text-neutral-800 dark:text-neutral-100 block mb-1">
                      🌐 WordPress:
                    </strong>
                    Buat postingan baru atau buka halaman &rarr; Tambah blok &rarr; Cari &quot;<strong>Custom HTML</strong>&quot; &rarr; Paste kode iframe di atas &rarr; Simpan / Terbitkan.
                  </div>
                  <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg">
                    <strong className="text-neutral-800 dark:text-neutral-100 block mb-1">
                      📄 Google Sites:
                    </strong>
                    Buka panel kanan &rarr; Klik &quot;<strong>Sisipkan (Insert)</strong>&quot; &rarr; Pilih &quot;<strong>Sematkan (Embed)</strong>&quot; &rarr; Tab &quot;Sematkan kode&quot; &rarr; Paste kode &rarr; Klik Selanjutnya.
                  </div>
                  <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg">
                    <strong className="text-neutral-800 dark:text-neutral-100 block mb-1">
                      🎓 Moodle / LMS Sekolah:
                    </strong>
                    Buat Page / Aktivitas baru &rarr; Pada editor teks klik tombol panah bawah lalu klik ikon &quot;<strong>HTML (&lt;/&gt;)</strong>&quot; &rarr; Paste kode &rarr; Simpan.
                  </div>
                  <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg">
                    <strong className="text-neutral-800 dark:text-neutral-100 block mb-1">
                      💻 Website HTML Kustom:
                    </strong>
                    Cukup tempelkan baris kode <code>&lt;iframe ...&gt;&lt;/iframe&gt;</code> ke dalam tag <code>&lt;body&gt;</code> di tempat teka-teki silang ingin ditampilkan.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-neutral-500">
                  Pratinjau bagaimana iframe ini tampil di website penerima:
                </span>
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded transition ${
                      previewDevice === 'desktop'
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-400'
                    }`}
                    title="Desktop (100%)"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-1.5 rounded transition ${
                      previewDevice === 'tablet'
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-400'
                    }`}
                    title="Tablet (768px)"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded transition ${
                      previewDevice === 'mobile'
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-400'
                    }`}
                    title="Mobile (420px)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center bg-neutral-200 dark:bg-neutral-950 p-4 rounded-xl overflow-auto min-h-[450px]">
                <div
                  className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-300 dark:border-neutral-800 transition-all duration-300 overflow-hidden"
                  style={{
                    width:
                      previewDevice === 'mobile'
                        ? '400px'
                        : previewDevice === 'tablet'
                        ? '650px'
                        : '100%',
                    height: '550px',
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>Tautan embed otomatis menyertakan seluruh data teka-teki silang.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-medium rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
