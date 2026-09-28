import type { TTSProvider, VoiceOption, VoiceGender } from "./types";

const VOICE_CACHE_MS = 6 * 60 * 60 * 1000;

// Used if the models endpoint is unreachable, so the pickers never come up empty.
const FALLBACK_VOICES: VoiceOption[] = [
  { id: "aura-2-thalia-en", label: "Thalia", accent: "American", gender: "female", language: "en-US", tier: "Aura-2" },
  { id: "aura-2-asteria-en", label: "Asteria", accent: "American", gender: "female", language: "en-US", tier: "Aura-2" },
  { id: "aura-2-pandora-en", label: "Pandora", accent: "British", gender: "female", language: "en-GB", tier: "Aura-2" },
  { id: "aura-2-orion-en", label: "Orion", accent: "American", gender: "male", language: "en-US", tier: "Aura-2" },
  { id: "aura-2-draco-en", label: "Draco", accent: "British", gender: "male", language: "en-GB", tier: "Aura-2" },
  { id: "aura-angus-en", label: "Angus", accent: "Irish", gender: "male", language: "en-IE", tier: "Aura-1" },
];

interface DeepgramModel {
  name?: string;
  canonical_name: string;
  languages?: string[];
  metadata?: { accent?: string; tags?: string[] };
}

function toGender(tags: string[] = []): VoiceGender {
  if (tags.some((t) => /^(feminine|female)$/i.test(t))) return "female";
  if (tags.some((t) => /^(masculine|male)$/i.test(t))) return "male";
  return "neutral";
}

function toVoiceOption(m: DeepgramModel): VoiceOption {
  const languages = m.languages || [];
  const name = m.name || m.canonical_name.split("-").slice(-2, -1)[0] || m.canonical_name;
  return {
    id: m.canonical_name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    accent: m.metadata?.accent || "Unknown",
    gender: toGender(m.metadata?.tags),
    language: languages.find((l) => l.includes("-")) || languages[0] || "en",
    tier: m.canonical_name.startsWith("aura-2-") ? "Aura-2" : "Aura-1",
  };
}

export class DeepgramTTS implements TTSProvider {
  name = "deepgram";
  label = "Deepgram Aura";
  contentType = "audio/mpeg";
  defaultVoice = process.env.DEEPGRAM_TTS_VOICE || "aura-2-thalia-en";

  private voiceCache: { voices: VoiceOption[]; fetchedAt: number } | null = null;

  isConfigured(): boolean {
    return Boolean(process.env.DEEPGRAM_API_KEY);
  }

  async listVoices(): Promise<VoiceOption[]> {
    if (this.voiceCache && Date.now() - this.voiceCache.fetchedAt < VOICE_CACHE_MS) {
      return this.voiceCache.voices;
    }
    try {
      const voices = await this.fetchVoices();
      this.voiceCache = { voices, fetchedAt: Date.now() };
      return voices;
    } catch (err) {
      console.error("[TTS:deepgram] Voice list fetch failed, using fallback:", (err as Error).message);
      return FALLBACK_VOICES;
    }
  }

  private async fetchVoices(): Promise<VoiceOption[]> {
    const res = await fetch("https://api.deepgram.com/v1/models", {
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`models endpoint returned ${res.status}`);
    const data = (await res.json()) as { tts?: DeepgramModel[] };
    // Interviews are English-only (locked safety rule), so only English voices are offered.
    const english = (data.tts || []).filter((m) => (m.languages || []).some((l) => l.startsWith("en")));
    if (english.length === 0) throw new Error("no English TTS models returned");
    return english.map(toVoiceOption);
  }

  async synthesize(text: string, voice?: string): Promise<Buffer> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) throw new Error("DEEPGRAM_API_KEY not configured");
    if (!text || !text.trim()) throw new Error("Empty text for TTS");

    // 15s hard timeout — without this, if Deepgram is slow/hung, the entire
    // streaming pipeline hangs forever and the client safety timeout fires at 30s.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const model = encodeURIComponent(voice || this.defaultVoice);

    try {
      const res = await fetch(`https://api.deepgram.com/v1/speak?model=${model}`, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Deepgram TTS error: ${res.status} ${errBody.substring(0, 200)}`);
      }
      return Buffer.from(await res.arrayBuffer());
    } finally {
      clearTimeout(timeout);
    }
  }
}
