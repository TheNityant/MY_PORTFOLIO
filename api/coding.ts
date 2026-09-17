type ProviderStatus = "ready" | "unconfigured" | "error" | "stale";

type CodingSummary = {
  provider: "wakatime";
  status: ProviderStatus;
  todaySeconds: number | null;
  todayHours: number | null;
  weekSeconds: number | null;
  weekHours: number | null;
  topProject: string | null;
  topLanguage: string | null;
  updatedAt: string | null;
  diagnostic?: string;
};

type WakaSummaryItem = {
  grand_total?: { total_seconds?: number };
  projects?: Array<{ name?: string; total_seconds?: number }>;
  languages?: Array<{ name?: string; total_seconds?: number }>;
  range?: { end?: string };
};

type WakaSummaryResponse = {
  data?: WakaSummaryItem[];
  cumulative_total?: { seconds?: number };
};

const WAKATIME_BASE_URL = "https://api.wakatime.com/api/v1";

function fallback(
  status: Exclude<ProviderStatus, "ready">,
  diagnostic?: string,
): CodingSummary {
  return {
    provider: "wakatime",
    status,
    todaySeconds: null,
    todayHours: null,
    weekSeconds: null,
    weekHours: null,
    topProject: null,
    topLanguage: null,
    updatedAt: null,
    ...(diagnostic ? { diagnostic } : {}),
  };
}

function hoursFromSeconds(seconds: number | null) {
  return seconds == null ? null : Math.round((seconds / 3600) * 100) / 100;
}

function pickTop(items: Array<{ name?: string; total_seconds?: number }> | undefined) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    [...items]
      .filter((item) => typeof item.name === "string")
      .sort((a, b) => (b.total_seconds ?? 0) - (a.total_seconds ?? 0))[0]
      ?.name?.trim() || null
  );
}

async function fetchSummaries(apiKey: string, timezone: string, range: "Today" | "Last 7 Days") {
  const url = new URL(`${WAKATIME_BASE_URL}/users/current/summaries`);
  url.searchParams.set("range", range);
  url.searchParams.set("timezone", timezone);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
    },
    signal: AbortSignal.timeout(7_000),
  });

  if (!response.ok) {
    throw new Error(`WakaTime summaries failed with HTTP ${response.status}`);
  }

  return (await response.json()) as WakaSummaryResponse;
}

export async function GET(_request: Request) {
  const apiKey = process.env.WAKATIME_API_KEY?.trim();
  const timezone = process.env.WAKATIME_TIMEZONE?.trim() || "Asia/Kolkata";

  if (!apiKey) {
    return Response.json(
      fallback("unconfigured", "WAKATIME_API_KEY is missing from this deployment"),
      { status: 200 },
    );
  }

  try {
    const [todayResponse, weekResponse] = await Promise.all([
      fetchSummaries(apiKey, timezone, "Today"),
      fetchSummaries(apiKey, timezone, "Last 7 Days"),
    ]);

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

    const payload: CodingSummary = {
      provider: "wakatime",
      status: "ready",
      todaySeconds,
      todayHours: hoursFromSeconds(todaySeconds),
      weekSeconds,
      weekHours: hoursFromSeconds(weekSeconds),
      topProject: pickTop(today?.projects),
      topLanguage: pickTop(today?.languages),
      updatedAt:
        typeof today?.range?.end === "string" ? today.range.end : new Date().toISOString(),
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("WakaTime function failure", error);
    const diagnostic = error instanceof Error ? error.message : "Unknown WakaTime runtime error";
    return Response.json(fallback("error", diagnostic), { status: 200 });
  }
}
