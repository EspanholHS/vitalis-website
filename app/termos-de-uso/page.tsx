import { LegalPage } from "@/components/site/legal-page";

export default function TermosDeUsoPage() {
  return (
    <LegalPage
      tag="Legal"
      title="Termos de uso"
      intro="Estes termos regulam o acesso e a utilização do website da Vitalis e de eventuais serviços digitais disponibilizados pela plataforma."
      sections={[
        {
          title: "1. Aceitação",
          content: (
            <>
              <p>
                Ao acessar ou utilizar o website, o usuário declara ciência e
                concordância com estes termos e com a política de privacidade
                vigente.
              </p>
            </>
          ),
        },
        {
          title: "2. Uso permitido",
          content: (
            <>
              <p>
                O usuário compromete-se a utilizar a plataforma de forma lícita,
                ética e compatível com sua finalidade, sem comprometer a
                segurança, disponibilidade ou integridade do serviço.
              </p>
              <p>
                É vedado inserir conteúdo ilegal, ofensivo, fraudulento ou que
                viole direitos de terceiros.
              </p>
            </>
          ),
        },
        {
          title: "3. Limitações e responsabilidade",
          content: (
            <>
              <p>
                A Vitalis não substitui acompanhamento médico, prescrição,
                diagnóstico ou conduta clínica. O uso da plataforma deve ocorrer
                como apoio organizacional ao tratamento.
              </p>
              <p>
                O usuário é responsável pela veracidade das informações
                inseridas e por observar orientações médicas aplicáveis ao seu
                contexto.
              </p>
            </>
          ),
        },
        {
          title: "4. Propriedade intelectual",
          content: (
            <>
              <p>
                Marca, identidade visual, conteúdos, interface e demais
                elementos do website pertencem à Vitalis ou a terceiros
                licenciantes, sendo vedada reprodução não autorizada.
              </p>
            </>
          ),
        },
        {
          title: "5. Atualizações",
          content: (
            <>
              <p>
                A Vitalis pode atualizar estes termos a qualquer momento para
                refletir evolução do serviço, requisitos legais ou ajustes
                operacionais. A versão vigente será a publicada no website.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
