import type { TTSProvider, VoiceOption } from "./types";
import { promisify } from "util";
import { execFile } from "child_process";
import { readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join, delimiter } from "path";
import { randomUUID } from "crypto";
import os from "os";

const execFileAsync = promisify(execFile);

const VOICES: VoiceOption[] = [
  { id: "en-IN-NeerjaNeural", label: "Neerja", accent: "Indian", gender: "female", language: "en-IN" },
  { id: "en-IN-PrabhatNeural", label: "Prabhat", accent: "Indian", gender: "male", language: "en-IN" },
  { id: "en-US-JennyNeural", label: "Jenny", accent: "American", gender: "female", language: "en-US" },
  { id: "en-US-GuyNeural", label: "Guy", accent: "American", gender: "male", language: "en-US" },
  { id: "en-GB-SoniaNeural", label: "Sonia", accent: "British", gender: "female", language: "en-GB" },
  { id: "en-GB-RyanNeural", label: "Ryan", accent: "British", gender: "male", language: "en-GB" },
  { id: "en-AU-NatashaNeural", label: "Natasha", accent: "Australian", gender: "female", language: "en-AU" },
];

function onPath(binary: string): boolean {
  return (process.env.PATH || "").split(delimiter).some((dir) => dir && existsSync(join(dir, binary)));
}

export class EdgeTTS implements TTSProvider {
  name = "edge";
  label = "Microsoft Edge (free, unofficial)";
  contentType = "audio/mpeg";
  defaultVoice = process.env.EDGE_TTS_VOICE || "en-IN-NeerjaNeural";

  // Opt-in: relies on an unofficial Microsoft endpoint, so it is only offered when
  // explicitly enabled (or selected as the server-wide TTS_PROVIDER).
  isConfigured(): boolean {
    const enabled = process.env.EDGE_TTS_ENABLED === "true" || process.env.TTS_PROVIDER === "edge";
    return enabled && onPath("edge-tts");
  }

  async listVoices(): Promise<VoiceOption[]> {
    return VOICES;
  }

  async synthesize(text: string, voiceId?: string): Promise<Buffer> {
    const voice = voiceId || this.defaultVoice;
    const rate = process.env.EDGE_TTS_RATE || "+10%";
    const tmpFile = join(os.tmpdir(), `edge-tts-${randomUUID()}.mp3`);

    try {
      await execFileAsync("edge-tts", [
        "--voice", voice,
        "--rate", rate,
        "--pitch=-6Hz",
        "--text", text,
        "--write-media", tmpFile,
      ], { timeout: 15000 });

      return await readFile(tmpFile);
    } finally {
      unlink(tmpFile).catch(() => {});
    }
  }
}
