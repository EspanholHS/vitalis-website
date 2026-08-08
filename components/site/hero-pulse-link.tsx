"use client";

import Link from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";

type HeroPulseLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
};

function dispatchPulse(active: boolean) {
  window.dispatchEvent(
    new CustomEvent("vitalis:hero-pulse", { detail: { active } }),
  );
}

export function HeroPulseLink({
  children,
  className,
  href,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: HeroPulseLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={(event) => {
        dispatchPulse(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        dispatchPulse(false);
        onMouseLeave?.(event);
      }}
      onFocus={(event) => {
        dispatchPulse(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        dispatchPulse(false);
        onBlur?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
