import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { TracingBeam } from "@/components/ui/TracingBeam";
import { HoverFeatureMedia } from "@/components/ui/HoverFeatureMedia";
import { useFinePointer } from "@/hooks/useFinePointer";
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
      {mark.src ? (
        <img src={mark.src} alt={mark.alt ?? ""} loading="lazy" decoding="async" />
      ) : (
        <span>{mark.fallback}</span>
      )}
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
  active,
}: {
  entry: PreviewableExperience;
  previewSrc: string;
  active: boolean;
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
          {active ? <img src={previewSrc} alt="" decoding="async" /> : null}
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

function ExperienceCollectionRow({ item }: { item: ExperienceCollection }) {
  const finePointer = useFinePointer();
  const [open, setOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [certificateEntries, setCertificateEntries] = useState<ExperienceCollectionEntry[]>([]);
  const [certificateStatus, setCertificateStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    if (!open || item.id !== "hackathons-competitions" || item.items.length) return;

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
            label: "Hackathon / Competition",
            dates: "",
            location: "",
            description:
              `${title} — certificate-backed participation record. This entry is linked to the original credential stored in the portfolio archive.`,
            skills: ["Hackathon", "Competition"],
            href: file.url,
            previewMode: "image-and-text",
          };
        });

        setCertificateEntries(entries);
        setCertificateStatus("ready");

        if (entries.length) {
          setActiveEntryId((current) => current ?? entries[0].id);
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Hackathon certificate archive failure", error);
        setCertificateStatus("error");
      });

    return () => controller.abort();
  }, [item.id, item.items.length, open]);

  const collectionEntries = item.items.length ? item.items : certificateEntries;

  useEffect(() => {
    if (!collectionEntries.length) return;
    setActiveEntryId((current) =>
      current && collectionEntries.some((entry) => entry.id === current)
        ? current
        : collectionEntries[0].id,
    );
  }, [collectionEntries]);

  const toggleCollection = () => {
    setOpen((value) => !value);
  };

  return (
    <li
      className={`experience-row experience-row--collection${open ? " experience-row--collection-open" : ""}`}
    >
      <ExperienceMarkView mark={item.mark} />

      <button
        type="button"
        className="experience-collection-trigger experience-collection-trigger--row"
        aria-expanded={open}
        aria-controls={`${item.id}-panel`}
        onClick={toggleCollection}
      >
        <span className="experience-collection-trigger__copy">
          <strong>{item.org}</strong>
          <small>Certificates, event context, and participation records</small>
        </span>
        <span className="experience-collection-trigger__meta">
          <span>{open ? "Hide archive" : "Explore archive"}</span>
          <ChevronDown className="experience-collection-chevron" size={16} aria-hidden="true" />
        </span>
      </button>

      {open ? (
        <div className="experience-collection-panel" id={`${item.id}-panel`}>
          <div className="experience-collection-intro">
            <span>Hackathons & competitions</span>
            <strong>Selected participation archive</strong>
            <p>
              Certificate-backed events are presented as full experience cards. Select a card to
              keep it focused; the archive stays open until you explicitly close it.
            </p>
          </div>

          {collectionEntries.length ? (
            <ul className="experience-collection-list">
              {collectionEntries.map((entry) => {
                const active = activeEntryId === entry.id;
                const certificateHref = entry.href ?? "";

                return (
                  <li
                    key={entry.id}
                    className={`experience-collection-item${active ? " experience-collection-item--active" : ""}`}
                  >
                    <button
                      type="button"
                      className="experience-collection-item__focus"
                      aria-pressed={active}
                      onClick={() => setActiveEntryId(entry.id)}
                    >
                      <span className="sr-only">
                        {active ? "Selected" : "Select"} {entry.org}
                      </span>
                    </button>

                    <div className="experience-collection-item__content">
                      <div className="experience-collection-item__heading">
                        <div>
                          <span>{entry.label}</span>
                          <h3>{entry.org}</h3>
                        </div>
                        {active ? <small className="experience-collection-item__selected">Focused</small> : null}
                      </div>

                      {[entry.dates, entry.location].some(Boolean) ? (
                        <small className="experience-collection-item__meta">
                          {[entry.dates, entry.location].filter(Boolean).join(" · ")}
                        </small>
                      ) : null}

                      <p>{entry.description}</p>

                      {entry.skills.length ? (
                        <ul className="project-tech">
                          {entry.skills.map((skill) => (
                            <li key={skill}>{skill}</li>
                          ))}
                        </ul>
                      ) : null}

                      {certificateHref ? (
                        <a
                          className="experience-collection-certificate-link"
                          href={certificateHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View certificate
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>

                    {finePointer ? (
                      <div className="experience-collection-certificate">
                        {certificateHref ? (
                          <iframe
                            src={`${certificateHref}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            title={`${entry.org} certificate preview`}
                            loading="lazy"
                            tabIndex={-1}
                          />
                        ) : (
                          <div className="experience-collection-certificate__empty">
                            Certificate preview unavailable
                          </div>
                        )}
                      </div>
                    ) : null}
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
                    {active ? <HoverFeatureMedia media={featureMedia} active /> : null}
                  </aside>

                  <ExperienceHoverPreview entry={item} previewSrc={previewSrc} active={active} />
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
