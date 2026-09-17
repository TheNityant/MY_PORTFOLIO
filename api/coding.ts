type CodingErrorPayload = {
  provider: "wakatime";
  status: "error";
  todaySeconds: null;
  todayHours: null;
  weekSeconds: null;
  weekHours: null;
  topProject: null;
  topLanguage: null;
  updatedAt: null;
  diagnostic: string;
};

function diagnosticMessage(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return "Unknown runtime error";
}

export async function GET(_request: Request) {
  try {
    const { getCodingSummary } = await import("../server/wakatime.ts");
    const coding = await getCodingSummary();

    return Response.json(coding, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("WakaTime function runtime failure", error);

    const payload: CodingErrorPayload = {
      provider: "wakatime",
      status: "error",
      todaySeconds: null,
      todayHours: null,
      weekSeconds: null,
      weekHours: null,
      topProject: null,
      topLanguage: null,
      updatedAt: null,
      diagnostic: diagnosticMessage(error),
    };

    return Response.json(payload, { status: 200 });
  }
}
