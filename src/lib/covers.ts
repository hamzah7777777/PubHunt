export const FALLBACK_COVER = '/covers/_fallback.svg';

interface ManifestEntry {
  theme: string;
  slug: string;
  file: string;
}

let coverMap: Map<string, string> | null = null;

function normalize(theme: string): string {
  return theme.trim().toLowerCase();
}

async function loadCoverMap(): Promise<Map<string, string>> {
  if (coverMap) return coverMap;

  const map = new Map<string, string>();
  try {
    const res = await fetch('/covers/manifest.json');
    if (res.ok) {
      const entries = (await res.json()) as ManifestEntry[];
      for (const entry of entries) {
        map.set(normalize(entry.theme), `/${entry.file}`);
      }
    }
  } catch {
    // No manifest yet, or it failed to load — every theme falls back below.
  }

  coverMap = map;
  return map;
}

export async function getCoverForTheme(theme: string): Promise<string> {
  const map = await loadCoverMap();
  return map.get(normalize(theme)) ?? FALLBACK_COVER;
}

export async function getCoverMap(): Promise<Map<string, string>> {
  return loadCoverMap();
}

// An admin-uploaded cover (teams.cover_url) beats the static theme-based
// cover from the manifest, which beats the fallback.
export function resolveCover(
  coverUrl: string | null | undefined,
  theme: string,
  map: Map<string, string>
): string {
  return coverUrl || map.get(normalize(theme)) || FALLBACK_COVER;
}

// Downscale an admin-picked image for use as a cover and encode it as webp
// (jpeg where the browser can't encode webp — toBlob then silently returns
// png, hence the type check). Cover tiles render at ~300px, so 640px on the
// long edge keeps retina crisp while staying a few tens of KB.
export async function fileToCoverBlob(file: File): Promise<{ blob: Blob; ext: 'webp' | 'jpg' }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process the image');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.85));
  const webp = await encode('image/webp');
  if (webp?.type === 'image/webp') return { blob: webp, ext: 'webp' };
  const jpg = await encode('image/jpeg');
  if (!jpg) throw new Error('Could not process the image');
  return { blob: jpg, ext: 'jpg' };
}
