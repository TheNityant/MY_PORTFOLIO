/**
 * Later sections recovered from `main` so they are not lost during the
 * structural-baseline checkpoint. Writing / footer remain deferred.
 * Live Projects and Experience now render from `components/home`.
 */
import { ChevronRight } from "lucide-react";
import { profile, writingEntries } from "@/data/portfolio";

export function DeferredLaterSections() {
  return (
    <>
      <section className="content-section writing-section" id="writing" aria-labelledby="writing-heading">
        <div className="container">
          <h2 id="writing-heading">Writing</h2>
          <div className="writing-list">
            {writingEntries.map((post, index) => (
              <a className="writing-row" href={`/writing/${post.slug}`} key={post.slug}>
                <span className="writing-index">0{index + 1}</span>
                <div>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                </div>
                <span className="writing-date">{post.status}</span>
                <ChevronRight size={17} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer" id="contact">
        <a href={`mailto:${profile.email}`}>Contact me</a>
        <span>© 2026 {profile.name}</span>
      </footer>
    </>
  );
}
