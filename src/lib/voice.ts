import { getOrgAISettings } from "./ai-settings";
import { resolveVoice, type ResolvedVoice } from "./providers";
import type { Interview } from "./store";

/** Voice for an interview: its own override, else the org default, else the server default. */
export async function resolveInterviewVoice(interview: Pick<Interview, "orgId" | "voice">): Promise<ResolvedVoice> {
  const settings = await getOrgAISettings(interview.orgId);
  return resolveVoice([
    { selection: interview.voice, source: "interview" },
    { selection: settings.voice, source: "organization" },
  ]);
}
