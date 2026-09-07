import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Github, Instagram, Linkedin, Mail, Menu, X } from "lucide-react";

const PROFILE = {
  name: "Your Name",
  shortName: "YOUR NAME",
  role: "Software Engineer & Product Builder",
  location: "Based in your city",
  email: "hello@yourdomain.com",
  bio: "A software engineer who likes building things that feel clear, useful, and a little bit unexpected.",
  github: "https://github.com/",
  linkedin: "https://www.linkedin.com/",
  instagram: "https://instagram.com/",
};

const projects = [
  {
    title: "Project One",
    description: "A thoughtful product experience built to make complex workflows feel simple, fast, and human.",
    stack: ["React", "TypeScript", "Next.js", "AI"],
    label: "01 / PRODUCT",
    color: "cobalt",
  },
  {
    title: "Project Two",
    description: "A calm, focused interface for turning scattered information into a clear next step.",
    stack: ["React Native", "Expo", "Node.js", "MongoDB"],
    label: "02 / SYSTEM",
    color: "orange",
  },
  {
    title: "Project Three",
    description: "A visual experiment exploring motion, interaction, and the small details that make software memorable.",
    stack: ["JavaScript", "WebGL", "CSS", "Motion"],
    label: "03 / EXPERIMENT",
    color: "ice",
  },
];

const posts = [
  { title: "Making Space for Better Interfaces", date: "MAY 16, 2026", excerpt: "A few notes on the relationship between restraint, rhythm, and digital products." },
  { title: "Sweating the Details", date: "MAY 15, 2026", excerpt: "Why timing, optical balance, and micro-interactions are worth paying attention to." },
  { title: "Building My Portfolio Website", date: "APR 12, 2026", excerpt: "A behind-the-scenes look at the tools, decisions, and ideas behind this site." },
];

const experience = [
  { company: "Your Current Role", role: "Software Engineer", dates: "2024 — PRESENT", place: "Your City", description: "Building useful products at the intersection of technology, design, and thoughtful systems.", skills: ["TypeScript", "React", "Next.js", "AI Systems", "Infrastructure"] },
  { company: "Previous Company", role: "Product Engineer", dates: "2022 — 2024", place: "Remote", description: "Worked across product, frontend, and platform to bring ideas from first sketch to shipped experience.", skills: ["React", "Node.js", "APIs", "UI/UX", "Testing"] },
  { company: "Independent", role: "Builder & Consultant", dates: "2020 — 2022", place: "Everywhere", description: "Partnered with small teams to shape, design, and build digital products from zero to one.", skills: ["Full-stack", "Design Systems", "Prototyping", "Strategy"] },
];

const education = {
  school: "Your University",
  degree: "B.S. in Computer Science",
  dates: "2018 — 2022",
  place: "Your City",
  skills: ["C++", "Python", "JavaScript", "HTML/CSS", "SQL"],
};

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let animation = 0;
    let width = 0;
    let height = 0;
    const pointer = { x: 0.52, y: 0.45 };
    const dots = Array.from({ length: 420 }, (_, index) => ({
      seed: index * 1.731,
      drift: 0.18 + (index % 7) * 0.025,
      size: 0.45 + (index % 4) * 0.2,
      opacity: 0.18 + (index % 8) * 0.06,
    }));

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const onMove = (event: MouseEvent) => {
      pointer.x = event.clientX / Math.max(window.innerWidth, 1);
      pointer.y = event.clientY / Math.max(window.innerHeight, 1);
    };
    const draw = () => {
      frame += 0.004;
      context.clearRect(0, 0, width, height);
      const originX = width * (0.57 + (pointer.x - 0.5) * 0.05);
      const originY = height * (0.52 + (pointer.y - 0.5) * 0.04);
      dots.forEach((dot, index) => {
        const t = frame * dot.drift + dot.seed;
        const ring = index / dots.length;
        const angle = t + ring * Math.PI * 11;
        const spreadX = width * (0.1 + ring * 0.67);
        const spreadY = height * (0.04 + ring * 0.48);
        const x = originX + Math.cos(angle) * spreadX + Math.sin(t * 1.9) * width * 0.08;
        const y = originY + Math.sin(angle * 1.23) * spreadY + Math.cos(t * 1.3) * height * 0.09;
        const fade = Math.max(0, 1 - Math.abs(x - width * 0.54) / (width * 0.72));
        context.beginPath();
        context.fillStyle = `rgba(31, 88, 242, ${dot.opacity * fade})`;
        context.arc(x, y, dot.size, 0, Math.PI * 2);
        context.fill();
      });
      animation = requestAnimationFrame(draw);
    };
    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);
  return <canvas className="particle-field" ref={canvasRef} aria-hidden="true" />;
}

