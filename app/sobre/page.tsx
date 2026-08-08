import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { SectionTag } from "@/components/site/section-tag";
import { SimplePageHero } from "@/components/site/simple-page-hero";

const pillars = [
  {
    title: "Clareza na rotina",
    description:
      "Interfaces simples para quem precisa confiar no próximo passo sem fricção desnecessária.",
  },
  {
    title: "Segurança da informação",
    description:
      "Tratamos dados sensíveis com responsabilidade e comunicação transparente.",
  },
  {
    title: "Apoio ao cuidado",
    description:
      "A plataforma aproxima pacientes, familiares e cuidadores em uma jornada organizada.",
  },
];

export default function SobrePage() {
  return (
    <PageShell softBackground>
      <SimplePageHero
        tag="Sobre"
        title="Vitalis é uma HealthTech feita para rotinas de tratamento mais claras."
        description="Criamos experiências digitais para ajudar pacientes, idosos, familiares e cuidadores a organizar medicamentos com menos esquecimentos, menos ruído e mais confiança."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contato"
            className="vitalis-button-primary inline-flex items-center justify-center px-6 py-4 text-[15px] font-semibold"
          >
            Falar com a Vitalis
          </Link>
          <Link
            href="/#funcionalidades"
            className="vitalis-button-secondary inline-flex items-center justify-center px-6 py-4 text-[15px] font-semibold"
          >
            Ver funcionalidades
          </Link>
        </div>
      </SimplePageHero>

      <section className="mx-auto max-w-[1200px] px-5 pb-20 lg:px-0">
        <div className="mx-auto grid max-w-[1020px] gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Reveal variant="slide-right">
            <article className="premium-card premium-card-interactive px-7 py-8 text-left">
              <SectionTag>Missão</SectionTag>
              <h2 className="mt-6 vitalis-display text-[40px] font-medium leading-[1.08] text-[var(--ink)]">
                Transformar a adesão ao tratamento em uma jornada possível.
              </h2>
              <p className="mt-5 text-[16px] leading-7 text-[var(--muted)]">
                A Vitalis nasce para reduzir esquecimentos, melhorar o acompanhamento
                de rotinas e oferecer uma experiência mais acolhedora para quem
                depende de medicação recorrente. Em vez de excesso de complexidade,
                priorizamos orientação prática, visual e confiável.
              </p>
              <p className="mt-4 text-[16px] leading-7 text-[var(--muted)]">
                Nosso foco é apoiar o cuidado contínuo sem substituir orientações
                clínicas. A tecnologia entra para organizar, lembrar e registrar.
              </p>
            </article>
          </Reveal>

          <Reveal variant="slide-left" delay={120}>
            <article className="product-surface px-7 py-8 text-left">
              <SectionTag>Visão</SectionTag>
              <h2 className="mt-6 vitalis-display text-[36px] font-medium leading-[1.08] text-[#f8f6f0]">
                Saúde digital com linguagem simples, transparência e vínculo humano.
              </h2>
              <p className="mt-5 text-[16px] leading-7 text-[#c7cbc5]">
                Queremos que pacientes e cuidadores encontrem na Vitalis um apoio
                diário que respeita limites, preserva contexto e incentiva o
                tratamento consistente.
              </p>
            </article>
          </Reveal>
        </div>

        <div className="mx-auto mt-6 grid max-w-[1020px] gap-4 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 80}>
              <article className="premium-card premium-card-interactive h-full px-5 py-6 text-left">
                <h3 className="text-[19px] font-semibold text-[var(--ink)]">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-[15px] leading-6 text-[var(--muted)]">
                  {pillar.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
