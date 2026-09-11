import { Check, ChevronDown, ChevronUp, Clipboard, RotateCcw, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  dispatchFluidRevealLabRebuild,
  dispatchFluidRevealLabUpdate,
  FLUID_LAB_PANEL_KEY,
  fluidRevealLabDefaults,
  fluidRevealLabPresets,
  readFluidRevealLabSettings,
  type FluidRevealPresetId,
  type FluidRevealTuning,
  writeFluidRevealLabSettings,
} from "@/config/fluidRevealLab";
import styles from "./fluidLabPanel.module.css";

type NumericKey = {
  [K in keyof FluidRevealTuning]: FluidRevealTuning[K] extends number ? K : never;
}[keyof FluidRevealTuning];

type ToggleKey = {
  [K in keyof FluidRevealTuning]: FluidRevealTuning[K] extends boolean ? K : never;
}[keyof FluidRevealTuning];

const REBUILD_KEYS = new Set<keyof FluidRevealTuning>([
  "simulationResolution",
  "densityResolution",
  "maxDpr",
]);

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
      <span className={styles.controlLabel}>{label}</span>
      <output className={styles.value}>{format(value)}</output>
      <input
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function ToggleControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={styles.toggleRow}>
      <span className={styles.controlLabel}>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className={styles.toggleTrack} aria-hidden="true">
        <span className={styles.toggleThumb} />
      </span>
    </label>
  );
}

function removeFluidLabQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("fluidLab");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export default function FluidLabPanel() {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settings, setSettings] = useState<FluidRevealTuning>(() => readFluidRevealLabSettings());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const params = new URLSearchParams(window.location.search);
    const requested = params.get("fluidLab") === "1";
    const remembered = window.localStorage.getItem(FLUID_LAB_PANEL_KEY) === "1";
    if (requested || remembered) {
      setVisible(true);
      window.localStorage.setItem(FLUID_LAB_PANEL_KEY, "1");
      dispatchFluidRevealLabUpdate(settings);
    }

    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.key.toLowerCase() !== "f") return;
      event.preventDefault();
      setVisible((current) => {
        const next = !current;
        if (next) {
          window.localStorage.setItem(FLUID_LAB_PANEL_KEY, "1");
        } else {
          window.localStorage.removeItem(FLUID_LAB_PANEL_KEY);
          removeFluidLabQuery();
        }
        return next;
      });
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const presetId = useMemo(() => {
    const serialized = JSON.stringify(settings);
    const match = (Object.entries(fluidRevealLabPresets) as [FluidRevealPresetId, (typeof fluidRevealLabPresets)[FluidRevealPresetId]][])
      .find(([, preset]) => JSON.stringify(preset.settings) === serialized);
    return match?.[0] ?? null;
  }, [settings]);

  const publish = (next: FluidRevealTuning, rebuild = false) => {
    setSettings(next);
    writeFluidRevealLabSettings(next);
    dispatchFluidRevealLabUpdate(next);
    if (rebuild) window.setTimeout(dispatchFluidRevealLabRebuild, 0);
  };

  const setNumber = (key: NumericKey, value: number) => {
    publish({ ...settings, [key]: value }, REBUILD_KEYS.has(key));
  };

  const setToggle = (key: ToggleKey, value: boolean) => {
    publish({ ...settings, [key]: value });
  };

  const applyPreset = (id: FluidRevealPresetId) => {
    const next = { ...fluidRevealLabPresets[id].settings };
    publish(next, true);
  };

  const reset = () => publish({ ...fluidRevealLabDefaults }, true);

  const copySettings = async () => {
    const exportValue = {
      preset: presetId ?? "custom",
      ...settings,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportValue, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const close = () => {
    setVisible(false);
    window.localStorage.removeItem(FLUID_LAB_PANEL_KEY);
    removeFluidLabQuery();
  };

  if (!import.meta.env.DEV || !visible) return null;

  return (
    <aside className={`${styles.panel} ${collapsed ? styles.panelCollapsed : ""}`} aria-label="Fluid reveal developer tuning">
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}><Zap size={12} /> DEV ONLY</div>
          <strong>Fluid Lab</strong>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand Fluid Lab" : "Collapse Fluid Lab"}>
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button type="button" onClick={close} aria-label="Close Fluid Lab"><X size={16} /></button>
        </div>
      </div>

      {!collapsed ? (
        <div className={styles.body}>
          <p className={styles.hint}>Live-tunes the real hero fluid simulation. Ctrl/⌘ + Shift + F toggles this panel.</p>

          <section className={styles.group}>
            <div className={styles.groupTitle}>Presets</div>
            <div className={styles.presets}>
              {(Object.entries(fluidRevealLabPresets) as [FluidRevealPresetId, (typeof fluidRevealLabPresets)[FluidRevealPresetId]][]).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.presetButton} ${presetId === id ? styles.presetButtonActive : ""}`}
                  onClick={() => applyPreset(id)}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.group}>
            <div className={styles.groupTitle}>Splat</div>
            <RangeControl label="Trail width" value={settings.splatRadius} min={0.0005} max={0.03} step={0.0001} onChange={(value) => setNumber("splatRadius", value)} format={(value) => value.toFixed(4)} />
            <RangeControl label="Force" value={settings.splatForce} min={1} max={18} step={0.1} onChange={(value) => setNumber("splatForce", value)} format={(value) => value.toFixed(1)} />
          </section>

          <section className={styles.group}>
            <div className={styles.groupTitle}>Fluid sim</div>
            <RangeControl label="Curl" value={settings.curlStrength} min={0} max={2} step={0.01} onChange={(value) => setNumber("curlStrength", value)} format={(value) => value.toFixed(2)} />
            <RangeControl label="Pressure" value={settings.pressureIterations} min={1} max={30} step={1} onChange={(value) => setNumber("pressureIterations", value)} format={(value) => String(Math.round(value))} />
            <RangeControl label="Motion life" value={settings.velocityDissipation} min={0.85} max={1} step={0.001} onChange={(value) => setNumber("velocityDissipation", value)} format={(value) => value.toFixed(3)} />
            <RangeControl label="Trail life" value={settings.densityDissipation} min={0.85} max={1} step={0.001} onChange={(value) => setNumber("densityDissipation", value)} format={(value) => value.toFixed(3)} />
            <RangeControl label="Pressure decay" value={settings.pressureDissipation} min={0} max={1} step={0.01} onChange={(value) => setNumber("pressureDissipation", value)} format={(value) => value.toFixed(2)} />
            <div className={styles.toggles}>
              <ToggleControl label="Vorticity" checked={settings.enableVorticity} onChange={(value) => setToggle("enableVorticity", value)} />
              <ToggleControl label="BFECC" checked={settings.useBFECC} onChange={(value) => setToggle("useBFECC", value)} />
              <ToggleControl label="Reflect walls" checked={settings.reflectWalls} onChange={(value) => setToggle("reflectWalls", value)} />
            </div>
          </section>

          <section className={styles.group}>
            <div className={styles.groupTitle}>Reveal composite</div>
            <RangeControl label="Threshold" value={settings.revealThreshold} min={0} max={0.5} step={0.005} onChange={(value) => setNumber("revealThreshold", value)} format={(value) => value.toFixed(3)} />
            <RangeControl label="Softness" value={settings.revealSoftness} min={0.005} max={0.3} step={0.005} onChange={(value) => setNumber("revealSoftness", value)} format={(value) => value.toFixed(3)} />
            <RangeControl label="Edge distortion" value={settings.boundaryDistortion} min={0} max={0.0004} step={0.00001} onChange={(value) => setNumber("boundaryDistortion", value)} format={(value) => value.toFixed(5)} />
            <RangeControl label="Rim strength" value={settings.rimMultiplier} min={0} max={2.5} step={0.05} onChange={(value) => setNumber("rimMultiplier", value)} format={(value) => `${value.toFixed(2)}×`} />
          </section>

          <section className={styles.group}>
            <div className={styles.groupTitle}>Quality · rebuilds canvas</div>
            <label className={styles.selectRow}>
              <span>Simulation</span>
              <select value={settings.simulationResolution} onChange={(event) => setNumber("simulationResolution", Number(event.currentTarget.value))}>
                {[128, 256, 384, 512].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className={styles.selectRow}>
              <span>Density</span>
              <select value={settings.densityResolution} onChange={(event) => setNumber("densityResolution", Number(event.currentTarget.value))}>
                {[256, 512, 768, 1024].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className={styles.selectRow}>
              <span>Max DPR</span>
              <select value={settings.maxDpr} onChange={(event) => setNumber("maxDpr", Number(event.currentTarget.value))}>
                {[1, 1.25, 1.5, 2].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </section>

          <div className={styles.footerActions}>
            <button type="button" onClick={dispatchFluidRevealLabRebuild}><RotateCcw size={14} /> Clear fluid</button>
            <button type="button" onClick={reset}>Reset</button>
            <button type="button" onClick={copySettings}>{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copied" : "Copy settings"}</button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
