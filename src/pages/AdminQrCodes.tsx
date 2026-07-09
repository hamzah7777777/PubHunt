import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import QRCode from 'qrcode';
import { FINISH_HINT, ROUTE_HINTS } from './hints';

// QR posters for the printed materials: one for the main site, one per pub
// per route, and one for the finish line. Scanning a pub poster deep-links
// to that stop's hint page (see consumeHintDeepLink in App.tsx); the route
// letter in the URL is only there so a scanned link is self-describing.
const SITE_URL = 'https://sheffieldpubhunt.com/';

interface QrSpec {
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

function buildSpecs(): QrSpec[] {
  const specs: QrSpec[] = [
    { id: 'main-site', title: 'MAIN SITE', subtitle: 'Team portal & host login', url: SITE_URL },
  ];
  for (const route of ['A', 'B'] as const) {
    ROUTE_HINTS[route].forEach((hint, i) => {
      specs.push({
        id: `route-${route.toLowerCase()}-pub-${i + 1}`,
        title: `ROUTE ${route} · PUB ${i + 1}`,
        subtitle: hint.time,
        url: `${SITE_URL}#pub-${route}${i + 1}`,
      });
    });
  }
  specs.push({
    id: 'finish-line',
    title: 'FINISH LINE',
    subtitle: FINISH_HINT.time,
    url: `${SITE_URL}#pub-5`,
  });
  return specs;
}

const SPECS = buildSpecs();

// Palette lifted from the design tokens in index.css — canvas can't read
// CSS variables, so the arcade colours are repeated here.
const INK = '#0C0B14';
const PANEL = '#15131F';
const WHITE = '#F5F3FF';
const CYAN = '#00E5FF';
const PURPLE = '#7C5CFF';
const GREEN = '#39FF7A';
const BODY = '#C7C3E0';

/** A4-ish portrait poster (1240x1754 ≈ 150dpi), flat pixel-arcade style. */
async function drawPoster(spec: QrSpec): Promise<HTMLCanvasElement> {
  await Promise.all([
    document.fonts.load('16px "Press Start 2P"'),
    document.fonts.load('16px "VT323"'),
  ]);

  const W = 1240;
  const H = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Flat background + hard pixel double border, like the app's panels.
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = WHITE;
  ctx.fillRect(24, 24, W - 48, H - 48);
  ctx.fillStyle = PANEL;
  ctx.fillRect(40, 40, W - 80, H - 80);

  // Corner blocks — little 8-bit notches on the inner frame.
  ctx.fillStyle = CYAN;
  for (const [x, y] of [[40, 40], [W - 88, 40], [40, H - 88], [W - 88, H - 88]]) {
    ctx.fillRect(x, y, 48, 48);
    ctx.fillStyle = CYAN;
  }

  ctx.textAlign = 'center';

  // Header.
  ctx.fillStyle = CYAN;
  ctx.font = '28px "Press Start 2P"';
  ctx.fillText('SHEFFIELD 2026', W / 2, 170);
  ctx.fillStyle = WHITE;
  ctx.font = '72px "Press Start 2P"';
  ctx.fillText('PUB HUNT', W / 2 + 6, 280 + 6); // hard offset shadow
  ctx.fillStyle = PURPLE;
  ctx.fillText('PUB HUNT', W / 2, 280);

  // Stop label + time window.
  ctx.fillStyle = GREEN;
  ctx.font = '44px "Press Start 2P"';
  ctx.fillText(spec.title, W / 2, 420);
  ctx.fillStyle = BODY;
  ctx.font = '56px "VT323"';
  ctx.fillText(spec.subtitle, W / 2, 500);

  // QR on a white panel with a hard black border.
  const qrSize = 720;
  const panelPad = 48;
  const panelSize = qrSize + panelPad * 2;
  const panelX = (W - panelSize) / 2;
  const panelY = 570;
  ctx.fillStyle = INK;
  ctx.fillRect(panelX - 12, panelY - 12, panelSize + 24, panelSize + 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(panelX, panelY, panelSize, panelSize);

  const qrDataUrl = await QRCode.toDataURL(spec.url, {
    errorCorrectionLevel: 'H',
    width: qrSize,
    margin: 0,
    color: { dark: INK, light: '#FFFFFF' },
  });
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = () => reject(new Error('QR image failed to load'));
    qrImg.src = qrDataUrl;
  });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrImg, panelX + panelPad, panelY + panelPad, qrSize, qrSize);

  // Footer.
  const footerY = panelY + panelSize + 110;
  ctx.fillStyle = CYAN;
  ctx.font = '40px "Press Start 2P"';
  ctx.fillText('SCAN TO PLAY', W / 2, footerY);
  ctx.fillStyle = BODY;
  ctx.font = '48px "VT323"';
  ctx.fillText(spec.url.replace('https://', ''), W / 2, footerY + 80);
  ctx.fillStyle = GREEN;
  ctx.font = '30px "VT323"';
  ctx.fillText('PRESS START · INSERT COIN · RAISE A GLASS', W / 2, H - 90);

  return canvas;
}

async function downloadPoster(spec: QrSpec) {
  const canvas = await drawPoster(spec);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pubhunt-qr-${spec.id}.png`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminQrCodes() {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        SPECS.map(async spec => {
          const dataUrl = await QRCode.toDataURL(spec.url, {
            errorCorrectionLevel: 'H',
            width: 240,
            margin: 1,
          });
          return [spec.id, dataUrl] as const;
        })
      );
      if (!cancelled) setPreviews(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = async (spec: QrSpec) => {
    setBusy(spec.id);
    try {
      await downloadPoster(spec);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-stats">
          Downloads are print-ready A4 posters · pub codes open that stop&rsquo;s hint page
        </span>
      </div>

      <div className="admin-qr-grid">
        {SPECS.map(spec => (
          <div key={spec.id} className="admin-qr-card">
            <div className="admin-qr-title">{spec.title}</div>
            <div className="admin-qr-subtitle">{spec.subtitle}</div>
            {previews[spec.id] ? (
              <img className="admin-qr-img" src={previews[spec.id]} alt={`QR code for ${spec.title}`} />
            ) : (
              <div className="admin-qr-img admin-qr-loading">…</div>
            )}
            <button
              className="admin-btn admin-btn-primary admin-qr-download"
              onClick={() => handleDownload(spec)}
              disabled={busy === spec.id}
            >
              <Download size={14} /> {busy === spec.id ? 'Building…' : 'Download poster'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
