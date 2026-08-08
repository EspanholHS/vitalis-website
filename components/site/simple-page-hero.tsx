import { ReactNode } from "react";
import { Reveal } from "./reveal";
import { SectionTag } from "./section-tag";

export function SimplePageHero({
  tag,
  title,
  description,
  children,
}: {
  tag: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-14 pt-14 lg:px-0">
      <Reveal>
        <div className="premium-card mx-auto max-w-[800px] px-7 py-9 text-center md:px-12 md:py-12">
          <SectionTag>{tag}</SectionTag>
          <h1 className="mt-6 vitalis-display text-[40px] font-medium leading-[1.05] text-[var(--ink)] md:text-[58px]">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-[660px] text-lg leading-8 text-[var(--muted)]">
            {description}
          </p>
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </Reveal>
    </section>
  );
}
