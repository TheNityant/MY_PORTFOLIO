type ProviderStatus = "ready" | "unconfigured" | "error" | "stale";

type CodingSummary = {
  provider: "wakatime";
  status: ProviderStatus;
  totalSeconds: number | null;
  totalHours: number | null;
  totalText: string | null;
  isUpToDate: boolean | null;
  percentCalculated: number | null;
  updatedAt: string | null;
  diagnostic?: string;
};

type WakaAllTimeResponse = {
  data?: {
    total_seconds?: number;
    text?: string;
    is_up_to_date?: boolean;
    percent_calculated?: number;
    range?: {
      end?: string;
    };
  };
};

const WAKATIME_ALL_TIME_URL =
  "https://api.wakatime.com/api/v1/users/current/all_time_since_today";

function fallback(
  status: Exclude<ProviderStatus, "ready">,
  diagnostic?: string,
): CodingSummary {
  return {
    provider: "wakatime",
    status,
    totalSeconds: null,
    totalHours: null,
    totalText: null,
    isUpToDate: null,
    percentCalculated: null,
    updatedAt: null,
    ...(diagnostic ? { diagnostic } : {}),
  };
}

function hoursFromSeconds(seconds: number) {
  return Math.round((seconds / 3600) * 100) / 100;
}

async function fetchAllTime(apiKey: string) {
  const response = await fetch(WAKATIME_ALL_TIME_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(7_000),
  });

  if (!response.ok) {
    throw new Error(`WakaTime all-time stats failed with HTTP ${response.status}`);
  }

  return (await response.json()) as WakaAllTimeResponse;
}

export async function GET(_request: Request) {
  const apiKey = process.env.WAKATIME_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      fallback("unconfigured", "WAKATIME_API_KEY is missing from this deployment"),
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }

  try {
    const response = await fetchAllTime(apiKey);
    const data = response.data;
    const totalSeconds = data?.total_seconds;

    if (typeof totalSeconds !== "number" || !Number.isFinite(totalSeconds)) {
      throw new Error("WakaTime all-time response did not include total_seconds");
    }

    const isUpToDate = data?.is_up_to_date !== false;
    const percentCalculated =
      typeof data?.percent_calculated === "number" ? data.percent_calculated : null;

    const payload: CodingSummary = {
      provider: "wakatime",
      status: isUpToDate ? "ready" : "stale",
      totalSeconds,
      totalHours: hoursFromSeconds(totalSeconds),
      totalText: typeof data?.text === "string" ? data.text : null,
      isUpToDate,
      percentCalculated,
      updatedAt:
        typeof data?.range?.end === "string"
          ? data.range.end
          : new Date().toISOString(),
      ...(!isUpToDate
        ? {
            diagnostic:
              percentCalculated == null
                ? "WakaTime is recalculating the all-time total"
                : `WakaTime is recalculating the all-time total (${percentCalculated}% calculated)`,
          }
        : {}),
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("WakaTime function failure", error);
    const diagnostic =
      error instanceof Error ? error.message : "Unknown WakaTime runtime error";
    return Response.json(fallback("error", diagnostic), {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
