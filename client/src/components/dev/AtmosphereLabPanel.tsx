import { Copy, RotateCcw, Settings2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ATMOSPHERE_LAB_PANEL_KEY,
  atmosphereLabDefaults,
  atmospherePresetMeta,
  dispatchAtmosphereLabUpdate,
  getAtmospherePresetTuning,
  readAtmosphereLabSettings,
  writeAtmosphereLabSettings,
  type AtmosphereLabSettings,
  type AtmospherePreset,
  type AtmospherePresetTuning,
} from "@/config/atmosphereLab";
import styles from "./atmosphereLabPanel.module.css";

function removeQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("atmosphereLab");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function cloneDefaults(): AtmosphereLabSettings {
  return {
    preset: atmosphereLabDefaults.preset,
    nighty: { ...atmosphereLabDefaults.nighty },
    interstella: { ...atmosphereLabDefaults.interstella },
  };
}

export default function AtmosphereLabPanel() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState<AtmosphereLabSettings>(() => readAtmosphereLabSettings());
  const [copied, setCopied] = useState(false);
  const tuning = getAtmospherePresetTuning(settings);

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

  const persist = (next: AtmosphereLabSettings) => {
    setSettings(next);
    writeAtmosphereLabSettings(next);
    dispatchAtmosphereLabUpdate(next);
  };

  const setPreset = (preset: AtmospherePreset) => {
    persist({ ...settings, preset });
  };

  const setTuning = (patch: Partial<AtmospherePresetTuning>) => {
    const preset = settings.preset;
    const current = getAtmospherePresetTuning(settings, preset);
    persist({
      ...settings,
      [preset]: { ...current, ...patch },
    });
  };

  const resetPreset = () => {
    const preset = settings.preset;
    persist({
      ...settings,
      [preset]: { ...getAtmospherePresetTuning(cloneDefaults(), preset) },
    });
  };

  const copyValues = async () => {
    const value = `${atmospherePresetMeta[settings.preset].label}: uSpeed=${tuning.speed.toFixed(2)}, brightness=${tuning.brightness.toFixed(2)}`;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
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
      <button type="button" className={styles.launcher} onClick={open} aria-label="Open background lab">
        <Settings2 size={15} />
        <span>Background lab</span>
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Background developer lab">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}><Sparkles size={12} /> DEV ONLY</span>
          <strong>Background Lab</strong>
        </div>
        <button type="button" onClick={close} aria-label="Close background lab"><X size={16} /></button>
      </header>

      <div className={styles.body}>
        <p className={styles.hint}>
          Compare Nighty Nighty and Interstella, then tune motion speed and brightness live. Each preset remembers its own values.
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

        <section className={styles.group}>
          <div className={styles.groupTitle}>{atmospherePresetMeta[settings.preset].label} tuning</div>

          <label className={styles.rangeRow}>
            <span>Motion speed</span>
            <output>{tuning.speed.toFixed(2)}</output>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={tuning.speed}
              onChange={(event) => setTuning({ speed: Number(event.target.value) })}
            />
          </label>

          <label className={styles.rangeRow}>
            <span>Brightness</span>
            <output>{tuning.brightness.toFixed(2)}</output>
            <input
              type="range"
              min="0.2"
              max="2"
              step="0.05"
              value={tuning.brightness}
              onChange={(event) => setTuning({ brightness: Number(event.target.value) })}
            />
          </label>
        </section>

        <div className={styles.visualReadout} aria-label="Current ShaderGradient values">
          <span>uSpeed</span><code>{tuning.speed.toFixed(2)}</code>
          <span>brightness</span><code>{tuning.brightness.toFixed(2)}</code>
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={resetPreset}><RotateCcw size={13} /> Reset preset</button>
          <button type="button" onClick={copyValues}><Copy size={13} /> {copied ? "Copied" : "Copy values"}</button>
          <button type="button" onClick={close}>Done</button>
        </div>

        <p className={styles.hint}>
          Ctrl/⌘ + Shift + A toggles this panel. Production still uses the committed preset values; this lab is for choosing them safely.
        </p>
      </div>
    </aside>
  );
}
