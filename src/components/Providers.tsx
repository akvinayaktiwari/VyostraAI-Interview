"use client";

import { SessionProvider } from "next-auth/react";
import { AUTH_DISABLED, LOCAL_SESSION } from "@/lib/local-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  if (AUTH_DISABLED) {
    return (
      <SessionProvider session={LOCAL_SESSION} refetchOnWindowFocus={false}>
        {children}
      </SessionProvider>
    );
  }
  return <SessionProvider>{children}</SessionProvider>;
}
