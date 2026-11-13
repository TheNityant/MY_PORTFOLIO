# Dashboard Customization Guide

This is the maintenance README for the portfolio **dashboard grid** (the interactive cards below the hero). It covers content, appearance, animation speeds, data connections, and what to change if you relocate or swap projects.

> **Scope:** Changing this dashboard does not require changing project demos, the hero, the global ShaderGradient, or the overall grid. Preserve the `dashboard-grid` structure and its `grid-template-rows` unless deliberately redesigning the layout.

## Quick-start

```powershell
git switch main
git pull --ff-only origin main
pnpm install
pnpm dev
# Other terminal
pnpm dev:api
```

The Vite development server renders the UI. The Express server handles the local versions of `/api/coding`, `/api/workouts` and `/api/now-playing`. Set values from `.env.example` in a local `.env` file; do not commit actual credentials.

Before shipping:

```powershell
pnpm check
pnpm build:web
```

Vercel builds the frontend and serves `api/*.ts` endpoints as serverless functions. Verify **the deployed dashboard on desktop and Android** before declaring animation timing or layout stable.

## Dashboard map: all cards

| Card | Content / data source | Editable source | Visual / animation knobs |
| --- | --- | --- | --- |
| Mumbai, India | Profile location and globe marker | `client/src/data/portfolio.ts` -> `profile.location`, `locationLat`, `locationLng` | `Globe.tsx` constants `PHI_IDLE`, `DRAG_DAMPING`, `INERTIA_DECAY`, `SPRING`, `THETA_*` |
| Scratch me | Random reward concealed by scratchable cover | `client/src/data/scratchRewards.ts` and `ScratchReveal.tsx` | `BRUSH_RADIUS`, `COMPLETE_THRESHOLD`, `GRADIENT_COLORS`; `scratchReveal.module.css` |
| Activity | GitHub contribution calendar | `GitHubActivity.tsx`, `profile.githubHandle` | `GITHUB_GREEN`, `last49Days`; related dashboard CSS |
| Workouts | Habit Tracker Supabase `Workout` completion count | `api/workouts.ts`, `useDashboardData.ts`, `Dashboard.tsx` | Odometer CSS, live value formatting and fallback rules |
| Hours coding | WakaTime all-time coding time | `api/coding.ts`, `useDashboardData.ts`, `Dashboard.tsx` | Odometer CSS, `formatCodingDuration` |
| Listening / Building | Spotify listening and active project, alternating automatically | `FeatureCard.tsx`, `portfolio.ts -> dashboardFeature`, `api/now-playing.ts` | Five-second switch and CSS/SVG character animation (see below) |
| Core stack | Featured technologies | `portfolio.ts -> coreStackTools` | `ToolsMarquee.tsx`, `.favorite-tools` styles |
| Connect | Email, LinkedIn, GitHub | `portfolio.ts -> socials`, `visibleSocials` | `Dashboard.tsx`, `.connect-list` |
| Tools | Tech-logo strip / marquee | `portfolio.ts -> tools` | `ToolsMarquee.tsx`, `.tools-track` CSS; static on touch devices |

Most cards are assembled in **`client/src/components/home/Dashboard.tsx`**, using `DashboardCard.tsx`. The grid positions and sizing live in **`client/src/index.css`** (`.dashboard-grid`, `.dashboard-area-*`). Additional responsive and animation rules are in **`client/src/styles/interactionEnhancements.css`**.

The desktop grid uses fixed row sizes. **Do not add another grid row or increase the feature-card height just to fit a longer title.** Instead use ellipsis, a short project name, and the existing title tooltip.

## 1. Change location / globe behavior

In `client/src/data/portfolio.ts`:

```ts
profile.location = "..."; // This is a const object; edit its initializer directly.
locationLat: 19.076,
locationLng: 72.8777,
```

Edit those **three fields together** when relocating. Also update `dashboardCopy.locationTitle` only if you override its `profile.location` reference. `Globe.tsx` reads the coordinates via `profile` and places the marker accordingly.

In `client/src/components/home/Globe.tsx`:

- `PHI_IDLE`: idle rotation per rendered step, smaller = slower globe;
- `DRAG_DAMPING`: pointer drag sensitivity;
- `INERTIA_DECAY`: closer to 1 = inertia persists longer;
- `SPRING`: higher = faster return toward target tilt;
- `THETA_TARGET/MIN/MAX`: default and allowable vertical angles.

Do not make the globe high-DPR on Android just for apparent sharpness; it increases GPU usage and worsens scroll performance.

## 2. Scratch card

The reward list is in `client/src/data/scratchRewards.ts`, not inside the dashboard component. The reveal code is in `ScratchReveal.tsx`:

```ts
const BRUSH_RADIUS = 30;       // larger brush removes a wider area
const COMPLETE_THRESHOLD = 0.2; // fraction revealed before completion
const GRADIENT_COLORS = ["#A97CF933", "#F38CB933", "#FDCC9233"];
```

