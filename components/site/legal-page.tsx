import { ReactNode } from "react";
import { PageShell } from "./page-shell";
import { Reveal } from "./reveal";
import { SectionTag } from "./section-tag";

type LegalSection = {
  title: string;
  content: ReactNode;
};

export function LegalPage({
  tag,
  title,
  intro,
  sections,
}: {
  tag: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <PageShell softBackground>
      <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-14 lg:px-0">
        <Reveal>
          <div className="premium-card mx-auto max-w-[860px] px-7 py-9 text-center md:px-10 md:py-11">
            <SectionTag>{tag}</SectionTag>
            <h1 className="mt-6 vitalis-display text-[40px] font-medium leading-[1.05] text-[var(--ink)] md:text-[56px]">
              {title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--muted)]">{intro}</p>
          </div>
        </Reveal>

        <div className="mx-auto mt-8 grid max-w-[860px] gap-4">
          {sections.map((section) => (
            <Reveal key={section.title}>
              <article className="premium-card premium-card-interactive px-7 py-6 text-left md:px-8">
                <h2 className="vitalis-display text-[30px] font-medium leading-tight text-[var(--ink)]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-[16px] leading-7 text-[var(--muted)]">
                  {section.content}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
