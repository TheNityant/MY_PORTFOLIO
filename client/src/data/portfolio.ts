export type SocialIconName = "mail" | "github";

export type SocialLink = {
  label: string;
  href: string;
  icon: SocialIconName;
  aria: string;
  external?: boolean;
};

export type NavItem = {
  name: string;
  href: string;
  icon: "home" | "projects" | "experience" | "blog";
  /** Destination section is not rendered yet (kept in the nav for structural parity). */
  deferred?: boolean;
};

export type ContentGap = {
  referenceSlot: string;
  reason: string;
  resolution: string;
};

export type ProjectDomainId = "backend" | "ai" | "ml" | "robotics";

export type ProjectDomain = {
  id: ProjectDomainId;
  label: string;
};

export type ProjectMedia =
  | {
      kind: "none";
      alt: string;
    }
  | {
      kind: "image";
      src: string;
      alt: string;
    }
  | {
      kind: "video";
      src: string;
      poster?: string;
      alt: string;
    };

export type Project = {
  id: string;
  domain: ProjectDomainId;
  title: string;
  description: string;
  technologies: string[];
  /** Repository or demo URL. Omit when no verified public link exists. */
  href?: string;
  hrefLabel?: string;
  status?: string;
  media: ProjectMedia;
  placeholder?: boolean;
};

export const PROJECT_PAGE_SIZE = 2;

export type WritingItem = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  href: string;
  placeholder?: boolean;
};

export type ExperienceItem = {
  id: string;
  /** Organization, program, or institution. */
  org: string;
  /** Transparent involvement label — not a fabricated job title. */
  label: string;
  dates: string;
  location: string;
  description: string;
  skills: string[];
  href?: string;
  placeholder?: boolean;
};

export const profile = {
  name: "Nityant Tiwari",
  displayName: "Nityant",
  initials: "NT",
  role: "Backend / Software Engineer",
  taglineLead: "I build",
  taglineEmphasis: "backend systems",
  taglineTail: "with AI/ML engineering.",
  portraitAlt: "Nityant Tiwari",
  email: "nityant.tiwari2404@gmail.com",
  githubHref: "https://github.com/TheNityant",
  repoHref: "https://github.com/TheNityant/MY_PORTFOLIO",
} as const;

export const socials: SocialLink[] = [
  {
    label: "Email",
    href: `mailto:${profile.email}`,
    icon: "mail",
    aria: `Email ${profile.name}`,
  },
  {
    label: "GitHub",
    href: profile.githubHref,
    icon: "github",
    aria: `${profile.name} on GitHub`,
    external: true,
  },
];

export const nav: NavItem[] = [
  { name: "Home", href: "#hero", icon: "home" },
  { name: "Projects", href: "#projects", icon: "projects" },
  { name: "Experience", href: "#experience", icon: "experience" },
  { name: "Blog", href: "#writing", icon: "blog", deferred: true },
];

export const tools = [
  "Java",
  "Spring Boot",
  "SQL",
  "Python",
  "TypeScript",
  "React",
  "Node.js",
  "AI / LLMs",
];

export const backendFocus = ["Java", "Spring Boot", "APIs", "SQL"];

export const aiFocus = ["RAG", "Transformers", "Embeddings", "Evaluation"];

export const dashboardCopy = {
  aboutTitle: "Engineering focus",
  aboutLead: profile.role,
  aboutBody: "AI/ML engineering as a specialization. REST APIs, databases, and production-quality backends.",
  scratchTitle: "Scratch me",
  scratchPrompt: "Reveal a line",
  scratchReveal: `${profile.role}, with AI/ML engineering as a specialization.`,
  githubTitle: "Activity",
  githubHandle: "TheNityant",
  githubCta: "Open GitHub",
  backendTitle: "Backend",
  aiTitle: "AI systems",
  nowBuildingTitle: "Now building",
  nowBuildingName: "Statistical analysis platform",
  nowBuildingBody: "Frontend plus Python analytics. In development.",
  stackTitle: "Primary stack",
  stackBody: "Java · Spring Boot",
  connectTitle: "Connect",
  toolsTitle: "Tools",
} as const;

