"use client";

import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:ml-64 p-6 pt-16 sm:p-8 sm:pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