Edit these to tune scratch feel. The scratch-completion calculation is sampled for efficiency on touch devices; avoid computing every pixel on every pointer movement.

## 3. Activity / contributions

`GitHubActivity.tsx` fetches GitHub activity and renders the last 49 days. Adjust `last49Days` only if the card's width accommodates more cells. To switch accounts, edit `profile.githubHandle` in `portfolio.ts`.

`GITHUB_GREEN` controls the heatmap color scale. `GitHubActivity.tsx` also provides fallbacks if public GitHub data is unavailable. Avoid inserting a fake contribution count to fill empty states.

## 4. Workout data

Workout counts are sourced from the **Habit Tracker Supabase database** through `api/workouts.ts`. The portfolio does not write workout completions; it only displays them.

Server-only environment variables:

```dotenv
HABIT_TRACKER_SUPABASE_URL=...
HABIT_TRACKER_SUPABASE_SECRET_KEY=...
HABIT_TRACKER_USER_ID=7
HABIT_TRACKER_WORKOUT_HABIT_ID=17
HABIT_TRACKER_WORKOUT_TITLE=Workout
HABIT_TRACKER_TIMEZONE=Asia/Kolkata
```

The UI displays `totalDays` (or the fallback totalCount) and uses the seven-day value in the tooltip. **Do not hard-code a progress number or alter the habit ID without verifying the target Habit Tracker record.**

## 5. Coding time

`api/coding.ts` reads the WakaTime **all-time** total. It needs a read-capable OAuth access token (`WAKATIME_ACCESS_TOKEN`), not the write-only API key used by an IDE plugin. `useDashboardData.ts` fetches coding and workouts concurrently every 60 seconds by default.

`formatCodingDuration` converts seconds into a compact `123h 45m` display. It intentionally shows hours + minutes, rather than growing a massive decimal counter.

## 6. Odometer / numerical scrolling

Workouts and coding both use `AnimatedMetric` in `Dashboard.tsx`. The visible digits are CSS **reels** that roll from zero and slow down near the final value, rather than React state jumping through rounded values every animation frame.

In `client/src/styles/interactionEnhancements.css`:

```css
.metric-odometer__reel {
  --metric-roll-duration: 2900ms;
  --metric-roll-easing: cubic-bezier(0.13, 0.83, 0.16, 1);
}
```

- **Slower overall:** try `3400ms`.
- **Faster overall:** try `1900ms`.
- **Stronger damping near the end:** keep the endpoint at `(1,1)`, use an easing curve with more early motion and more late settling (experiment with `cubic-bezier(0.11, 0.86, 0.13, 1)`).
- **Digit staggering:** change `85` in `Math.min(order, 6) * 85` in `Dashboard.tsx`; zero makes digits start together.
- The first display waits until the card is visible. Updates use the actual API values; never fabricate digits.
- `prefers-reduced-motion` displays the true number without rolling.
- The final true value remains available to assistive technology through `aria-label`.

**One important tradeoff:** Large integer values use the same digit reel idea; visually the reels travel through repeated 0–9 digits, rather than the page doing hundreds of numeric React renders. That is intentional, not a data-calculation animation.

## 7. Listening / Building dual card

This one card intentionally retains the existing dashboard `feature` grid area. Source: `client/src/components/home/FeatureCard.tsx`.

### Auto-switch timing

```ts
export const LIVE_PULSE_SWITCH_MS = 5000;
export const SPOTIFY_REFRESH_MS = 60000;
```

The CSS timer automatically reads `LIVE_PULSE_SWITCH_MS` from the React component. Change **one constant** to make the Listening ↔ Building rotation faster or slower. The card pauses rotation when off-screen, in a hidden tab, or when the visitor requests reduced motion. The buttons allow manual switching and restart the five-second interval.

### Active project

Set `dashboardFeature` in `client/src/data/portfolio.ts`:

```ts
export const dashboardFeature: DashboardFeature = {
  kind: "building",
  title: "Jiraiya Personal Assistant",
  description: "Personalization · AI agents",
  href: "https://github.com/TheNityant/JIRAYA_PERSONAL_ASSISTANT",
};
```

You can edit this independently of the actual Projects list, so spotlighting Jiraiya doesn't remove Statistical Analysis Platform from the projects catalog. The arrow link takes visitors to the configured repo.

For **truly live project status**, the planned future integration is a server endpoint reading a `live_status` row from the separate **Portfolio Supabase project**, with RLS/server credentials. This table is **not created or connected by this change**; the spotlight text currently comes from `portfolio.ts`. No need to join the Habit Tracker database with the Portfolio database to implement this card.

### Actual Spotify data

`api/now-playing.ts` reads Spotify through server-side OAuth. The frontend calls `/api/now-playing` when the card is near the viewport, refreshing once per minute while visible.

Add these **server-only secrets** in Vercel and local `.env`:

```dotenv
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
```

