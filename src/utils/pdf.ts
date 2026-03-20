import type { QuizResult } from '../types/quiz';

export async function exportQuizToPDF(result: QuizResult): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const correctCount = result.answers.filter((a) => a.isCorrect).length;
  const scorePercent = Math.round((correctCount / result.questions.length) * 100);

  // ── Helper functions ─────────────────────────────────────────
  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > 280) addPage();
  };

  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  };

  // ── Cover Page ───────────────────────────────────────────────
  // Header background
  doc.setFillColor(29, 29, 31);
  doc.rect(0, 0, 210, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('QuizAI', margin, 28);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Personal Quiz Report', margin, 40);

  doc.setFontSize(10);
  doc.text(
    `Generated on ${new Date(result.completedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    margin,
    52
  );

  y = 75;

  // Score summary box
  doc.setFillColor(245, 245, 247);
  doc.roundedRect(margin, y, contentW, 52, 4, 4, 'F');

  doc.setTextColor(29, 29, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.text(`${scorePercent}%`, margin + 10, y + 33);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 110, 115);
  doc.text(`${correctCount} / ${result.questions.length} Correct`, margin + 10, y + 44);

  // Stats on right
  const stats = [
    { label: 'Category', value: result.settings.category },
    { label: 'Difficulty', value: result.settings.difficulty.charAt(0).toUpperCase() + result.settings.difficulty.slice(1) },
    { label: 'Topic', value: result.settings.topic || 'General' },
    { label: 'Total Time', value: `${result.totalTime}s` },
  ];

  const statsX = margin + contentW / 2 + 5;
  stats.forEach((s, i) => {
    const sy = y + 12 + i * 11;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(110, 110, 115);
    doc.text(s.label.toUpperCase(), statsX, sy);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(29, 29, 31);
    doc.text(s.value, statsX + 30, sy);
  });

  y += 62;

  // ── Questions & Answers ──────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(29, 29, 31);
  doc.text('Questions & Answers', margin, y);
  y += 8;

  doc.setDrawColor(232, 232, 237);
  doc.line(margin, y, margin + contentW, y);
  y += 8;

  result.questions.forEach((q, idx) => {
    const answer = result.answers[idx];
    const isCorrect = answer?.isCorrect;
    const selectedOption = answer?.selectedOption;

    // Estimate height needed
    const qLines = wrapText(`${idx + 1}. ${q.question}`, contentW - 14, 12);
    const expLines = wrapText(q.explanation, contentW - 14, 10);
    const neededHeight = 14 + qLines.length * 5.5 + q.options.length * 10 + expLines.length * 4.5 + 20;

    checkPageBreak(neededHeight);

    // Question card background
    doc.setFillColor(isCorrect ? 240 : 255, isCorrect ? 255 : 245, isCorrect ? 244 : 245);
    doc.roundedRect(margin, y, contentW, neededHeight - 6, 3, 3, 'F');

    // Status badge
    doc.setFillColor(isCorrect ? 52 : 255, isCorrect ? 199 : 59, isCorrect ? 89 : 48);
    doc.roundedRect(margin + contentW - 28, y + 4, 26, 8, 4, 4, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(isCorrect ? '✓ CORRECT' : '✗ WRONG', margin + contentW - 26, y + 9.5);

    // Question number & text
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 29, 31);
    const qX = margin + 6;
    qLines.forEach((line: string, li: number) => {
      doc.text(line, qX, y + 14 + li * 5.5);
    });
    y += 14 + qLines.length * 5.5 + 2;

    // Options
    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, oi) => {
      const isCorrectOpt = oi === q.correctAnswer;
      const isSelected = oi === selectedOption;

      if (isCorrectOpt) {
        doc.setTextColor(52, 199, 89);
        doc.setFont('helvetica', 'bold');
      } else if (isSelected && !isCorrectOpt) {
        doc.setTextColor(255, 59, 48);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(110, 110, 115);
        doc.setFont('helvetica', 'normal');
      }

      doc.setFontSize(10);
      const prefix = isCorrectOpt ? '✓' : isSelected ? '✗' : '○';
      const optLines = wrapText(`${prefix} ${letters[oi]}. ${opt}`, contentW - 20, 10);
      optLines.forEach((line: string, li: number) => {
        doc.text(line, qX + 4, y + li * 4.5);
      });
      y += optLines.length * 4.5 + 2;
    });

    y += 3;

    // Divider
    doc.setDrawColor(232, 232, 237);
    doc.line(qX, y, margin + contentW - 6, y);
    y += 4;

    // Explanation
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 115);
    doc.text('EXPLANATION', qX, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(29, 29, 31);
    doc.setFontSize(10);
    y += 6;
    expLines.forEach((line: string) => {
      doc.text(line, qX, y);
      y += 4.5;
    });

    // Hint
    if (answer?.usedHint && q.hint) {
      y += 2;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 115);
      const hintLines = wrapText(`💡 Hint used: ${q.hint}`, contentW - 20, 9);
      hintLines.forEach((line: string) => {
        doc.text(line, qX, y);
        y += 4;
      });
    }

    y += 10;
  });

  // ── Footer on last page ──────────────────────────────────────
  checkPageBreak(20);
  doc.setFillColor(29, 29, 31);
  doc.rect(0, 287, 210, 10, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text('Generated by QuizAI • Keep learning, keep growing!', margin, 294);

  // Page numbers on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 115);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin - 20, 294);
  }

  doc.save(`QuizAI_${result.settings.category}_${result.settings.difficulty}_${Date.now()}.pdf`);
}
