import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { settingsApi, attendanceApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, MapPin, CheckCircle2, XCircle, Camera } from "lucide-react";
import logo from "@/assets/zenithyuga-logo.png";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

type ScanState = "idle" | "scanning" | "verifying" | "success" | "error";

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ScannerPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<{
    time: string;
    date: string;
    distance?: number;
    action?: "check-in" | "check-out";
    workedHours?: number;
    shortageHours?: number;
    checkInTime?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Start camera AFTER the #qr-reader div is rendered
  useEffect(() => {
    if (state !== "scanning") return;

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        await scanner.stop().catch(() => {});
        scannerRef.current = null;
        setState("verifying");

        if (!navigator.geolocation) {
          setState("error");
          setErrorMsg("Geolocation is not supported by your browser.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const settings = await settingsApi.get();
              const distance = Math.round(
                getDistance(
                  position.coords.latitude,
                  position.coords.longitude,
                  settings.settings.lat,
                  settings.settings.lng
                )
              );
              const res = await attendanceApi.checkIn({
                qrToken: decodedText,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
              const now = new Date();
              setResult({
                time: now.toLocaleTimeString(),
                date: now.toLocaleDateString(),
                distance,
                action: res.action,
                workedHours: res.record?.workedHours,
                shortageHours: res.record?.shortageHours,
                checkInTime: res.record?.checkInTime,
              });
              setState("success");
            } catch (e: unknown) {
              setState("error");
              setErrorMsg(e instanceof Error ? e.message : "Check-in failed.");
            }
          },
          () => {
            setState("error");
            setErrorMsg("Unable to retrieve your location. Please enable GPS.");
          },
          { enableHighAccuracy: true }
        );
      },
      () => {}
    ).catch(() => {
      setState("error");
      setErrorMsg("Camera access denied. Please allow camera permission and try again.");
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [state]);

  const handleScan = () => setState("scanning");

  const reset = () => {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setState("idle");
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-border bg-card">
        <img src={logo} alt="ZenithYuga" className="h-8" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <button onClick={() => { logout(); navigate("/"); }} className="text-sm text-destructive hover:underline">Logout</button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6">
                <div className="inline-flex h-20 w-20 rounded-2xl zy-gradient items-center justify-center mx-auto">
                  <ScanLine className="h-10 w-10 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold mb-1">Mark Attendance</h1>
                  <p className="text-sm text-muted-foreground">Tap to scan the office QR code and check in.</p>
                </div>
                <button onClick={handleScan} className="w-full py-3 rounded-xl zy-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2">
                  <Camera className="h-4 w-4" /> Start Scanning
                </button>
              </motion.div>
            )}

            {state === "scanning" && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">Point your camera at the office QR code</p>
                <div id="qr-reader" className="rounded-2xl overflow-hidden w-full" />
                <button onClick={reset} className="text-sm text-destructive hover:underline">Cancel</button>
              </motion.div>
            )}

            {state === "verifying" && (
              <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6">
                <div className="h-64 bg-muted rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Verifying location...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {state === "success" && result && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6">
                <div className="inline-flex h-20 w-20 rounded-full bg-zy-success/10 items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-zy-success" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    {result.action === "check-out" ? "Shift Completed!" : "Attendance Marked!"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {result.action === "check-out" ? "Successfully checked out." : "Successfully checked in."}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 zy-shadow text-left space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Employee</span><span className="font-medium">{user?.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span className="font-medium">{result.date}</span></div>
                  {result.action === "check-in" ? (
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Check-in Time</span><span className="font-medium">{result.time}</span></div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Check-in Time</span><span className="font-medium">{result.checkInTime}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Check-out Time</span><span className="font-medium">{result.time}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Worked</span><span className="font-medium">{result.workedHours} hrs</span></div>
                      {(result.shortageHours || 0) > 0 && (
                         <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shortage</span><span className="font-medium text-destructive">{result.shortageHours} hrs</span></div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Location</span><span className="font-medium text-zy-success inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Verified ({result.distance}m)</span></div>
                </div>
                <button onClick={() => navigate("/employee/dashboard")} className="w-full py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Go to Dashboard</button>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6">
                <div className="inline-flex h-20 w-20 rounded-full bg-destructive/10 items-center justify-center mx-auto">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">Attendance Failed</h2>
                  <p className="text-sm text-destructive">{errorMsg}</p>
                </div>
                <button onClick={reset} className="w-full py-3 rounded-xl zy-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">Try Again</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
