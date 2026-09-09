export type SocialIconName = "mail" | "github" | "linkedin";

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
  icon: "home" | "projects" | "experience" | "writing";
  deferred?: boolean;
};

export type ContentGap = {
  referenceSlot: string;
  reason: string;
  resolution: string;
};

export type ProjectDomainId = "backend" | "fullstack" | "ai-ml" | "robotics";

export type ProjectDomain = {
  id: ProjectDomainId;
  label: string;
};

export type ProjectMedia =
  | { kind: "none"; alt: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; poster?: string; alt: string };

export type Project = {
  id: string;
  domain: ProjectDomainId;
  title: string;
  description: string;
  technologies: string[];
  href?: string;
  hrefLabel?: string;
  status?: string;
  media: ProjectMedia;
};

export const PROJECT_PAGE_SIZE = 2;

export type ScratchRevealContent =
  | { kind: "text"; text: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "gif"; src: string; alt: string };

export type DashboardFeature =
  | { kind: "building"; title: string; description: string; href?: string }
  | {
      kind: "music";
      title: string;
      artist: string;
      album?: string;
      artwork?: string;
      spotifyUrl?: string;
      accent?: string;
    };

export type DashboardCursorKind =
  | "plane"
  | "hand"
  | "laptop"
  | "dumbbell"
  | "clock"
  | "hammer"
  | "music"
  | "heart"
  | "link"
  | "wrench";

export type WritingSection = {
  id: string;
  title: string;
  topics: string[];
};

export type WritingEntry = {
  slug: string;
  title: string;
  type: "learning-journey";
  status: "ongoing" | "complete";
  summary: string;
  tags: string[];
  sourceUrl?: string;
  sections: WritingSection[];
};

export type ExperienceMark = { src?: string; alt?: string; fallback: string };

export type ExperienceItem = {
  id: string;
  org: string;
  label: string;
  dates: string;
  location: string;
  description: string;
  skills: string[];
  href?: string;
  mark: ExperienceMark;
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
  githubHandle: "TheNityant",
  repoHref: "https://github.com/TheNityant/MY_PORTFOLIO",
  location: "Mumbai, India",
  locationLat: 19.076,
  locationLng: 72.8777,
  summary: "Backend / Software Engineer with AI/ML engineering as a specialization.",
} as const;

export const socialUrls = {
  email: profile.email,
  github: profile.githubHref,
  linkedin: null as string | null,
} as const;

export const socials: SocialLink[] = [
  {
    label: "Email",
    href: `mailto:${socialUrls.email}`,
    icon: "mail",
    aria: `Email ${profile.name}`,
  },
  ...(socialUrls.linkedin
    ? [
        {
          label: "LinkedIn",
          href: socialUrls.linkedin,
          icon: "linkedin" as const,
          aria: `${profile.name} on LinkedIn`,
          external: true,
        },
      ]
    : []),
  {
    label: "GitHub",
    href: socialUrls.github,
    icon: "github",
    aria: `${profile.name} on GitHub`,
    external: true,
  },
];

export const visibleSocials = socials;

export const nav: NavItem[] = [
  { name: "Home", href: "#hero", icon: "home" },
  { name: "Projects", href: "#projects", icon: "projects" },
  { name: "Writing", href: "#writing", icon: "writing" },
  { name: "Experience", href: "#experience", icon: "experience" },
];

export type ToolMark = {
  name: string;
  icon?: string;
  accent?: string;
  iconColor?: string;
  needsDarkVariant?: boolean;
};

export const tools: ToolMark[] = [
  { name: "Java", icon: "/tools/java.svg", accent: "#f89820", iconColor: "#f89820" },
  { name: "Spring Boot", icon: "/tools/spring.svg", accent: "#6db33f", iconColor: "#6db33f" },
  { name: "PostgreSQL", icon: "/tools/postgresql.svg", accent: "#336791", iconColor: "#5b9bd5" },
  { name: "Python", icon: "/tools/python.svg", accent: "#3776ab", iconColor: "#4b8bbe" },
  { name: "TypeScript", icon: "/tools/typescript.svg", accent: "#3178c6", iconColor: "#5b9cf5" },
  { name: "React", icon: "/tools/react.svg", accent: "#61dafb", iconColor: "#61dafb" },
  { name: "Node.js", icon: "/tools/nodedotjs.svg", accent: "#339933", iconColor: "#68a063" },
  { name: "AI / LLMs", accent: "#a78bfa", iconColor: "#c4b5fd" },
];

