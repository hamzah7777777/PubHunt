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
