import Link from "next/link";
import { CapsuleScrollExperience } from "@/components/site/capsule-scroll-experience";
import { Reveal } from "@/components/site/reveal";
import { ScrollAtmosphere } from "@/components/site/scroll-atmosphere";
import { SectionTag } from "@/components/site/section-tag";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { VitalisCapabilityStory } from "@/components/site/vitalis-capability-story";
import { VitalisContinuityStory } from "@/components/site/vitalis-continuity-story";
import { VitalisHubStory } from "@/components/site/vitalis-hub-story";

const testimonials = [
  {
    quote:
      '"Agora consigo lembrar dos horários sem confusão. O histórico de tomas me ajudou a manter o tratamento em dia."',
    author: "Helena, 62 anos",
  },
  {
    quote:
      '"Cuido dos remédios da minha mãe e o app facilitou muito a organização da rotina."',
    author: "Paulo, 39 anos (cuidador)",
  },
  {
    quote:
      '"Levei o relatório de adesão para consulta e ficou mais fácil ajustar horários e dosagens com meu médico."',
    author: "Renata, 47 anos",
  },
];

const faqs = [
  {
    question: "O app substitui prescrição médica?",
    answer:
      "Não. A Vitalis organiza a rotina, lembra horários e registra tomas, mas não substitui prescrição, diagnóstico ou orientação profissional.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "A proposta prioriza privacidade, controle de acesso e comunicação transparente para dados sensíveis de saúde.",
  },
  {
    question: "Quem pode usar a plataforma?",
    answer:
      "Pacientes, idosos, cuidadores, familiares e profissionais que precisam acompanhar a adesão medicamentosa.",
  },
  {
    question: "Funciona em celular e tablet?",
    answer:
      "Sim. A interface foi planejada para ser responsiva, simples e adequada para diferentes tamanhos de tela.",
  },
];

export default function Home() {
  return (
    <div className="premium-canvas overflow-x-clip text-[var(--ink)]">
      <a className="skip-link" href="#conteudo-principal">
        Ir para o conteúdo principal
      </a>
      <SiteHeader />
      <ScrollAtmosphere />

      <main id="conteudo-principal">
        <CapsuleScrollExperience />

        <VitalisContinuityStory />

        <VitalisCapabilityStory />

        <VitalisHubStory />

        <section
          className="human-proof-section premium-section"
          data-header-section="experiences"
          data-header-label="Experiências"
          data-header-tone="light"
        >
          <div className="human-proof-section__bridge" aria-hidden="true">
            <span />
          </div>
          <div className="mx-auto max-w-[1200px] px-5 lg:px-0">
            <Reveal>
              <SectionTag>Experiências de uso</SectionTag>
              <div className="human-proof-section__heading">
                <h2 className="vitalis-display text-[42px] font-medium leading-[1.02] text-[var(--ink)] md:text-[60px]">
                  Quando a rotina volta a caber no dia.
                </h2>
                <p>
                  Organização percebida em pequenos momentos: lembrar, confirmar
                  e compartilhar o cuidado com menos ruído.
                </p>
              </div>
            </Reveal>

            <div className="testimonial-editorial">
              <Reveal variant="slide-right">
                <article className="testimonial-quote testimonial-quote--primary">
                  <span aria-hidden="true">01</span>
                  <blockquote>{testimonials[0].quote}</blockquote>
                  <p>{testimonials[0].author}</p>
                </article>
              </Reveal>

              <div className="testimonial-editorial__secondary">
                {testimonials.slice(1).map((item, index) => (
                  <Reveal key={item.author} delay={100 + index * 110}>
                    <article className="testimonial-quote">
                      <span aria-hidden="true">
                        {String(index + 2).padStart(2, "0")}
                      </span>
                      <blockquote>{item.quote}</blockquote>
                      <p>{item.author}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="faq-section premium-section bg-[var(--surface-soft)]"
          data-header-section="faq"
          data-header-label="FAQ"
          data-header-tone="light"
          data-header-href="#faq"
        >
          <div className="mx-auto max-w-[1100px] px-5 lg:px-0">
            <Reveal>
              <SectionTag>FAQ</SectionTag>
              <h2 className="mt-6 max-w-[720px] vitalis-display text-[42px] font-medium leading-[1.02] text-[var(--ink)] md:text-[60px]">
                Clareza também faz parte do cuidado.
              </h2>
            </Reveal>
            <div className="faq-ledger">
              {faqs.map((item, index) => (
                <Reveal key={item.question} delay={index * 85}>
                  <article className="faq-ledger__item">
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="cta"
          className="finale-section"
          data-header-section="finale"
          data-header-label="Começar"
          data-header-tone="dark"
        >
          <span className="finale-section__signal" aria-hidden="true" />
          <Reveal>
            <div className="finale-section__inner">
              <p className="finale-section__eyebrow">Sua rotina, em continuidade</p>
              <h2 className="vitalis-display">
                Mantenha seu tratamento em dia com simplicidade e segurança.
              </h2>
              <p className="finale-section__copy">
                Organize medicamentos, horários e histórico de tomas em um só lugar.
              </p>
              <Link href="/entrar" className="finale-section__cta">
                Criar conta gratuita
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

