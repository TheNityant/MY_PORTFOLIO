# Portfolio Design & Content Maintenance Guide

This document is the practical source of truth for extending the portfolio without having to reverse-engineer the React components every time.

It focuses on the content systems that are expected to change often:

- Writing entries
- Experience entries
- Hackathons & Competitions collections
- Writing and experience hover media
- The small lower hover-preview card

This file documents the current implementation paths and data contracts.

---

## 1. Where portfolio content lives

The main editable content is split across two files:

```text
client/src/data/portfolio.ts
client/src/data/media.ts
```

`portfolio.ts` contains the text/content objects.

`media.ts` maps an experience or writing ID to the images/videos shown on hover.

Static assets live under:

```text
client/public/media/experience/
client/public/media/writing/
```

Anything inside `client/public` is referenced from the website root. For example:

```text
client/public/media/experience/my-event.webp
```

is used in code as:

```ts
"/media/experience/my-event.webp"
```

Do **not** write `/client/public/...` in the React data.

---

# 2. Experience media

Each normal experience can show two media surfaces when the user hovers it.

## A. Large feature image/video

This is the large floating media surface above the row.

It is controlled by:

```ts
experienceFeatureMedia
```

inside:

```text
client/src/data/media.ts
```

Example using an image:

```ts
export const experienceFeatureMedia: Record<string, HoverFeatureMedia> = {
  "my-experience": {
    kind: "image",
    src: "/media/experience/my-experience.webp",
  },
};
```

Example using a video:

```ts
"my-experience": {
  kind: "video",
  src: "/media/experience/my-experience.mp4",
  poster: "/media/experience/my-experience-poster.webp",
},
```

The video is muted, loops, and only plays while its hover preview is active.

## B. Lower compact preview image

The smaller lower preview uses:

```ts
experiencePreviewMedia
```

Example:

```ts
export const experiencePreviewMedia: Record<string, string> = {
  "my-experience": "/media/experience/my-experience-thumb.webp",
};
```

You may use the same image for the feature and lower preview if you do not need two separate assets.

If an ID is not mapped, the portfolio uses the existing fallback placeholder.

---

# 3. Lower experience preview modes

Each standalone experience or grouped hackathon can control the lower hover card with:

```ts
previewMode
```

Supported values are:

```ts
"image-and-text"
"text-only"
"image-only"
```

If `previewMode` is omitted, the default is:

```ts
"image-and-text"
```

### Image + text

```ts
previewMode: "image-and-text",
```

Shows the thumbnail on the left and the label/title/description on the right.

### Text only

```ts
previewMode: "text-only",
```

Removes the lower thumbnail and keeps only the written information.

### Image only

```ts
previewMode: "image-only",
```

Removes the lower text and gives the lower image the full preview width.

The large top feature media is independent from this lower-card mode.

---

# 4. Adding a new standalone experience

Standalone entries are for experiences important enough to deserve their own row: major wins, major competitions, meaningful programs, internships, substantial engineering roles, etc.

Edit:

```text
client/src/data/portfolio.ts
```

Inside:

```ts
export const experience: ExperienceItem[] = [
```

add an object like this:

```ts
{
  kind: "entry",
  id: "my-major-event",
  org: "Event or Organization",
  label: "Winner / Finalist / Participant / Role",
  dates: "2026",
  location: "Mumbai / Online / etc.",
  description:
    "Short explanation of what I built, achieved, or was responsible for.",
  skills: ["Backend", "AI", "Cloud"],
  href: "https://optional-link.example.com",
  mark: {
    fallback: "ME",
    alt: "Event or Organization",
  },
  previewMode: "image-and-text",
},
```

Rules:

1. `id` must be unique.
2. Use lowercase kebab-case IDs such as `iit-roorkee-hackathon`.
3. The same `id` is used in `media.ts` to attach hover media.
4. `href` is optional.
5. `previewMode` is optional.
6. If there is no real logo yet, keep a meaningful short `fallback` mark.

Then add the hover media in `client/src/data/media.ts`:

```ts
experiencePreviewMedia["my-major-event"]
experienceFeatureMedia["my-major-event"]
```

In practice this means adding normal object entries to those two maps.

---

# 5. Hackathons & Competitions archive

The portfolio now has a special grouped experience:

```text
Hackathons & Competitions
```

Its purpose is to prevent every smaller participation from becoming a full top-level experience row.

Use this rule:

- **Major win / major final / standout achievement:** standalone experience.
- **Useful participation worth showing but not important enough for a full row:** add it to the Hackathons & Competitions collection.

This allows things such as major IIT/industry wins to remain prominent while still preserving the rest of the competition history.

The group currently lives inside `experience` in:

```text
client/src/data/portfolio.ts
```

and looks like:

```ts
{
  kind: "collection",
  id: "hackathons-competitions",
  org: "Hackathons & Competitions",
  label: "Participation archive",
  dates: "Ongoing",
  location: "Online + in person",
  description:
    "A grouped archive for hackathons and competitions worth showcasing without turning every participation into a standalone experience.",
  skills: ["Hackathons", "Competitions"],
  mark: { fallback: "H+C", alt: "Hackathons and competitions" },
  items: [],
},
```

