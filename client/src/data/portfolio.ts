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
  portraitSrc: null as string | null,
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
  linkedin: "https://www.linkedin.com/in/nityant-tiwari-88b97533b/",
} as const;

export const socials: SocialLink[] = [
  {
    label: "Email",
    href: `mailto:${socialUrls.email}`,
    icon: "mail",
    aria: `Email ${profile.name}`,
  },
  {
    label: "LinkedIn",
    href: socialUrls.linkedin,
    icon: "linkedin",
    aria: `${profile.name} on LinkedIn`,
    external: true,
  },
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
  { name: "Node.js", icon: "/tools/nodedotjs.svg", accent: "#5fa04e", iconColor: "#5fa04e" },
];

export const projectDomains: ProjectDomain[] = [
  { id: "backend", label: "Backend" },
  { id: "fullstack", label: "Full Stack / App Dev" },
  { id: "ai-ml", label: "AI / ML" },
  { id: "robotics", label: "Robotics" },
];

export const projects: Project[] = [
  {
    id: "habit-tracker",
    domain: "fullstack",
    title: "Habit Tracker — Full Stack App",
    description: "Flutter + Spring Boot habit system with PostgreSQL, offline Hive storage, synchronization, analytics, file upload and a Gemini-powered journal.",
    technologies: ["Flutter", "Spring Boot", "PostgreSQL", "Hive", "Gemini"],
    href: "https://github.com/TheNityant/HABIT_TRACKER_Full_Stack_App",
    hrefLabel: "GitHub repository",
    status: "v4",
    media: { kind: "none", alt: "Habit Tracker project media" },
  },
  {
    id: "statistical-analysis-platform",
    domain: "fullstack",
    title: "Statistical Analysis Platform",
    description: "A statistics-oriented software project in the portfolio set.",
    technologies: ["Software Engineering", "Data Analysis"],
    media: { kind: "none", alt: "Statistical Analysis Platform project media" },
  },
  {
    id: "backend-notebook",
    domain: "backend",
    title: "Backend Engineering Notebook",
    description: "An evolving engineering notebook focused on backend fundamentals, APIs, databases and production software design.",
    technologies: ["Java", "Backend", "APIs", "Databases"],
    status: "Planned / evolving",
    media: { kind: "none", alt: "Backend engineering notebook media" },
  },
  {
    id: "genezap",
    domain: "backend",
    title: "GeneZap",
    description: "A backend-oriented software project in the current portfolio set.",
    technologies: ["Backend", "Software Engineering"],
    media: { kind: "none", alt: "GeneZap project media" },
  },
  {
    id: "llm-visualizer",
    domain: "ai-ml",
    title: "LLM Visualizer",
    description: "A model-visualization project exploring how LLM concepts and behavior can be made easier to inspect and understand.",
    technologies: ["LLMs", "Python", "Visualization"],
    href: "https://github.com/TheNityant/LLM_visualizer",
    hrefLabel: "GitHub repository",
    media: { kind: "none", alt: "LLM Visualizer project media" },
  },
  {
    id: "llm-engineering-notebook",
    domain: "ai-ml",
    title: "LLM Engineering Notebook",
    description: "A structured learning and design notebook covering transformer/LLM foundations, RAG, MCP and applied AI engineering.",
    technologies: ["Transformers", "RAG", "MCP", "AI Engineering"],
    href: "/writing/llm-engineering-notebook",
    hrefLabel: "Open notebook",
    status: "Ongoing",
    media: { kind: "none", alt: "LLM Engineering Notebook media" },
  },
  {
    id: "robotic-hand-s100",
    domain: "robotics",
    title: "Robotic Hand S100",
    description: "STM32-based servo and robotic mechanism control work, developed through progressively integrated control programs.",
    technologies: ["STM32", "Servo Control", "Embedded", "Robotics"],
    href: "https://github.com/TheNityant/ROBOTIC_HAND_S100",
    hrefLabel: "GitHub repository",
    media: { kind: "none", alt: "Robotic Hand S100 project media" },
  },
  {
    id: "robocon-2026",
    domain: "robotics",
    title: "ROBOCON 2026 Complete Bot",
    description: "A competition robot system spanning locomotion, mechanisms, control electronics and robotics integration.",
    technologies: ["Robotics", "STM32", "ESP32", "Control Systems"],
    href: "https://github.com/TheNityant/ROBOCON_2026_COMPLETE_BOT",
    hrefLabel: "GitHub repository",
    media: { kind: "none", alt: "ROBOCON 2026 robot project media" },
  },
];

export const scratchRevealContent: ScratchRevealContent = {
  kind: "text",
  text: "Backend systems · AI/ML · Embedded",
};

export const dashboardFeature: DashboardFeature = {
  kind: "building",
  title: "LLM Engineering Notebook",
  description: "Designing a structured notebook around transformers, RAG, MCP and applied AI engineering.",
  href: "/writing/llm-engineering-notebook",
};

export const writingEntries: WritingEntry[] = [
  {
    slug: "llm-engineering-notebook",
    title: "LLM Engineering Notebook",
    type: "learning-journey",
    status: "ongoing",
    summary: "An ongoing learning and design notebook about transformer/LLM foundations, RAG, MCP and applied AI engineering.",
    tags: ["LLMs", "RAG", "MCP", "AI Engineering"],
    sourceUrl: "https://github.com/TheNityant/LLM_Engineering_Notebook",
    sections: [
      { id: "01", title: "Foundations", topics: ["Language modeling", "Tokens", "Probability", "Entropy"] },
      { id: "05", title: "Retrieval", topics: ["Embeddings", "Chunking", "Vector search", "RAG"] },
      { id: "09", title: "Systems", topics: ["MCP", "Agents", "Architecture", "Evaluation"] },
    ],
  },
];

export const experiences: ExperienceItem[] = [
  {
    id: "google-genai-academy",
    org: "Google GenAI Academy APAC",
    label: "GenAI Academy / Hackathon track",
    dates: "2026",
    location: "APAC / Online",
    description: "Hands-on Google Cloud GenAI work spanning agent development, Cloud Run, Firestore and BigQuery MCP workflows.",
    skills: ["Google Cloud", "Agents", "Cloud Run", "Firestore", "BigQuery MCP"],
    mark: { fallback: "G" },
  },
  {
    id: "iit-delhi-rover",
    org: "IIT Delhi",
    label: "Rover / robotics event",
    dates: "2026",
    location: "Delhi, India",
    description: "Robotics event experience centered on rover-oriented engineering and technical competition work.",
    skills: ["Robotics", "Embedded Systems", "Team Engineering"],
    mark: { fallback: "IIT" },
  },
  {
    id: "btech",
    org: "St. Francis Institute of Technology",
    label: "B.Tech — Engineering",
    dates: "2025–present",
    location: "Mumbai, India",
    description: "Undergraduate engineering studies with backend/software engineering as the primary career track and AI/ML as a specialization.",
    skills: ["Software Engineering", "AI/ML", "Robotics"],
    mark: { fallback: "SFIT" },
  },
];

export const contentGaps: ContentGap[] = [
  {
    referenceSlot: "Project media",
    reason: "Screenshots/videos are not committed for every featured project yet.",
    resolution: "Add user-owned media when supplied; do not fabricate previews.",
  },
];
