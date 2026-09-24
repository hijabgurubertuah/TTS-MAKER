import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Check, ExternalLink, Code2, HelpCircle } from 'lucide-react';

export const EmbedExplainer: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const sampleIframeCrosswordlabs = `<iframe width="500" height="500" style="border:3px solid black" src="https://crosswordlabs.com/embed/nama-puzzle-anda"></iframe>`;
  const sampleIframeStudio = `<iframe src="${window.location.origin}?embed=1&puzzle=sains-biologi" width="100%" height="700" frameborder="0" style="border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1);"></iframe>`;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 md:p-7 shadow-sm space-y-6">
      <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-medium text-sm mb-1">
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          <span>Jawaban &amp; Panduan Teknis untuk Pertanyaan Anda</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
          Apakah kode form HTML CrosswordLabs di atas bisa di-embed langsung?
        </h2>
      </div>

      {/* Direct verdict */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-rose-900 dark:text-rose-200">
                TIDAK BISA jika hanya copy-paste kode form HTML tersebut
              </h3>
              <p className="text-xs md:text-sm text-rose-800/90 dark:text-rose-300/80 mt-1 leading-relaxed">
                Kode yang Anda lampirkan adalah <strong>form HTML mentah</strong> (halaman input pembuat), bukan komponen embed teka-teki silang jadi.
              </p>
            </div>
          </div>
          <ul className="text-xs text-rose-800/85 dark:text-rose-300/80 list-disc list-inside mt-3 space-y-1 pl-1">
            <li><strong>Tidak ada Script Generator:</strong> Logika penataan kotak silang (grid placement algorithm) ada di server CrosswordLabs.</li>
            <li><strong>Tidak ada CSS:</strong> Tampilan preview kotak dan tombol akan hancur/berantakan.</li>
            <li><strong>Aset 404:</strong> Gambar ikon <code>/static/.../eye.svg</code> akan hilang karena jalur lokal CrosswordLabs.</li>
            <li><strong>Form Action kosong:</strong> Menekan tombol "Save &amp; Finish" tidak akan menyimpan apapun atau ditolak CORS.</li>
          </ul>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                SOLUSI: Gunakan Format Iframe yang Sah
              </h3>
              <p className="text-xs md:text-sm text-emerald-800/90 dark:text-emerald-300/80 mt-1 leading-relaxed">
                Untuk menyematkan (embed) teka-teki silang ke website Anda (WordPress, Google Sites, LMS Moodle, atau Web HTML custom), Anda harus memakai tag <code>&lt;iframe&gt;</code>.
              </p>
            </div>
          </div>

          <div className="mt-3 bg-emerald-100/60 dark:bg-emerald-900/40 rounded-lg p-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <strong>Kabar baik:</strong> Aplikasi ini sudah kami lengkapi dengan <strong>Generator TTS Mandiri Lengkap</strong> yang bisa langsung menghasilkan kode embed iframe responsif gratis tanpa watermark!
          </div>
        </div>
      </div>

      {/* Comparison and Solution */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-500" />
          Dua Cara Resmi Melakukan Embed Crossword ke Website Anda:
        </h3>

        {/* Option 1 */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Opsi 1: Jika Menggunakan CrosswordLabs Resmi
            </span>
            <span className="text-[11px] bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300">
              Perlu buat dulu di situs mereka
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300 mt-2">
            1. Buka <code>crosswordlabs.com</code>, buat dan simpan teka-teki silang Anda.<br />
            2. Klik menu <strong>Share / Bagikan</strong>, lalu pilih tab <strong>Embed</strong>.<br />
            3. Salin kode iframe resmi mereka seperti format di bawah ini:
          </p>
          <div className="relative mt-2.5">
            <pre className="bg-neutral-900 text-neutral-100 p-3 rounded text-xs font-mono overflow-x-auto">
              {sampleIframeCrosswordlabs}
            </pre>
            <button
              onClick={() => copyToClipboard(sampleIframeCrosswordlabs, 'cslabs')}
              className="absolute right-2 top-2 p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 border border-neutral-700"
            >
              {copiedCode === 'cslabs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'cslabs' ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>

        {/* Option 2 */}
        <div className="border border-emerald-300 dark:border-emerald-800/80 rounded-lg p-4 bg-emerald-50/20 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Opsi 2 (Direkomendasikan): Menggunakan Crossword Studio Ini Langsung
            </span>
            <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
              100% Mandiri &amp; Fleksibel
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300 mt-2">
            Anda dapat membuat teka-teki silang di tab <strong>"Buat Puzzle Baru"</strong> di atas. Setelah itu, klik tombol <strong>"Embed &amp; Bagikan"</strong> untuk mendapatkan kode iframe yang dapat langsung disematkan di web Anda atau LMS sekolah.
          </p>
          <div className="relative mt-2.5">
            <pre className="bg-neutral-900 text-emerald-300 p-3 rounded text-xs font-mono overflow-x-auto">
              {sampleIframeStudio}
            </pre>
            <button
              onClick={() => copyToClipboard(sampleIframeStudio, 'studio')}
              className="absolute right-2 top-2 p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 border border-neutral-700"
            >
              {copiedCode === 'studio' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'studio' ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