## Add a hackathon or competition to the dropdown

Add an object inside the `items` array:

```ts
items: [
  {
    id: "sample-hackathon",
    org: "Sample Hackathon",
    label: "Participant",
    dates: "Sep 2026",
    location: "Online",
    description:
      "Built a short description of the project, challenge, role, or result.",
    skills: ["AI", "Backend", "Cloud"],
    href: "https://optional-event-or-project-link.example.com",
    previewMode: "image-and-text",
  },
],
```

Then add that exact ID to `client/src/data/media.ts`:

```ts
export const experiencePreviewMedia: Record<string, string> = {
  "sample-hackathon": "/media/experience/sample-hackathon-thumb.webp",
};

export const experienceFeatureMedia: Record<string, HoverFeatureMedia> = {
  "sample-hackathon": {
    kind: "image",
    src: "/media/experience/sample-hackathon.webp",
  },
};
```

### Interaction behavior

Desktop/fine pointer:

1. Hover `Hackathons & Competitions`.
2. The row opens a dropdown list.
3. Hover one competition in that list.
4. A large feature image/video appears above.
5. The lower detail area shows image + text, text only, or image only according to `previewMode`.

Keyboard:

- Focusing the collection opens it.
- Each child entry is focusable and can reveal its preview.

Touch/mobile:

- The collection title can be tapped to open/close the list.
- Large floating hover media is intentionally hidden on small/touch layouts to avoid covering the page.

---

# 6. Writing images

Writing uses the same two-level media model as Experience.

Assets go in:

```text
client/public/media/writing/
```

The lower preview thumbnail is mapped in:

```ts
writingPreviewMedia
```

Example:

```ts
export const writingPreviewMedia: Record<string, string> = {
  "backend-engineering-notebook": "/media/writing/backend-engineering-notebook-thumb.webp",
};
```

The large feature image/video is mapped in:

```ts
writingFeatureMedia
```

Example image:

```ts
export const writingFeatureMedia: Record<string, HoverFeatureMedia> = {
  "backend-engineering-notebook": {
    kind: "image",
    src: "/media/writing/backend-engineering-notebook.webp",
  },
};
```

Example video:

```ts
"backend-engineering-notebook": {
  kind: "video",
  src: "/media/writing/backend-engineering-notebook.mp4",
  poster: "/media/writing/backend-engineering-notebook-poster.webp",
},
```

The media-map key must match the Writing entry's `slug`.

---

# 7. Adding a new Writing entry

Edit:

```text
client/src/data/portfolio.ts
```

Inside:

```ts
export const writingEntries: WritingEntry[] = [
```

add an entry such as:

```ts
{
  slug: "backend-engineering-notebook",
  title: "Backend Engineering Notebook",
  type: "learning-journey",
  status: "ongoing",
  summary:
    "Notes and experiments covering backend engineering, databases, concurrency, reliability, and production systems.",
  tags: ["Java", "Backend", "Databases", "Systems"],
  sections: [
    {
      id: "01",
      title: "Backend Foundations",
      topics: ["HTTP", "REST", "API contracts", "testing"],
    },
  ],
},
```

Then map the same slug in `writingPreviewMedia` and `writingFeatureMedia`.

Example:

```ts
"backend-engineering-notebook"
```

must be identical in all three places.

---

# 8. Recommended asset workflow

For photos and UI screenshots:

```text
WebP preferred
JPG acceptable
PNG when transparency or lossless UI detail matters
SVG for logos/illustrations
```

Recommended naming:

```text
<experience-id>.webp
<experience-id>-thumb.webp
<experience-id>-poster.webp
```

For example:

```text
fundmycrazy.webp
fundmycrazy-thumb.webp
fundmycrazy-poster.webp
```

Keep original media outside the repository if it is very large. Commit an optimized portfolio copy instead.

Avoid dropping random images directly into `client/src` or creating a new media folder for every event.

---

# 9. Replacing an existing image

If the filename stays the same, replace the file inside `client/public/media/...` and rebuild.

If the filename changes, update the corresponding value in `client/src/data/media.ts`.

Example:

Old:

```ts
"genai-academy": "/media/experience/genai-academy.svg",
```

New:

```ts
"genai-academy": "/media/experience/genai-academy.webp",
```

No component change is required.

---

# 10. Quick validation after content changes

Run:

```powershell
pnpm check
pnpm build
pnpm dev
```

Then verify:

- Writing hover media loads.
- Experience hover media loads.
- No fallback appears where real media should exist.
- `Hackathons & Competitions` opens on hover/focus.
- Child competition hover shows the correct event-specific media.
- Links open the intended external page.
- Mobile does not show oversized floating hover cards.

If TypeScript reports an unknown field, check that the object follows the current `WritingEntry`, `ExperienceEntry`, or `ExperienceCollectionEntry` type in `client/src/data/portfolio.ts`.
