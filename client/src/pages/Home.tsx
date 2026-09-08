import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Github,
  Link2,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Moon,
  Music2,
  Search,
  Sparkles,
  Sun,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  dashboard,
  education,
  experience,
  profile,
  projects,
  searchItems,
  tools,
  writing,
} from "@/data/portfolio";

type IconName = "mail" | "linkedin" | "github";

function SocialIcon({ name, size = 17 }: { name: IconName; size?: number }) {
  if (name === "mail") return <Mail size={size} strokeWidth={1.7} />;
  if (name === "linkedin") return <Linkedin size={size} strokeWidth={1.7} />;
  return <Github size={size} strokeWidth={1.7} />;
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-kicker"><span className="section-kicker-mark">✳</span>{eyebrow}</span>
        <h2>{title}<span className="heading-period">.</span></h2>
      </div>
      {detail ? <span className="section-detail">{detail}</span> : null}
    </div>
  );
}

function TileHeader({ icon, title, caption }: { icon: ReactNode; title: string; caption?: string }) {
  return (
    <div className="tile-header">
      <span className="tile-icon" aria-hidden="true">{icon}</span>
      <div>
        <span className="tile-title">{title}</span>
        {caption ? <span className="tile-caption">{caption}</span> : null}
      </div>
    </div>
  );
}

