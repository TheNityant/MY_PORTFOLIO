# Portfolio Content Guide

This file is the maintenance map for the portfolio so new projects, images, writing and experience items can be added without touching the visual components.

## 1. Add a project

Open:

`client/src/data/portfolio.ts`

Find:

```ts
export const projects: Project[] = [
```

Add one object inside that array.

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

Valid domains are currently:

- `backend`
- `fullstack`
- `ai-ml`
- `robotics`

The portfolio automatically groups the project under the matching story-rail category. `PROJECT_PAGE_SIZE` is currently `2`, so every two projects become another page inside that domain.

### Project media

Put files in:

`client/public/media/projects/`

Use one of these media shapes:

```ts
media: { kind: "none", alt: "Project media placeholder" }
```

```ts
media: {
  kind: "image",
  src: "/media/projects/my-project.webp",
  alt: "Project screenshot",
}
```

```ts
media: {
  kind: "video",
  src: "/media/projects/my-project.mp4",
  poster: "/media/projects/my-project-poster.webp",
  alt: "Project demo",
}
```

A demo placeholder already exists at:

`client/public/media/projects/demo-project.svg`

## 2. Replace experience hover images

Put the real image in:

`client/public/media/experience/`

Then open:

`client/src/data/media.ts`

Change only the corresponding path. Example:

```ts
"robocon-applied": "/media/experience/robocon-team.webp",
```

Current IDs are:

- `genai-academy`
- `robocon-applied`
- `iitb-hackathon`

The hover preview automatically uses that mapping.

## 3. Add a new experience item

Open `client/src/data/portfolio.ts` and add an object to `experience`.

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

Then add a preview image mapping in `client/src/data/media.ts`:

```ts
"new-event": "/media/experience/new-event.webp",
```

## 4. Add writing / notebooks

Writing content lives in `writingEntries` inside:

`client/src/data/portfolio.ts`

The current home preview and writing routes read from that array automatically.

Put writing artwork/screenshots in:

`client/public/media/writing/`

Then map the writing slug in:

`client/src/data/media.ts`

Example:

```ts
"backend-engineering-notebook": "/media/writing/backend-notebook.webp",
```

## 5. Background tuning

In development, open the **Background Lab** button at the bottom-left.

It lets you live-tune, independently for Nighty Nighty and Interstella:

- motion speed (`uSpeed`)
- brightness

The development values are stored locally in the browser. When a final combination is chosen, commit those values in:

`client/src/config/atmosphereLab.ts`

## 6. Hero fluid tuning

The bottom-right **Tune hero fluid** control is development-only. It controls only the bounded portrait/identity fluid effect.

## 7. Search / command palette

The command palette uses the existing portfolio data. Navigation, project and writing entries come from `searchItems` in `client/src/data/portfolio.ts`.

Long-term AI portfolio summarization should be added as a separate command/action rather than mixing model logic directly into the visual search component.

## 8. Before pushing

Run:

```bash
pnpm install
pnpm check
pnpm build
```

Then inspect at least desktop and mobile widths before merging to `main`.
