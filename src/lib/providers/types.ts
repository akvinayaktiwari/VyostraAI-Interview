export type VoiceGender = "female" | "male" | "neutral";

/** One selectable voice, as shown in the voice pickers. */
export interface VoiceOption {
  id: string;           // provider-specific voice id, e.g. "aura-2-thalia-en"
  label: string;        // display name, e.g. "Thalia"
  accent: string;       // e.g. "American", "Indian"
  gender: VoiceGender;
  language: string;     // BCP-47, e.g. "en-US"
  tier?: string;        // optional pricing/quality tier, e.g. "Aura-2"
}

/** Which provider + voice to speak with. Stored on the org (default) and per interview (override). */
export interface VoiceSelection {
  provider: string;
  voice: string;
}

export interface TTSProvider {
  name: string;         // registry id, e.g. "deepgram"
  label: string;        // display name, e.g. "Deepgram Aura"
  contentType: string;  // audio/mpeg, audio/wav, etc.
  defaultVoice: string; // used when no voice is selected
  /** True when the provider can be used (API key / binary present). */
  isConfigured(): boolean;
  listVoices(): Promise<VoiceOption[]>;
  /** Returns an audio buffer (mp3/wav). Uses defaultVoice when voice is omitted. */
  synthesize(text: string, voice?: string): Promise<Buffer>;
}

export interface STTConfig {
  provider: string;
  language: string;
  wsUrl: string;  // WebSocket URL for the provider
  headers: Record<string, string>;  // Auth headers
  params: Record<string, string>;  // Query params
}

/** GET /api/voices response item: one provider and, when configured, its voices. */
export interface VoiceCatalogProvider {
  id: string;
  label: string;
  configured: boolean;
  defaultVoice: string;
  voices: VoiceOption[];
}
