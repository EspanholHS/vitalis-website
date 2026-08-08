import { ContactForm } from "@/components/site/contact-form";
import { PageShell } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { SectionTag } from "@/components/site/section-tag";
import { SimplePageHero } from "@/components/site/simple-page-hero";

export default function ContatoPage() {
  return (
    <PageShell softBackground>
      <SimplePageHero
        tag="Contato"
        title="Fale com a equipe da Vitalis."
        description="Use o formulário para tirar dúvidas, solicitar demonstração ou conversar sobre parceria. Retornaremos pelo e-mail informado."
      />

      <section className="mx-auto max-w-[1200px] px-5 pb-20 lg:px-0">
        <div className="mx-auto grid max-w-[1020px] gap-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:items-start">
          <Reveal variant="slide-right">
            <article className="product-surface px-7 py-8 text-left">
              <SectionTag>Canal direto</SectionTag>
              <h2 className="mt-6 vitalis-display text-[38px] font-medium leading-[1.08] text-[#f8f6f0]">
                Vamos entender sua necessidade e responder com contexto.
              </h2>
              <div className="mt-6 space-y-4 text-[16px] leading-7 text-[#c7cbc5]">
                <p>
                  A Vitalis atende pacientes, cuidadores, clínicas, equipes de
                  saúde e parceiros que precisam organizar jornadas de medicação
                  com mais clareza.
                </p>
                <p>
                  Compartilhe o contexto da sua rotina, operação ou necessidade e
                  retornaremos com a orientação adequada.
                </p>
              </div>
            </article>
          </Reveal>

          <Reveal variant="slide-left" delay={120}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
