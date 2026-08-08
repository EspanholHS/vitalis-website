import { LegalPage } from "@/components/site/legal-page";

export default function LgpdPage() {
  return (
    <LegalPage
      tag="LGPD"
      title="Compromisso com a LGPD"
      intro="A Vitalis trata dados pessoais em conformidade com os princípios da Lei Geral de Proteção de Dados, buscando transparência, segurança e responsabilidade em toda a jornada do usuário."
      sections={[
        {
          title: "1. Bases legais",
          content: (
            <>
              <p>
                O tratamento de dados pessoais pode ocorrer com fundamento em
                consentimento, execução de contrato, legítimo interesse,
                cumprimento de obrigação legal ou regulatória e demais hipóteses
                previstas na legislação aplicável.
              </p>
            </>
          ),
        },
        {
          title: "2. Governança",
          content: (
            <>
              <p>
                Mantemos práticas de governança voltadas à minimização de dados,
                controle de acesso, avaliação de risco e revisão periódica de
                processos relacionados à privacidade.
              </p>
            </>
          ),
        },
        {
          title: "3. Atendimento ao titular",
          content: (
            <>
              <p>
                Solicitações relacionadas aos direitos previstos na LGPD podem
                ser encaminhadas pelos canais oficiais da Vitalis. Cada pedido é
                analisado conforme o contexto, a identidade do solicitante e a
                legislação aplicável.
              </p>
            </>
          ),
        },
        {
          title: "4. Incidentes e prevenção",
          content: (
            <>
              <p>
                Trabalhamos com medidas preventivas e rotinas de resposta para
                reduzir a chance de incidentes de segurança e mitigar impactos
                quando identificados.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
