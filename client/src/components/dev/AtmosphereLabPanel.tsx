import { Check, Clipboard, RotateCcw, Settings2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ATMOSPHERE_LAB_PANEL_KEY,
  atmosphereCursorPresetMeta,
  atmosphereCursorPresets,
  atmosphereLabDefaults,
  atmospherePresetMeta,
  dispatchAtmosphereLabRebuild,
  dispatchAtmosphereLabUpdate,
  readAtmosphereLabSettings,
  writeAtmosphereLabSettings,
  type AtmosphereCursorPreset,
  type AtmosphereFluidSettings,
  type AtmospherePreset,
} from "@/config/atmosphereLab";
import styles from "./atmosphereLabPanel.module.css";

type NumericKey = {
  [K in keyof AtmosphereFluidSettings]: AtmosphereFluidSettings[K] extends number ? K : never;
}[keyof AtmosphereFluidSettings];

type CursorPresetSelection = AtmosphereCursorPreset | "custom";

const REBUILD_KEYS = new Set<keyof AtmosphereFluidSettings>([
  "simulationResolution",
  "densityResolution",
  "maxDpr",
]);

function removeQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("atmosphereLab");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (number) => String(number),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <label className={styles.rangeRow}>
      <span>{label}</span>
      <output>{format(value)}</output>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.currentTarget.value))} />
    </label>
  );
}

