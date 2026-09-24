import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Copy,
  Sparkles,
  FileDown,
  Download,
  ExternalLink,
  X,
  Trash2,
  FileText,
  KeyRound,
} from 'lucide-react';
import { generateCrossword, parseRawInput } from '../utils/crosswordGenerator';
import { CrosswordLayout } from '../types';
import { WorksheetPaper } from './WorksheetPaper';

export const WorksheetGenerator: React.FC = () => {
  // Persistence via localStorage so inputs are preserved across page refresh
  const [title, setTitle] = useState(() => {
    try {
      return localStorage.getItem('tts_maker_title') ?? '';
    } catch {
      return '';
    }
  });

  const [rawWords, setRawWords] = useState(() => {
    try {
      return localStorage.getItem('tts_maker_raw_words') ?? '';
    } catch {
      return '';
    }
  });

  const [seed, setSeed] = useState(() => {
    try {
      const saved = localStorage.getItem('tts_maker_seed');
      return saved ? parseInt(saved, 10) : 42;
    } catch {
      return 42;
    }
  });

  // Active view mode: Lembar Soal (false) vs Kunci Jawaban (true)
  const [showAnswerKey, setShowAnswerKey] = useState(() => {
    try {
      return localStorage.getItem('tts_maker_show_key') === 'true';
    } catch {
      return false;
    }
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Modal download preview & fail-safe actions
  const [exportModal, setExportModal] = useState<{
    isOpen: boolean;
    type: 'pdf' | 'image';
    url: string;
    fileName: string;
    isKey: boolean;
  }>({
    isOpen: false,
    type: 'pdf',
    url: '',
    fileName: '',
    isKey: false,
  });

  // Auto-dismiss toast after 4.5s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Save to localStorage automatically whenever inputs change
  useEffect(() => {
    try {
      localStorage.setItem('tts_maker_title', title);
    } catch (e) {
      console.warn('Failed to save title to localStorage', e);
    }
  }, [title]);

  useEffect(() => {
    try {
      localStorage.setItem('tts_maker_raw_words', rawWords);
    } catch (e) {
      console.warn('Failed to save rawWords to localStorage', e);
    }
  }, [rawWords]);

  useEffect(() => {
    try {
      localStorage.setItem('tts_maker_seed', seed.toString());
    } catch (e) {
      console.warn('Failed to save seed to localStorage', e);
    }
  }, [seed]);

  useEffect(() => {
    try {
      localStorage.setItem('tts_maker_show_key', showAnswerKey.toString());
    } catch (e) {
      console.warn('Failed to save showAnswerKey to localStorage', e);
    }
  }, [showAnswerKey]);

  const handleClearInputs = () => {
    setTitle('');
    setRawWords('');
    try {
      localStorage.removeItem('tts_maker_title');
      localStorage.removeItem('tts_maker_raw_words');
    } catch (e) {
      console.warn('Failed to clear localStorage', e);
    }
    setShowClearConfirm(false);
    setToast({ type: 'success', message: 'Form isian berhasil dikosongkan.' });
  };

  const chatGptPrompt =
    'Jadilah Ahli dalam membuat Jawaban dan soal TTS mata pelajaran ... kelas.... Buatkan soal dan jawaban untuk dijadikan teka teki silang dengan jawaban hanya berupa satu kata atau istilah penting untuk materi ....... Dengan format JAWABAN[spasi]PETUNJUK atau SOAL, satu soal per baris. sebanyak 10 butir, tanpa nomor dan mudah di copy.';

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

  // Dedicated off-screen container refs for 100% unscaled, pristine A4 export
  const exportQuestionRef = useRef<HTMLDivElement>(null);
  const exportAnswerRef = useRef<HTMLDivElement>(null);

  const previewWorksheetRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState<number>(1);
  const [isFitMode, setIsFitMode] = useState<boolean>(true);

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

  // Dynamic cell size to ensure crossword grid and questions fit comfortably on 1 single A4 sheet
  const cellSize = useMemo(() => {
    if (!layout.width || layout.width <= 0) return 26;
    const maxAvailableWidth = 680;
    const maxAvailableHeight = 430; // Max height to strictly maintain 1-page boundary
    const calculatedW = Math.floor(maxAvailableWidth / layout.width);
    const calculatedH = Math.floor(maxAvailableHeight / (layout.height || 1));
    const calculated = Math.min(calculatedW, calculatedH);
    return Math.min(26, Math.max(16, calculated));
  }, [layout.width, layout.height]);

  // Find the optimal seed that fits on 1 sheet with 100% placed words and most compact area
  const findOptimalSeed = () => {
    if (parsedItems.length === 0) return 42;
    let bestS = seed;
    let minUnplaced = Infinity;
    let minArea = Infinity;

    // Evaluate seeds 1 to 40
    for (let s = 1; s <= 40; s++) {
      const res = generateCrossword(parsedItems, s);
      const unplaced = res.unplacedWords.length;
      const area = (res.width || 50) * (res.height || 50);

      if (unplaced < minUnplaced) {
        minUnplaced = unplaced;
        minArea = area;
        bestS = s;
      } else if (unplaced === minUnplaced && area < minArea) {
        minArea = area;
        bestS = s;
      }
    }
    return bestS;
  };

  const handleAutoFit = () => {
    const optimal = findOptimalSeed();
    setSeed(optimal);
    setToast({ type: 'success', message: `Susunan dioptimalkan ke Variasi ${optimal} (Pas 1 Lembar).` });
  };

  // Auto-optimize to best seed if current layout has unplaced words when items change
  useEffect(() => {
    if (parsedItems.length >= 2 && layout.unplacedWords.length > 0) {
      const optimal = findOptimalSeed();
      if (optimal !== seed) {
        setSeed(optimal);
      }
    }
  }, [parsedItems.length]);

  // Measure container and worksheet to provide exact WYSIWYG scale on mobile
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const cWidth = containerRef.current.clientWidth;
        if (cWidth > 0) {
          const targetWidth = 794; // Exact standard A4 width in px at 96 DPI
          const calculatedScale = Math.min(1, cWidth / targetWidth);
          setScale(calculatedScale);
        }
      }
    };

    updateDimensions();
    const timer = setTimeout(updateDimensions, 100);

    window.addEventListener('resize', updateDimensions);
    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, [layout, title, showAnswerKey, rawWords]);

  const effectiveScale = isFitMode ? scale : 1;

  const handleNextSeed = () => setSeed((prev) => prev + 1);
  const handlePrevSeed = () => setSeed((prev) => (prev > 1 ? prev - 1 : 9999));

  const acrossWords = layout.placedWords.filter((w) => w.direction === 'across');
  const downWords = layout.placedWords.filter((w) => w.direction === 'down');

  // Helper to sanitize filename
  const getSafeFileName = (isKey: boolean, ext: 'png' | 'pdf') => {
    const safeTitle = (title.trim() || 'Teka-Teki-Silang')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `TTS-${safeTitle}${isKey ? '-KunciJawaban' : ''}.${ext}`;
  };

  /**
   * Capture A4 Worksheet Container as PNG Data URL using html-to-image (toPng).
   * Adheres strictly to:
   * 1. Awaiting document.fonts.ready
   * 2. Capturing unscaled dedicated container (width: 794px, height: scrollHeight)
   * 3. pixelRatio: 2.5 and backgroundColor: #ffffff
   * 4. Filter out any UI controls or .no-export elements
   */
  const captureWorksheetToPng = async (isKey: boolean): Promise<string> => {
    // 1. Await font loading
    await document.fonts.ready;

    // 2. Select target container
    const targetElement = isKey ? exportAnswerRef.current : exportQuestionRef.current;
    if (!targetElement) {
      throw new Error('Container lembar kerja ekspor tidak ditemukan di DOM.');
    }

    // 3. Get exact scroll dimensions
    const exportWidth = targetElement.scrollWidth || 794;
    const exportHeight = targetElement.scrollHeight || 1123;

    // 4. Capture with toPng
    const dataUrl = await toPng(targetElement, {
      pixelRatio: 2.5, // 2.5x high resolution (~1985 x 2807 px)
      backgroundColor: '#ffffff',
      width: exportWidth,
      height: exportHeight,
      cacheBust: true,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          if (node.classList.contains('no-export') || node.classList.contains('print:hidden')) {
            return false;
          }
        }
        return true;
      },
    });

    return dataUrl;
  };

  /**
   * Direct PNG Image Export and Download
   */
  const handleExportImage = async (isKey: boolean = showAnswerKey) => {
    if (parsedItems.length === 0) {
      setToast({
        type: 'warning',
        message: 'Silakan masukkan soal dan jawaban terlebih dahulu sebelum mendownload Gambar.',
      });
      return;
    }

    try {
      setIsExporting(true);
      const dataUrl = await captureWorksheetToPng(isKey);
      const fileName = getSafeFileName(isKey, 'png');

      // Convert dataUrl to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Trigger standard browser download
      try {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn('Unduhan otomatis dibatasi oleh browser/iframe:', dlErr);
      }

      // Open fallback modal for mobile long-press and direct preview
      setExportModal({
        isOpen: true,
        type: 'image',
        url: blobUrl,
        fileName,
        isKey,
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
      setToast({
        type: 'success',
        message: `Gambar ${isKey ? 'Kunci Jawaban' : 'Lembar Soal'} berhasil diproses!`,
      });
    } catch (err) {
      console.error('Gagal mengekspor gambar:', err);
      setToast({
        type: 'error',
        message: `Gagal membuat gambar: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Direct PDF Export and Download using jsPDF
   * A4 Portrait with 10 mm margin. Multi-page vertical slice fallback if content exceeds single page.
   */
  const handleExportPdf = async (isKey: boolean = showAnswerKey) => {
    if (parsedItems.length === 0) {
      setToast({
        type: 'warning',
        message: 'Silakan masukkan soal dan jawaban terlebih dahulu sebelum mendownload PDF.',
      });
      return;
    }

    try {
      setIsExportingPdf(true);
      const dataUrl = await captureWorksheetToPng(isKey);
      const fileName = getSafeFileName(isKey, 'pdf');

      // Load image to compute true dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = 210; // Standard A4 width in mm
      const pdfHeight = 297; // Standard A4 height in mm
      const margin = 10; // 10 mm margin
      const printableWidth = pdfWidth - 2 * margin; // 190 mm
      const printableHeight = pdfHeight - 2 * margin; // 277 mm

      const imgPdfHeight = (img.naturalHeight * printableWidth) / img.naturalWidth;

      if (imgPdfHeight <= printableHeight) {
        // Fits perfectly on 1 single page
        pdf.addImage(dataUrl, 'PNG', margin, margin, printableWidth, imgPdfHeight, undefined, 'FAST');
      } else {
        // Multi-page slicing without stretching or clipping
        const pagePixelHeight = Math.floor((printableHeight * img.naturalWidth) / printableWidth);
        const totalPages = Math.ceil(img.naturalHeight / pagePixelHeight);

        for (let p = 0; p < totalPages; p++) {
          if (p > 0) {
            pdf.addPage('a4', 'portrait');
          }

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = img.naturalWidth;
          const sourceY = p * pagePixelHeight;
          const sliceH = Math.min(pagePixelHeight, img.naturalHeight - sourceY);
          sliceCanvas.height = sliceH;

          const sliceCtx = sliceCanvas.getContext('2d');
          if (sliceCtx) {
            sliceCtx.fillStyle = '#ffffff';
            sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            sliceCtx.drawImage(
              img,
              0,
              sourceY,
              img.naturalWidth,
              sliceH,
              0,
              0,
              img.naturalWidth,
              sliceH
            );

            const sliceDataUrl = sliceCanvas.toDataURL('image/png');
            const slicePdfHeight = (sliceH * printableWidth) / img.naturalWidth;
            pdf.addImage(sliceDataUrl, 'PNG', margin, margin, printableWidth, slicePdfHeight, undefined, 'FAST');
          }
        }
      }

      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Trigger standard browser download
      try {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn('Unduhan PDF otomatis dibatasi oleh browser/iframe:', dlErr);
      }

      // Open fallback modal
      setExportModal({
        isOpen: true,
        type: 'pdf',
        url: blobUrl,
        fileName,
        isKey,
      });

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2500);
      setToast({
        type: 'success',
        message: `PDF ${isKey ? 'Kunci Jawaban' : 'Lembar Soal'} berhasil dibuat!`,
      });
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
      setToast({
        type: 'error',
        message: `Gagal membuat PDF: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-3.5 rounded-xl shadow-lg border text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
              : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100'
              : 'bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Input Card: Judul dan Daftar Kata Jawaban (Hidden when printing) */}
      <div className="print:hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Judul
            </label>
            {(title || rawWords) && (
              <div>
                {showClearConfirm ? (
                  <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-lg text-xs">
                    <span className="text-rose-700 dark:text-rose-300 font-medium">Kosongkan semua?</span>
                    <button
                      type="button"
                      onClick={handleClearInputs}
                      className="font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Ya, Hapus
                    </button>
                    <span className="text-neutral-400">|</span>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 transition font-medium cursor-pointer"
                    title="Kosongkan teks judul dan isian soal (tersimpan otomatis)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Form</span>
                  </button>
                )}
              </div>
            )}
          </div>
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
          {layout.unplacedWords.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{layout.unplacedWords.length} kata belum bersilangan (coba ganti variasi di bawah)</span>
            </div>
          )}

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

      {/* Pratinjau Lembar Kerja (Worksheet) - Responsive WYSIWYG Container */}
      <div className="w-full flex flex-col items-center">
        {/* Mobile WYSIWYG Header Bar */}
        <div className="print:hidden w-full max-w-[794px] flex flex-wrap items-center justify-between gap-2 px-2 mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 dark:text-white text-sm">
              Pratinjau
            </span>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              ✓ 1 Lembar A4
            </span>
            {scale < 1 && (
              <span className="text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-full font-medium">
                {Math.round(effectiveScale * 100)}%
              </span>
            )}
          </div>

          {/* Mode Switcher: Lembar Soal vs Kunci Jawaban */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-200/70 dark:bg-neutral-800/80 rounded-xl border border-neutral-300 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setShowAnswerKey(false)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                !showAnswerKey
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lembar Soal</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAnswerKey(true)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                showAnswerKey
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Kunci Jawaban</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoFit}
              title="Pilih susunan paling ringkas dan pas untuk 1 lembar kertas"
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Susunan Pas 1 Lembar</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              title="Cetak langsung atau Simpan sebagai PDF via printer peramban"
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak (Browser)</span>
            </button>
            {scale < 1 && (
              <button
                type="button"
                onClick={() => setIsFitMode(!isFitMode)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold transition cursor-pointer shadow-2xs"
              >
                {isFitMode ? '🔍 100%' : '📱 Fit HP'}
              </button>
            )}
          </div>
        </div>

        {/* Viewport Box for Interactive Screen Display */}
        <div
          ref={containerRef}
          className={`w-full flex justify-center ${
            !isFitMode && effectiveScale === 1 ? 'overflow-x-auto pb-4' : 'overflow-hidden'
          }`}
        >
          <div
            style={
              effectiveScale < 1
                ? {
                    width: `${Math.round(794 * effectiveScale)}px`,
                    height: `${Math.round(1123 * effectiveScale)}px`,
                  }
                : {
                    width: '794px',
                    height: '1123px',
                  }
            }
            className="relative shrink-0 transition-all duration-150 print:!w-full print:!h-auto"
          >
            <div
              style={
                effectiveScale < 1
                  ? {
                      transform: `scale(${effectiveScale})`,
                      transformOrigin: 'top left',
                      width: '794px',
                      height: '1123px',
                    }
                  : {
                      width: '794px',
                      height: '1123px',
                    }
              }
              className="print:!transform-none print:!w-full"
            >
              {/* Interactive Screen Preview */}
              <div ref={previewWorksheetRef}>
                <WorksheetPaper
                  title={title}
                  layout={layout}
                  cellSize={cellSize}
                  acrossWords={acrossWords}
                  downWords={downWords}
                  showAnswerKey={showAnswerKey}
                  isExportMode={false}
                  id="worksheet-a4-page"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED OFF-SCREEN CLEAN CONTAINERS FOR EXPORT (Always 100% Unscaled A4 794px, No Transforms, No CSS Color Bugs) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          zIndex: -100,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Export Container: Lembar Soal (Kosong) */}
        <div ref={exportQuestionRef} style={{ width: '794px', backgroundColor: '#ffffff' }}>
          <WorksheetPaper
            title={title}
            layout={layout}
            cellSize={cellSize}
            acrossWords={acrossWords}
            downWords={downWords}
            showAnswerKey={false}
            isExportMode={true}
          />
        </div>

        {/* Export Container: Kunci Jawaban (Terisi) */}
        <div ref={exportAnswerRef} style={{ width: '794px', backgroundColor: '#ffffff' }}>
          <WorksheetPaper
            title={title}
            layout={layout}
            cellSize={cellSize}
            acrossWords={acrossWords}
            downWords={downWords}
            showAnswerKey={true}
            isExportMode={true}
          />
        </div>
      </div>

      {/* Action Bar: Navigasi Variasi & Tombol Ekspor Utama */}
      <div className="print:hidden w-full max-w-[794px] mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 sm:p-4 rounded-2xl shadow-md space-y-3">
        {/* Row 1: Variasi Layout Switcher */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <button
            type="button"
            onClick={handlePrevSeed}
            title="Susunan Layout Sebelumnya"
            className="h-10 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold rounded-xl transition flex items-center justify-center gap-1 text-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="h-10 px-4 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-2xs flex items-center justify-center text-center">
            <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
              Variasi {seed}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextSeed}
            title="Susunan Layout Berikutnya"
            className="h-10 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold rounded-xl transition flex items-center justify-center gap-1 text-xs cursor-pointer"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Row 2: Export Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Tombol Ekspor PDF */}
          <div className="flex rounded-xl overflow-hidden shadow-xs border border-neutral-300 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => handleExportPdf(false)}
              disabled={isExportingPdf}
              className="flex-1 h-12 px-3 bg-neutral-900 hover:bg-black active:scale-[0.98] text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 font-bold transition flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-60 border-r border-neutral-700 dark:border-neutral-300"
              title="Download Lembar Soal (Kosong) dalam format PDF A4"
            >
              {isExportingPdf && !showAnswerKey ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Unduh PDF (Soal)</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportPdf(true)}
              disabled={isExportingPdf}
              className="px-3 h-12 bg-neutral-800 hover:bg-neutral-900 active:scale-[0.98] text-amber-400 dark:bg-neutral-200 dark:hover:bg-neutral-300 dark:text-amber-800 font-bold transition flex items-center justify-center gap-1 text-xs cursor-pointer disabled:opacity-60"
              title="Download Kunci Jawaban (Terisi) dalam format PDF A4"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>+ Kunci</span>
            </button>
          </div>

          {/* Tombol Ekspor Gambar PNG */}
          <div className="flex rounded-xl overflow-hidden shadow-xs border border-amber-400 dark:border-amber-600">
            <button
              type="button"
              onClick={() => handleExportImage(false)}
              disabled={isExporting}
              className="flex-1 h-12 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 active:scale-[0.98] text-neutral-950 font-bold transition flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-60 border-r border-amber-600 dark:border-amber-700"
              title="Download Lembar Soal (Kosong) dalam format Gambar PNG resolusi tinggi"
            >
              {isExporting && !showAnswerKey ? (
                <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span>Unduh Gambar (Soal)</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportImage(true)}
              disabled={isExporting}
              className="px-3 h-12 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold transition flex items-center justify-center gap-1 text-xs cursor-pointer disabled:opacity-60"
              title="Download Kunci Jawaban (Terisi) dalam format Gambar PNG"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>+ Kunci</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Siap Unduh / Fail-safe Download Dialog */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  {exportModal.type === 'pdf' ? (
                    <FileDown className="w-5 h-5" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                    {exportModal.type === 'pdf'
                      ? `Dokumen PDF ${exportModal.isKey ? 'Kunci Jawaban' : 'Lembar Soal'} Siap!`
                      : `Gambar ${exportModal.isKey ? 'Kunci Jawaban' : 'Lembar Soal'} Siap!`}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    File telah diproses dan unduhan otomatis telah dimulai
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                title="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview & Keterangan */}
            {exportModal.type === 'image' ? (
              <div className="space-y-3">
                <div className="max-h-60 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-2">
                  <img
                    src={exportModal.url}
                    alt="Hasil TTS A4"
                    className="max-h-52 w-auto object-contain rounded shadow-xs"
                  />
                </div>
                <div className="flex justify-between items-center text-xs px-1 text-neutral-600 dark:text-neutral-300">
                  <span className="font-medium text-neutral-500">Ukuran Gambar:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    A4 Standar WYSIWYG (1985 × 2807 px)
                  </span>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-300">
                  <p className="font-semibold flex items-center gap-1.5">
                    <span>📱</span> Tips Pengguna HP:
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Jika peramban tidak otomatis mendownload, Anda dapat <strong>menyentuh & tahan (tekan lama)</strong> gambar di atas, lalu pilih <strong>&quot;Simpan Gambar&quot;</strong> / <strong>&quot;Download Gambar&quot;</strong> ke galeri.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/60 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium text-neutral-500">Nama Dokumen:</span>
                  <span className="font-mono font-bold truncate max-w-[210px] text-neutral-900 dark:text-white">
                    {exportModal.fileName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium text-neutral-500">Ukuran & Format:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    PDF A4 Portrait Margin 10mm (210 × 297 mm)
                  </span>
                </div>
              </div>
            )}

            {/* Tombol Aksi Modal */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={exportModal.url}
                  download={exportModal.fileName}
                  className="flex-1 h-11 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 text-xs cursor-pointer text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Simpan / Unduh Ulang</span>
                </a>
                <a
                  href={exportModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer text-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka di Tab Baru</span>
                </a>
              </div>

              {exportModal.type === 'pdf' && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full h-10 px-3 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer text-center"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Langsung / Simpan PDF (Dialog Browser)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
