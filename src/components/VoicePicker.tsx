"use client";

import { useEffect, useMemo, useState } from "react";
import type { VoiceCatalogProvider, VoiceOption, VoiceSelection } from "@/lib/providers/types";

interface VoiceCatalog {
  providers: VoiceCatalogProvider[];
  serverDefault: VoiceSelection;
}

interface VoicePickerProps {
  /** null = inherit (organization default / server default). */
  value: VoiceSelection | null;
  onChange: (value: VoiceSelection | null) => void;
  /** Label for the inherit option, e.g. "Organization default". */
  inheritLabel: string;
  selectClassName?: string;
}

let catalogPromise: Promise<VoiceCatalog> | null = null;

/** Shared across pickers on a page; retried on the next mount if it failed. */
function loadCatalog(): Promise<VoiceCatalog> {
  if (!catalogPromise) {
    catalogPromise = fetch("/api/voices")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .catch((err: Error) => { catalogPromise = null; throw err; });
  }
  return catalogPromise;
}

function voiceLabel(v: VoiceOption): string {
  const tier = v.tier ? ` · ${v.tier}` : "";
  return `${v.label} (${v.gender})${tier}`;
}

/** Groups voices by accent, preserving the provider's order within each group. */
function groupByAccent(voices: VoiceOption[]): [string, VoiceOption[]][] {
  const groups = new Map<string, VoiceOption[]>();
  for (const v of voices) groups.set(v.accent, [...(groups.get(v.accent) || []), v]);
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

async function playPreview(selection: VoiceSelection): Promise<void> {
  const res = await fetch("/api/voices/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
  });
  const data = (await res.json()) as { audio?: string; contentType?: string; error?: string };
  if (!res.ok || !data.audio) throw new Error(data.error || "Preview failed");
  const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: data.contentType || "audio/mpeg" }));
  const audio = new Audio(url);
  await new Promise<void>((resolve, reject) => {
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Audio playback failed")); };
    audio.play().catch(reject);
  });
}

export function VoicePicker({ value, onChange, inheritLabel, selectClassName = "input" }: VoicePickerProps) {
  const [catalog, setCatalog] = useState<VoiceCatalog | null>(null);
  const [loadError, setLoadError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((err: Error) => setLoadError(err.message));
  }, []);

  const provider = useMemo(
    () => catalog?.providers.find((p) => p.id === value?.provider) ?? null,
    [catalog, value?.provider],
  );

  if (loadError) return <p className="text-xs text-red-600">Could not load voices: {loadError}</p>;
  if (!catalog) return <p className="text-xs text-gray-400">Loading voices…</p>;

  const selectProvider = (id: string) => {
    if (!id) return onChange(null);
    const next = catalog.providers.find((p) => p.id === id);
    if (!next) return;
    const hasDefault = next.voices.some((v) => v.id === next.defaultVoice);
    onChange({ provider: next.id, voice: hasDefault ? next.defaultVoice : next.voices[0]?.id || next.defaultVoice });
  };

  const preview = async () => {
    setPreviewError("");
    setPreviewing(true);
    try {
      await playPreview(value ?? catalog.serverDefault);
    } catch (err) {
      setPreviewError((err as Error).message);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <select value={value?.provider || ""} onChange={(e) => selectProvider(e.target.value)} className={selectClassName} aria-label="Voice provider">
          <option value="">{inheritLabel}</option>
          {catalog.providers.map((p) => (
            <option key={p.id} value={p.id} disabled={!p.configured}>
              {p.label}{p.configured ? "" : " (not configured)"}
            </option>
          ))}
        </select>
        {provider && value && (
          <select value={value.voice} onChange={(e) => onChange({ provider: provider.id, voice: e.target.value })} className={selectClassName} aria-label="Voice">
            {groupByAccent(provider.voices).map(([accent, voices]) => (
              <optgroup key={accent} label={accent}>
                {voices.map((v) => <option key={v.id} value={v.id}>{voiceLabel(v)}</option>)}
              </optgroup>
            ))}
          </select>
        )}
        <button type="button" onClick={preview} disabled={previewing}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-50">
          {previewing ? "Playing…" : "▶ Preview"}
        </button>
      </div>
      {previewError && <p className="text-xs text-red-600">{previewError}</p>}
    </div>
  );
}