function Spark({ small = false }: { small?: boolean }) {
  return <span className={small ? "spark spark--small" : "spark"} aria-hidden="true">✳</span>;
}

function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span>{index}</span>
      <span>{children}</span>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    update();
    const interval = window.setInterval(update, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  return (
    <main className="site-shell">
      <header className="site-header">
        <a href="#home" className="wordmark" onClick={closeMenu} aria-label="Go to home">
          <span className="wordmark-mark">◈</span>
          <span>{PROFILE.shortName}</span>
        </a>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
        <nav className={menuOpen ? "main-nav main-nav--open" : "main-nav"}>
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#projects" onClick={closeMenu}>Projects</a>
          <a href="#experience" onClick={closeMenu}>Experience</a>
          <a href="#writing" onClick={closeMenu}>Blog</a>
        </nav>
        <a className="header-cta" href={`mailto:${PROFILE.email}`}>Say hello <ArrowUpRight size={14} /></a>
      </header>

      <section className="hero" id="home">
        <ParticleField />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-meta">
            <span>PORTFOLIO / 2026</span>
            <span className="hero-meta-right"><i className="status-dot" /> {PROFILE.location.toUpperCase()} / {time || "--:--"}</span>
          </div>
          <div className="profile-orbit">
            <div className="profile-orbit-ring" />
            <div className="profile-avatar">YN</div>
            <div className="profile-tag">PROFILE SIGNAL<br /><span>ACTIVE / OPEN</span></div>
          </div>
          <p className="hero-kicker">Hello, I am</p>
          <h1>{PROFILE.name.split(" ")[0]}<br /><em>{PROFILE.name.split(" ").slice(1).join(" ") || "your next collaborator"}</em></h1>
          <p className="hero-description">{PROFILE.bio}</p>
          <a className="hero-link" href="#projects">View my work <span>↓</span></a>
        </div>
        <a className="scroll-indicator" href="#projects" aria-label="Scroll to projects"><ChevronDown size={16} /></a>
      </section>

      <section className="statement-section">
        <div className="container statement-grid">
          <SectionLabel index="00">A NOTE FROM THE FIELD</SectionLabel>
          <div className="statement-copy">
            <div className="word-cloud" aria-hidden="true"><span>THEY</span><span>HAVE</span><span>BECOME</span><span className="accent-word">INEVITABLE</span></div>
            <p>Good software should feel like an extension of the way you think. I care about the space between an idea and the moment it becomes real — the systems, interfaces, and small decisions that make that distance feel effortless.</p>
          </div>
        </div>
      </section>

      <section className="section container" id="projects">
        <div className="section-heading-row">
          <div><Spark /><span className="eyebrow">SELECTED WORK</span><h2>Projects<span className="accent-dot">.</span></h2></div>
          <span className="section-count">03 / 03</span>
        </div>
        <div className="project-grid">
          {projects.map((project, index) => (
            <article className={`project-card project-card--${project.color}`} key={project.title}>
              <div className="card-topline"><span>{project.label}</span><span>↗</span></div>
              <div className="project-visual" aria-hidden="true"><span className="visual-number">0{index + 1}</span><span className="visual-cross">+</span><span className="visual-orbit" /></div>
              <div className="project-info"><h3>{project.title}</h3><p>{project.description}</p><div className="tag-row">{project.stack.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
              <a href="#contact" className="card-arrow" aria-label={`Learn more about ${project.title}`}><ArrowUpRight size={16} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="section writing-section container" id="writing">
        <div className="section-heading-row"><div><Spark /><span className="eyebrow">NOTES / OBSERVATIONS</span><h2>Writing<span className="accent-dot">.</span></h2></div><a className="text-link" href="#contact">Read all posts <ArrowUpRight size={14} /></a></div>
        <div className="writing-list">
          {posts.map((post, index) => <a className="writing-row" href="#contact" key={post.title}><span className="writing-index">0{index + 1}</span><div className="writing-main"><h3>{post.title}</h3><p>{post.excerpt}</p></div><span className="writing-date">{post.date}</span><ArrowUpRight className="writing-arrow" size={16} /></a>)}
        </div>
      </section>

      <section className="section experience-section" id="experience">
        <div className="container">
          <div className="section-heading-row"><div><Spark /><span className="eyebrow">THE LONG VIEW</span><h2>Experience<span className="accent-dot">.</span></h2></div><span className="section-count">2018 — NOW</span></div>
          <div className="experience-list">
            {experience.map((item, index) => <article className="experience-row" key={item.company}><div className="experience-index">0{index + 1}</div><div className="experience-company"><span className="company-symbol">{item.company.slice(0, 1)}</span><h3>{item.company}</h3></div><div className="experience-role"><strong>{item.role}</strong><span>{item.dates} · {item.place}</span><p>{item.description}</p></div><div className="skill-list">{item.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></article>)}
          </div>
        </div>
      </section>

      <section className="section education-section container" id="education">
        <div className="education-intro"><Spark /><div><span className="eyebrow">FOUNDATIONS</span><h2>Education<span className="accent-dot">.</span></h2></div></div>
        <article className="education-card"><div className="edu-logo">{education.school.slice(0, 2).toUpperCase()}</div><div className="edu-main"><h3>{education.degree}</h3><strong>{education.school}</strong><span>{education.dates} · {education.place}</span></div><div className="skill-list">{education.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></article>
      </section>

      <section className="earth-section" id="earth">
        <div className="container earth-content"><div><Spark /><span className="eyebrow">FIELD NOTES</span><h2>I like the<br /><em>earth</em><span className="accent-dot">.</span></h2></div><p>Places that made me stop and take a picture.</p><a className="earth-image" href="#contact"><img src="/manus-storage/earth-coast_27ac9c9d.jpg" alt="Coastal cliffs shrouded in morning fog" /><span className="image-label">COASTLINE / 36.7783° N, 119.4179° W <ArrowUpRight size={14} /></span></a></div>
      </section>

      <footer className="site-footer" id="contact">
        <div className="container footer-top"><div><span className="eyebrow">OPEN CHANNEL</span><h2>Say hello<span className="accent-dot">.</span> <span className="wave">↗</span></h2></div><a className="contact-link" href={`mailto:${PROFILE.email}`}>{PROFILE.email}<ArrowUpRight size={16} /></a></div>
        <div className="container footer-bottom"><div><a className="wordmark" href="#home"><span className="wordmark-mark">◈</span><span>{PROFILE.name}</span></a><p>{PROFILE.role}, building thoughtful products at the intersection of technology and great UX.</p></div><div className="footer-column"><span className="footer-label">Navigate</span><a href="#home">Home</a><a href="#projects">Projects</a><a href="#experience">Experience</a><a href="#writing">Blog</a></div><div className="footer-column"><span className="footer-label">Connect</span><a href={`mailto:${PROFILE.email}`}>Email</a><a href={PROFILE.linkedin}>LinkedIn</a><a href={PROFILE.github}>GitHub</a><a href={PROFILE.instagram}>Instagram</a></div></div>
        <div className="container footer-legal"><span>© 2026 {PROFILE.name}</span><span>BUILT WITH CURIOSITY / <span className="blue-text">●</span></span></div>
      </footer>
    </main>
  );
}
