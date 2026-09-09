import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchItems } from "@/data/portfolio";

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchItems;
    return searchItems.filter((item) => `${item.label} ${item.type}`.toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search portfolio">
      <button className="search-backdrop" type="button" aria-label="Close search" onClick={onClose} />
      <div className="search-panel">
        <div className="search-panel-topline">
          <span>Search</span>
          <button className="icon-button" type="button" aria-label="Close search" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Jump to a section…"
          />
          <kbd>ESC</kbd>
        </label>
        <div className="search-results">
          {results.length ? (
            results.map((item) => (
              <a className="search-result" href={item.href} key={item.label} onClick={onClose}>
                <span>{item.label}</span>
                <small>{item.type}</small>
              </a>
            ))
          ) : (
            <p className="search-empty">No matching section.</p>
          )}
        </div>
      </div>
    </div>
  );
}
