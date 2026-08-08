import { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PageShell({
  children,
  softBackground = false,
}: {
  children: ReactNode;
  softBackground?: boolean;
}) {
  return (
    <main
      className={`premium-canvas relative min-h-screen overflow-hidden ${
        softBackground ? "bg-[var(--background)]" : "bg-[var(--surface-soft)]"
      } text-[var(--ink)]`}
    >
      <SiteHeader />
      {children}
      <SiteFooter />
    </main>
  );
}