export const searchItems = [
  { label: "Home", href: "#hero", type: "Navigation" },
  { label: "Dashboard", href: "#dashboard", type: "Section" },
  { label: "Projects", href: "#projects", type: "Section" },
  { label: "Experience", href: "#experience", type: "Section" },
];

export const projectsCopy = {
  heading: "Selected work",
  intro: "Selected work by engineering domain.",
} as const;

export const projectDomains: ProjectDomain[] = [
  { id: "backend", label: "Backend / Full Stack" },
  { id: "ai", label: "AI / LLM" },
  { id: "ml", label: "ML / Data" },
  { id: "robotics", label: "Robotics / Embedded" },
];

export const defaultProjectDomain: ProjectDomainId = "backend";

export const experienceCopy = {
  heading: "Experience",
  intro: "Applied engineering, technical programs, and education.",
} as const;

export const contentGaps: ContentGap[] = [
  {
    referenceSlot: "Availability badge (Available / Away)",
    reason: "No timezone or availability status is stored in this repository.",
    resolution: "Equivalent empty status slot preserves vertical rhythm. No invented Available/Away label.",
  },
  {
    referenceSlot: "Portrait photograph",
    reason: "No likeness or photo is committed in this repository.",
    resolution: "NT monogram in the portrait footprint, without a visible engineering caption.",
  },
  {
    referenceSlot: "Location / globe card",
    reason: "No verified location is stored.",
    resolution: "Tall left cell reframed as Engineering focus with verified positioning. No inferred city.",
  },
  {
    referenceSlot: "Scratch-to-reveal GIFs",
    reason: "Reference GIFs are personal content; none of mine are in the repo.",
    resolution: "Keyboard-accessible reveal of the existing tagline.",
  },
  {
    referenceSlot: "GitHub contribution heatmap",
    reason: "No backend or verified contribution dataset in this phase.",
    resolution: "Activity card shows the verified GitHub handle and link. No fabricated heatmap.",
  },
  {
    referenceSlot: "Hours coding / coffees drank",
    reason: "No WakaTime or similar metrics exist in source content.",
    resolution: "Compact Backend and AI systems cards with verified topic chips. No metrics.",
  },
  {
    referenceSlot: "Last played / Spotify",
    reason: "No music data in this repository.",
    resolution: "Wide cell is Now building: statistical analysis platform, in development, no inflated claims.",
  },
  {
    referenceSlot: "Favorite tool (Next.js)",
    reason: "No favorite-tool claim exists.",
    resolution: "Primary stack card shows Java · Spring Boot. No favorite-tool claim.",
  },
  {
    referenceSlot: "LinkedIn and Instagram",
    reason: "No verified LinkedIn or Instagram URLs in the repository.",
    resolution: "Contact actions are mailto and GitHub only.",
  },
  {
    referenceSlot: "Writing / blog and earth gallery",
    reason: "No published posts or gallery assets in this repository.",
    resolution: "Writing markup remains deferred. Blog nav stays disabled. Education sits inside Experience.",
  },
];

