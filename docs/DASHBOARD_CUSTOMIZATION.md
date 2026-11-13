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

### Manual featured track (current Listening mode)

The Listening card now shows a **curated song, not live Spotify playback**. The `FeatureCard.tsx` component does not fetch `/api/now-playing`. Change the song in `client/src/data/portfolio.ts`:

```ts
export const dashboardFeaturedTrack = {
  title: "Shinigami",
  artist: "Draven Godrics",
} as const;
```

The label "Spotify pick" means a recommended/selected song—not a claim that the track is actually playing. No OAuth setup or playback is necessary. The existing `api/now-playing.ts` remains in the repository for **optional future OAuth integration**, but is not called by the UI. Do not add a fake track URL or an autoplaying recording.

### Mode-specific cursor emoji

`Dashboard.tsx` stores `featureMode`, and `FeatureCard.tsx` reports its automatic and manual transitions through `onModeChange`. The dashboard card uses `music` in Listening mode (🎵) and `hammer` in Building mode (🛠️). The hovering cursor reads `data-cursor-kind` from `DashboardCursor.tsx`, including when the card switches while the mouse is still.

Edit the `CURSOR_EMOJI` mapping in `DashboardCursor.tsx` to choose different emojis without changing other cards.

### Background fade, song typography and traveling red equalizer

**Current effect:** The outer dark/black dashboard frame stays in place, but the Listening/Building panel's green/purple atmospheric color dissolves gradually into the card background. There should be no hard green or purple outline; that inner color is a glow, **not a border**. The black outer dashboard card border remains untouched.

The Listening view displays the manually curated `Shinigami — Draven Godrics` rather than live Spotify status. The text has a little extra left inset, larger title/artist type, and more letter spacing. The construction worker and dancing GIFs and the five-second rotation remain unchanged.

The **42 red equalizer bars** are an independent decorative animation, **not an audio analyzer**. They now sit in `live-pulse__body`, spanning from the dancer on the right toward the title on the left. Their *pulse sequence* starts at the right and moves left with increasing phase delay, while the bars decrease in height and opacity toward the left, under the text. The dancers are drawn above these bars.

Implementation:
- JSX source: `client/src/components/home/FeatureCard.tsx` (`live-pulse__spectrum` and 42 generated bars).
- Styles: the **last** block of `client/src/styles/interactionEnhancements.css`, starting with `Curated song: soft atmospheric fade and directional red spectrum`. It overrides earlier generic Live Pulse rules.

| Edit | Effect / safe adjustment |
| --- | --- |
| `.dashboard-area-feature .live-pulse` `background` | Green/purple-to-black fade; reduce the radial gradient's `21%` tint for less color or raise gently to intensify |
| `.live-pulse::before` radial gradient | Secondary soft glow; keep the end stop `transparent` to avoid hard color edges |
| `.dashboard-area-feature .dashboard-tile` `padding` | Controls visible **outer black margin**, not glow boundary. Do not alter parent grid geometry |
| `.live-pulse--listening .live-pulse__copy` (via `.live-pulse__copy`) `padding` | Moves song/artist in from the hard left edge |
| `.live-pulse--listening .live-pulse__heading` | Song font size, letter spacing, weight, line height |
| `.live-pulse--listening .live-pulse__sub` | Artist font size, letter spacing, gap below the title |
| `.live-pulse__spectrum` `height` | Overall red spectrum height; constrained within the existing card |
| `.live-pulse__spectrum` `opacity` | Overall strength of the red wave |
| `.live-pulse__spectrum` `mask-image` | Progressive fade to invisible on the left, full strength near the dancer |
| `--spectrum-peak`, `--spectrum-opacity`, `--spectrum-delay` | Per-bar strength and phase, generated from each bar index in `FeatureCard.tsx` |
| `live-pulse-red-travel` | Red pulse's motion curve; 2800ms duration is defined in the spectrum-bar animation |

For a **slower traveling equalizer**, try `3600ms` in the CSS *and* increase the index-based `42ms` phase gap moderately (to `50ms`). For **faster** motion, try `2200ms` and `34ms`. Keep the left-to-right bar ordering in JSX; `(41 - index)` intentionally delays the **left** bars so the wave visually moves **right to left**.

No part of this effect changes the fixed dashboard grid, the outer frame dimensions, the DSP/audio source (there is none), or the GIF URLs. The bars stop moving while out of view or for reduced-motion users.

### Character and lighting animations

The live scenes now use **embedded animated stickers**, following the implementation pattern in [Shivam Patel's open-source dashboard](https://github.com/shivy02/portfolio-website/blob/main/src/components/home/dashboard.tsx): an animated foreground character, a light sweep and a small floor-shadow effect. The two dancing/floor GIF URLs in `FeatureCard.tsx` come from his example, and the hard-hat hammering sticker comes from [Tenor's Manutencao listing](https://tenor.com/view/manutencao-gif-2627228245989249955).

These are **external hosted media**, not newly authored or redistributable GIF files. Before relying on them long term (especially for business use), verify the respective creator/platform usage rights and availability; replace with properly licensed or commissioned assets when necessary. The original inline SVG figures remain as instant fallbacks and are also used when a visitor requests reduced motion.

Tune these in `interactionEnhancements.css`:

| Class / keyframe | What changes |
| --- | --- |
| `.live-pulse__figure` | Right-hand animation space |
| `.live-pulse__gif` | Size and placement of actual animated Giphy/Tenor stickers |
| `.live-pulse__floor` | Dancing character's subtle floor-shadow GIF |
| `.dashboard-area-feature .tile-header` | Hidden large duplicate heading; don't re-enable unless redesigning the tile |
| `.live-pulse::before` | Full-tile atmospheric highlight rather than half-tile glow |
| `live-dance` | Dancer side-to-side body movement |
| `live-arm-left`, `live-arm-right` | Dancer arm timing and swing |
| `live-step-left`, `live-step-right` | Dancer legs |
| `live-light-left`, `live-light-right` | Overhead spotlight sweep |
| `live-builder-bob` | Worker walking/leaning motion |
| `live-hammer-hit` | Hammer impact cycle |
| `live-builder-spark` | Impact sparks |
| `live-pulse-soundbar` | Decorative bars behind the dancer, independent of Spotify playback |
| `--live-pulse-green`, `--live-pulse-violet` / `--live-pulse-tint` | Color emphasis |

The characters are decorative and **do not play music**. The manually curated song has no outbound Spotify link unless one is explicitly configured in a future change. The spotlight is CSS, the floor animation is a second GIF, and animated images only mount for the active five-second scene.

### Where to change layout safely

Look for `.live-pulse__body`, `.live-pulse__gif`, and `.live-pulse__figure` in `interactionEnhancements.css`. The body uses a two-column grid, with text on the left and the animation on the right. The oversized outer heading is hidden only for the feature tile; the tiny Listening/Building toggle remains visible. The atmosphere now fills the tile's entire content area. Keep `overflow: hidden`, `min-width: 0`, and the truncation rules; these prevent the feature card from resizing or pushing the whole dashboard layout. The feature card's fixed dashboard grid slot has **not** been resized.

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
