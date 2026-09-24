import { CrosswordLayout, PlacedWord } from '../types';

/**
 * Pure HTML5 Canvas renderer for standard A4 (1588 x 2246 px at 2x 192 DPI).
 * Guarantee 100% fail-safe export without any dependency on CSS color parsers (oklch) or DOM cloning.
 */
export function renderCrosswordToCanvas(
  title: string,
  layout: CrosswordLayout,
  acrossWords: PlacedWord[],
  downWords: PlacedWord[],
  showAnswerKey: boolean
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = 1588; // 2x 794px
  const height = 2246; // 2x 1123px (Standard ISO 216 A4 ratio 1:1.414)
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const marginX = 70;
  let currentY = 70;

  // 2. Title & Score Box
  const displayTitle = (title.trim() || 'TEKA-TEKI SILANG').toUpperCase();
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'top';

  // Draw Score Box on right
  const scoreBoxWidth = 144;
  const scoreBoxHeight = 104;
  const scoreBoxX = width - marginX - scoreBoxWidth;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(scoreBoxX, currentY, scoreBoxWidth, scoreBoxHeight);

  // Draw Title (wrap if too long)
  const maxTitleWidth = scoreBoxX - marginX - 40;
  ctx.fillText(displayTitle, marginX, currentY + 10, maxTitleWidth);

  currentY += scoreBoxHeight + 20;

  // Divider line under title
  ctx.beginPath();
  ctx.moveTo(marginX, currentY);
  ctx.lineTo(width - marginX, currentY);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.stroke();

  currentY += 16;

  // Student Identity Line
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('Nama: _________________________________________', marginX, currentY);
  ctx.fillText('Kelas: ____________________', marginX + 800, currentY);

  currentY += 45;

  // Dashed divider line
  ctx.beginPath();
  ctx.setLineDash([8, 8]);
  ctx.moveTo(marginX, currentY);
  ctx.lineTo(width - marginX, currentY);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#9ca3af';
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  currentY += 30;

  // 3. Draw Crossword Grid
  const availableGridWidth = width - marginX * 2;
  const availableGridHeight = 780; // Bound grid height for single sheet layout

  let cellSize = 52;
  if (layout.width > 0 && layout.height > 0) {
    const calculatedW = Math.floor(availableGridWidth / layout.width);
    const calculatedH = Math.floor(availableGridHeight / layout.height);
    cellSize = Math.min(52, Math.max(32, Math.min(calculatedW, calculatedH)));
  }

  const gridPixelWidth = (layout.width || 1) * cellSize;
  const gridPixelHeight = (layout.height || 1) * cellSize;
  const gridStartX = marginX + Math.floor((availableGridWidth - gridPixelWidth) / 2);
  const gridStartY = currentY;

  if (layout.width > 0 && layout.height > 0) {
    for (let r = 0; r < layout.height; r++) {
      for (let c = 0; c < layout.width; c++) {
        const key = `${r},${c}`;
        const cell = layout.cells[key];
        const cellX = gridStartX + c * cellSize;
        const cellY = gridStartY + r * cellSize;

        if (cell) {
          // White filled cell
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);

          ctx.lineWidth = 2;
          ctx.strokeStyle = '#000000';
          ctx.strokeRect(cellX, cellY, cellSize, cellSize);

          // Clue Number at top-left
          if (cell.number !== undefined) {
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${Math.max(12, Math.floor(cellSize * 0.3))}px monospace`;
            ctx.textBaseline = 'top';
            ctx.fillText(`${cell.number}`, cellX + 3, cellY + 3);
          }

          // Letter if showAnswerKey is on
          if (showAnswerKey && cell.letter) {
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${Math.max(18, Math.floor(cellSize * 0.55))}px monospace`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText(cell.letter.toUpperCase(), cellX + cellSize / 2, cellY + cellSize / 2 + 2);
            ctx.textAlign = 'left'; // Reset
          }
        } else {
          // Empty background block with subtle tint
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
        }
      }
    }
  }

  currentY = gridStartY + gridPixelHeight + 40;

  // 4. Clues Section (2 Columns: Mendatar & Menurun)
  ctx.beginPath();
  ctx.moveTo(marginX, currentY);
  ctx.lineTo(width - marginX, currentY);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.stroke();

  currentY += 25;

  const colWidth = (width - marginX * 2 - 60) / 2;
  const col1X = marginX;
  const col2X = marginX + colWidth + 60;

  // Draw Column Headers
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';
  ctx.fillText(`MENDATAR (${acrossWords.length} Soal)`, col1X, currentY);
  ctx.fillText(`MENURUN (${downWords.length} Soal)`, col2X, currentY);

  currentY += 40;

  // Helper to wrap and draw clues
  const renderCluesColumn = (words: PlacedWord[], startX: number, startY: number) => {
    let y = startY;
    const clueFontSize = 21;
    ctx.font = `500 ${clueFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    for (const item of words) {
      if (y > height - 70) break; // Keep strictly within A4 height

      const numStr = `${item.number}. `;
      ctx.font = `bold ${clueFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#111827';
      const numWidth = ctx.measureText(numStr).width;
      ctx.fillText(numStr, startX, y);

      // Clue text
      ctx.font = `400 ${clueFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textX = startX + numWidth;
      const textMaxWidth = colWidth - numWidth;

      let fullText = item.clue;
      const wordsArr = fullText.split(' ');
      let line = '';

      for (let n = 0; n < wordsArr.length; n++) {
        const testLine = line + wordsArr[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > textMaxWidth && n > 0) {
          ctx.fillText(line, textX, y);
          line = wordsArr[n] + ' ';
          y += clueFontSize + 8;
        } else {
          line = testLine;
        }
      }

      ctx.fillText(line, textX, y);

      // Draw answer tag if showAnswerKey
      if (showAnswerKey) {
        ctx.font = `bold ${clueFontSize - 2}px monospace`;
        ctx.fillStyle = '#047857';
        ctx.fillText(` [${item.word}]`, textX + ctx.measureText(line).width, y);
      }

      y += clueFontSize + 14;
    }
  };

  renderCluesColumn(acrossWords, col1X, currentY);
  renderCluesColumn(downWords, col2X, currentY);

  return canvas;
}
