import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { getTTSProvider, validateVoiceSelection } from "@/lib/providers";

// Fixed text: a preview must not double as a free general-purpose TTS endpoint.
const PREVIEW_TEXT = "Hi, I'll be your interviewer today. Could you start by telling me a little about yourself?";

export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`voice-preview:${ip}`, 20, 60000)) {
    return NextResponse.json({ error: "Too many previews. Try again in a minute." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { provider?: unknown; voice?: unknown } | null;
  const selection = { provider: String(body?.provider ?? ""), voice: String(body?.voice ?? "") };
  const problem = validateVoiceSelection(selection);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  try {
    const provider = getTTSProvider(selection.provider);
    const audio = await provider.synthesize(PREVIEW_TEXT, selection.voice);
    return NextResponse.json({ audio: audio.toString("base64"), contentType: provider.contentType });
  } catch (err) {
    console.error("[TTS] Voice preview failed:", (err as Error).message);
    return NextResponse.json({ error: "Preview failed" }, { status: 502 });
  }
}