export const projects: Project[] = [
  {
    id: "stat-platform",
    domain: "backend",
    title: "Statistical analysis platform",
    description:
      "Statistical analysis platform in development, combining a modern frontend with a Python analytics stack.",
    technologies: ["Frontend", "Python", "Statistics"],
    status: "In development",
    media: { kind: "none", alt: "Placeholder frame for the statistical analysis platform." },
  },
  {
    id: "habit-tracker",
    domain: "backend",
    title: "Habit Tracker",
    description:
      "Flutter client with a Spring Boot REST API and PostgreSQL — auth, habit and task tracking with streaks, analytics, calendar, file uploads, and Gemini-assisted journaling.",
    technologies: ["Flutter", "Spring Boot", "PostgreSQL", "Gemini"],
    href: "https://github.com/TheNityant/HABIT_TRACKER-Full-Stack-app",
    hrefLabel: "Repository",
    media: { kind: "none", alt: "Placeholder frame for Habit Tracker." },
  },
  {
    id: "llm-visualizer",
    domain: "ai",
    title: "LLM Visualizer",
    description:
      "A visual exploration tool for understanding LLM internals, including layers, tensors, and token-level computation.",
    technologies: ["LLMs", "Model internals", "Visualization"],
    href: "https://github.com/TheNityant/LLM_Visualizer",
    hrefLabel: "Repository",
    status: "In progress",
    media: { kind: "none", alt: "Placeholder frame for LLM Visualizer." },
  },
  {
    id: "genezap",
    domain: "ml",
    title: "GeneZap",
    description:
      "Experimental offline genomic-analysis pipeline combining species profiling, ML resistance prediction, CGR/CNN-style analysis, and CARD-based validation.",
    technologies: ["Python", "TensorFlow", "scikit-learn", "OpenCV"],
    status: "Experimental",
    media: { kind: "none", alt: "Placeholder frame for GeneZap." },
  },
  {
    id: "robotic-hand",
    domain: "robotics",
    title: "Robotic Hand S100",
    description:
      "STM32 servo and control work spanning UART and multi-servo control, PS4-driven picking, and servo–stepper integration.",
    technologies: ["STM32", "Embedded C", "UART"],
    href: "https://github.com/TheNityant/ROBTOTIC_HAND_S100",
    hrefLabel: "Repository",
    status: "Earlier work",
    media: { kind: "none", alt: "Placeholder frame for Robotic Hand S100." },
  },
  {
    id: "robocon-2026",
    domain: "robotics",
    title: "Robocon 2026 bot",
    description:
      "STM32 and ESP-class control for a competition robot, integrating locomotion, sensors, motors, servos, and mechanism actuation.",
    technologies: ["STM32", "ESP32", "Embedded C"],
    href: "https://github.com/TheNityant/ROBOCON_2026_COMPLETE_BOT",
    hrefLabel: "Repository",
    status: "Applied work",
    media: { kind: "none", alt: "Placeholder frame for the Robocon 2026 bot." },
  },
];

export function projectsForDomain(domain: ProjectDomainId, list: readonly Project[] = projects) {
  return list.filter((project) => project.domain === domain);
}

export function visibleProjectDomains(list: readonly Project[] = projects) {
  return projectDomains.filter((domain) => projectsForDomain(domain.id, list).length > 0);
}

export const writing: WritingItem[] = [
  {
    id: "note-01",
    title: "Add a technical note",
    date: "DATE",
    excerpt: "Replace this row with a short description of an idea, lesson, or system you want to share.",
    href: "#contact",
    placeholder: true,
  },
  {
    id: "note-02",
    title: "Add a build log",
    date: "DATE",
    excerpt: "Use this space for a practical reflection on engineering, product, or design decisions.",
    href: "#contact",
    placeholder: true,
  },
  {
    id: "note-03",
    title: "Add a research note",
    date: "DATE",
    excerpt: "A future Markdown post can plug into this same list without changing the visual component.",
    href: "#contact",
    placeholder: true,
  },
];

export const experience: ExperienceItem[] = [
  {
    id: "genai-academy",
    org: "Google GenAI Academy / APAC GenAI Academy",
    label: "Participant",
    dates: "2026",
    location: "APAC · C3",
    description:
      "Worked through Google Cloud / GenAI codelabs covering a Coffee Barista Agent and a BigQuery MCP agent.",
    skills: ["Google Cloud", "GenAI", "Agents"],
  },
  {
    id: "robocon-applied",
    org: "Robocon 2026",
    label: "Applied work",
    dates: "2026",
    location: "Robotics / embedded",
    description:
      "STM32 and ESP-class control, sensors, motors, servos, and mechanism integration for a competition robot.",
    skills: ["STM32", "ESP32", "Embedded C"],
    href: "https://github.com/TheNityant/ROBOCON_2026_COMPLETE_BOT",
  },
  {
    id: "iitb-hackathon",
    org: "IIT Bombay",
    label: "Participant",
    dates: "",
    location: "Mumbai",
    description: "Attended a two-day hackathon at IIT Bombay.",
    skills: ["Hackathon"],
  },
];

export const education = {
  school: "St. Francis Institute of Technology (SFIT)",
  degree: "B.Tech",
  dates: "Second year as of 2026",
  location: "Mumbai",
  skills: [] as string[],
  placeholder: false,
};
