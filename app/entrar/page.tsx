import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/dashboard/login-form";
import { ScrollAtmosphere } from "@/components/site/scroll-atmosphere";
import styles from "@/components/dashboard/dashboard.module.css";
import { BrandMark } from "@/components/site/brand-mark";
import { getAuthenticatedViewer } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Acesso Vitalis | HUB",
  description: "Entre ou crie sua conta para acompanhar sua rotina de medicamentos.",
};

function safeNextPath(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/hub";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; confirmed?: string | string[] }>;
}) {
  const [viewer, params] = await Promise.all([
    getAuthenticatedViewer(),
    searchParams,
  ]);

  if (viewer) redirect(safeNextPath(params.next));

  const confirmed = Array.isArray(params.confirmed)
    ? params.confirmed[0]
    : params.confirmed;

  return (
    <main className={styles.loginPage}>
      <ScrollAtmosphere variant="dashboard" />
      <div aria-hidden="true" className={styles.loginAtmosphere}>
        <span />
        <span />
        <span />
      </div>
      <header className={styles.loginHeader}>
        <BrandMark href="/" />
        <Link href="/" className={styles.backLink}>
          Voltar ao site <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <div className={styles.loginLayout}>
        <section className={styles.loginStory} aria-labelledby="login-title">
          <span className={styles.kicker}>HUB VITALIS / ACESSO SEGURO</span>
          <h1 id="login-title">
            Sua rotina,
            <br />
            em movimento.
          </h1>
          <p className={styles.loginStoryCopy}>
            Um espaço calmo para acompanhar tomadas, entender sua consistência e
            cuidar do que importa todos os dias.
          </p>

          <div aria-hidden="true" className={styles.loginCapsuleStage}>
            <div className={styles.loginOrbitalRing} />
            <div className={styles.loginCapsule}>
              <span />
              <i />
            </div>
            <div className={styles.loginCapsuleReflection} />
            <span className={styles.loginStageMark}>01 / CONTINUIDADE</span>
          </div>

          <div className={styles.loginSignals} aria-label="O que você encontra no HUB">
            <div>
              <strong>Agenda</strong>
              <span>Próximas tomadas em foco</span>
            </div>
            <div>
              <strong>Ritmo</strong>
              <span>Consistência sem complicar</span>
            </div>
            <div>
              <strong>Histórico</strong>
              <span>Decisões mais bem informadas</span>
            </div>
          </div>
        </section>

        <section className={styles.loginCard} aria-labelledby="auth-title">
          <div className={styles.authCardTopline}>
            <span className={styles.authPulse} />
            <span>ACESSO AO HUB</span>
            <span className={styles.authSecure}>SESSÃO PROTEGIDA</span>
          </div>
          <div className={styles.loginIntro}>
            <span className={styles.kicker}>BEM-VINDO À VITALIS</span>
            <h2 id="auth-title">Continue de onde parou.</h2>
            <p>
              Entre com sua conta ou crie um acesso para começar a organizar sua
              rotina com mais clareza.
            </p>
          </div>
          {confirmed === "1" ? (
            <p className={styles.loginSuccessNotice} role="status">
              E-mail confirmado. Agora você já pode entrar no HUB.
            </p>
          ) : null}
          <LoginForm nextPath={safeNextPath(params.next)} />
          <p className={styles.loginSupport}>
            Seus dados permanecem privados e protegidos pela autenticação da Vitalis.
          </p>
        </section>
      </div>
    </main>
  );
}
