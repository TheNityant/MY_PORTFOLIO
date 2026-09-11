import { Settings2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ATMOSPHERE_LAB_PANEL_KEY,
  atmospherePresetMeta,
  dispatchAtmosphereLabUpdate,
  readAtmosphereLabSettings,
  writeAtmosphereLabSettings,
  type AtmosphereFluidSettings,
  type AtmospherePreset,
} from "@/config/atmosphereLab";
import styles from "./atmosphereLabPanel.module.css";

function removeQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("atmosphereLab");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export default function AtmosphereLabPanel() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState<AtmosphereFluidSettings>(() => readAtmosphereLabSettings());

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("atmosphereLab") === "1";
    const remembered = window.localStorage.getItem(ATMOSPHERE_LAB_PANEL_KEY) === "1";

    if (requested || remembered) {
      setVisible(true);
      window.localStorage.setItem(ATMOSPHERE_LAB_PANEL_KEY, "1");
      dispatchAtmosphereLabUpdate(settings);
    }

    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.key.toLowerCase() !== "a") return;
      event.preventDefault();
      setVisible((current) => {
        const next = !current;
        if (next) {
          window.localStorage.setItem(ATMOSPHERE_LAB_PANEL_KEY, "1");
          dispatchAtmosphereLabUpdate(settings);
        } else {
          window.localStorage.removeItem(ATMOSPHERE_LAB_PANEL_KEY);
          removeQuery();
        }
        return next;
      });
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const setPreset = (preset: AtmospherePreset) => {
    const next = { ...settings, preset };
    setSettings(next);
    writeAtmosphereLabSettings(next);
    dispatchAtmosphereLabUpdate(next);
  };

  const open = () => {
    setVisible(true);
    window.localStorage.setItem(ATMOSPHERE_LAB_PANEL_KEY, "1");
    dispatchAtmosphereLabUpdate(settings);
  };

  const close = () => {
    setVisible(false);
    window.localStorage.removeItem(ATMOSPHERE_LAB_PANEL_KEY);
    removeQuery();
  };

  if (!import.meta.env.DEV) return null;

  if (!visible) {
    return (
      <button type="button" className={styles.launcher} onClick={open} aria-label="Compare portfolio backgrounds">
        <Settings2 size={15} />
        <span>Compare backgrounds</span>
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Background comparison developer panel">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}><Sparkles size={12} /> DEV ONLY</span>
          <strong>Background A/B</strong>
        </div>
        <button type="button" onClick={close} aria-label="Close background comparison"><X size={16} /></button>
      </header>

      <div className={styles.body}>
        <p className={styles.hint}>
          Switch only the full-site ShaderGradient. The global fluid cursor has been removed; fluid now lives only in the hero identity reveal.
        </p>

        <section className={styles.group}>
          <div className={styles.groupTitle}>Dark atmosphere</div>
          <div className={styles.presetGrid}>
            {(Object.keys(atmospherePresetMeta) as AtmospherePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                className={settings.preset === preset ? styles.active : ""}
                onClick={() => setPreset(preset)}
                title={atmospherePresetMeta[preset].description}
              >
                {atmospherePresetMeta[preset].label}
              </button>
            ))}
          </div>
        </section>

        <p className={styles.hint}>
          Tip: compare the hero first, then scroll through Tools, Projects and Writing before choosing. Ctrl/⌘ + Shift + A also toggles this panel.
        </p>
      </div>
    </aside>
  );
}
