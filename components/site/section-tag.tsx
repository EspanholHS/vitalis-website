import type { ReactNode } from "react";

export function SectionTag({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className="section-tag"
      data-tone={tone}
    >
      {children}
    </span>
  );
}
