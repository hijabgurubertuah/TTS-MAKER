import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
import { generateCrossword, parseRawInput, findOptimalSeedForLayout } from '../utils/crosswordGenerator';
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
  const [showPromptGuide, setShowPromptGuide] = useState(false);
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
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Primary TTS generation (used for TTS 1 / Top Slot)
  const parsedItems1 = useMemo(() => parseRawInput(rawWords), [rawWords]);
  const layout1: CrosswordLayout = useMemo(() => generateCrossword(parsedItems1, seed), [parsedItems1, seed]);
  const acrossWords1 = layout1.placedWords.filter((w) => w.direction === 'across');
  const downWords1 = layout1.placedWords.filter((w) => w.direction === 'down');

  // Secondary TTS generation (used for TTS 2 / Bottom Slot)
  // When 'same': uses parsedItems1 (same questions) with its own variation (seed2)
  // When 'different': uses parsedItems2 with seed2
  const parsedItems2 = useMemo(() => parseRawInput(rawWords2), [rawWords2]);
  const bottomItems = useMemo(
    () => (twoPerPageSource === 'same' ? parsedItems1 : parsedItems2),
    [twoPerPageSource, parsedItems1, parsedItems2]
  );
  const layout2: CrosswordLayout = useMemo(() => generateCrossword(bottomItems, seed2), [bottomItems, seed2]);
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
    return {
      title: (twoPerPageSource === 'different' ? title2 : title) || title || 'Teka-Teki Silang',
      layout: layout2,
      acrossWords: acrossWords2,
      downWords: downWords2,
    };
  }, [twoPerPageSource, title2, title, layout2, acrossWords2, downWords2]);

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

  const handleSelectLayout = (layoutMode: '1_per_page' | '2_per_page') => {
    setPrintLayout(layoutMode);
    try {
      localStorage.setItem('tts_print_layout', layoutMode);
    } catch {
      // ignore
    }

    if (layoutMode === '2_per_page') {
      // Force and automatically optimize the seed to utilize empty space for 2-per-page
      if (parsedItems1.length > 0) {
        const optimal1 = findOptimalSeedForLayout(parsedItems1, '2_per_page', seed);
        setSeed(optimal1);
      }
      if (twoPerPageSource === 'different' && parsedItems2.length > 0) {
        const optimal2 = findOptimalSeedForLayout(parsedItems2, '2_per_page', seed2);
        setSeed2(optimal2);
      }
      setToast({
        type: 'success',
        message: 'Layout 2 TTS per Halaman diaktifkan & disesuaikan otomatis agar pas di ruang kertas.',
      });
    } else {
      setToast({
        type: 'success',
        message: 'Layout 1 TTS per Halaman diaktifkan.',
      });
    }
  };

  const handleAutoFit = () => {
    if (activeEditorTab === 'tts1' || printLayout === '1_per_page') {
      const optimal = findOptimalSeedForLayout(parsedItems1, printLayout, seed);
      setSeed(optimal);
      setToast({
        type: 'success',
        message: `Susunan TTS 1 dioptimalkan ke susunan terbaik (${printLayout === '2_per_page' ? 'Pas 2 TTS / Lembar' : 'Pas 1 Lembar'}).`,
      });
    } else {
      const optimal = findOptimalSeedForLayout(parsedItems2, printLayout, seed2);
      setSeed2(optimal);
      setToast({
        type: 'success',
        message: `Susunan TTS 2 dioptimalkan ke susunan terbaik (${printLayout === '2_per_page' ? 'Pas 2 TTS / Lembar' : 'Pas 1 Lembar'}).`,
      });
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

  // Always auto-fit smoothly to the container / mobile screen width
  const effectiveScale = scale;

  const currentSeed = activeEditorTab === 'tts1' ? seed : seed2;
  const handleNextSeed = () => {
    if (activeEditorTab === 'tts1') setSeed((prev) => prev + 1);
    else setSeed2((prev) => prev + 1);
  };
  const handlePrevSeed = () => {
    if (activeEditorTab === 'tts1') setSeed((prev) => (prev > 1 ? prev - 1 : 9999));
    else setSeed2((prev) => (prev > 1 ? prev - 1 : 9999));
  };

  // Touch gesture swipe handlers (swipe left/right to change variations)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    // Trigger only if horizontal swipe exceeds 40px and is predominantly horizontal
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      if (printLayout === '2_per_page') {
        const containerRect = containerRef.current?.getBoundingClientRect();
        const isTopHalf = containerRect
          ? touchStartY.current < containerRect.top + containerRect.height / 2
          : true;

        if (isTopHalf) {
          if (diffX > 0) setSeed((prev) => (prev > 1 ? prev - 1 : 9999));
          else setSeed((prev) => prev + 1);
        } else {
          if (diffX > 0) setSeed2((prev) => (prev > 1 ? prev - 1 : 9999));
          else setSeed2((prev) => prev + 1);
        }
      } else {
        if (diffX > 0) {
          handlePrevSeed();
        } else {
          handleNextSeed();
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
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

  // Auto-resize textarea to dynamically fit content rows when typing or pressing Enter
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      
      const lineCount = Math.max(1, (currentRawWords || '').split('\n').length);
      // text-sm (14px) with leading-relaxed (~1.625) is ~23px per line + 28px padding + 2px border
      const lineBasedHeight = lineCount * 24 + 32;
      const hasHorizontalScrollbar = el.scrollWidth > el.clientWidth;
      const scrollbarBuffer = hasHorizontalScrollbar ? 20 : 8;
      
      const computedHeight = Math.max(el.scrollHeight + scrollbarBuffer, lineBasedHeight, 110);
      el.style.height = `${computedHeight}px`;
      el.scrollTop = 0;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [currentRawWords, activeEditorTab]);

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

      {/* Input Card: Judul dan Daftar Kata Jawaban (Hidden when printing) */}
      <div className="print:hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        {/* Sub-options for 2-per-page if active: Salin Sama vs 2 TTS Berbeda */}
        {printLayout === '2_per_page' && (
          <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-2 animate-in fade-in">
            {/* Row 1: Salin Sama vs 2 TTS Berbeda (Balanced Grid on Mobile & Desktop) */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => setTwoPerPageSource('same')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  twoPerPageSource === 'same'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <CopyCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Salin Sama</span>
              </button>
              <button
                type="button"
                onClick={() => setTwoPerPageSource('different')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  twoPerPageSource === 'different'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">2 TTS Berbeda</span>
              </button>
            </div>

            {/* Row 2: TTS 1 (Atas) vs TTS 2 (Bawah) (Balanced Grid on Mobile & Desktop) */}
            {twoPerPageSource === 'different' && (
              <div className="grid grid-cols-2 gap-2 w-full pt-1.5 border-t border-neutral-200 dark:border-neutral-700/70">
                <button
                  type="button"
                  onClick={() => setActiveEditorTab('tts1')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition text-center ${
                    activeEditorTab === 'tts1'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  TTS 1 (Atas)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditorTab('tts2')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition text-center ${
                    activeEditorTab === 'tts2'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  TTS 2 (Bawah)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tombol Layang Lebar Petunjuk Prompt ChatGPT (Default Tersembunyi) */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => setShowPromptGuide((prev) => !prev)}
            aria-expanded={showPromptGuide}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-between gap-2 cursor-pointer shadow-xs border ${
              showPromptGuide
                ? 'bg-amber-500 text-neutral-950 border-amber-600 dark:bg-amber-500 dark:text-neutral-950 dark:border-amber-400 ring-2 ring-amber-400/50'
                : 'bg-amber-50 hover:bg-amber-100/90 active:bg-amber-100 text-amber-900 border-amber-300/80 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <span className="tracking-wide uppercase">Petunjuk</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span>{showPromptGuide ? 'Tutup Petunjuk' : 'Buka Prompt AI / ChatGPT'}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${showPromptGuide ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {/* Kolom Prompt ChatGPT (Hanya Muncul Jika Tombol Petunjuk Ditekan) */}
          {showPromptGuide && (
            <div className="mt-2.5 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-start sm:items-center gap-1.5 leading-snug">
                  <span className="shrink-0">💡</span> Salin Prompt ini lalu tempel ke ChatGPT, Sesuaikan Materi dan Jumlah Soalnya.
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  title="Salin prompt untuk ChatGPT"
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold rounded-lg transition text-xs cursor-pointer shadow-2xs w-full sm:w-auto"
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
              <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700/70 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] sm:text-xs leading-relaxed select-all break-words">
                {chatGptPrompt}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Judul
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
              JAWABAN &lt;spasi&gt; SOAL
            </label>
            <span className="text-xs text-neutral-500 font-mono">
              {currentParsedItems.length} Kata terdeteksi
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={currentRawWords}
            onChange={(e) => {
              setCurrentRawWords(e.target.value);
              adjustTextareaHeight();
            }}
            onInput={() => adjustTextareaHeight()}
            onPaste={() => setTimeout(adjustTextareaHeight, 10)}
            onCut={() => setTimeout(adjustTextareaHeight, 10)}
            onKeyUp={() => adjustTextareaHeight()}
            onKeyDown={() => {
              setTimeout(adjustTextareaHeight, 0);
            }}
            onFocus={() => adjustTextareaHeight()}
            rows={4}
            wrap="off"
            placeholder="JAWABAN Petunjuk pertanyaan...&#10;JAWABAN2 Petunjuk pertanyaan kedua..."
            className="w-full font-mono text-xs md:text-sm p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed shadow-2xs whitespace-pre overflow-x-auto overflow-y-hidden resize-none"
            style={{ minHeight: '100px' }}
          />
          {currentLayout.unplacedWords.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{currentLayout.unplacedWords.length} kata belum bersilangan (coba geser panah kiri/kanan)</span>
            </div>
          )}
        </div>
      </div>

      {/* Pratinjau Lembar Kerja (Worksheet) - Responsive WYSIWYG Container */}
      <div className="w-full flex flex-col items-center">
        {/* WYSIWYG Header Bar */}
        <div className="print:hidden w-full max-w-[794px] flex flex-wrap items-center justify-between gap-2.5 px-2 mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center flex-wrap gap-2">
            <span className="font-bold text-neutral-900 dark:text-white text-sm">
              Pratinjau
            </span>

            {/* Tombol Pilih Layout (Miniatur Gambar Pas di Deretan Tulisan Pratinjau) */}
            <div className="flex items-center gap-1.5 ml-1">
              {/* Opsi 1 TTS per Halaman */}
              <button
                type="button"
                onClick={() => handleSelectLayout('1_per_page')}
                title="1 TTS per Halaman A4"
                className={`p-1 rounded-lg border-2 transition cursor-pointer flex flex-col items-center justify-center ${
                  printLayout === '1_per_page'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 scale-105'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="w-5 h-6.5 rounded-2xs border border-current p-0.5 flex flex-col justify-between bg-white dark:bg-neutral-950">
                  <div className="w-full h-2.5 border border-current/80 rounded-2xs bg-current/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 grid grid-cols-2 gap-px opacity-60">
                      <div className="bg-current" />
                      <div className="bg-current" />
                      <div className="bg-current" />
                      <div className="bg-current" />
                    </div>
                  </div>
                  <div className="w-full space-y-0.5">
                    <div className="w-full h-0.5 bg-current/60 rounded-2xs" />
                  </div>
                </div>
              </button>

              {/* Opsi 2 TTS per Halaman */}
              <button
                type="button"
                onClick={() => handleSelectLayout('2_per_page')}
                title="2 TTS per Halaman A4 (Hemat Kertas)"
                className={`p-1 rounded-lg border-2 transition cursor-pointer flex flex-col items-center justify-center ${
                  printLayout === '2_per_page'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 scale-105'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="w-5 h-6.5 rounded-2xs border border-current p-0.5 flex flex-col justify-between bg-white dark:bg-neutral-950">
                  <div className="w-full h-2 border border-current/80 rounded-2xs bg-current/20 flex items-center justify-between px-0.5">
                    <div className="w-1 h-1 bg-current opacity-70" />
                    <div className="w-1 h-0.5 bg-current opacity-70" />
                  </div>
                  <div className="w-full border-t border-dashed border-current my-px" />
                  <div className="w-full h-2 border border-current/80 rounded-2xs bg-current/20 flex items-center justify-between px-0.5">
                    <div className="w-1 h-1 bg-current opacity-70" />
                    <div className="w-1 h-0.5 bg-current opacity-70" />
                  </div>
                </div>
              </button>
            </div>

            {/* Tombol Otomatis Pas di samping Tombol Layout */}
            <button
              type="button"
              onClick={handleAutoFit}
              title="Otomatis pilih susunan yang pas untuk 1 lembar kertas"
              className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold transition cursor-pointer shadow-2xs flex items-center gap-1 ml-0.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Otomatis Pas</span>
            </button>
          </div>

          {/* Tab Lembar Soal dan Ceklis Kunci */}
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Tab Lembar Soal */}
            <button
              type="button"
              onClick={() => setShowAnswerKey(false)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                !showAnswerKey
                  ? 'bg-amber-500 text-neutral-950 shadow-2xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lembar Soal</span>
            </button>

            {/* Ceklis Kunci */}
            <label
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none border ${
                showAnswerKey
                  ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-2xs'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
              title="Ceklis untuk melihat kunci jawaban"
            >
              <input
                type="checkbox"
                checked={showAnswerKey}
                onChange={(e) => setShowAnswerKey(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
              />
              <span>Kunci</span>
            </label>
          </div>
        </div>

        {/* Viewport Box for Interactive Screen Display with Blue Navigation Arrows & Swipe */}
        <div
          ref={containerRef}
          className="relative w-full flex justify-center items-center overflow-hidden select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Tombol Panah Navigasi Variasi (Biru Transparan) */}
          {printLayout === '2_per_page' ? (
            <>
              {/* === SLOT ATAS (TTS 1) === */}
              {/* Panah Kiri TTS Atas */}
              <button
                type="button"
                onClick={() => setSeed((prev) => (prev > 1 ? prev - 1 : 9999))}
                title="TTS Atas: Susunan sebelumnya (bisa swipe layar atas ke kanan)"
                aria-label="TTS Atas Sebelumnya"
                className="absolute left-0 sm:left-2 top-[25%] -translate-y-1/2 z-30 p-2 sm:p-3 text-blue-500 hover:text-blue-600 active:text-blue-700 hover:bg-blue-500/10 active:scale-95 bg-transparent rounded-full transition cursor-pointer focus:outline-none"
              >
                <ChevronLeft className="w-8 h-8 sm:w-11 sm:h-11 stroke-[3] drop-shadow-md" />
              </button>

              {/* Panah Kanan TTS Atas */}
              <button
                type="button"
                onClick={() => setSeed((prev) => prev + 1)}
                title="TTS Atas: Susunan berikutnya (bisa swipe layar atas ke kiri)"
                aria-label="TTS Atas Berikutnya"
                className="absolute right-0 sm:right-2 top-[25%] -translate-y-1/2 z-30 p-2 sm:p-3 text-blue-500 hover:text-blue-600 active:text-blue-700 hover:bg-blue-500/10 active:scale-95 bg-transparent rounded-full transition cursor-pointer focus:outline-none"
              >
                <ChevronRight className="w-8 h-8 sm:w-11 sm:h-11 stroke-[3] drop-shadow-md" />
              </button>

              {/* === SLOT BAWAH (TTS 2) === */}
              {/* Panah Kiri TTS Bawah */}
              <button
                type="button"
                onClick={() => setSeed2((prev) => (prev > 1 ? prev - 1 : 9999))}
                title="TTS Bawah: Susunan sebelumnya (bisa swipe layar bawah ke kanan)"
                aria-label="TTS Bawah Sebelumnya"
                className="absolute left-0 sm:left-2 top-[75%] -translate-y-1/2 z-30 p-2 sm:p-3 text-blue-500 hover:text-blue-600 active:text-blue-700 hover:bg-blue-500/10 active:scale-95 bg-transparent rounded-full transition cursor-pointer focus:outline-none"
              >
                <ChevronLeft className="w-8 h-8 sm:w-11 sm:h-11 stroke-[3] drop-shadow-md" />
              </button>

              {/* Panah Kanan TTS Bawah */}
              <button
                type="button"
                onClick={() => setSeed2((prev) => prev + 1)}
                title="TTS Bawah: Susunan berikutnya (bisa swipe layar bawah ke kiri)"
                aria-label="TTS Bawah Berikutnya"
                className="absolute right-0 sm:right-2 top-[75%] -translate-y-1/2 z-30 p-2 sm:p-3 text-blue-500 hover:text-blue-600 active:text-blue-700 hover:bg-blue-500/10 active:scale-95 bg-transparent rounded-full transition cursor-pointer focus:outline-none"
              >
                <ChevronRight className="w-8 h-8 sm:w-11 sm:h-11 stroke-[3] drop-shadow-md" />
              </button>
            </>
          ) : (
            <>
              {/* === 1 TTS PER HALAMAN === */}
              {/* Tombol Variasi Kiri (Panah Biru Latar Transparan) */}
              <button
                type="button"
                onClick={handlePrevSeed}
                title="Susunan sebelumnya (bisa swipe layar ke kanan)"
                aria-label="Sebelumnya"
                className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 text-blue-500 hover:text-blue-600 active:text-blue-700 hover:bg-blue-500/10 active:scale-95 bg-transparent rounded-full transition cursor-pointer focus:outline-none"
              >
                <ChevronLeft className="w-8 h-8 sm:w-11 sm:h-11 stroke-[3] drop-shadow-md" />
              </button>

              {/* Tombol Variasi Kanan (Panah Biru Latar Transparan) */}
              <button
                type="button"
                onClick={handleNextSeed}
                title="Susunan berikutnya (bisa swipe layar ke kiri)"
                aria-label="Berikutnya"
                className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 text-blue-500 hover:text-blue-600 active:text-blue-700 hover:bg-blue-500/10 active:scale-95 bg-transparent rounded-full transition cursor-pointer focus:outline-none"
              >
                <ChevronRight className="w-8 h-8 sm:w-11 sm:h-11 stroke-[3] drop-shadow-md" />
              </button>
            </>
          )}

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
            className="relative shrink-0 transition-all duration-150 print:!w-full print:!h-auto shadow-md rounded-lg overflow-hidden"
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

      {/* Action Bar: Tombol Ekspor Utama */}
      <div className="print:hidden w-full max-w-[794px] mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 sm:p-4 rounded-2xl shadow-md">
        {/* Export Action Buttons */}
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
