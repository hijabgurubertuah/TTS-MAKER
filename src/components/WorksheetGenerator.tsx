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
  LayoutGrid,
  CopyCheck,
  SplitSquareVertical,
} from 'lucide-react';
import { generateCrossword, parseRawInput } from '../utils/crosswordGenerator';
import { CrosswordLayout } from '../types';
import { WorksheetPaper } from './WorksheetPaper';
import { WorksheetPaper2PerPage } from './WorksheetPaper2PerPage';

export const WorksheetGenerator: React.FC = () => {
  // Layout Cetak State: 1 TTS per halaman A4 vs 2 TTS per halaman A4 (Hemat kertas)
  const [printLayout, setPrintLayout] = useState<'1_per_page' | '2_per_page'>(() => {
    try {
      return (localStorage.getItem('tts_print_layout') as '1_per_page' | '2_per_page') || '1_per_page';
    } catch {
      return '1_per_page';
    }
  });

  // Source for 2 per page: "same" (Salin sama) vs "different" (Dua TTS berbeda)
  const [twoPerPageSource, setTwoPerPageSource] = useState<'same' | 'different'>(() => {
    try {
      return (localStorage.getItem('tts_2per_source') as 'same' | 'different') || 'same';
    } catch {
      return 'same';
    }
  });

  // Active Editor Tab when "different" is selected: 'tts1' | 'tts2'
  const [activeEditorTab, setActiveEditorTab] = useState<'tts1' | 'tts2'>('tts1');

  // Primary TTS (Slot 1 / Atas)
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

  // Secondary TTS (Slot 2 / Bawah, for "Dua TTS berbeda")
  const [title2, setTitle2] = useState(() => {
    try {
      return localStorage.getItem('tts_maker_title2') ?? '';
    } catch {
      return '';
    }
  });

  const [rawWords2, setRawWords2] = useState(() => {
    try {
      return localStorage.getItem('tts_maker_raw_words2') ?? '';
    } catch {
      return '';
    }
  });

  const [seed2, setSeed2] = useState(() => {
    try {
      const saved = localStorage.getItem('tts_maker_seed2');
      return saved ? parseInt(saved, 10) : 15;
    } catch {
      return 15;
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
    layoutDesc: string;
  }>({
    isOpen: false,
    type: 'pdf',
    url: '',
    fileName: '',
    isKey: false,
    layoutDesc: '1 TTS per Halaman',
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
      localStorage.setItem('tts_print_layout', printLayout);
      localStorage.setItem('tts_2per_source', twoPerPageSource);
      localStorage.setItem('tts_maker_title', title);
      localStorage.setItem('tts_maker_raw_words', rawWords);
      localStorage.setItem('tts_maker_seed', seed.toString());
      localStorage.setItem('tts_maker_title2', title2);
      localStorage.setItem('tts_maker_raw_words2', rawWords2);
      localStorage.setItem('tts_maker_seed2', seed2.toString());
      localStorage.setItem('tts_maker_show_key', showAnswerKey.toString());
    } catch (e) {
      console.warn('Failed to save state to localStorage', e);
    }
  }, [printLayout, twoPerPageSource, title, rawWords, seed, title2, rawWords2, seed2, showAnswerKey]);

  const handleClearInputs = () => {
    if (activeEditorTab === 'tts1') {
      setTitle('');
      setRawWords('');
      try {
        localStorage.removeItem('tts_maker_title');
        localStorage.removeItem('tts_maker_raw_words');
      } catch (e) {
        console.warn('Failed to clear localStorage', e);
      }
    } else {
      setTitle2('');
      setRawWords2('');
      try {
        localStorage.removeItem('tts_maker_title2');
        localStorage.removeItem('tts_maker_raw_words2');
      } catch (e) {
        console.warn('Failed to clear localStorage', e);
      }
    }
    setShowClearConfirm(false);
    setToast({ type: 'success', message: `Form isian ${activeEditorTab === 'tts1' ? 'TTS 1' : 'TTS 2'} berhasil dikosongkan.` });
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState<number>(1);
  const [isFitMode, setIsFitMode] = useState<boolean>(true);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight + 4, 180)}px`;
    }
  }, [rawWords, rawWords2, activeEditorTab]);

  // Primary TTS generation
  const parsedItems1 = useMemo(() => parseRawInput(rawWords), [rawWords]);
  const layout1: CrosswordLayout = useMemo(() => generateCrossword(parsedItems1, seed), [parsedItems1, seed]);
  const acrossWords1 = layout1.placedWords.filter((w) => w.direction === 'across');
  const downWords1 = layout1.placedWords.filter((w) => w.direction === 'down');

  // Secondary TTS generation (used when printLayout === '2_per_page' and twoPerPageSource === 'different')
  const parsedItems2 = useMemo(() => parseRawInput(rawWords2 || rawWords), [rawWords2, rawWords]);
  const layout2: CrosswordLayout = useMemo(() => generateCrossword(parsedItems2, seed2), [parsedItems2, seed2]);
  const acrossWords2 = layout2.placedWords.filter((w) => w.direction === 'across');
  const downWords2 = layout2.placedWords.filter((w) => w.direction === 'down');

  // TTS Data bundles
  const topTTS = useMemo(() => ({
    title: title || 'Teka-Teki Silang',
    layout: layout1,
    acrossWords: acrossWords1,
    downWords: downWords1,
  }), [title, layout1, acrossWords1, downWords1]);

  const bottomTTS = useMemo(() => {
    if (twoPerPageSource === 'same') {
      return topTTS;
    }
    return {
      title: title2 || title || 'Teka-Teki Silang (B)',
      layout: layout2,
      acrossWords: acrossWords2,
      downWords: downWords2,
    };
  }, [twoPerPageSource, topTTS, title2, title, layout2, acrossWords2, downWords2]);

  // Dynamic cell size for 1 TTS per page
  const cellSize1PerPage = useMemo(() => {
    if (!layout1.width || layout1.width <= 0) return 26;
    const maxAvailableWidth = 680;
    const maxAvailableHeight = 430;
    const calculatedW = Math.floor(maxAvailableWidth / layout1.width);
    const calculatedH = Math.floor(maxAvailableHeight / (layout1.height || 1));
    const calculated = Math.min(calculatedW, calculatedH);
    return Math.min(26, Math.max(16, calculated));
  }, [layout1.width, layout1.height]);

  // Capacity validation check for 2-per-page layout (Half-page slot)
  const isLayoutTooLargeFor2PerPage = (l: CrosswordLayout, across: typeof acrossWords1, down: typeof downWords1) => {
    const totalWords = across.length + down.length;
    // Maximum grid dimensions and question count that fit comfortably in ~495px height
    return (l.width > 16 || l.height > 14 || totalWords > 16);
  };

  // Check whenever layout changes
  const checkAndValidate2PerPage = () => {
    if (printLayout === '2_per_page') {
      const topTooLarge = isLayoutTooLargeFor2PerPage(layout1, acrossWords1, downWords1);
      const bottomTooLarge = twoPerPageSource === 'different' && isLayoutTooLargeFor2PerPage(layout2, acrossWords2, downWords2);

      if (topTooLarge || bottomTooLarge) {
        setPrintLayout('1_per_page');
        setToast({
          type: 'warning',
          message: 'Grid terlalu besar untuk 2 per halaman (Maks. 16x14 kotak & 16 soal). Otomatis kembali ke layout 1 per halaman.',
        });
      }
    }
  };

  const handleSelectLayout = (layoutMode: '1_per_page' | '2_per_page') => {
    if (layoutMode === '2_per_page') {
      const topTooLarge = isLayoutTooLargeFor2PerPage(layout1, acrossWords1, downWords1);
      const bottomTooLarge = twoPerPageSource === 'different' && isLayoutTooLargeFor2PerPage(layout2, acrossWords2, downWords2);

      if (topTooLarge || bottomTooLarge) {
        setToast({
          type: 'warning',
          message: 'Grid terlalu besar untuk 2 per halaman (Maks. 16x14 kotak & 16 soal). Silakan kurangi kata atau gunakan 1 TTS per halaman.',
        });
        return;
      }
    }
    setPrintLayout(layoutMode);
  };

  useEffect(() => {
    checkAndValidate2PerPage();
  }, [layout1, layout2, acrossWords1.length, downWords1.length, acrossWords2.length, downWords2.length]);

  // Find optimal seed
  const findOptimalSeed = (items: ReturnType<typeof parseRawInput>, currentSeed: number) => {
    if (items.length === 0) return 42;
    let bestS = currentSeed;
    let minUnplaced = Infinity;
    let minArea = Infinity;

    for (let s = 1; s <= 40; s++) {
      const res = generateCrossword(items, s);
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
    if (activeEditorTab === 'tts1' || printLayout === '1_per_page') {
      const optimal = findOptimalSeed(parsedItems1, seed);
      setSeed(optimal);
      setToast({ type: 'success', message: `Susunan TTS 1 dioptimalkan ke Variasi ${optimal} (Pas 1 Lembar).` });
    } else {
      const optimal = findOptimalSeed(parsedItems2, seed2);
      setSeed2(optimal);
      setToast({ type: 'success', message: `Susunan TTS 2 dioptimalkan ke Variasi ${optimal} (Pas 1 Lembar).` });
    }
  };

  // Measure container and worksheet for responsive WYSIWYG scale on mobile
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const cWidth = containerRef.current.clientWidth;
        if (cWidth > 0) {
          const targetWidth = 794; // Exact standard A4 width in px
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
  }, [layout1, layout2, title, title2, showAnswerKey, rawWords, rawWords2, printLayout, twoPerPageSource]);

  const effectiveScale = isFitMode ? scale : 1;

  const currentSeed = activeEditorTab === 'tts1' ? seed : seed2;
  const handleNextSeed = () => {
    if (activeEditorTab === 'tts1') setSeed((prev) => prev + 1);
    else setSeed2((prev) => prev + 1);
  };
  const handlePrevSeed = () => {
    if (activeEditorTab === 'tts1') setSeed((prev) => (prev > 1 ? prev - 1 : 9999));
    else setSeed2((prev) => (prev > 1 ? prev - 1 : 9999));
  };

  // Helper to sanitize filename
  const getSafeFileName = (isKey: boolean, ext: 'png' | 'pdf') => {
    const activeTitle = (title.trim() || 'Teka-Teki-Silang')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    const layoutTag = printLayout === '2_per_page' ? '2perHalaman' : '1perHalaman';
    return `TTS-${activeTitle}-${layoutTag}${isKey ? '-KunciJawaban' : ''}.${ext}`;
  };

  /**
   * Capture A4 Worksheet Container as PNG Data URL using html-to-image (toPng).
   * Exact 794 x 1123 px container, pixelRatio 3 (ultra-sharp 2382 x 3369 px).
   */
  const captureWorksheetToPng = async (isKey: boolean): Promise<string> => {
    await document.fonts.ready;

    const targetElement = isKey ? exportAnswerRef.current : exportQuestionRef.current;
    if (!targetElement) {
      throw new Error('Container lembar kerja ekspor tidak ditemukan di DOM.');
    }

    const dataUrl = await toPng(targetElement, {
      pixelRatio: 3, // 3x ultra-sharp resolution (~2382 x 3369 px)
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
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
    if (parsedItems1.length === 0) {
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

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

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

      setExportModal({
        isOpen: true,
        type: 'image',
        url: blobUrl,
        fileName,
        isKey,
        layoutDesc: printLayout === '2_per_page' ? '2 TTS per Halaman (Hemat Kertas)' : '1 TTS per Halaman',
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
      setToast({
        type: 'success',
        message: `Gambar ${isKey ? 'Kunci Jawaban' : 'Lembar Soal'} (${printLayout === '2_per_page' ? '2 TTS/Halaman' : '1 TTS/Halaman'}) berhasil diproses!`,
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
   * Direct PDF Export and Download using jsPDF (A4 Full Page 0mm Margin)
   */
  const handleExportPdf = async (isKey: boolean = showAnswerKey) => {
    if (parsedItems1.length === 0) {
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

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Exactly 1 full A4 page (210 x 297 mm) with 0mm margin because internal container already includes padding
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

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

      setExportModal({
        isOpen: true,
        type: 'pdf',
        url: blobUrl,
        fileName,
        isKey,
        layoutDesc: printLayout === '2_per_page' ? '2 TTS per Halaman (Hemat Kertas)' : '1 TTS per Halaman',
      });

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2500);
      setToast({
        type: 'success',
        message: `PDF ${isKey ? 'Kunci Jawaban' : 'Lembar Soal'} (${printLayout === '2_per_page' ? '2 TTS/Halaman' : '1 TTS/Halaman'}) berhasil dibuat!`,
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

  const currentTitle = activeEditorTab === 'tts1' ? title : title2;
  const setCurrentTitle = (val: string) => {
    if (activeEditorTab === 'tts1') setTitle(val);
    else setTitle2(val);
  };

  const currentRawWords = activeEditorTab === 'tts1' ? rawWords : rawWords2;
  const setCurrentRawWords = (val: string) => {
    if (activeEditorTab === 'tts1') setRawWords(val);
    else setRawWords2(val);
  };

  const currentParsedItems = activeEditorTab === 'tts1' ? parsedItems1 : parsedItems2;
  const currentLayout = activeEditorTab === 'tts1' ? layout1 : layout2;

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

      {/* Selector Layout Cetak (1 TTS vs 2 TTS Hemat Kertas) - Minimalis & Gambar Saja */}
      <div className="print:hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Layout Cetak:
            </span>
          </div>

          {/* Tombol-tombol Layout Cuma Gambar Saja Tanpa Keterangan */}
          <div className="flex items-center gap-2">
            {/* Opsi A: 1 TTS per Halaman (Gambar Miniatur A4) */}
            <button
              type="button"
              onClick={() => handleSelectLayout('1_per_page')}
              title="1 TTS per Halaman A4"
              className={`p-1.5 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center ${
                printLayout === '1_per_page'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20 shadow-xs scale-105'
                  : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-70 hover:opacity-100'
              }`}
            >
              {/* Miniatur A4 1 TTS */}
              <div className="w-7 h-9 rounded-xs border border-current p-0.5 flex flex-col justify-between bg-white dark:bg-neutral-950">
                <div className="w-full h-4 border border-current/80 rounded-2xs bg-current/20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 grid grid-cols-2 gap-0.5 opacity-60">
                    <div className="bg-current rounded-2xs" />
                    <div className="bg-current rounded-2xs" />
                    <div className="bg-current rounded-2xs" />
                    <div className="bg-current rounded-2xs" />
                  </div>
                </div>
                <div className="w-full space-y-0.5">
                  <div className="w-full h-0.5 bg-current/60 rounded" />
                  <div className="w-2/3 h-0.5 bg-current/60 rounded" />
                </div>
              </div>
            </button>

            {/* Opsi B: 2 TTS per Halaman (Gambar Miniatur A4 2 Bagian) */}
            <button
              type="button"
              onClick={() => handleSelectLayout('2_per_page')}
              title="2 TTS per Halaman A4 (Hemat Kertas)"
              className={`p-1.5 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center ${
                printLayout === '2_per_page'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20 shadow-xs scale-105'
                  : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-70 hover:opacity-100'
              }`}
            >
              {/* Miniatur A4 2 TTS Split */}
              <div className="w-7 h-9 rounded-xs border border-current p-0.5 flex flex-col justify-between bg-white dark:bg-neutral-950">
                <div className="w-full h-3 border border-current/80 rounded-2xs bg-current/20 flex items-center justify-between px-0.5">
                  <div className="w-2 h-2 grid grid-cols-2 gap-px opacity-60">
                    <div className="bg-current" />
                    <div className="bg-current" />
                    <div className="bg-current" />
                    <div className="bg-current" />
                  </div>
                  <div className="w-2 space-y-px">
                    <div className="w-full h-px bg-current" />
                    <div className="w-full h-px bg-current" />
                  </div>
                </div>
                <div className="w-full border-t border-dashed border-current my-px" />
                <div className="w-full h-3 border border-current/80 rounded-2xs bg-current/20 flex items-center justify-between px-0.5">
                  <div className="w-2 h-2 grid grid-cols-2 gap-px opacity-60">
                    <div className="bg-current" />
                    <div className="bg-current" />
                    <div className="bg-current" />
                    <div className="bg-current" />
                  </div>
                  <div className="w-2 space-y-px">
                    <div className="w-full h-px bg-current" />
                    <div className="w-full h-px bg-current" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Sub-options for 2-per-page: Salin Sama vs Dua TTS Berbeda */}
        {printLayout === '2_per_page' && (
          <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTwoPerPageSource('same')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  twoPerPageSource === 'same'
                    ? 'bg-amber-500 text-neutral-950 shadow-2xs'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <CopyCheck className="w-3.5 h-3.5" />
                <span>Salin Sama</span>
              </button>
              <button
                type="button"
                onClick={() => setTwoPerPageSource('different')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  twoPerPageSource === 'different'
                    ? 'bg-amber-500 text-neutral-950 shadow-2xs'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>2 TTS Berbeda</span>
              </button>
            </div>

            {twoPerPageSource === 'different' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveEditorTab('tts1')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeEditorTab === 'tts1'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-2xs'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  TTS 1 (Atas)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditorTab('tts2')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeEditorTab === 'tts2'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-2xs'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  TTS 2 (Bawah)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Card: Judul dan Daftar Kata Jawaban (Hidden when printing) */}
      <div className="print:hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        {printLayout === '2_per_page' && twoPerPageSource === 'different' && (
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-neutral-950 font-black text-xs">
              {activeEditorTab === 'tts1' ? 'SEDANG MENGEDIT TTS 1 (SLOT ATAS)' : 'SEDANG MENGEDIT TTS 2 (SLOT BAWAH)'}
            </span>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Judul {printLayout === '2_per_page' && twoPerPageSource === 'different' ? (activeEditorTab === 'tts1' ? '(Slot Atas)' : '(Slot Bawah)') : ''}
            </label>
            {(currentTitle || currentRawWords) && (
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
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder="Masukkan judul lembar kerja..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
              JAWABAN &lt;spasi&gt; Soal {printLayout === '2_per_page' && twoPerPageSource === 'different' ? (activeEditorTab === 'tts1' ? '(Slot Atas)' : '(Slot Bawah)') : ''}
            </label>
            <span className="text-xs text-neutral-500 font-mono">
              {currentParsedItems.length} Kata terdeteksi
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={currentRawWords}
            onChange={(e) => setCurrentRawWords(e.target.value)}
            wrap="off"
            placeholder="JAWABAN Petunjuk pertanyaan...&#10;JAWABAN2 Petunjuk pertanyaan kedua..."
            className="w-full font-mono text-xs md:text-sm p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed shadow-2xs whitespace-pre overflow-x-auto overflow-y-hidden resize-y transition-[height] duration-75"
            style={{ minHeight: '180px' }}
          />
          {currentLayout.unplacedWords.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{currentLayout.unplacedWords.length} kata belum bersilangan (coba ganti variasi di bawah)</span>
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
              ✓ {printLayout === '2_per_page' ? '2 TTS / 1 Lembar A4' : '1 TTS / 1 Lembar A4'}
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
              <span>Cetak</span>
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
              {printLayout === '1_per_page' ? (
                <WorksheetPaper
                  title={title}
                  layout={layout1}
                  cellSize={cellSize1PerPage}
                  acrossWords={acrossWords1}
                  downWords={downWords1}
                  showAnswerKey={showAnswerKey}
                  isExportMode={false}
                  id="worksheet-a4-page"
                />
              ) : (
                <WorksheetPaper2PerPage
                  topTTS={topTTS}
                  bottomTTS={bottomTTS}
                  showAnswerKey={showAnswerKey}
                  isExportMode={false}
                  id="worksheet-a4-page"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED OFF-SCREEN CLEAN CONTAINERS FOR EXPORT (Always 100% Unscaled A4 794x1123px, No Transforms, No CSS Color Bugs) */}
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
        <div ref={exportQuestionRef} style={{ width: '794px', height: '1123px', backgroundColor: '#ffffff' }}>
          {printLayout === '1_per_page' ? (
            <WorksheetPaper
              title={title}
              layout={layout1}
              cellSize={cellSize1PerPage}
              acrossWords={acrossWords1}
              downWords={downWords1}
              showAnswerKey={false}
              isExportMode={true}
            />
          ) : (
            <WorksheetPaper2PerPage
              topTTS={topTTS}
              bottomTTS={bottomTTS}
              showAnswerKey={false}
              isExportMode={true}
            />
          )}
        </div>

        {/* Export Container: Kunci Jawaban (Terisi) */}
        <div ref={exportAnswerRef} style={{ width: '794px', height: '1123px', backgroundColor: '#ffffff' }}>
          {printLayout === '1_per_page' ? (
            <WorksheetPaper
              title={title}
              layout={layout1}
              cellSize={cellSize1PerPage}
              acrossWords={acrossWords1}
              downWords={downWords1}
              showAnswerKey={true}
              isExportMode={true}
            />
          ) : (
            <WorksheetPaper2PerPage
              topTTS={topTTS}
              bottomTTS={bottomTTS}
              showAnswerKey={true}
              isExportMode={true}
            />
          )}
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
              {printLayout === '2_per_page' && twoPerPageSource === 'different'
                ? `${activeEditorTab === 'tts1' ? 'TTS 1' : 'TTS 2'} - Variasi ${currentSeed}`
                : `Variasi ${currentSeed}`}
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
              <span>Unduh PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportPdf(true)}
              disabled={isExportingPdf}
              className="px-3.5 h-12 bg-neutral-800 hover:bg-neutral-900 active:scale-[0.98] text-amber-400 dark:bg-neutral-200 dark:hover:bg-neutral-300 dark:text-amber-800 font-bold transition flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-60"
              title="Download Kunci Jawaban (Terisi) dalam format PDF A4"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unduh Kunci</span>
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
              <span>Unduh Gambar</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportImage(true)}
              disabled={isExporting}
              className="px-3.5 h-12 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold transition flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-60"
              title="Download Kunci Jawaban (Terisi) dalam format Gambar PNG"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unduh Kunci</span>
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
                    {exportModal.layoutDesc} • Unduhan otomatis telah dimulai
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
                    A4 Standar WYSIWYG (2382 × 3369 px)
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
                    PDF A4 Portrait Penuh (210 × 297 mm)
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