export const coreStackTools: ToolMark[] = [
  { name: "Java", icon: "/tools/java.svg", accent: "#f89820", iconColor: "#f89820" },
  { name: "Spring Boot", icon: "/tools/spring.svg", accent: "#6db33f", iconColor: "#6db33f" },
];

export const metrics = {
  workouts: null as number | null,
  codingHours: null as number | null,
  wakaTimeEmbedUrl: null as string | null,
};

export const dashboardFeature: DashboardFeature = {
  kind: "building",
  title: "Statistical analysis platform",
  description: "Frontend plus Python analytics. In development.",
};

export const scratchRevealContent: ScratchRevealContent = {
  kind: "text",
  text: "Backend systems · AI/ML · Embedded",
};

export const dashboardCopy = {
  locationTitle: profile.location,
  scratchTitle: "Scratch me",
  scratchPrompt: "Scratch to reveal",
  activityTitle: "Activity",
  workoutsTitle: "Workouts",
  hoursTitle: "Hours coding",
  coreStackTitle: "Core stack",
  connectTitle: "Connect",
  toolsTitle: "Tools",
  githubCta: "Open GitHub",
  featureBuildingTitle: "Now building",
  featureMusicTitle: "Last played",
} as const;

export const searchItems = [
  { label: "Home", href: "#hero", type: "Navigate" },
  { label: "Projects", href: "#projects", type: "Navigate" },
  { label: "Writing", href: "#writing", type: "Navigate" },
  { label: "Experience", href: "#experience", type: "Navigate" },
  { label: "Statistical Analysis Platform", href: "#projects", type: "Projects" },
  { label: "Habit Tracker", href: "#projects", type: "Projects" },
  { label: "LLM Visualizer", href: "#projects", type: "Projects" },
  { label: "GeneZap", href: "#projects", type: "Projects" },
  { label: "Robotic Hand S100", href: "#projects", type: "Projects" },
  { label: "Robocon 2026 Bot", href: "#projects", type: "Projects" },
  { label: "LLM Engineering Notebook", href: "/writing/llm-engineering-notebook", type: "Writing" },
];

export const projectDomains: ProjectDomain[] = [
  { id: "backend", label: "Backend" },
  { id: "fullstack", label: "Full Stack / App Development" },
  { id: "ai-ml", label: "AI / ML" },
  { id: "robotics", label: "Robotics / Embedded" },
];

export const defaultProjectDomain: ProjectDomainId = "backend";

export const experienceCopy = {
  heading: "Experience",
  intro: "Applied engineering, technical programs, and education.",
} as const;

