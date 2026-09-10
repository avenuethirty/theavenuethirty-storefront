const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const MIME_TYPE = 'image/jpeg';
const QUALITY = 0.85;

export interface CompressedImage {
  base64: string;
  width: number;
  height: number;
  sizeKB: number;
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = calculateDimensions(bitmap.width, bitmap.height);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await canvas.convertToBlob({ type: MIME_TYPE, quality: QUALITY });
  const base64 = await blobToBase64(blob);
  const sizeKB = Math.round(blob.size / 1024);

  return { base64, width, height, sizeKB };
}

function calculateDimensions(originalWidth: number, originalHeight: number) {
  if (originalWidth <= MAX_WIDTH && originalHeight <= MAX_HEIGHT) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth > originalHeight) {
    return {
      width: MAX_WIDTH,
      height: Math.round(MAX_WIDTH / aspectRatio),
    };
  }

  return {
    width: Math.round(MAX_HEIGHT * aspectRatio),
    height: MAX_HEIGHT,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
