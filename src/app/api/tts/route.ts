import { NextResponse } from "next/server";
import { stripThinking } from "@/lib/ai";
import { getTTSProvider, type ResolvedVoice } from "@/lib/providers";
import { validateAccessPost } from "@/lib/auth-check";
import { getInterview } from "@/lib/store";
import { resolveInterviewVoice } from "@/lib/voice";

/** The interview's voice when an interview is given, else the server default. */
async function voiceFor(interviewId: string | undefined): Promise<ResolvedVoice> {
  const interview = interviewId ? await getInterview(interviewId) : null;
  if (interview) return resolveInterviewVoice(interview);
  const provider = getTTSProvider();
  return { provider, voice: provider.defaultVoice, source: "server" };
}

export async function POST(req: Request) {
  try {
    const { text, interviewId, token } = await req.json();

    if (interviewId && token) {
      if (!(await validateAccessPost(interviewId, token))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Strip thinking tags, then remove non-English Unicode (MiniMax leaks CJK chars)
    const cleanedText = stripThinking(text).replace(/[^\x20-\x7EÀ-ɏ]/g, " ").replace(/\s{2,}/g, " ").trim();
    const { provider, voice } = await voiceFor(interviewId && token ? interviewId : undefined);
    const audioBuffer = await provider.synthesize(cleanedText, voice);

    return NextResponse.json({
      audio: audioBuffer.toString("base64"),
      contentType: provider.contentType,
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}
