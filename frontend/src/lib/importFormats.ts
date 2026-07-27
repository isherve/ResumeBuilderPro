export const IMPORT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
] as const;

export const IMPORT_ACCEPT_ATTR = IMPORT_EXTENSIONS.join(',');

export const IMPORT_FORMATS_LABEL =
  'PDF · Word (.doc / .docx) · TXT · JSON · PNG · JPG · WEBP · GIF · BMP · TIFF';

export const IMPORT_FORMAT_CHIPS = [
  'PDF',
  'DOC',
  'DOCX',
  'TXT',
  'JSON',
  'PNG',
  'JPG',
  'WEBP',
  'GIF',
  'BMP',
  'TIFF',
] as const;

export function isAcceptedImportFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMPORT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
