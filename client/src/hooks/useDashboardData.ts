import { useEffect, useState } from "react";

type CodingSummary = {
  provider: "wakatime";
  status: "ready" | "unconfigured" | "error" | "stale";
  todaySeconds: number | null;
  todayHours: number | null;
  weekSeconds: number | null;
  weekHours: number | null;
  topProject: string | null;
  topLanguage: string | null;
  updatedAt: string | null;
};

type DashboardData = {
  generatedAt: string;
  coding: CodingSummary;
};

export function useDashboardData(refreshMs = 60_000) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch("/api/dashboard", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) throw new Error(`Dashboard request failed: ${response.status}`);

        const payload = (await response.json()) as DashboardData;
        if (!active) return;

        setData(payload);
        setFailed(false);
      } catch (error) {
        if (!active) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), refreshMs);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refreshMs]);

  return { data, failed };
}

export function formatCodingDuration(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return "—";

  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