export default function AtmosphereLabPanel() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState<AtmosphereFluidSettings>(() => readAtmosphereLabSettings());
  const [cursorPreset, setCursorPreset] = useState<CursorPresetSelection>("custom");
  const [copied, setCopied] = useState(false);

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

  const publish = (next: AtmosphereFluidSettings, rebuild = false) => {
    setSettings(next);
    writeAtmosphereLabSettings(next);
    dispatchAtmosphereLabUpdate(next);
    if (rebuild) window.setTimeout(dispatchAtmosphereLabRebuild, 0);
  };

  const setNumber = (key: NumericKey, value: number) => {
    setCursorPreset("custom");
    publish({ ...settings, [key]: value }, REBUILD_KEYS.has(key));
  };

  const setPreset = (preset: AtmospherePreset) => publish({ ...settings, preset });
  const toggleFluid = () => publish({ ...settings, fluidEnabled: !settings.fluidEnabled });

  const applyCursorPreset = (preset: CursorPresetSelection) => {
    setCursorPreset(preset);
    if (preset === "custom") return;
    publish({ ...settings, ...atmosphereCursorPresets[preset] });
  };

  const reset = () => {
    setCursorPreset("ink");
    publish({ ...atmosphereLabDefaults }, true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ cursorPreset, ...settings }, null, 2));
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
      <button type="button" className={styles.launcher} onClick={open} aria-label="Open cursor tuning panel">
        <Settings2 size={15} />
        <span>Tune cursor</span>
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Atmosphere developer tuning">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}><Sparkles size={12} /> DEV ONLY</span>
          <strong>Cursor Tune</strong>
        </div>
        <button type="button" onClick={close} aria-label="Close Cursor Tune"><X size={16} /></button>
      </header>

      <div className={styles.body}>
        <p className={styles.hint}>Visible only during local development. The first control block mirrors Taha Bakri&apos;s demo workflow; advanced controls are underneath.</p>

        <section className={`${styles.group} ${styles.referenceGroup}`}>
          <div className={styles.groupTitle}>Fluid-cursor demo controls</div>

          <label className={styles.fullSelectRow}>
            <span>Preset</span>
            <select value={cursorPreset} onChange={(event) => applyCursorPreset(event.currentTarget.value as CursorPresetSelection)}>
              <option value="custom">Custom</option>
              {(Object.keys(atmosphereCursorPresetMeta) as AtmosphereCursorPreset[]).map((preset) => (
                <option key={preset} value={preset}>{atmosphereCursorPresetMeta[preset].label}</option>
              ))}
            </select>
          </label>

          <RangeControl label="Swirl" value={settings.curlStrength} min={0} max={2} step={0.01} onChange={(value) => setNumber("curlStrength", value)} format={(value) => value.toFixed(2)} />
          <RangeControl label="Pressure iters" value={settings.pressureIterations} min={1} max={40} step={1} onChange={(value) => setNumber("pressureIterations", value)} format={(value) => String(Math.round(value))} />
          <RangeControl label="Trail fade" value={settings.densityDissipation} min={0.95} max={0.995} step={0.001} onChange={(value) => setNumber("densityDissipation", value)} format={(value) => value.toFixed(3)} />
          <RangeControl label="Trail width" value={settings.splatRadius} min={0.00005} max={0.0012} step={0.00001} onChange={(value) => setNumber("splatRadius", value)} format={(value) => value.toFixed(5)} />

          <button type="button" className={styles.clearCanvas} onClick={dispatchAtmosphereLabRebuild}>
            <RotateCcw size={14} /> Clear canvas
          </button>
        </section>

        <section className={styles.group}>
          <div className={styles.groupTitle}>Background A/B</div>
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
          <button type="button" className={`${styles.fluidToggle} ${settings.fluidEnabled ? styles.active : ""}`} onClick={toggleFluid}>
            Fluid cursor {settings.fluidEnabled ? "ON" : "OFF"}
          </button>
        </section>

        <section className={styles.group}>
          <div className={styles.groupTitle}>Advanced physics</div>
          <RangeControl label="Force" value={settings.splatForce} min={1} max={18} step={0.1} onChange={(value) => setNumber("splatForce", value)} format={(value) => value.toFixed(1)} />
          <RangeControl label="Motion life" value={settings.velocityDissipation} min={0.85} max={1} step={0.001} onChange={(value) => setNumber("velocityDissipation", value)} format={(value) => value.toFixed(3)} />
          <RangeControl label="Pressure decay" value={settings.pressureDissipation} min={0} max={1} step={0.01} onChange={(value) => setNumber("pressureDissipation", value)} format={(value) => value.toFixed(2)} />
        </section>

        <section className={styles.group}>
          <div className={styles.groupTitle}>Ink display</div>
          <RangeControl label="Threshold" value={settings.threshold} min={0} max={0.35} step={0.005} onChange={(value) => setNumber("threshold", value)} format={(value) => value.toFixed(3)} />
          <RangeControl label="Softness" value={settings.softness} min={0.001} max={0.12} step={0.001} onChange={(value) => setNumber("softness", value)} format={(value) => value.toFixed(3)} />
          <RangeControl label="Opacity" value={settings.opacity} min={0} max={1} step={0.01} onChange={(value) => setNumber("opacity", value)} format={(value) => `${Math.round(value * 100)}%`} />
          <div className={styles.visualReadout}>
            <span>Ink</span>
            <code>{settings.inkColor}</code>
            <span>Blend</span>
            <code>{settings.blendMode}</code>
          </div>
        </section>

        <section className={styles.group}>
          <div className={styles.groupTitle}>Quality · rebuilds fluid</div>
          <div className={styles.selectGrid}>
            <label>Sim<select value={settings.simulationResolution} onChange={(event) => setNumber("simulationResolution", Number(event.currentTarget.value))}>{[128, 256, 384].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Dye<select value={settings.densityResolution} onChange={(event) => setNumber("densityResolution", Number(event.currentTarget.value))}>{[256, 512, 768].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>DPR<select value={settings.maxDpr} onChange={(event) => setNumber("maxDpr", Number(event.currentTarget.value))}>{[1, 1.25, 1.5].map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
        </section>

        <footer className={styles.footer}>
          <button type="button" onClick={dispatchAtmosphereLabRebuild}><RotateCcw size={14} /> Clear</button>
          <button type="button" onClick={reset}>Reset</button>
          <button type="button" onClick={copy}>{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copied" : "Copy"}</button>
        </footer>
      </div>
    </aside>
  );
}
