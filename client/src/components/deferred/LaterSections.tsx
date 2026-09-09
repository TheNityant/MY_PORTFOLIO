/**
 * Later sections recovered from `main` so they are not lost during the
 * structural-baseline checkpoint. Writing / footer remain deferred.
 * Live Projects and Experience now render from `components/home`.
 */
import { ChevronRight } from "lucide-react";
import { profile, writing } from "@/data/portfolio";

export function DeferredLaterSections() {
  return (
    <>
      <section className="content-section writing-section" id="writing" aria-labelledby="writing-heading">
        <div className="container">
          <h2 id="writing-heading">Writing</h2>
          <div className="writing-list">
            {writing.map((post, index) => (
              <a className="writing-row" href={post.href} key={post.id}>
                <span className="writing-index">0{index + 1}</span>
                <div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                </div>
                <span className="writing-date">{post.date}</span>
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
