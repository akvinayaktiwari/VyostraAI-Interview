import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/session";
import { getTTSProvider, listTTSProviders } from "@/lib/providers";
import type { VoiceCatalogProvider } from "@/lib/providers/types";

export const dynamic = "force-dynamic";

/** Voice catalog for the pickers. Unconfigured providers are listed (so the UI can say why) but carry no voices. */
export async function GET() {
  const session = await getAppSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const catalog: VoiceCatalogProvider[] = await Promise.all(
    listTTSProviders().map(async (p) => ({
      ...p,
      voices: p.configured ? await getTTSProvider(p.id).listVoices() : [],
    })),
  );
  const serverDefault = getTTSProvider();
  return NextResponse.json({
    providers: catalog,
    serverDefault: { provider: serverDefault.name, voice: serverDefault.defaultVoice },
  });
}
