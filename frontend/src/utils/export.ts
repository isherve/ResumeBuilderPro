import type { ResumeContent, ResumeTheme } from '@/types';

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Preview element not found');

  const html2pdf = (await import('html2pdf.js')).default;

  await html2pdf()
    .set({
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save();
}

export function exportToJSON(content: ResumeContent, theme: ResumeTheme, filename: string): void {
  const data = { content, theme, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToTXT(content: ResumeContent, filename: string): void {
  const lines: string[] = [];
  const info = content.personalInfo;

  if (info) {
    lines.push(`${info.firstName || ''} ${info.lastName || ''}`.trim());
    if (info.jobTitle) lines.push(info.jobTitle);
    if (info.email) lines.push(info.email);
    if (info.phone) lines.push(info.phone);
    lines.push('');
  }

  if (content.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(content.summary);
    lines.push('');
  }

  if (content.experience?.length) {
    lines.push('EXPERIENCE');
    content.experience.forEach((exp) => {
      lines.push(`${exp.jobTitle} - ${exp.company}`);
      lines.push(`${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate}`);
      exp.responsibilities?.forEach((r) => lines.push(`  • ${r}`));
      lines.push('');
    });
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printResume(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html><head><title>Resume</title>
    <style>body{margin:0;padding:20px;font-family:Inter,sans-serif;}</style>
    </head><body>${element.innerHTML}</body></html>
  `);
  printWindow.document.close();
  printWindow.print();
}
