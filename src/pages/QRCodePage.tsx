import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { qrApi } from "@/lib/api";
import { QrCode, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

export default function QRCodePage() {
  const [qrValue, setQrValue] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [loading, setLoading] = useState(false);
  const [noToken, setNoToken] = useState(false); // true = no active token exists

  // On mount: only load existing active token — do NOT auto-generate
  useEffect(() => {
    qrApi.getActive()
      .then((res) => {
        setQrValue(res.qrToken.token);
        setTimestamp(new Date().toLocaleString());
        setNoToken(false);
      })
      .catch(() => {
        // No active token — show empty state, wait for user to click Generate
        setNoToken(true);
      });
  }, []);

  // Generate only when user clicks the button
  const generateQR = useCallback(async () => {
    setLoading(true);
    try {
      const res = await qrApi.generate();
      setQrValue(res.qrToken.token);
      setTimestamp(new Date(res.qrToken.generatedAt).toLocaleString());
      setNoToken(false);
      toast.success(`QR code successfully generated!`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  }, []);

  // Visual QR renderer
  const renderQRVisual = () => {
    if (!qrValue) return null;
    const size = 21;
    const cells: boolean[][] = [];
    let hash = 0;
    for (let i = 0; i < qrValue.length; i++) {
      hash = ((hash << 5) - hash + qrValue.charCodeAt(i)) | 0;
    }
    for (let r = 0; r < size; r++) {
      cells[r] = [];
      for (let c = 0; c < size; c++) {
        const isCorner = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
        const isBorder = isCorner && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= size - 7 && (r === size - 1 || r === size - 7)) || (c >= size - 7 && (c === size - 1 || c === size - 7)));
        const isInner = isCorner && r >= 2 && r <= 4 && c >= 2 && c <= 4 || (r >= 2 && r <= 4 && c >= size - 5 && c <= size - 3) || (r >= size - 5 && r <= size - 3 && c >= 2 && c <= 4);
        if (isBorder || isInner) {
          cells[r][c] = true;
        } else if (isCorner && !isBorder && !isInner) {
          const ir = r % 7; const ic = c % 7;
          cells[r][c] = ir === 0 || ir === 6 || ic === 0 || ic === 6 || (ir >= 2 && ir <= 4 && ic >= 2 && ic <= 4);
        } else {
          const seed = (hash + r * 31 + c * 37) & 0xffffffff;
          cells[r][c] = (seed % 3) !== 0;
        }
      }
    }
    const cellSize = 10;
    return (
      <svg width={size * cellSize} height={size * cellSize} viewBox={`0 0 ${size * cellSize} ${size * cellSize}`} className="mx-auto">
        <rect width={size * cellSize} height={size * cellSize} fill="white" />
        {cells.map((row, r) =>
          row.map((cell, c) =>
            cell ? <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="black" /> : null
          )
        )}
      </svg>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">QR Code Generator</h1>
          <p className="text-sm text-muted-foreground">Generate attendance QR codes for employees to scan.</p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 zy-shadow text-center space-y-6">
            <div className="inline-flex h-12 w-12 rounded-xl zy-gradient items-center justify-center mx-auto">
              <QrCode className="h-6 w-6 text-primary-foreground" />
            </div>

            {/* QR display area */}
            <div className="bg-background border border-border rounded-xl p-6 min-h-[220px] flex items-center justify-center">
              {loading ? (
                <div className="space-y-3 text-center">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Generating...</p>
                </div>
              ) : noToken || !qrValue ? (
                <div className="text-center space-y-3">
                  <QrCode className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No active QR code.<br />
                    Click <strong>Generate QR</strong> to create one.
                  </p>
                </div>
              ) : (
                <div className="animate-pulse-glow">{renderQRVisual()}</div>
              )}
            </div>

            {/* Meta info */}
            {qrValue && !noToken && (
              <div className="space-y-1 text-left bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Generated: {timestamp}</p>
                <p className="text-xs font-mono text-muted-foreground break-all">{qrValue}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={generateQR}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg zy-gradient text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {noToken || !qrValue ? "Generate QR" : "Regenerate"}
              </button>
              {qrValue && !noToken && (
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                  <Download className="h-4 w-4" /> Download
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