Create your own Spotify developer application and authorize the **same Spotify account** using `user-read-currently-playing` and `user-read-recently-played` scopes. Perform the OAuth authorization-code exchange securely to obtain a refresh token; never expose the client secret or refresh token in client JavaScript or a `VITE_` variable.

Statuses:

- `playing`: actual current song — shows **Now playing** and a three-bar equalizer;
- `last-played`: most recent song — labels it **Last played** (not pretending you're currently listening);
- `idle`, `unconfigured`, `unavailable`: a neutral **Music corner** placeholder; no fake song, artist, or playback indicator.

Spotify is **not connected until those environment variables are provided and authorized**. A database table alone cannot infer the actual currently playing track on Spotify.

### Character and lighting animations

Both are **original inline SVG figures**, so there are no external heavy dancing GIFs, Lottie packages, MP4s, or copyrighted character files.

Tune these in `interactionEnhancements.css`:

| Class / keyframe | What changes |
| --- | --- |
| `.live-pulse__figure` | Right-hand animation size |
| `live-dance` | Dancer side-to-side body movement |
| `live-arm-left`, `live-arm-right` | Dancer arm timing and swing |
| `live-step-left`, `live-step-right` | Dancer legs |
| `live-light-left`, `live-light-right` | Overhead spotlight sweep |
| `live-builder-bob` | Worker walking/leaning motion |
| `live-hammer-hit` | Hammer impact cycle |
| `live-builder-spark` | Impact sparks |
| `live-equalize` | Audio-themed bars; only shown when Spotify says `playing` |
| `--live-pulse-green`, `--live-pulse-violet` / `--live-pulse-tint` | Color emphasis |

The characters are decorative and **do not play music**. A Spotify link opens the actual track when available. Shadows are CSS-only and intentionally restrained: the global shader already provides the site's atmosphere.

### Where to change layout safely

Look for `.live-pulse__body` and `.live-pulse__figure` in `interactionEnhancements.css`. The body uses a two-column grid, with text on the left and the small SVG scene on the right. Keep `overflow: hidden`, `min-width: 0`, and the truncation rules; these prevent the feature card from resizing or pushing the whole dashboard layout. The feature card's fixed dashboard grid slot has **not** been resized.

## 8. Core stack, tools, and contact

- Core stack: change `coreStackTools` in `portfolio.ts` (currently selected Java/Spring Boot). The actual `ToolMarkView` rendering component is in `ToolsMarquee.tsx`.
- Tools: add `{ name, icon, accent, iconColor }` to `tools` in `portfolio.ts`. Place matching icons in `client/public/tools` if needed. The marquee duplicates icons only on desktop/fine pointers; it stays static on touch devices.
- Connect: change `socials` / `socialUrls` in `portfolio.ts`. `Dashboard.tsx` renders the visible links. Test every email/link after changing it.

## 9. Dashboard visuals and global effects

- Card skeleton: `DashboardCard.tsx`; custom pointer: `DashboardCursor.tsx`.
- Core grid placement: `client/src/index.css` and its `@media (min-width: 900px)` block. Don't edit unless modifying the dashboard composition.
- Mobile overrides, counter reels, dual-card characters: `client/src/styles/interactionEnhancements.css`.
- Scratch styling: `client/src/components/home/scratchReveal.module.css`.
- Full-page ShaderGradient: `client/src/components/layout/SiteShaderScene.tsx` (separate from dashboard). `uSpeed` changes how rapidly the shader moves; `pixelDensity` affects GPU cost. Do not change animation type or frame scheduling casually.
- The globe and special cursor animation pause/degrade on touch/reduced-motion where appropriate.

## 10. Failure checks

| Symptom | Check |
| --- | --- |
| Counters say Loading / Not set | `/api/coding`, `/api/workouts` network response; credentials and database fields |
| Number scroll appears too quick | `--metric-roll-duration`; `--metric-roll-easing`; reduced-motion OS setting |
| Spotify says Music corner | `/api/now-playing` status; credentials, scopes, token authorization |
| Spotify never shows current song | Spotify may return 204 when paused; check active Spotify session and `user-read-currently-playing` scope |
| Now Building points to wrong repo | `dashboardFeature.href` |
| Globe marker stuck in Mumbai | `profile.locationLat`, `profile.locationLng` |
| Touch dashboard janks | Avoid 60 FPS canvas overlays, large blur filters, or external dancing GIFs |
| Dashboard card grows / overflows | Preserve grid areas, `min-width: 0`, ellipsis, `.live-pulse__figure` sizing |

## Checklist before any future change

1. Change **one component** at a time; keep old data behavior and fallback.
2. Verify local `pnpm check` and `pnpm build:web`.
3. Verify desktop and a narrow Android viewport, light/dark and reduced-motion.
4. Confirm every live metric still comes from a real API; don't simulate usage data.
5. Verify no server-only key has been placed in client code.
6. Push to main only after testing, and verify the resulting Vercel deployment status.
