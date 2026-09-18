import { useEffect, useState, type FocusEvent } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { TracingBeam } from "@/components/ui/TracingBeam";
import { HoverFeatureMedia } from "@/components/ui/HoverFeatureMedia";
import {
  education,
  experience,
  experienceCopy,
  type ExperienceCollection,
  type ExperienceCollectionEntry,
  type ExperienceEntry,
  type ExperienceMark,
  type ExperiencePreviewMode,
} from "@/data/portfolio";
import {
  experienceFeatureMedia,
  experiencePreviewMedia,
  fallbackExperienceFeatureMedia,
  fallbackExperiencePreview,
} from "@/data/media";

function ExperienceMarkView({ mark }: { mark: ExperienceMark }) {
  return (
    <div className="experience-mark" aria-hidden={!mark.alt}>
      {mark.src ? <img src={mark.src} alt={mark.alt ?? ""} /> : <span>{mark.fallback}</span>}
    </div>
  );
}

type PreviewableExperience = ExperienceEntry | ExperienceCollectionEntry;

type HackathonCertificateFile = {
  name: string;
  objectPath: string;
  url: string;
};

type HackathonCertificateResponse = {
  ok: boolean;
  status: "ready" | "unconfigured" | "error";
  count?: number;
  files: HackathonCertificateFile[];
  diagnostic?: string;
};