export const projects: Project[] = [
  {
    id: "stat-platform",
    domain: "backend",
    title: "Statistical Analysis Platform",
    description:
      "Statistical analysis platform in development, combining a modern frontend with a Python analytics stack.",
    technologies: ["Frontend", "Python", "Statistics"],
    status: "In development",
    media: { kind: "none", alt: "Media frame for the Statistical Analysis Platform." },
  },
  {
    id: "habit-tracker",
    domain: "fullstack",
    title: "Habit Tracker",
    description:
      "Flutter client with a Spring Boot REST API and PostgreSQL — auth, habit and task tracking with streaks, analytics, calendar, file uploads, and Gemini-assisted journaling.",
    technologies: ["Flutter", "Spring Boot", "PostgreSQL", "Gemini"],
    href: "https://github.com/TheNityant/HABIT_TRACKER-Full-Stack-app",
    hrefLabel: "Repository",
    media: { kind: "none", alt: "Media frame for Habit Tracker." },
  },
  {
    id: "llm-visualizer",
    domain: "ai-ml",
    title: "LLM Visualizer",
    description:
      "A visual exploration tool for understanding LLM internals, including layers, tensors, and token-level computation.",
    technologies: ["LLMs", "Model internals", "Visualization"],
    href: "https://github.com/TheNityant/LLM_Visualizer",
    hrefLabel: "Repository",
    status: "In progress",
    media: { kind: "none", alt: "Media frame for LLM Visualizer." },
  },
  {
    id: "genezap",
    domain: "ai-ml",
    title: "GeneZap",
    description:
      "Experimental offline genomic-analysis pipeline combining species profiling, ML resistance prediction, CGR/CNN-style analysis, and CARD-based validation.",
    technologies: ["Python", "TensorFlow", "scikit-learn", "OpenCV"],
    status: "Experimental",
    media: { kind: "none", alt: "Media frame for GeneZap." },
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
    media: { kind: "none", alt: "Media frame for Robotic Hand S100." },
  },
  {
    id: "robocon-2026",
    domain: "robotics",
    title: "Robocon 2026 Bot",
    description:
      "STM32 and ESP-class control for a competition robot, integrating locomotion, sensors, motors, servos, and mechanism actuation.",
    technologies: ["STM32", "ESP32", "Embedded C"],
    href: "https://github.com/TheNityant/ROBOCON_2026_COMPLETE_BOT",
    hrefLabel: "Repository",
    status: "Applied work",
    media: { kind: "none", alt: "Media frame for the Robocon 2026 bot." },
  },
];

export function projectsForDomain(domain: ProjectDomainId, list: readonly Project[] = projects) {
  return list.filter((project) => project.domain === domain);
}

export function visibleProjectDomains(list: readonly Project[] = projects) {
  return projectDomains.filter((domain) => projectsForDomain(domain.id, list).length > 0);
}

export const writingEntries: WritingEntry[] = [
  {
    slug: "llm-engineering-notebook",
    title: "LLM Engineering Notebook",
    type: "learning-journey",
    status: "ongoing",
    summary:
      "An engineering handbook and learning journey that develops a deep understanding of large language models from mathematical foundations through transformers and production LLM systems.",
    tags: ["LLMs", "Transformers", "LLM Systems", "Engineering"],
    sections: [
      {
        id: "01",
        title: "Mathematical Foundations for Language Modeling",
        topics: [
          "probability theory",
          "conditional probability and chain rule",
          "information theory",
          "entropy and cross-entropy",
          "sequence probability",
          "perplexity",
          "maximum likelihood estimation",
          "executable verification",
        ],
      },
      {
        id: "05",
        title: "Attention Mechanisms and Transformers",
        topics: [
          "queries, keys and values",
          "scaled dot-product attention",
          "self-attention",
          "causal masking",
          "multi-head attention",
          "positional information",
          "transformer block construction",
          "attention-weight visualization",
          "transparent attention experiments",
        ],
      },
      {
        id: "09",
        title: "LLM Systems and Deployment",
        topics: [
          "model serving and API contracts",
          "prefill and decode",
          "KV caching",
          "context-window engineering",
          "batching",
          "quantization/compression",
          "inference parallelism",
          "latency, throughput, memory and cost",
          "deployment architecture",
          "autoscaling/backpressure",
          "streaming/cancellation",
          "observability and reliability",
          "deployment acceptance",
        ],
      },
    ],
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
    mark: { fallback: "G", alt: "Google GenAI Academy" },
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
    mark: { fallback: "R", alt: "Robocon 2026" },
  },
  {
    id: "iitb-hackathon",
    org: "IIT Bombay",
    label: "Participant",
    dates: "",
    location: "Mumbai",
    description: "Attended a two-day hackathon at IIT Bombay.",
    skills: ["Hackathon"],
    mark: { fallback: "IITB", alt: "IIT Bombay" },
  },
];

export const education = {
  school: "St. Francis Institute of Technology (SFIT)",
  degree: "B.Tech",
  dates: "Second year as of 2026",
  location: "Mumbai",
  mark: { fallback: "SFIT", alt: "St. Francis Institute of Technology" } as ExperienceMark,
};

export function formatMetric(value: number | null) {
  return value === null ? "—" : String(value);
}
