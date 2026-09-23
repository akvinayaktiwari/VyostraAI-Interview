import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAppSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { rows } = await pool.query("SELECT id, name FROM organizations ORDER BY name ASC");
  return NextResponse.json(rows);
}
