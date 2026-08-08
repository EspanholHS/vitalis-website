import Link from "next/link";

export function BrandMark({
  href = "/",
  tone = "light",
}: {
  href?: string;
  tone?: "light" | "dark";
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] bg-[linear-gradient(145deg,#1565d8_0%,#1f9d67_100%)] vitalis-logo-font text-sm font-bold text-white shadow-[0_10px_24px_rgba(21,101,216,0.2)]">
        <span className="absolute inset-px rounded-[9px] border border-white/20" />
        <span className="relative">V</span>
      </div>
      <span
        className={`vitalis-logo-font text-[17px] font-bold ${
          tone === "dark" ? "text-[#f8f6f0]" : "text-[var(--ink)]"
        }`}
      >
        Vitalis
      </span>
    </Link>
  );
}
