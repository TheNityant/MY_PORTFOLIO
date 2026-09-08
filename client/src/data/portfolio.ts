export type SocialLink = {
  label: string;
  href: string;
  icon: "mail" | "linkedin" | "github";
  placeholder?: boolean;
};

export type Project = {
  id: string;
  index: string;
  title: string;
  description: string;
  technologies: string[];
  href: string;
  placeholder?: boolean;
};

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
  company: string;
  role: string;
  dates: string;
  location: string;
  description: string;
  skills: string[];
  placeholder?: boolean;
};

export type DashboardConfig = {
  locationTitle: string;
  locationBody: string;
  currentFocus: string;
  recentActivity: string;
  favoriteTool: string;
  availability: string;
};

export const profile = {
  name: "Nityant Tiwari",
  displayName: "Nityant",
  role: "Aspiring AI + full-stack engineer",
  taglineLead: "I build",
  taglineEmphasis: "useful systems",
  taglineTail: "with thoughtful interfaces.",
  portraitAlt: "Nityant portrait placeholder",
  email: "replace-with-your-email@example.com",
  socials: [
    { label: "Email", href: "#contact", icon: "mail", placeholder: true },
    { label: "LinkedIn", href: "#contact", icon: "linkedin", placeholder: true },
    { label: "GitHub", href: "#contact", icon: "github", placeholder: true },
  ] satisfies SocialLink[],
};

export const dashboard: DashboardConfig = {
  locationTitle: "Location",
  locationBody: "Add the place you call home and the environments where you like to build.",
  currentFocus: "Add what you are building right now.",
  recentActivity: "Connect a repository or write a short update here.",
  favoriteTool: "Choose one tool you reach for often.",
  availability: "Update your current availability.",
};

export const tools = ["React", "TypeScript", "Python", "Node.js", "AI / LLMs", "Design systems"];

export const projects: Project[] = [
  {
    id: "project-01",
    index: "01",
    title: "Project 01",
    description: "Editable placeholder for a product, research project, or system you want to feature.",
    technologies: ["Add stack", "Add role"],
    href: "#contact",
    placeholder: true,
  },
  {
    id: "project-02",
    index: "02",
    title: "Project 02",
    description: "Editable placeholder for a shipped experience with a clear problem, process, and outcome.",
    technologies: ["Add stack", "Add year"],
    href: "#contact",
    placeholder: true,
  },
  {
    id: "project-03",
    index: "03",
    title: "Project 03",
    description: "Editable placeholder for an experiment that shows how you think and what you like to explore.",
    technologies: ["Add stack", "Add link"],
    href: "#contact",
    placeholder: true,
  },
];

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
    id: "experience-01",
    company: "Add organization",
    role: "Add role",
    dates: "DATE RANGE",
    location: "LOCATION",
    description: "Replace this honest placeholder with your contribution, scope, and impact.",
    skills: ["Add skill 01", "Add skill 02"],
    placeholder: true,
  },
  {
    id: "experience-02",
    company: "Add organization",
    role: "Add role",
    dates: "DATE RANGE",
    location: "LOCATION",
    description: "Add a second experience, leadership role, or meaningful collaboration here.",
    skills: ["Add skill 01", "Add skill 02"],
    placeholder: true,
  },
];

export const education = {
  school: "Add university or program",
  degree: "Add degree or field of study",
  dates: "DATE RANGE",
  location: "LOCATION",
  skills: ["Add subject 01", "Add subject 02", "Add subject 03"],
  placeholder: true,
};

export const searchItems = [
  { label: "Home", href: "#home", type: "Navigation" },
  { label: "Dashboard", href: "#dashboard", type: "Section" },
  { label: "Projects", href: "#projects", type: "Section" },
  { label: "Writing", href: "#writing", type: "Section" },
  { label: "Experience", href: "#experience", type: "Section" },
  { label: "Education", href: "#education", type: "Section" },
  { label: "Contact", href: "#contact", type: "Section" },
];
