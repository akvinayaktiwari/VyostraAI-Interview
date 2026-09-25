import { getServerSession, type Session } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "./auth";
import { pool } from "./db";
import { AUTH_DISABLED, LOCAL_SESSION, LOCAL_USER } from "./local-auth";

let localUserReady: Promise<void> | null = null;

/** Make sure the local test user row exists (FKs such as created_by point at it). */
function ensureLocalUser(): Promise<void> {
  if (!localUserReady) {
    localUserReady = pool
      .query(
        `INSERT INTO users (id, org_id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, 'auth-disabled', $5)
         ON CONFLICT (id) DO NOTHING`,
        [LOCAL_USER.id, LOCAL_USER.orgId, LOCAL_USER.email, LOCAL_USER.name, LOCAL_USER.role]
      )
      .then(() => undefined)
      .catch((err: unknown) => {
        localUserReady = null;
        throw err;
      });
  }
  return localUserReady;
}

/** Drop-in replacement for getServerSession(authOptions) that honours the local auth bypass. */
export async function getAppSession(): Promise<Session | null> {
  if (!AUTH_DISABLED) return getServerSession(authOptions);
  // getServerSession reads request headers, which makes the route dynamic.
  // Do the same here so Next.js never prerenders DB-backed routes at build time.
  headers();
  await ensureLocalUser();
  return LOCAL_SESSION;
}
