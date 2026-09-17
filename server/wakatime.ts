export type ProviderStatus = "ready" | "unconfigured" | "error" | "stale";

export type CodingSummary = {
  provider: "wakatime";
  status: ProviderStatus;
  todaySeconds: number | null;
  todayHours: number | null;
  weekSeconds: number | null;
  weekHours: number | null;
  topProject: string | null;
  topLanguage: string | null;
  updatedAt: string | null;
};

type WakaSummaryItem = {
  grand_total?: {
    total_seconds?: number;
  };
  projects?: Array<{
    name?: string;
    total_seconds?: number;
  }>;
  languages?: Array<{
    name?: string;
    total_seconds?: number;
  }>;
  range?: {
    end?: string;
  };
};

type WakaSummaryResponse = {
  data?: WakaSummaryItem[];
  cumulative_total?: {
    seconds?: number;
  };
};

const WAKATIME_BASE_URL = "https://api.wakatime.com/api/v1";
const apiKey = process.env.WAKATIME_API_KEY?.trim();
const timezone = process.env.WAKATIME_TIMEZONE?.trim() || "Asia/Kolkata";

const hoursFromSeconds = (seconds: number | null) =>
  seconds == null ? null : Math.round((seconds / 3600) * 100) / 100;

const fallback = (status: Exclude<ProviderStatus, "ready">): CodingSummary => ({
  provider: "wakatime",
  status,
  todaySeconds: null,
  todayHours: null,
  weekSeconds: null,
  weekHours: null,
  topProject: null,
  topLanguage: null,
  updatedAt: null,
});

function basicAuthHeader(secret: string) {
  // WakaTime expects the API key itself to be base64 encoded for Basic auth.
  return `Basic ${Buffer.from(secret).toString("base64")}`;
}

async function fetchSummaries(range: "Today" | "Last 7 Days") {
  if (!apiKey) return null;

  const url = new URL(`${WAKATIME_BASE_URL}/users/current/summaries`);
  url.searchParams.set("range", range);
  url.searchParams.set("timezone", timezone);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: basicAuthHeader(apiKey),
    },
    signal: AbortSignal.timeout(7_000),
  });

  if (!response.ok) {
    throw new Error(`WakaTime summaries failed with ${response.status}`);
  }

  return (await response.json()) as WakaSummaryResponse;
}

function pickTop(
  items: Array<{ name?: string; total_seconds?: number }> | undefined,
): string | null {
  if (!Array.isArray(items) || items.length === 0) return null;

  const sorted = [...items]
    .filter((item) => typeof item.name === "string")
    .sort((a, b) => (b.total_seconds ?? 0) - (a.total_seconds ?? 0));

  return sorted[0]?.name?.trim() || null;
}

export async function getCodingSummary(): Promise<CodingSummary> {
  if (!apiKey) return fallback("unconfigured");

  try {
    const [todayResponse, weekResponse] = await Promise.all([
      fetchSummaries("Today"),
      fetchSummaries("Last 7 Days"),
    ]);

    if (!todayResponse || !weekResponse) return fallback("unconfigured");

    const today = todayResponse.data?.[0];
    const todaySeconds =
      typeof today?.grand_total?.total_seconds === "number"
        ? today.grand_total.total_seconds
        : 0;

    const weekSeconds =
      typeof weekResponse.cumulative_total?.seconds === "number"
        ? weekResponse.cumulative_total.seconds
        : Array.isArray(weekResponse.data)
          ? weekResponse.data.reduce(
              (total, item) =>
                total +
                (typeof item.grand_total?.total_seconds === "number"
                  ? item.grand_total.total_seconds
                  : 0),
              0,
            )
          : 0;

    const updatedAt =
      typeof today?.range?.end === "string"
        ? today.range.end
        : new Date().toISOString();

    return {
      provider: "wakatime",
      status: "ready",
      todaySeconds,
      todayHours: hoursFromSeconds(todaySeconds),
      weekSeconds,
      weekHours: hoursFromSeconds(weekSeconds),
      topProject: pickTop(today?.projects),
      topLanguage: pickTop(today?.languages),
      updatedAt,
    };
  } catch {
    return fallback("error");
  }
}
