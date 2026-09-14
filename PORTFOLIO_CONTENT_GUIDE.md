# Portfolio Content Guide

This is the maintenance map for the portfolio. The goal is that normal content changes should not require redesigning components.

## A. The nine dashboard sections

The dashboard order is defined in:

`client/src/components/home/Dashboard.tsx`

Most text/content values come from:

`client/src/data/portfolio.ts`

Desktop geometry and the Tools marquee live in:

`client/src/components/home/dashboardParity.css`

### 1. Location

Visible card: **Mumbai, India** + globe.

Main values:

```ts
profile.location
profile.locationLat
profile.locationLng
```

Component:

`client/src/components/home/Globe.tsx`

If you move city later, update all three profile values together.

### 2. Scratch me

Content is controlled by:

```ts
scratchRevealContent
```

in `client/src/data/portfolio.ts`.

Supported shapes are text, image and GIF. Images/GIFs should be stored under `client/public/` and referenced with a root-relative path such as `/media/scratch/example.webp`.

Component:

`client/src/components/home/ScratchReveal.tsx`

### 3. Activity

This is the GitHub contribution card.

It currently reads `profile.githubHandle` and uses `react-github-calendar`, so normal GitHub contribution changes appear without editing the portfolio source.

Component:

`client/src/components/home/GitHubActivity.tsx`

### 4. Workouts

Current value:

```ts
metrics.workouts
```

`null` intentionally renders as an em dash instead of inventing data.

Future live choices: Strava, Hevy, Garmin/Health export, or another source you actually use. Do not make this look live until there is a real source.

### 5. Hours coding

Current value:

```ts
metrics.codingHours
```

Future recommended source: WakaTime. The public client should call our own backend endpoint such as `/api/wakatime`; the WakaTime API key must stay server-side.

### 6. Feature / Now building

Current data:

```ts
dashboardFeature
```

Current component:

`client/src/components/home/FeatureCard.tsx`

Right now the type supports two modes:

- `building`
- `music`

This card is the best candidate to become a general **Now / Spotlight** card later. The recommended design is one normalized shape such as:

```ts
type Spotlight = {
  kind: "building" | "music" | "outing" | "work" | "note";
  eyebrow: string;
  title: string;
  description?: string;
  image?: string;
  href?: string;
  updatedAt?: string;
};
```

Then the UI can stay the same while the source changes.

### 7. Core stack

Current content:

```ts
coreStackTools
```

inside `client/src/data/portfolio.ts`.

Tool icons live under:

`client/public/tools/`

### 8. Connect

Current social links are in:

```ts
socialUrls
socials
```

inside `client/src/data/portfolio.ts`.

To add Instagram, add `instagram` to the `SocialIconName` union, add the Instagram URL to `socialUrls`, then add an entry to `socials`:

```ts
{
  label: "Instagram",
  href: socialUrls.instagram,
  icon: "instagram",
  aria: `${profile.name} on Instagram`,
  external: true,
},
```

Then teach the two icon renderers about it:

- `client/src/components/home/Hero.tsx`
- `client/src/components/home/Dashboard.tsx`

Import `Instagram` from `lucide-react` and return it when the icon name is `instagram`.

### 9. Tools

Tool definitions:

```ts
tools
```

inside `client/src/data/portfolio.ts`.

Icons:

`client/public/tools/`

Marquee component:

`client/src/components/home/ToolsMarquee.tsx`

Desktop height, logo size, gaps and marquee speed:

`client/src/components/home/dashboardParity.css`

The continuous motion speed is currently controlled by:

```css
animation: tools-marquee-seamless 20s linear infinite;
```

Increase `20s` to slow it down; decrease it to speed it up.

---

## B. Add a project

Open:

`client/src/data/portfolio.ts`

Find:

```ts
export const projects: Project[] = [
```

Add one object:

```ts
{
  id: "my-project",
  domain: "backend",
  title: "My Project",
  description: "One concise sentence about what it does and why it matters.",
  technologies: ["Java", "Spring Boot", "PostgreSQL"],
  href: "https://github.com/TheNityant/MY_REPO",
  hrefLabel: "Repository",
  status: "In development",
  media: {
    kind: "image",
    src: "/media/projects/my-project.webp",
    alt: "My Project dashboard",
  },
},
```

Valid domains:

- `backend`
- `fullstack`
- `ai-ml`
- `robotics`

`PROJECT_PAGE_SIZE` is currently `2`, so every two projects automatically become another page in that domain.

### Project media

Store files in:

`client/public/media/projects/`

Image:

