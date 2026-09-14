# Portfolio media slots

Everything in this folder is served directly from the site root. Example:

- `client/public/media/experience/genai-academy.svg`
- becomes `/media/experience/genai-academy.svg` in React.

## Experience hover images

The current mapping lives in:

`client/src/data/media.ts`

Current slots:

- `genai-academy` -> `/media/experience/genai-academy.svg`
- `robocon-applied` -> `/media/experience/robocon-applied.svg`
- `iitb-hackathon` -> `/media/experience/iitb-hackathon.svg`

When you add a real PNG/JPG/WebP, put it in `client/public/media/experience/` and change only the matching path in `client/src/data/media.ts`.

Example:

```ts
"robocon-applied": "/media/experience/robocon-team.webp",
```

## Writing hover images

Current slot:

- `llm-engineering-notebook` -> `/media/writing/llm-engineering-notebook.svg`

Add real writing/notebook artwork under `client/public/media/writing/` and update `client/src/data/media.ts`.

## Project media

Put project screenshots/videos under:

`client/public/media/projects/`

Then edit the matching project object in `client/src/data/portfolio.ts`.

Image example:

```ts
media: {
  kind: "image",
  src: "/media/projects/habit-tracker.webp",
  alt: "Habit Tracker dashboard",
},
```

Video example:

```ts
media: {
  kind: "video",
  src: "/media/projects/habit-tracker.mp4",
  poster: "/media/projects/habit-tracker-poster.webp",
  alt: "Habit Tracker product demo",
},
```

Prefer WebP for screenshots and compressed MP4/WebM for short demos. Keep filenames lowercase with hyphens.
