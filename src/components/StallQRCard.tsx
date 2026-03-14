'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, X, QrCode, Copy, Check } from 'lucide-react';

const APP_URL = 'https://www.ments.app';

type Props = {
  eventId: string;
  stallId: string;
  stallName: string;
  startupId?: string | null;
  logoUrl?: string | null;
};

export default function StallQRCard({ eventId, stallId, stallName, startupId, logoUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const investUrl = startupId
    ? `${APP_URL}/startups/${startupId}?fromArena=1&eventId=${encodeURIComponent(eventId)}&stallId=${encodeURIComponent(stallId)}`
    : `${APP_URL}/invest/${encodeURIComponent(eventId)}/${encodeURIComponent(stallId)}`;

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { quality: 1.0, pixelRatio: 3 });
      const a = document.createElement('a');
      a.download = `${stallName.replace(/\s+/g, '_')}_QR.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setDownloading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(investUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted hover:text-primary transition-colors"
        title="Download QR Card"
      >
        <QrCode size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-card-border bg-card-bg shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <h3 className="font-bold text-foreground">Investment QR Code</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 hover:bg-card-border/30 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-6 space-y-4">
              <p className="text-sm text-muted text-center">
                Audience can scan this to invest virtual funds in <span className="font-medium text-foreground">{stallName}</span>.
              </p>

              {/* Downloadable card */}
              <div className="flex justify-center">
                <div
                  ref={cardRef}
                  style={{ fontFamily: 'sans-serif' }}
                  className="bg-white p-6 rounded-2xl flex flex-col items-center shadow-sm border border-gray-100 w-[280px]"
                >
                  {/* Ments branding */}
                  <div className="mb-3 flex items-center gap-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/black.png" alt="Ments" width={24} height={24} />
                    <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px', color: '#000' }}>ments</span>
                  </div>

                  {/* Startup logo if available */}
                  {logoUrl && (
                    <div className="mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt={stallName} className="h-12 w-12 rounded-xl object-cover border border-gray-100" />
                    </div>
                  )}

                  <QRCodeSVG
                    value={investUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />

                  <div className="mt-4 text-center w-full">
                    <p className="text-lg font-bold text-black truncate">{stallName}</p>
                    <p className="text-xs text-gray-500 mt-1">Scan to Invest · Investment Arena</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-muted break-all px-2">{investUrl}</p>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-3 text-sm transition disabled:opacity-60"
                >
                  <Download size={15} />
                  {downloading ? 'Downloading…' : 'Download'}
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-card-border bg-card-bg hover:bg-card-border/20 text-foreground font-semibold px-4 py-3 text-sm transition"
                >
                  {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