```ts
media: {
  kind: "image",
  src: "/media/projects/my-project.webp",
  alt: "Project screenshot",
}
```

Video:

```ts
media: {
  kind: "video",
  src: "/media/projects/my-project.mp4",
  poster: "/media/projects/my-project-poster.webp",
  alt: "Project demo",
}
```

A demo placeholder exists at:

`client/public/media/projects/demo-project.svg`

---

## C. Experience

Experience entries live in:

```ts
experience
```

inside `client/src/data/portfolio.ts`.

Example:

```ts
{
  id: "new-event",
  org: "Organization",
  label: "Participant",
  dates: "2026",
  location: "Mumbai",
  description: "What you actually did.",
  skills: ["Backend", "Cloud"],
  href: "https://example.com",
  mark: { fallback: "ORG", alt: "Organization" },
},
```

Hover-preview images belong in:

`client/public/media/experience/`

Map each ID to an image in:

`client/src/data/media.ts`

Example:

```ts
"robocon-applied": "/media/experience/robocon-team.webp",
```

---

## D. Writing / notebooks

Writing data lives in:

```ts
writingEntries
```

inside `client/src/data/portfolio.ts`.

Writing artwork/screenshots:

`client/public/media/writing/`

Map the writing slug in:

`client/src/data/media.ts`

Example:

```ts
"backend-engineering-notebook": "/media/writing/backend-notebook.webp",
```

---

## E. Hero

Hero component:

`client/src/components/home/Hero.tsx`

The fluid portrait experiment has been removed from the live hero. The identity is now a normal portrait/monogram, which is substantially cheaper and visually calmer.

The animated name component is:

`client/src/components/home/AnimatedHeroName.tsx`

The hero currently supplies:

```tsx
<AnimatedHeroName
  name={profile.displayName}
  alternate={profile.githubHandle}
/>
```

So the two current labels are `Nityant` and `TheNityant`. Change the `alternate` prop if another second identity is chosen later.

The animation intentionally uses a right-edge clip/wipe rather than scaling or bouncing the word.

Availability status is calculated in `Hero.tsx` using `Asia/Kolkata` and the current 08:00-22:00 window.

---

## F. ShaderGradient / background tuning

Development-only Background Lab:

- bottom-left **Background lab** button
- keyboard shortcut: `Ctrl/Cmd + Shift + A`

It currently live-tunes:

- `uSpeed`
- `brightness`

Per-preset defaults are stored in:

`client/src/config/atmosphereLab.ts`

Current main shader component:

`client/src/components/layout/SiteShaderScene.tsx`

That is where all advanced ShaderGradient properties live, including:

- `type`
- `uSpeed`
- `uStrength`
- `uDensity`
- `uFrequency`
- `uAmplitude`
- `positionX/Y/Z`
- `rotationX/Y/Z`
- `color1/2/3`
- `reflection`
- `cameraZoom`
- `brightness`
- `envPreset`
- `grain`

Use Background Lab first for speed/brightness. Only edit the advanced values after choosing the final background preset because those parameters interact strongly.

---

## G. Future live / service-backed dashboard widgets

Do not split a personal portfolio into many microservices just because the word sounds scalable. For this site, the clean architecture is:

```text
Browser
  -> one portfolio API/BFF
       -> WakaTime adapter
       -> GitHub adapter
       -> Spotify adapter
       -> workout adapter
       -> editable Spotlight content source
```

The public browser never receives third-party private API keys.

For the future Spotlight card, the easiest editable source is one small remote content store (for example Supabase, Firestore, or a headless CMS) containing the current mode and content. Then you can change:

- Now building
- Last played / music
- Outing / travel
- Working with / current role
- Short personal update

without changing the React component or redeploying the portfolio. The API simply normalizes the selected source into the same `Spotlight` shape.

For third-party live services such as Spotify or WakaTime, use server-side adapters and short cache/revalidation windows. Those widgets update at runtime; they do not need a Git commit or a Vercel redeploy for every data change.

---

## H. Search / command palette

Component:

`client/src/components/layout/CommandPalette.tsx`

The palette reads existing portfolio data. The future AI portfolio summarizer should be a separate command/action that calls a backend model endpoint rather than mixing model execution directly into the visual search component.

---

## I. Before pushing

Run:

```bash
pnpm install
pnpm check
pnpm build
```

Then inspect at least:

- desktop dark/light
- mobile dark/light
- hero name transition
- status pill
- dashboard Tools row
- dashboard pointer glow
- command palette
- Writing/Experience hover previews

Only merge to `main` after the visual pass is approved.
