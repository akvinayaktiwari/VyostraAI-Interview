import type { Session } from "next-auth";

/**
 * Local-testing auth bypass. When NEXT_PUBLIC_AUTH_DISABLED=true every request
 * is treated as LOCAL_USER (an admin in the default seeded organization).
 * Safe to import from both client and server code.
 */
export const AUTH_DISABLED: boolean = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  orgId: string;
  orgName: string;
  role: string;
}

export const LOCAL_USER: LocalUser = {
  id: "00000000-0000-0000-0000-00000000beef",
  email: "local@localhost",
  name: "Local Tester",
  orgId: "00000000-0000-0000-0000-000000000001",
  orgName: "NammaYatri",
  role: "admin",
};

export const LOCAL_SESSION: Session = {
  user: LOCAL_USER,
  expires: "9999-12-31T23:59:59.999Z",
};
