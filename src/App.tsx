import React, { useState, useEffect } from 'react';
import { Grid3X3, Moon, Sun } from 'lucide-react';
import { WorksheetGenerator } from './components/WorksheetGenerator';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('tts_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tts_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tts_theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <div
      className={`${
        isDarkMode ? 'dark' : ''
      } min-h-screen bg-neutral-100/80 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200`}
    >
      {/* Top Navbar - Hidden when printing */}
      <header className="print:hidden sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Grid3X3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-neutral-900 dark:text-white leading-none">
                Teka Teki Silang Maker
              </h1>
            </div>
          </div>

          {/* Right Action: Dark Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              title="Ganti Tema Gelap/Terang"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-2 sm:px-6 py-4 sm:py-6 print:p-0 print:m-0 print:max-w-none">
        <WorksheetGenerator />
      </main>
    </div>
  );
}
