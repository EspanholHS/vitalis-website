import Link from "next/link";
import { BrandMark } from "./brand-mark";

const footerGroups = [
  {
    title: "Institucional",
    links: [
      { href: "/sobre", label: "Sobre" },
      { href: "/contato", label: "Contato" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/politica-de-privacidade", label: "Política de privacidade" },
      { href: "/termos-de-uso", label: "Termos de uso" },
      { href: "/lgpd", label: "LGPD" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[var(--surface-dark)] text-[#a8aaa4]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))] lg:px-0">
        <div>
          <BrandMark tone="dark" />
          <p className="mt-4 max-w-[300px] text-[15px] leading-6 text-[#b9bbb4]">
            HealthTech para organização de medicamentos e adesão ao tratamento.
          </p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-[15px] font-semibold text-[#f8f6f0]">
              {group.title}
            </h3>
            <div className="mt-4 space-y-2 text-[15px] text-[#b9bbb4]">
              {group.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block w-fit rounded-[6px] py-0.5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
