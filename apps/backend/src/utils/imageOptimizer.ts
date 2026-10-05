import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function convertToWebP(filePath: string): Promise<string> {
  const ext = path.extname(filePath);
  const webpPath = filePath.replace(ext, '.webp');

  try {
    await sharp(filePath).resize(1920, 1920, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(webpPath);
    fs.unlinkSync(filePath);
    return webpPath;
  } catch (error) {
    console.error('convertToWebP failed for', filePath, error);
    throw error;
  }
}

export function getWebpFileName(originalFileName: string): string {
  const ext = path.extname(originalFileName);
  return originalFileName.replace(ext, '.webp');
}
