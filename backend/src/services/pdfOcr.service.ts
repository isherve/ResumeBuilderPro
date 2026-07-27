import Tesseract from 'tesseract.js';

const MAX_OCR_PAGES = 6;

export async function extractTextFromPdfWithOcr(buffer: Buffer): Promise<string> {
  const { pdf } = await import('pdf-to-img');

  let document: AsyncIterable<Buffer>;
  try {
    document = await pdf(buffer, { scale: 2 });
  } catch (error) {
    console.error('PDF to image conversion failed:', error);
    return '';
  }

  const pageTexts: string[] = [];
  let pageIndex = 0;

  for await (const pageImage of document) {
    pageIndex += 1;
    if (pageIndex > MAX_OCR_PAGES) break;

    try {
      const result = await Tesseract.recognize(pageImage, 'eng', {
        logger: () => undefined,
      });
      const text = result.data.text?.trim();
      if (text) pageTexts.push(text);
    } catch (error) {
      console.error(`OCR failed on PDF page ${pageIndex}:`, error);
    }
  }

  return pageTexts.join('\n\n').trim();
}

export async function extractTextFromImageWithOcr(buffer: Buffer): Promise<string> {
  try {
    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: () => undefined,
    });
    return result.data.text?.trim() ?? '';
  } catch (error) {
    console.error('Image OCR failed:', error);
    return '';
  }
}
