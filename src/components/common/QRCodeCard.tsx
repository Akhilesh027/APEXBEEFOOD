import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  Printer,
  Copy,
  ExternalLink,
  Check,
  Smartphone,
  Sparkles,
  Utensils,
  Share2,
} from 'lucide-react';
import { generateQRMatrix, qrMatrixToSvgPath } from '../../utils/qrCode';
import { IQRRecord } from '../../services/qrMenuStorage';

interface QRCodeCardProps {
  qrRecord: IQRRecord;
  scanUrl?: string;
  onOpenCustomerView?: (url: string) => void;
  showStandeeActions?: boolean;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  qrRecord,
  scanUrl,
  onOpenCustomerView,
  showStandeeActions = true,
}) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Compute full scan URL with network host override support
  const targetUrl = useMemo(() => {
    if (scanUrl) return scanUrl;
    let baseOrigin = window.location.origin;
    try {
      const override = localStorage.getItem('apexbee_qr_host_override');
      if (override && override.trim()) {
        baseOrigin = override.trim().replace(/\/+$/, '');
        if (!baseOrigin.startsWith('http://') && !baseOrigin.startsWith('https://')) {
          baseOrigin = `http://${baseOrigin}`;
        }
      }
    } catch (e) {}
    return `${baseOrigin}/menu/view?qr=${qrRecord.id}&table=${encodeURIComponent(qrRecord.tableNumber)}`;
  }, [scanUrl, qrRecord.id, qrRecord.tableNumber]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&ecc=M&data=${encodeURIComponent(targetUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ApexBee Food - Standee ${qrRecord.tableNumber}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              text-align: center;
              padding: 40px;
              background: #fff;
              color: #111;
            }
            .standee {
              border: 3px solid #111;
              border-radius: 24px;
              padding: 30px;
              max-width: 380px;
              margin: 0 auto;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .badge {
              display: inline-block;
              background: #f59e0b;
              color: #000;
              font-weight: 800;
              font-size: 13px;
              padding: 6px 14px;
              border-radius: 20px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            h1 {
              margin: 12px 0 4px;
              font-size: 26px;
              font-weight: 900;
            }
            p.sub {
              font-size: 13px;
              color: #555;
              margin-bottom: 20px;
            }
            .qr-box {
              background: #fff;
              border: 2px solid #e2e8f0;
              border-radius: 18px;
              padding: 16px;
              display: inline-block;
            }
            .instructions {
              margin-top: 20px;
              font-size: 12px;
              color: #475569;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="standee">
            <span class="badge">TABLE ${qrRecord.tableNumber}</span>
            <h1>ApexBee Food</h1>
            <p class="sub">Scan with any phone camera to view menu & order</p>
            <div class="qr-box">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&ecc=M&data=${encodeURIComponent(targetUrl)}" width="240" height="240" style="display:block;margin:0 auto;" />
            </div>
            <div class="instructions">
              ⚡ Instant Digital Kitchen Ordering • Contactless • Wi-Fi Free
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPNG = () => {
    window.open(qrImageUrl, '_blank');
  };

  return (
    <div
      ref={cardRef}
      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300"
    >
      {/* GLOW ACCENT */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <div className="flex items-center justify-between w-full mb-3">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">Mobile Scannable</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          Table {qrRecord.tableNumber}
        </span>
      </div>

      {/* QR CONTAINER - 100% COMPLIANT CLEAN SCANNABLE CODE */}
      <div className="relative p-3.5 bg-white rounded-2xl shadow-2xl border-4 border-slate-900 group-hover:scale-[1.02] transition-transform duration-300">
        <img
          src={qrImageUrl}
          alt={`QR Table ${qrRecord.tableNumber}`}
          className="w-48 h-48 md:w-52 md:h-52 rounded-xl object-contain bg-white"
          loading="eager"
        />
      </div>

      {/* TABLE INFO */}
      <div className="mt-3.5 w-full">
        <h4 className="font-extrabold font-heading text-slate-100 text-sm">
          {qrRecord.label || `Table ${qrRecord.tableNumber} QR Menu`}
        </h4>
        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
          {qrRecord.specialNote || 'Scan with camera to view live digital menu & place order'}
        </p>

        {/* URL PREVIEW BADGE */}
        <div className="mt-2 text-[10px] text-slate-400 font-mono truncate max-w-full bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
          {targetUrl}
        </div>

        {/* STATS & MODE PILLS */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono">
            {qrRecord.menuMode === 'CUSTOM_SELECTION'
              ? `${qrRecord.selectedItemIds?.length || 0} Curated Dishes`
              : 'Full Digital Menu'}
          </span>
          {qrRecord.discountPercent > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{qrRecord.discountPercent}% OFF</span>
            </span>
          )}
        </div>
      </div>
      {/* ACTION BUTTONS */}
      {showStandeeActions && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 w-full space-y-2">
          {/* SIMULATE SCAN / PREVIEW LIVE MENU */}
          <button
            onClick={() => {
              if (onOpenCustomerView) {
                onOpenCustomerView(targetUrl);
              } else {
                window.open(targetUrl, '_blank');
              }
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center space-x-2"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Simulate Scan / View Menu</span>
          </button>

          {/* QUICK TOOLBAR */}
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              onClick={handleCopyLink}
              className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition flex items-center justify-center space-x-1"
              title="Copy Customer Menu Link"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition flex items-center justify-center space-x-1"
              title="Download High-Res QR"
            >
              <Download className="w-3 h-3" />
              <span>Save</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition flex items-center justify-center space-x-1"
              title="Print Table Standee"
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
