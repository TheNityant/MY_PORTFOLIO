type Song = {
  name?: string;
  artists?: Array<{ name?: string }>;
  album?: { images?: Array<{ url?: string }> };
  external_urls?: { spotify?: string };
};

type SpotifyPlayback = {
  is_playing?: boolean;
  item?: Song | null;
};

type RecentlyPlayed = {
  items?: Array<{ track?: Song | null }>;
};

type PublicStatus = "playing" | "last-played" | "idle" | "unconfigured" | "unavailable";

function response(
  status: PublicStatus,
  song: Song | null = null,
  ttl = 30,
) {
  return Response.json(
    {
      status,
      title: song?.name ?? null,
      artist: song?.artists?.map((a) => a.name).filter(Boolean).join(", ") || null,
      artwork: song?.album?.images?.[0]?.url ?? null,
      url: song?.external_urls?.spotify ?? null,
    },
    {
      headers: {
        // Never expose secrets; short caching also avoids one Spotify request
        // per portfolio visitor on a popular page.
        "Cache-Control": `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=45`,
      },
    },
  );
}

export async function GET(_request: Request) {
  const id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN?.trim();

  if (!id || !secret || !refreshToken) return response("unconfigured", null, 120);

  try {
    const basic = Buffer.from(`${id}:${secret}`).toString("base64");
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
    });
    if (!tokenResponse.ok) return response("unavailable", null, 10);

    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!token.access_token) return response("unavailable", null, 10);
    const authHeaders = { Authorization: `Bearer ${token.access_token}` };

    const playingResponse = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      { headers: authHeaders, cache: "no-store", signal: AbortSignal.timeout(6_000) },
    );

    if (playingResponse.ok && playingResponse.status !== 204) {
      const playing = (await playingResponse.json()) as SpotifyPlayback;
      if (playing.is_playing && playing.item?.name) {
        return response("playing", playing.item, 15);
      }
    }

    // If not currently playing, identify the result honestly as LAST PLAYED.
    const recentResponse = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=1",
      { headers: authHeaders, cache: "no-store", signal: AbortSignal.timeout(6_000) },
    );
    if (recentResponse.ok) {
      const recent = (await recentResponse.json()) as RecentlyPlayed;
      const song = recent.items?.[0]?.track;
      if (song?.name) return response("last-played", song, 45);
    }
    return response("idle", null, 45);
  } catch {
    return response("unavailable", null, 10);
  }
}
