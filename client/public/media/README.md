# Portfolio media

The portfolio uses two media sources:

- Small repository assets under `client/public/` for lightweight SVG/WebP/JPG files.
- Public Supabase Storage buckets for project videos and larger portfolio media.

## Project videos

Project videos are defined in `client/src/data/portfolio.ts`.

Use the shared helper:

```ts
portfolioAsset("PROJECT", "example.mp4")
```

The helper in `client/src/lib/portfolioAssets.ts` builds the public Supabase Storage URL. It reads `VITE_SUPABASE_URL` when configured and otherwise uses the current Portfolio Supabase project URL.

Keep the Supabase object filename exactly identical to the filename passed to `portfolioAsset`; Storage paths are case-sensitive.

Do not commit large MP4/MOV/WebM project demos to Git. Local copies under `client/public/media/projects/` or `client/public/media/Projects/` are ignored.

## Experience and writing assets

Lightweight fallback SVGs remain in:

```text
client/public/media/experience/
client/public/media/writing/
```

Real portfolio images can also use `portfolioAsset(...)` from public Supabase buckets.

## Naming

Storage paths are case-sensitive, so the filename passed to `portfolioAsset(...)` must exactly match the uploaded object.

For production videos, prefer versioned filenames when the media changes, for example:

```text
Authenticator-v2.mp4
Authenticator-v3.mp4
```

Versioned URLs avoid stale browser/CDN copies when long-lived cache metadata is used. Do not overwrite a long-cached object in place unless you intentionally want clients to keep revalidating the same URL.
