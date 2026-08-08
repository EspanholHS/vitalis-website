import { LegalPage } from "@/components/site/legal-page";

export default function PoliticaDePrivacidadePage() {
  return (
    <LegalPage
      tag="Privacidade"
      title="Política de privacidade"
      intro="Esta política descreve como a Vitalis coleta, utiliza, armazena e protege dados pessoais no contexto do website e dos serviços digitais associados."
      sections={[
        {
          title: "1. Dados coletados",
          content: (
            <>
              <p>
                Podemos coletar dados de identificação e contato fornecidos pelo
                usuário, como nome, e-mail, telefone e conteúdo enviado por
                formulários.
              </p>
              <p>
                Também podem ser tratados dados de navegação, dispositivo,
                registros de acesso e informações necessárias para segurança,
                performance e melhoria da experiência.
              </p>
            </>
          ),
        },
        {
          title: "2. Finalidades do tratamento",
          content: (
            <>
              <p>
                Utilizamos os dados para responder solicitações, viabilizar
                contato comercial ou institucional, melhorar nossos serviços e
                cumprir obrigações legais e regulatórias.
              </p>
              <p>
                O tratamento pode ocorrer ainda para prevenção a fraudes,
                exercício regular de direitos e proteção da plataforma.
              </p>
            </>
          ),
        },
        {
          title: "3. Compartilhamento",
          content: (
            <>
              <p>
                A Vitalis pode compartilhar dados com operadores e prestadores
                estritamente necessários para infraestrutura, suporte, envio de
                comunicações e funcionamento do serviço.
              </p>
              <p>
                Sempre buscamos parceiros com padrões adequados de segurança e
                privacidade compatíveis com a natureza dos dados tratados.
              </p>
            </>
          ),
        },
        {
          title: "4. Segurança e retenção",
          content: (
            <>
              <p>
                Adotamos medidas técnicas e administrativas razoáveis para
                proteger os dados contra acesso não autorizado, perda, alteração
                ou divulgação indevida.
              </p>
              <p>
                Os dados são mantidos apenas pelo tempo necessário para cumprir
                as finalidades previstas nesta política, obrigações legais ou
                exercício regular de direitos.
              </p>
            </>
          ),
        },
        {
          title: "5. Direitos do titular",
          content: (
            <>
              <p>
                O titular pode solicitar confirmação de tratamento, acesso,
                correção, anonimização, portabilidade, eliminação, informação
                sobre compartilhamento e revisão de decisões automatizadas,
                quando aplicável.
              </p>
              <p>
                Para exercer direitos, utilize os canais disponibilizados na
                página de contato.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
