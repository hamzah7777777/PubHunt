const MAX_DIMENSION = 1920;

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not read image'));
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      'image/jpeg',
      quality
    );
  });
}

/**
 * Downscales + re-encodes an image as JPEG, stepping quality and dimensions
 * down until it fits under maxBytes. Reports 0-1 progress as it tries steps.
 */
export async function compressImage(
  file: File,
  maxBytes: number,
  onProgress?: (fraction: number) => void
): Promise<Blob> {
  const img = await loadImage(file);
  onProgress?.(0.15);

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const qualitySteps = [0.92, 0.8, 0.65, 0.5, 0.35];
  let attempt = 0;
  const totalAttempts = qualitySteps.length * 2;

  while (attempt < totalAttempts) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const quality = qualitySteps[attempt % qualitySteps.length];
    const blob = await canvasToBlob(canvas, quality);
    attempt += 1;
    onProgress?.(0.15 + 0.55 * (attempt / totalAttempts));

    if (blob.size <= maxBytes) return blob;

    if (attempt % qualitySteps.length === 0) {
      width = Math.round(width * 0.75);
      height = Math.round(height * 0.75);
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvasToBlob(canvas, 0.3);
}
