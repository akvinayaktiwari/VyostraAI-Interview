import type { TTSProvider, STTConfig, VoiceSelection } from "./types";
import { DeepgramTTS } from "./tts-deepgram";
import { EdgeTTS } from "./tts-edge";
import { SarvamTTS } from "./tts-sarvam";
import { ElevenLabsTTS } from "./tts-elevenlabs";
import { CartesiaTTS } from "./tts-cartesia";

/**
 * TTS provider registry — the single place providers are wired in.
 * To add a provider: implement TTSProvider in ./tts-<name>.ts and add one line here.
 * The voice pickers (settings + new interview) pick it up automatically once
 * isConfigured() returns true.
 */
const REGISTRY: Record<string, () => TTSProvider> = {
  deepgram: () => new DeepgramTTS(),
  edge: () => new EdgeTTS(),
  sarvam: () => new SarvamTTS(),
  elevenlabs: () => new ElevenLabsTTS(),
  cartesia: () => new CartesiaTTS(),
};

const instances = new Map<string, TTSProvider>();

export interface ProviderSummary {
  id: string;
  label: string;
  configured: boolean;
  defaultVoice: string;
}

export type VoiceSource = "interview" | "organization" | "server";

export interface ResolvedVoice {
  provider: TTSProvider;
  voice: string;
  source: VoiceSource;
}

export function isKnownProvider(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(REGISTRY, id);
}

function serverDefaultProviderId(): string {
  const id = process.env.TTS_PROVIDER || "deepgram";
  return isKnownProvider(id) ? id : "deepgram";
}

/** Returns the provider for `id`, or the server default (TTS_PROVIDER) when omitted/unknown. */
export function getTTSProvider(id?: string): TTSProvider {
  const key = id && isKnownProvider(id) ? id : serverDefaultProviderId();
  let instance = instances.get(key);
  if (!instance) {
    instance = REGISTRY[key]();
    instances.set(key, instance);
  }
  return instance;
}

export function listTTSProviders(): ProviderSummary[] {
  return Object.keys(REGISTRY).map((id) => {
    const p = getTTSProvider(id);
    return { id, label: p.label, configured: p.isConfigured(), defaultVoice: p.defaultVoice };
  });
}

/** Returns an error message, or null when the selection is usable. */
export function validateVoiceSelection(sel: VoiceSelection): string | null {
  if (!isKnownProvider(sel.provider)) return `unknown voice provider "${sel.provider}"`;
  if (!sel.voice || sel.voice.length > 100) return "voice id must be 1-100 chars";
  if (!getTTSProvider(sel.provider).isConfigured()) return `voice provider "${sel.provider}" is not configured on the server`;
  return null;
}

/**
 * Picks the voice to speak with: the first usable selection in precedence order
 * (interview override, then organization default), else the server default.
 * An unusable selection (e.g. provider key removed) is skipped with a warning
 * rather than breaking the interview.
 */
export function resolveVoice(
  candidates: { selection: VoiceSelection | null | undefined; source: Exclude<VoiceSource, "server"> }[],
): ResolvedVoice {
  for (const { selection, source } of candidates) {
    if (!selection?.provider || !selection.voice) continue;
    const problem = validateVoiceSelection(selection);
    if (problem) {
      console.warn(`[TTS] Ignoring ${source} voice: ${problem}`);
      continue;
    }
    return { provider: getTTSProvider(selection.provider), voice: selection.voice, source };
  }
  const provider = getTTSProvider();
  return { provider, voice: provider.defaultVoice, source: "server" };
}

export function getSTTConfig(): STTConfig {
  const provider = process.env.STT_PROVIDER || "deepgram";
  const language = process.env.STT_LANGUAGE || "en-IN";

  if (provider === "soniox") {
    return {
      provider: "soniox",
      language,
      wsUrl: "wss://stt-rt.soniox.com/transcribe-websocket",
      headers: {},
      params: { model: "stt-rt-v4" },
    };
  }

  if (provider === "sarvam") {
    const apiKey = process.env.SARVAM_API_KEY || "";
    return {
      provider: "sarvam",
      language,
      wsUrl: `wss://api.sarvam.ai/speech-to-text-streaming/transcribe/ws?api_subscription_key=${apiKey}&language_code=${language}&model=saaras:v3`,
      headers: {},
      params: { language_code: language, model: "saaras:v3" },
    };
  }

  // Default: Deepgram
  const apiKey = process.env.DEEPGRAM_API_KEY || "";
  return {
    provider: "deepgram",
    language,
    wsUrl: `wss://api.deepgram.com/v1/listen?model=nova-3&language=${language}&punctuate=true&interim_results=true&endpointing=800&vad_events=true&diarize=true`,
    headers: { Authorization: `Token ${apiKey}` },
    params: {},
  };
}
