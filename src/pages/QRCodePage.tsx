import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { qrApi } from "@/lib/api";
import { QrCode, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodePage() {
  const [qrValue, setQrValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    qrApi.getActive()
      .then((res) => {
        setQrValue(res.qrToken.token);
        setExpiresAt(new Date(res.qrToken.expiresAt).toLocaleString());
        setNoToken(false);
      })
      .catch(() => {
        setNoToken(true);
      });
  }, []);

  const generateQR = useCallback(async () => {
    setLoading(true);
    try {
      const res = await qrApi.generate();
      setQrValue(res.qrToken.token);
      setExpiresAt(new Date(res.qrToken.expiresAt).toLocaleString());
      setNoToken(false);
      toast.success("QR code successfully generated!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownload = () => {
    const svg = document.getElementById("attendance-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = "attendance-qr.png";
      link.href = canvas.toDataURL();
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
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
            <div className="bg-white border border-border rounded-xl p-6 min-h-[220px] flex items-center justify-center">
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
                <QRCodeSVG id="attendance-qr" value={qrValue} size={220} level="H" includeMargin />
              )}
            </div>

            {qrValue && !noToken && (
              <div className="space-y-1 text-left bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Expires: {expiresAt}</p>
                <p className="text-xs font-mono text-muted-foreground break-all">{qrValue}</p>
              </div>
            )}

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
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
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
