import type { ResumeContent, ResumeTheme } from '@/types';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

function prepareExportNode(elementId: string): { node: HTMLElement; cleanup: () => void } {
  const container = document.getElementById(elementId);
  if (!container) throw new Error('Preview element not found');

  const source = (container.firstElementChild ?? container) as HTMLElement;
  const clone = source.cloneNode(true) as HTMLElement;

  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top left';
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minHeight = `${A4_HEIGHT_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position:fixed',
    'left:-12000px',
    'top:0',
    `width:${A4_WIDTH_PX}px`,
    'background:#ffffff',
    'z-index:-1',
  ].join(';');
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  return {
    node: clone,
    cleanup: () => {
      document.body.removeChild(wrapper);
    },
  };
}

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const { node, cleanup } = prepareExportNode(elementId);

  try {
    const imported = await import('html2pdf.js');
    const html2pdf = (imported as { default: (element?: HTMLElement) => { set: (opts: object) => { from: (el: HTMLElement) => { save: () => Promise<void> } } } }).default;

    await html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename: `${filename.replace(/[^\w\s-]/g, '').trim() || 'resume'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: A4_WIDTH_PX,
          windowWidth: A4_WIDTH_PX,
        },
        jsPDF: { unit: 'px', format: [A4_WIDTH_PX, A4_HEIGHT_PX], orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(node)
      .save();
  } finally {
    cleanup();
  }
}

export function exportToJSON(content: ResumeContent, theme: ResumeTheme, filename: string): void {
  const data = { content, theme, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${sanitizeFilename(filename)}.json`);
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
  downloadBlob(blob, `${sanitizeFilename(filename)}.txt`);
}

export function printResume(elementId: string): void {
  const { node, cleanup } = prepareExportNode(elementId);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    cleanup();
    throw new Error('Pop-up blocked. Allow pop-ups to print or export.');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html><head><title>Resume</title>
    <style>
      @page { size: A4; margin: 0; }
      body { margin: 0; padding: 0; font-family: Inter, sans-serif; background: #fff; }
    </style>
    </head><body>${node.outerHTML}</body></html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  cleanup();
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').trim() || 'resume';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
