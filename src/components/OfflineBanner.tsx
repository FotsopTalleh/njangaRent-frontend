import { useEffect, useState, useRef, useCallback } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

const PING_URL = "/api/health";
const DEBOUNCE_MS = 3000;

async function checkConnectivity(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(PING_URL, { method: "HEAD", cache: "no-store", signal: ctrl.signal });
    clearTimeout(timeout);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleCheck = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const online = await checkConnectivity();
      setIsOffline(!online);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    window.addEventListener("online", scheduleCheck);
    window.addEventListener("offline", scheduleCheck);

    const init = setTimeout(async () => {
      const online = await checkConnectivity();
      setIsOffline(!online);
    }, 1500);

    return () => {
      window.removeEventListener("online", scheduleCheck);
      window.removeEventListener("offline", scheduleCheck);
      clearTimeout(init);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [scheduleCheck]);

  const handleRetry = async () => {
    setChecking(true);
    const online = await checkConnectivity();
    setIsOffline(!online);
    setChecking(false);
  };

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-3 bg-destructive text-destructive-foreground text-sm font-medium py-2 px-4 shadow-lg"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>You're offline — some features may be unavailable</span>
      <button
        onClick={handleRetry}
        disabled={checking}
        aria-label="Retry connection"
        className="ml-2 flex items-center gap-1 text-xs underline underline-offset-2 opacity-80 hover:opacity-100 disabled:opacity-50 transition-opacity"
      >
        <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} aria-hidden="true" />
        {checking ? "Checking..." : "Retry"}
      </button>
    </div>
  );
}
