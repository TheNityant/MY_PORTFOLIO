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

async function fetchAllTime(accessToken: string) {
  const response = await fetch(WAKATIME_ALL_TIME_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(7_000),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(`WakaTime OAuth access denied (HTTP ${response.status}). Make sure the configured environment variable contains a personal OAuth access token (not a WakaTime plugin API key).`);
  }
  if (!response.ok) {
    throw new Error(`WakaTime all-time stats failed with HTTP ${response.status}`);
  }

  return { status: response.status, body: (await response.json()) as WakaAllTimeResponse };
}

export async function GET(_request: Request) {
  // WAKATIME_API_KEY is retained for deployments that replaced the old
  // write-only API key's value with a personal OAuth token.
  // Both variables must contain an OAuth token, never a plugin API key.
  const accessToken =
    process.env.WAKATIME_ACCESS_TOKEN?.trim() ||
    process.env.WAKATIME_API_KEY?.trim();

  if (!accessToken) {
    return Response.json(
      fallback("unconfigured", "Neither WAKATIME_ACCESS_TOKEN nor WAKATIME_API_KEY is defined in this deployment. Configure a personal OAuth token in Vercel."),
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }

  try {
    const { status, body } = await fetchAllTime(accessToken);
    const data = body.data;
    const totalSeconds = data?.total_seconds;

    if (typeof totalSeconds !== "number" || !Number.isFinite(totalSeconds)) {
      if (status === 202) {
        return Response.json(
          {
            ...fallback("stale", "WakaTime is still calculating the all-time total"),
            isUpToDate: false,
            percentCalculated:
              typeof data?.percent_calculated === "number"
                ? data.percent_calculated
                : null,
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      throw new Error("WakaTime all-time response did not include total_seconds");
    }

    const isUpToDate = status !== 202 && data?.is_up_to_date !== false;
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
      updatedAt: new Date().toISOString(),
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
        "Cache-Control": isUpToDate
          ? "public, max-age=0, s-maxage=300, stale-while-revalidate=600"
          : "no-store",
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