function DashboardTile({
  area,
  children,
  className = "",
  labelledBy,
}: {
  area: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return <article className={`dashboard-tile dashboard-tile--${area} ${className}`} aria-labelledby={labelledBy}>{children}</article>;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchItems;
    return searchItems.filter((item) => `${item.label} ${item.type}`.toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search portfolio">
      <button className="search-backdrop" type="button" aria-label="Close search" onClick={onClose} />
      <div className="search-panel">
        <div className="search-panel-topline">
          <span>Search the portfolio</span>
          <button className="icon-button" type="button" aria-label="Close search" onClick={onClose}><X size={17} /></button>
        </div>
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jump to a section..." />
          <kbd>ESC</kbd>
        </label>
        <div className="search-results">
          {results.length ? results.map((item) => (
            <a className="search-result" href={item.href} key={item.label} onClick={onClose}>
              <span>{item.label}</span><small>{item.type}</small><ArrowUpRight size={15} />
            </a>
          )) : <p className="search-empty">No matching section.</p>}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ scratchRevealed, onScratch }: { scratchRevealed: boolean; onScratch: () => void }) {
  return (
    <section className="dashboard-section" id="dashboard" aria-labelledby="dashboard-heading">
      <div className="container">
        <div className="dashboard-intro">
          <div>
            <span className="section-kicker"><span className="section-kicker-mark">✳</span>02 / PERSONAL DASHBOARD</span>
            <h2 id="dashboard-heading">A little more<br /><em>context.</em></h2>
          </div>
          <p>Keep this space personal: a location, a current focus, a few signals, and the tools that shape how you work.</p>
        </div>
        <div className="dashboard-grid">
          <DashboardTile area="location" labelledBy="location-title">
            <div className="tile-tall-content">
              <div className="tile-surface-art" aria-hidden="true"><span className="surface-line surface-line--one" /><span className="surface-line surface-line--two" /><span className="surface-dot" /></div>
              <TileHeader icon={<MapPin size={17} />} title="Location" caption="PERSONAL / EDITABLE" />
              <div className="tile-bottom-copy">
                <h3 id="location-title">{dashboard.locationTitle}</h3>
                <p>{dashboard.locationBody}</p>
                <span className="tile-note">ADD YOUR PLACE <ArrowUpRight size={13} /></span>
              </div>
            </div>
          </DashboardTile>

          <DashboardTile area="scratch" labelledBy="scratch-title">
            <TileHeader icon={<Sparkles size={17} />} title="Scratch Me" caption="A SMALL RESET" />
            <button className={`scratch-card ${scratchRevealed ? "scratch-card--revealed" : ""}`} type="button" onClick={onScratch} aria-describedby="scratch-hint">
              <span className="scratch-card-scribble" aria-hidden="true">{scratchRevealed ? "✦" : "···"}</span>
              <strong id="scratch-title">{scratchRevealed ? "Keep going." : "Tap to reveal"}</strong>
              <span id="scratch-hint">{scratchRevealed ? "A small note for the next build." : "A tiny interactive personal detail."}</span>
            </button>
          </DashboardTile>

          <DashboardTile area="github" labelledBy="github-title">
            <TileHeader icon={<Github size={17} />} title="GitHub Activity" caption="CONNECT WHEN READY" />
            <div className="activity-card">
              <div className="activity-topline"><strong id="github-title">Contribution map</strong><span>TODO</span></div>
              <div className="activity-grid" aria-hidden="true">
                {Array.from({ length: 56 }, (_, index) => <span key={index} className={`activity-cell activity-cell--${index % 5}`} />)}
              </div>
              <p>Connect a public repository or keep this as an honest placeholder until there is real activity to show.</p>
            </div>
          </DashboardTile>

          <DashboardTile area="coffees" className="metric-tile" labelledBy="signal-one-title">
            <TileHeader icon={<BarChart3 size={16} />} title="Signal 01" />
            <strong id="signal-one-title">TODO</strong>
            <span>add a real metric</span>
          </DashboardTile>

          <DashboardTile area="hours" className="metric-tile" labelledBy="signal-two-title">
            <TileHeader icon={<Activity size={16} />} title="Signal 02" />
            <strong id="signal-two-title">TODO</strong>
            <span>add a real metric</span>
          </DashboardTile>

          <DashboardTile area="music" labelledBy="building-title">
            <TileHeader icon={<Music2 size={17} />} title="Currently building" caption="RECENT ACTIVITY" />
            <div className="building-card">
              <div className="building-mark" aria-hidden="true"><Code2 size={30} strokeWidth={1.2} /></div>
              <div>
                <span className="tile-note">NOW / EDITABLE</span>
                <h3 id="building-title">{dashboard.recentActivity}</h3>
                <p>{dashboard.currentFocus}</p>
              </div>
              <ArrowRight className="building-arrow" size={18} aria-hidden="true" />
            </div>
          </DashboardTile>

          <DashboardTile area="favorite" labelledBy="favorite-title">
            <TileHeader icon={<Wrench size={17} />} title="Favorite tool" caption="PERSONAL PREFERENCE" />
            <div className="favorite-card">
              <span className="favorite-orb" aria-hidden="true"><Zap size={20} /></span>
              <strong id="favorite-title">{dashboard.favoriteTool}</strong>
              <span>replace with a tool you love</span>
            </div>
          </DashboardTile>

          <DashboardTile area="contact" className="connect-tile" labelledBy="connect-title">
            <TileHeader icon={<Link2 size={17} />} title="Connect" caption="OPEN CHANNEL" />
            <div className="connect-card">
              <h3 id="connect-title">Let’s make<br /><em>something useful.</em></h3>
              <a href="#contact" className="tile-action">Open contact <ArrowUpRight size={14} /></a>
            </div>
          </DashboardTile>

          <DashboardTile area="tools" labelledBy="tools-title">
            <div className="tools-strip-head"><TileHeader icon={<Wrench size={17} />} title="Tools / technology" caption="EDITABLE SKILLS" /><span>ADD OR REMOVE</span></div>
            <div className="tools-marquee" id="tools-title">
              {tools.map((tool) => <span key={tool}>{tool}</span>)}
            </div>
          </DashboardTile>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const toggleSearch = () => {
    setMenuOpen(false);
    setSearchOpen((open) => !open);
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <a href="#home" className="wordmark" onClick={closeMenu} aria-label="Go to home"><span className="wordmark-mark">✳</span><span>NT / PORTFOLIO</span></a>
        <nav className={menuOpen ? "main-nav main-nav--open" : "main-nav"} aria-label="Primary navigation">
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#projects" onClick={closeMenu}>Projects</a>
          <a href="#experience" onClick={closeMenu}>Experience</a>
          <a href="#writing" onClick={closeMenu}>Blog</a>
        </nav>
        <div className="header-tools">
          <button className="header-tool search-trigger" type="button" onClick={toggleSearch} aria-label="Open search"><Search size={15} /><kbd>⌘K</kbd></button>
          <button className="header-tool theme-trigger" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button>
          <a className="header-contact" href="#contact" onClick={closeMenu}>Say hello <ArrowUpRight size={14} /></a>
        </div>
        <button className="menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </header>

      <section className="hero" id="home" aria-labelledby="hero-title">
        <div className="aurora aurora--one" aria-hidden="true" /><div className="aurora aurora--two" aria-hidden="true" />
        <div className="hero-content">
          <div className="portrait-placeholder" role="img" aria-label={profile.portraitAlt}><span>NT</span><i aria-hidden="true" /></div>
          <div className="availability"><span className="availability-dot" />{dashboard.availability}<span className="availability-edit">/ EDITABLE</span></div>
          <p className="hero-kicker">Hi. I’m</p>
          <h1 id="hero-title">{profile.displayName}</h1>
          <p className="hero-description">{profile.taglineLead} <span className="hero-inline-script">{profile.taglineEmphasis}</span> {profile.taglineTail}</p>
          <p className="hero-role">{profile.role} <span>— interested in the space between intelligence, systems, and great UX.</span></p>
          <div className="hero-actions">
            <div className="social-actions" aria-label="Social links">
              {profile.socials.map((social) => <a href={social.href} key={social.label} aria-label={`${social.label}${social.placeholder ? " placeholder" : ""}`}><SocialIcon name={social.icon} /><span>{social.label}</span></a>)}
            </div>
            <span className="hero-divider" aria-hidden="true" />
            <a href="#projects" className="outline-action">View my work <ArrowRight size={15} /></a>
          </div>
        </div>
        <a className="scroll-indicator" href="#dashboard" aria-label="Scroll to personal dashboard"><ChevronDown size={16} /></a>
      </section>

      <Dashboard scratchRevealed={scratchRevealed} onScratch={() => setScratchRevealed((revealed) => !revealed)} />

      <section className="content-section projects-section" id="projects" aria-labelledby="projects-heading">
        <div className="container">
          <SectionHeading eyebrow="03 / SELECTED WORK" title="Projects" detail="EDITABLE PROJECT INDEX" />
          <div className="projects-grid">
            {projects.map((project, index) => (
              <a className={`project-card ${index === 0 ? "project-card--featured" : ""}`} href={project.href} key={project.id}>
                <div className="project-card-top"><span>{project.index} / {project.placeholder ? "PLACEHOLDER" : "FEATURED"}</span><ArrowUpRight size={16} /></div>
                <div className="project-art" aria-hidden="true"><span className="project-art-line project-art-line--one" /><span className="project-art-line project-art-line--two" /><span className="project-art-node" /></div>
                <div className="project-copy"><h3>{project.title}</h3><p>{project.description}</p><div className="tag-row">{project.technologies.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section writing-section" id="writing" aria-labelledby="writing-heading">
        <div className="container">
          <SectionHeading eyebrow="04 / NOTES & OBSERVATIONS" title="Writing" detail="BLOG / TECHNICAL NOTES" />
          <div className="writing-list">
            {writing.map((post, index) => <a className="writing-row" href={post.href} key={post.id}><span className="writing-index">0{index + 1}</span><div><h3>{post.title}</h3><p>{post.excerpt}</p></div><span className="writing-date">{post.date}</span><ChevronRight className="writing-arrow" size={17} /></a>)}
          </div>
        </div>
      </section>

      <section className="experience-section" id="experience" aria-labelledby="experience-heading">
        <div className="container">
          <SectionHeading eyebrow="05 / THE LONG VIEW" title="Experience" detail="LEADERSHIP / WORK" />
          <div className="experience-list">
            {experience.map((item, index) => <article className="experience-row" key={item.id}><span className="experience-index">0{index + 1}</span><div className="experience-company"><span className="company-mark">{item.company.slice(0, 1)}</span><div><h3>{item.company}</h3><strong>{item.role}</strong></div></div><div className="experience-description"><span>{item.dates} · {item.location}</span><p>{item.description}</p></div><div className="skill-list">{item.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></article>)}
          </div>
        </div>
      </section>

      <section className="content-section education-section" id="education" aria-labelledby="education-heading">
        <div className="container">
          <SectionHeading eyebrow="06 / FOUNDATIONS" title="Education" detail="BACKGROUND" />
          <article className="education-row"><span className="education-mark"><CheckCircle2 size={16} /></span><div><h3 id="education-heading">{education.degree}</h3><strong>{education.school}</strong><span>{education.dates} · {education.location}</span></div><div className="skill-list">{education.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></article>
        </div>
      </section>

      <footer className="site-footer" id="contact">
        <div className="container footer-lead"><div><span className="section-kicker"><span className="section-kicker-mark">✳</span>07 / OPEN CHANNEL</span><h2>Let’s build<br /><em>the next thing.</em></h2></div><a className="footer-cta" href={`mailto:${profile.email}`}>Contact me <ArrowUpRight size={16} /></a></div>
        <div className="container footer-grid"><div><a href="#home" className="wordmark"><span className="wordmark-mark">✳</span><span>NT / PORTFOLIO</span></a><p>{profile.role}, building useful systems with thoughtful interfaces.</p></div><div className="footer-column"><span className="footer-label">Navigate</span><a href="#home">Home</a><a href="#projects">Projects</a><a href="#experience">Experience</a><a href="#writing">Blog</a></div><div className="footer-column"><span className="footer-label">Connect</span>{profile.socials.map((social) => <a href={social.href} key={social.label}>{social.label}{social.placeholder ? " / TODO" : ""}</a>)}</div></div>
        <div className="container footer-legal"><span>© 2026 {profile.name}</span><span>BUILT WITH INTENT / <span className="footer-spark">✳</span></span></div>
      </footer>

      {searchOpen ? <SearchPanel onClose={() => setSearchOpen(false)} /> : null}
    </main>
  );
}
