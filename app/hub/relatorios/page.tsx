import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProgressCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardIcon } from "@/components/dashboard/dashboard-icon";
import styles from "@/components/dashboard/dashboard.module.css";
import { ScrollAtmosphere } from "@/components/site/scroll-atmosphere";
import { HubTools } from "@/components/dashboard/hub-tools";
import { BrandMark } from "@/components/site/brand-mark";
import { getAuthenticatedViewer } from "@/lib/supabase/auth";
import { getHubDashboard } from "@/lib/vitalis-dashboard";
import { signOutAction } from "@/app/hub/actions";

export const metadata: Metadata = {
  title: "Relat\u00f3rios | Vitalis HUB",
  description: "An\u00e1lises detalhadas da sua rotina de medicamentos.",
  robots: { follow: false, index: false },
};

export default async function HubReportsPage() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) redirect("/entrar?next=/hub/relatorios");

  const timezone = viewer.profile?.timezone || "America/Sao_Paulo";
  const data = await getHubDashboard(viewer.userId, timezone);

  return (
    <main className={`${styles.dashboardPage} ${styles.reportPage}`}>
      <ScrollAtmosphere variant="dashboard" />
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}><BrandMark href="/hub" /><span>HUB</span></div>
        

      <nav aria-label="Navega\u00e7\u00e3o do HUB" className={styles.sidebarNav}>
          <Link href="/hub"><DashboardIcon name="home" /><span>Vis&atilde;o geral</span></Link>
          <Link className={styles.navActive} href="/hub/relatorios"><DashboardIcon name="progress" /><span>Relat&oacute;rios</span></Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/">Ver site Vitalis</Link>
          <form action={signOutAction}><button type="submit">Sair da conta</button></form>
        </div>
      </aside>

      <section className={styles.dashboardMain}>
        <header className={styles.dashboardHeader}>
          <div>
            <span className={styles.mobileBrand}><BrandMark href="/hub" /></span>
            <p className={styles.today}>AN&Aacute;LISE DA ROTINA</p>
            <h1>Relat&oacute;rios.</h1>
            <p className={styles.headerDescription}>Observe os padr&otilde;es que ajudam sua rotina a permanecer em dia.</p>
          </div>
          <div className={styles.headerActions}><Link className={styles.panelLink} href="/hub">Voltar &agrave; vis&atilde;o geral <span aria-hidden="true">&rarr;</span></Link></div>
        </header>

        <section className={styles.reportSummary} aria-label="Resumo dos relat&oacute;rios">
          <div><span className={styles.panelKicker}>PER&Iacute;ODO ATUAL</span><strong>{data.summary.adherence}%</strong><span>ades&atilde;o registrada</span></div>
          <div><span className={styles.panelKicker}>TOMADAS</span><strong>{data.summary.dueTaken}/{data.summary.duePlanned}</strong><span>confirmadas no per&iacute;odo</span></div>
          <div><span className={styles.panelKicker}>ATEN&Ccedil;&Atilde;O</span><strong>{data.summary.attentionCount}</strong><span>itens para revisar</span></div>
        </section>

        <section className={styles.reportCharts}>
          <ProgressCharts analytics={data.analytics} byMedication={data.byMedication} />
        </section>
        <footer className={styles.dashboardFooter}><span>Vitalis HUB</span><p>Use os dados como apoio para conversar com sua equipe de sa&uacute;de.</p></footer>
      </section>

      <HubTools />

      <nav aria-label="Navega&ccedil;&atilde;o m&oacute;vel do HUB" className={styles.mobileNav}>
        <Link href="/hub"><DashboardIcon name="home" /><span>Vis&atilde;o geral</span></Link>
        <Link href="/hub/relatorios"><DashboardIcon name="progress" /><span>Relat&oacute;rios</span></Link>
      </nav>
    </main>
  );
}



