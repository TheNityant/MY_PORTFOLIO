# Portfolio rendering and visual stability

This guide explains how the personal portfolio is composed, why some browsers can show transient visual glitches, what the November 2026 stability pass changed, and how to test the rendering without changing the design.

## Rendering architecture

```text
index.html + React / Vite
  -> PortfolioLoader covers the entire viewport
    -> Critical assets settle: window load, fonts, identity / experience images
      -> Mount the full page and lazy ShaderGradient BEHIND the opaque loader
        -> Warm project media in the persistent HTMLVideoElement pool
          -> PortfolioLoader slides away and exposes the already mounted page
            -> Existing animated ShaderGradient, globe, dashboard, videos continue
```

Relevant source files:

| File | Role |
| --- | --- |
| `client/src/pages/Home.tsx` | Holds `visualsPrepared` / `revealed` state and mounts the page |
| `client/src/components/layout/PortfolioLoader.tsx` | Coordinates asset warmup, hidden pre-render, and loader dismissal |
| `client/src/styles/portfolioLoader.css` | Single loader exit transition; no second full-page fade/translation |
| `client/src/components/layout/SiteAtmosphere.tsx` | Desktop shader availability and static diagnostic mode |
| `client/src/components/layout/SiteShaderScene.tsx` | Current animated ShaderGradient settings; visual identity not modified |
| `client/src/styles/siteAtmosphere.css` | Fixed full-window shader, fallback colors, readability overlay |
| `client/src/styles/interactionEnhancements.css` | Mobile section layout and responsive media/performance rules |
| `client/src/lib/projectVideoPool.ts` | Keeps project videos alive/pooled, supports warmup without repeated recreation |

## What caused concern in the earlier implementation?

There were three concrete rendering risks. These are **code-level causes / hypotheses**, not yet measured proof of the user's particular visual symptom.

1. The lazy, relatively large Three.js / ShaderGradient bundle and WebGL GPU program were mounted just **240 ms** before the loader began to leave, after nearly all media warmup. Some laptops take longer to import, initialize WebGL, and paint a stable first frame. If that work happens during the reveal, the background can appear late or the UI can stutter.
2. The loader was already translating out over **680 ms**, but `.site-shell--revealed .page-column` was simultaneously animating an entire page from opacity 0 with a 12px translation. Fading and translating an entire long document, including translucent blurred cards, is expensive; visitors could briefly see an incomplete/transparent page behind the moving loader.
3. On touch/mobile viewports, entire projects, writing, experience, and footer sections had `content-visibility: auto` plus the same `contain-intrinsic-size: auto 720px`. Those sections have different real heights. Substituting one size off-screen can cause scroll-position / layout jumps when the browser encounters the full content.

## Fixes implemented

### A. Pre-render while hidden

In `PortfolioLoader.tsx`, `prepareBehindVeil()` is now called immediately after critical resource promises settle and **before** the video-warmup phase. The loader stays opaque while React mounts the page and the lazy ShaderGradient begins initializing. The 15-second emergency reveal still works and prepares the page if critical resources take too long.

This overlaps rendering and media preparation. It does not disable animation or replace the shader, and avoids timing the WebGL startup to a tiny 240 ms reveal window.

**Tradeoff:** Shader compilation and video prebuffering can now compete briefly for CPU/GPU/network; verify on weaker laptops and older phones. On touch devices, the existing static atmosphere policy remains unchanged.

### B. One reveal transition, not two

`portfolioLoader.css` no longer runs `portfolio-content-reveal` (whole-page opacity + translate) or `portfolio-header-reveal` simultaneously with the loader exit. The already mounted page stays at opacity 1 and transform none; the **loader alone slides upward**.

**Tradeoff:** The secondary entrance fade is intentionally removed, but the original loader motion and the page's individual interactive animations remain.

### C. Avoid mobile height estimation

The touch-specific rule now uses `content-visibility: visible` / `contain-intrinsic-size: none` for full page sections. Section geometry is available immediately, so scrolling no longer depends on a guessed 720px height.

**Tradeoff:** This can increase initial layout cost on mobile; project videos and off-screen effects still use their independent IntersectionObserver / loading strategies. If scrolling performance worsens, prefer targeted containment of small fixed-size items instead of approximate heights for entire long sections.

### D. Static-background A/B test

On a desktop browser, compare these two links in the **same browser and same device**:

- Normal animated shader: `https://thenityant.runs-on.dev/`
- Static fallback (temporary diagnostic, **not** a permanent design switch): `https://thenityant.runs-on.dev/?staticBackground=1`

The query flag is read in `SiteAtmosphere.tsx` and suppresses only the ShaderGradient mount. The existing atmospheric fallback remains; all other content and interactions are unchanged. It does **not** change the site's default behavior.

**Interpretation:**

- Animated version stutters, static version is smooth -> GPU/WebGL rendering or compositing is the likely bottleneck. Check shader GPU time, grain, pixel density, video overlays, and backdrop filters before changing the design.
- Both stutter -> inspect main-thread JavaScript, media decoding/network stalls, image loading, layout shifts, and device/browser extensions.
- Only the first reveal glitches -> inspect hidden pre-render timing, loader exit, font loads, and first shader frame.
- Only scrolling glitches -> inspect the Chrome Performance trace for layout shifts, paint and compositor work; check videos and CSS effects.

Do not attribute a particular glitch to a specific subsystem without reproducing it.

## Practical testing procedure

1. Open the normal site in a fresh private/incognito window; use browser DevTools Network/Performance tools if available.
2. Hard refresh, record the loading animation and first 3 seconds of the reveal. Verify that the background does not appear late and cards do not fade in behind the loader.
3. Scroll from Hero -> Dashboard -> Projects -> Writing -> Experience -> Footer, and back. Watch for sudden vertical jumps and overlapping sections.
4. Repeat with `?staticBackground=1` on desktop. Do not run this A/B on a touch device where the shader is already disabled by design.
5. In Chrome DevTools -> Performance: record one reveal / scroll. Check **long tasks**, layout-shift markers, dropped frames, and scripting vs rendering/compositing costs. The video-loader diagnostics can be enabled with `?mediaDebug=1`, separately.
6. Repeat in Firefox and on Android; verify dark/light theme, reduced-motion setting, and the Listening/Building animation.
7. Use `pnpm check` and `pnpm build:web` for the local source. Confirm Vercel's deployment status after publishing.

## Preserved features / non-goals

This pass does **not** alter shader colors, shader speed, noise setting, globe motion, project video assets, the Listening/Building card, GIFs, Spotify featured song, counters, or the dashboard layout. It also does not claim to fix every source of jank. Further performance tuning should be based on a video or DevTools trace from the device where the problem occurs.

## Rolling back selectively

To revert only these rendering changes, compare and revert the associated changes in:

- `PortfolioLoader.tsx`: move `prepareBehindVeil()` back to just before reveal
- `portfolioLoader.css`: reintroduce separate whole-page animations (not recommended)
- `interactionEnhancements.css`: restore mobile `content-visibility` if measured performance justifies the tradeoff
- `SiteAtmosphere.tsx`: remove optional `staticBackground` diagnostic check

Avoid reverting earlier dashboard design commits while diagnosing render timing.
