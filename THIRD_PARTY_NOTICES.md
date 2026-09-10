# Third-party notices

## Shivam Patel — portfolio-website

- Source: https://github.com/shivy02/portfolio-website
- Rendered: https://shivypatel.com/
- Source code: Apache License 2.0
- Personal and creative content: All Rights Reserved (not reused)

This project adapts the Apache-2.0 **source-code** architecture (page sequence,
navigation chrome, hero information order, and asymmetric dashboard grid) into
an independent Vite + React implementation.

### Reused

- Information architecture and CSS grid area names/spans
- Interaction rhythm: hide-on-scroll nav, entrance fade, hover on CTA/cards
- Card nesting (outer padded border + inner raised surface)

### Not reused (All Rights Reserved or out of scope)

- Name, biography, photographs, logo, favicon
- Employers, projects, writing, travel photos, music, GIFs, statistics
- Contact addresses and social profile URLs
- `public/` assets (profile images, album art, tool SVGs, sunset photos, logos)
- Particle constellation, glowing-border effects, custom cursor
- Reference WebGL globe implementation and travel/relocation animation
- `public/` GIFs, album art, and tool SVGs from the reference repo

### Independent third-party libraries (not from the reference)

- **cobe** (MIT) — WebGL globe used for a Mumbai location marker. Independent of the
  reference globe implementation; no relocation/two-city story.
- **Simple Icons** (CC0 1.0) — monochrome tool marks in `client/public/tools/`
  (Java/OpenJDK, Spring, Python, PostgreSQL, TypeScript, React, Node.js).

### Attribution required by Apache 2.0

A copy of the reference NOTICE is preserved in `NOTICE`. The Apache 2.0 license
text is in `licenses/APACHE-2.0.txt`.