function certificateTitle(filename: string) {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function certificateId(filename: string) {
  return certificateTitle(filename)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function ExperienceHoverPreview({
  entry,
  previewSrc,
}: {
  entry: PreviewableExperience;
  previewSrc: string;
}) {
  const mode: ExperiencePreviewMode = entry.previewMode ?? "image-and-text";
  const showImage = mode !== "text-only";
  const showText = mode !== "image-only";

  return (
    <aside
      className={`experience-hover-preview experience-hover-preview--${mode}`}
      aria-hidden="true"
    >
      {showImage ? (
        <div className="experience-hover-preview__media">
          <img src={previewSrc} alt="" />
        </div>
      ) : null}
      {showText ? (
        <div className="experience-hover-preview__copy">
          <span>{entry.label}</span>
          <strong>{entry.org}</strong>
          <p>{entry.description}</p>
        </div>
      ) : null}
    </aside>
  );
}

function CollectionEntryExtension({
  entry,
  active,
}: {
  entry: ExperienceCollectionEntry;
  active: boolean;
}) {
  const mode: ExperiencePreviewMode = entry.previewMode ?? "image-and-text";
  const featureMedia = experienceFeatureMedia[entry.id] ?? fallbackExperienceFeatureMedia;
  const previewSrc = experiencePreviewMedia[entry.id] ?? fallbackExperiencePreview;

  if (!active) return null;

  return (
    <aside className="experience-collection-inspector" aria-hidden="true">
      <div className="experience-collection-inspector__feature">
        <HoverFeatureMedia media={featureMedia} active={active} />
      </div>
      <div
        className={`experience-collection-inspector__detail experience-collection-inspector__detail--${mode}`}
      >
        {mode !== "text-only" ? (
          <div className="experience-collection-inspector__thumb">
            <img src={previewSrc} alt="" />
          </div>
        ) : null}
        {mode !== "image-only" ? (
          <div className="experience-collection-inspector__copy">
            <span>{entry.label}</span>
            <strong>{entry.org}</strong>
            <small>{[entry.dates, entry.location].filter(Boolean).join(" · ")}</small>
            <p>{entry.description}</p>
            {entry.skills.length ? (
              <ul className="project-tech">
                {entry.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function ExperienceCollectionRow({ item }: { item: ExperienceCollection }) {
  const [open, setOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [certificateEntries, setCertificateEntries] = useState<ExperienceCollectionEntry[]>([]);
  const [certificateStatus, setCertificateStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    if (item.id !== "hackathons-competitions" || item.items.length) return;

    const controller = new AbortController();
    setCertificateStatus("loading");

    void fetch("/api/hackathon-certificates", {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Certificate archive failed: ${response.status}`);
        return (await response.json()) as HackathonCertificateResponse;
      })
      .then((payload) => {
        if (!payload.ok || payload.status !== "ready") {
          throw new Error(payload.diagnostic || "Certificate archive is unavailable");
        }

        const entries = payload.files.map<ExperienceCollectionEntry>((file) => {
          const title = certificateTitle(file.name);
          return {
            id: certificateId(file.name) || file.name,
            org: title,
            label: "Certificate",
            dates: "",
            location: "",
            description: `Credential archived for ${title}. Open the original certificate PDF for the verified record.`,
            skills: ["Hackathon", "Competition"],
            href: file.url,
            previewMode: "text-only",
          };
        });

        setCertificateEntries(entries);
        setCertificateStatus("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Hackathon certificate archive failure", error);
        setCertificateStatus("error");
      });

    return () => controller.abort();
  }, [item.id, item.items.length]);

  const collectionEntries = item.items.length ? item.items : certificateEntries;
  const archiveStatus = collectionEntries.length
    ? `${collectionEntries.length} ${collectionEntries.length === 1 ? "entry" : "entries"}`
    : certificateStatus === "loading"
      ? "Loading certificates…"
      : certificateStatus === "error"
        ? "Certificates unavailable"
        : "No archived entries yet";

  const closeCollection = () => {
    setOpen(false);
    setActiveEntryId(null);
  };

  const onBlur = (event: FocusEvent<HTMLLIElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    closeCollection();
  };

  return (
    <li
      className="experience-row experience-row--preview experience-row--collection"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={closeCollection}
      onFocus={() => setOpen(true)}
      onBlur={onBlur}
    >
      <ExperienceMarkView mark={item.mark} />

      <button
        type="button"
        className="experience-collection-trigger experience-collection-trigger--row"
        aria-expanded={open}
        aria-controls={`${item.id}-panel`}
        onClick={() => {
          setOpen((value) => !value);
          setActiveEntryId(null);
        }}
      >
        <span className="experience-collection-trigger__copy">
          <strong>{item.org}</strong>
          <small>{archiveStatus}</small>
        </span>
        <span className="experience-collection-trigger__meta">
          <span>{item.label}</span>
          <ChevronDown className="experience-collection-chevron" size={16} aria-hidden="true" />
        </span>
      </button>

      {open ? (
        <div className="experience-collection-panel" id={`${item.id}-panel`}>
          {item.items.length ? (
            <ul className="experience-collection-list">
              {item.items.map((entry) => {
                const active = activeEntryId === entry.id;

                return (
                  <li
                    key={entry.id}
                    className="experience-collection-item"
                    tabIndex={0}
                    onMouseEnter={() => setActiveEntryId(entry.id)}
                    onMouseLeave={() => setActiveEntryId(null)}
                    onFocus={() => setActiveEntryId(entry.id)}
                  >
                    <div className="experience-collection-item__heading">
                      {entry.href ? (
                        <a href={entry.href} target="_blank" rel="noopener noreferrer">
                          <strong>{entry.org}</strong>
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </a>
                      ) : (
                        <strong>{entry.org}</strong>
                      )}
                      <span>{entry.label}</span>
                    </div>
                    <small>{[entry.dates, entry.location].filter(Boolean).join(" · ")}</small>
                    <p>{entry.description}</p>

                    <CollectionEntryExtension entry={entry} active={active} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="experience-collection-empty" role="status">
              <strong>
                {certificateStatus === "loading"
                  ? "Loading certificate archive…"
                  : certificateStatus === "error"
                    ? "Certificate archive unavailable."
                    : "No certificates found."}
              </strong>
              <span>
                {certificateStatus === "error"
                  ? "The portfolio could not read the Supabase Hackathon Certificates folder."
                  : "PDF certificates placed in the configured Supabase folder will appear here automatically."}
              </span>
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function Experience() {
  const [activePreview, setActivePreview] = useState<string | null>(null);

  return (
    <section className="experience-section" id="experience" aria-labelledby="experience-heading">
      <header className="section-heading">
        <h2 id="experience-heading">{experienceCopy.heading}</h2>
        <p>{experienceCopy.intro}</p>
      </header>

      <div className="experience-track">
        <TracingBeam>
          <ol className="experience-list">
            {experience.map((item) => {
              if (item.kind === "collection") {
                return <ExperienceCollectionRow key={item.id} item={item} />;
              }

              const previewSrc = experiencePreviewMedia[item.id] ?? fallbackExperiencePreview;
              const featureMedia = experienceFeatureMedia[item.id] ?? fallbackExperienceFeatureMedia;
              const active = activePreview === item.id;

              return (
                <li
                  className="experience-row experience-row--preview"
                  key={item.id}
                  tabIndex={0}
                  onMouseEnter={() => setActivePreview(item.id)}
                  onMouseLeave={() => setActivePreview(null)}
                  onFocus={() => setActivePreview(item.id)}
                  onBlur={(event) => {
                    const nextTarget = event.relatedTarget;
                    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
                    setActivePreview(null);
                  }}
                >
                  <ExperienceMarkView mark={item.mark} />
                  <div className="experience-meta">
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        <h3>{item.org}</h3>
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    ) : (
                      <h3>{item.org}</h3>
                    )}
                    <strong>{item.label}</strong>
                    <span>{[item.dates, item.location].filter(Boolean).join(" · ")}</span>
                  </div>
                  <div className="experience-copy">
                    <p>{item.description}</p>
                    {item.skills.length ? (
                      <ul className="project-tech">
                        {item.skills.map((skill) => (
                          <li key={skill}>{skill}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <aside className="experience-feature-preview" aria-hidden="true">
                    <HoverFeatureMedia media={featureMedia} active={active} />
                  </aside>

                  <ExperienceHoverPreview entry={item} previewSrc={previewSrc} />
                </li>
              );
            })}
          </ol>
        </TracingBeam>
      </div>

      <article className="education-card" aria-labelledby="education-heading">
        <div className="education-card-head">
          <ExperienceMarkView mark={education.mark} />
          <div>
            <p className="education-kicker">Education</p>
            <h3 id="education-heading">{education.degree}</h3>
            <strong>{education.school}</strong>
            <span>
              {education.dates} · {education.location}
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}
