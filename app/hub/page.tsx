import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { recordDoseAction, signOutAction } from "@/app/hub/actions";
import { AdherenceGauge, CompactProgressChart } from "@/components/dashboard/dashboard-charts";
import { DashboardIcon } from "@/components/dashboard/dashboard-icon";
import styles from "@/components/dashboard/dashboard.module.css";
import { ScrollAtmosphere } from "@/components/site/scroll-atmosphere";
import { AddMedicationButton, HubTools } from "@/components/dashboard/hub-tools";
import { BrandMark } from "@/components/site/brand-mark";
import { getAuthenticatedViewer } from "@/lib/supabase/auth";
import { getHubDashboard, type HubDoseStatus } from "@/lib/vitalis-dashboard";

export const metadata: Metadata = {
  title: "Central de Rotina | Vitalis",
  description: "Acompanhe tomadas, consist\u00eancia e hist\u00f3rico no HUB Vitalis.",
  robots: { follow: false, index: false },
};

const statusLabels: Record<HubDoseStatus, string> = {
  late: "Atrasada", missed: "N\u00e3o realizada", pending: "Programada",
  skipped: "Ignorada", snoozed: "Adiada", taken: "Confirmada",
};

function formatTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(new Date(iso));
}

function formatDay(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: timezone }).format(new Date(iso)).replace(".", "");
}

function todayLabel(timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", timeZone: timezone, weekday: "long" }).format(new Date());
}

export default async function HubPage() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) redirect("/entrar?next=/hub");

  const timezone = viewer.profile?.timezone || "America/Sao_Paulo";
  const data = await getHubDashboard(viewer.userId, timezone);
  const displayName = viewer.profile?.preferred_name || viewer.profile?.full_name?.split(" ")[0] || "voc\u00ea";
  const nextDose = data.nextDose;

  return (
    <main className={`${styles.dashboardPage} ${styles.overviewPage}`}>
      <ScrollAtmosphere variant="dashboard" />
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}><BrandMark href="/hub" /><span>HUB</span></div>
        <nav aria-label={"Navega\u00e7\u00e3o do HUB"} className={styles.sidebarNav}>
          <Link className={styles.navActive} href="/hub"><DashboardIcon name="home" /><span>Vis&atilde;o geral</span></Link>
          <Link href="/hub/relatorios"><DashboardIcon name="progress" /><span>Relat&oacute;rios</span></Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.siteLink}>Ver site Vitalis</Link>
          <form action={signOutAction}><button type="submit">Sair da conta</button></form>
        </div>
      </aside>

      <section className={styles.dashboardMain} id="visao-geral">
        <header className={styles.dashboardHeader}>
          <div>
            <span className={styles.mobileBrand}><BrandMark href="/hub" /></span>
            <p className={styles.today}>{todayLabel(timezone)}</p>
            <h1>Ol&aacute;, {displayName}.</h1>
            <p className={styles.headerDescription}>Aqui est&aacute; o que importa para manter sua rotina em movimento.</p>
          </div>
          <div className={styles.headerActions}>
            <AddMedicationButton />
            <span className={styles.liveIndicator}><i /> rotina sincronizada</span>
            <div className={styles.avatar} aria-label={`Perfil de ${displayName}`}>{displayName.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        <section className={styles.commandGrid} aria-label="Resumo da rotina">
          <article className={styles.nextDoseCard}>
            <div aria-hidden="true" className={styles.cardAtmosphere}><span /><span /></div>
            <div className={styles.nextDoseContent}>
              <span className={styles.commandKicker}><i /> PR&Oacute;XIMA A&Ccedil;&Atilde;O</span>
              {nextDose ? (
                <>
                  <div className={styles.nextDoseTitle}>
                    <span className={styles.medicationDot} style={{ backgroundColor: nextDose.color }} />
                    <div><h2>{nextDose.medicationName}</h2><p>{nextDose.dosage}</p></div>
                  </div>
                  <div className={styles.nextDoseTime}>
                    <strong>{formatTime(nextDose.scheduledFor, timezone)}</strong>
                    <span className={`${styles.statusPill} ${styles[`status_${nextDose.status}`]}`}>{statusLabels[nextDose.status]}</span>
                  </div>
                  {nextDose.instructions ? <p className={styles.instructions}>{nextDose.instructions}</p> : null}
                  {nextDose.canRecord ? (
                    <div className={styles.doseActions}>
                      <form action={recordDoseAction}>
                        <input name="medicationId" type="hidden" value={nextDose.medicationId} />
                        <input name="scheduledFor" type="hidden" value={nextDose.scheduledFor} />
                        <input name="status" type="hidden" value="taken" />
                        <button className={styles.confirmButton} type="submit"><DashboardIcon name="check" /> Confirmar tomada</button>
                      </form>
                      <form action={recordDoseAction}>
                        <input name="medicationId" type="hidden" value={nextDose.medicationId} />
                        <input name="scheduledFor" type="hidden" value={nextDose.scheduledFor} />
                        <input name="status" type="hidden" value="skipped" />
                        <button className={styles.skipButton} type="submit">Ignorar</button>
                      </form>
                    </div>
                  ) : <p className={styles.waitingMessage}>A confirma&ccedil;&atilde;o ser&aacute; liberada no hor&aacute;rio programado.</p>}
                </>
              ) : (
                <div className={styles.allDone}>
                  <span><DashboardIcon name="check" /></span>
                  <div><h2>Rotina em dia.</h2><p>N&atilde;o h&aacute; nenhuma a&ccedil;&atilde;o pendente para hoje.</p></div>
                </div>
              )}
            </div>
            <div className={styles.capsuleVisual} aria-hidden="true"><span /><span /><i /></div>
          </article>

          <article className={styles.adherenceCard}>
            <div>
              <span className={styles.panelKicker}>&Uacute;LTIMOS 30 DIAS</span>
              <h2>Seu ritmo</h2>
              <p>{data.summary.dueTaken} de {data.summary.duePlanned} tomadas previstas foram confirmadas.</p>
            </div>
            <AdherenceGauge value={data.summary.adherence} />
          </article>
        </section>

        <section className={styles.metricsGrid} aria-label="Indicadores de hoje">
          <article>
            <span className={styles.metricIcon}><DashboardIcon name="check" /></span>
            <div><strong>{data.summary.takenToday}/{data.summary.plannedToday}</strong><span>tomadas hoje</span></div>
            <small>{data.summary.plannedToday ? `${Math.round((data.summary.takenToday / data.summary.plannedToday) * 100)}% conclu\u00eddo` : "sem doses previstas"}</small>
          </article>
          <article>
            <span className={styles.metricIcon}><DashboardIcon name="medicine" /></span>
            <div><strong>{data.activeMedicationCount}</strong><span>medicamentos ativos</span></div>
            <small>rotina sincronizada</small>
          </article>
          <article className={data.summary.attentionCount ? styles.metricAttention : undefined}>
            <span className={styles.metricIcon}><DashboardIcon name="activity" /></span>
            <div><strong>{data.summary.attentionCount}</strong><span>pedem aten&ccedil;&atilde;o</span></div>
            <small>{data.summary.attentionCount ? "revise sua agenda" : "nenhuma pend\u00eancia"}</small>
          </article>
        </section>

        <section className={styles.overviewLowerGrid} id="progresso">
          <article className={`${styles.panel} ${styles.compactTrendPanel}`}>
            <header className={styles.panelHeader}>
              <div><span className={styles.panelKicker}>7 DIAS / RITMO</span><h2>Consist&ecirc;ncia recente</h2><p>Uma leitura r&aacute;pida da sua rotina.</p></div>
              <Link className={styles.panelLink} href="/hub/relatorios">Ver detalhes <span aria-hidden="true">&rarr;</span></Link>
            </header>
            <div className={styles.compactChartSummary}><strong>{data.summary.adherence}%</strong><span>ades&atilde;o atual</span></div>
            <CompactProgressChart analytics={data.analytics} />
          </article>

          <article className={`${styles.panel} ${styles.timelinePanel} ${styles.compactTimelinePanel}`} id="agenda">
            <header className={styles.panelHeader}>
              <div><span className={styles.panelKicker}>AGENDA DE HOJE</span><h2>Pr&oacute;ximas tomadas</h2></div>
              <span className={styles.dateChip}>{todayLabel(timezone).split(",")[0]}</span>
            </header>
            <ol className={styles.timeline}>
              {data.todayDoses.length ? data.todayDoses.slice(0, 4).map((dose) => (
                <li className={styles[`timeline_${dose.status}`]} key={dose.key}>
                  <time dateTime={dose.scheduledFor}>{formatTime(dose.scheduledFor, timezone)}</time>
                  <span className={styles.timelineMarker}><i /></span>
                  <div><strong>{dose.medicationName}</strong><span>{dose.dosage}</span></div>
                  <em>{statusLabels[dose.status]}</em>
                </li>
              )) : <li className={styles.timelineEmpty}>Nenhuma dose programada para hoje.</li>}
            </ol>
          </article>

          <article className={`${styles.panel} ${styles.historyPanel} ${styles.compactHistoryPanel}`} id="historico">
            <header className={styles.panelHeader}>
              <div><span className={styles.panelKicker}>ATIVIDADE RECENTE</span><h2>Hist&oacute;rico</h2></div>
              <Link className={styles.panelLink} href="/hub/relatorios#historico">Tudo <span aria-hidden="true">&rarr;</span></Link>
            </header>
            <ul className={styles.historyList}>
              {data.history.length ? data.history.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <span className={styles.historyDot} style={{ backgroundColor: item.color }} />
                  <div><strong>{item.medicationName}</strong><span>{formatDay(item.scheduledFor, timezone)} &middot; {formatTime(item.scheduledFor, timezone)}</span></div>
                  <em className={styles[`history_${item.status}`]}>{statusLabels[item.status]}</em>
                </li>
              )) : <li className={styles.emptyHistory}>Seu hist&oacute;rico aparecer&aacute; ap&oacute;s a primeira confirma&ccedil;&atilde;o.</li>}
            </ul>
          </article>
        </section>

        <footer className={styles.dashboardFooter}>
          <span>Vitalis HUB</span>
          <p>Informa&ccedil;&atilde;o para apoiar sua rotina. Em caso de d&uacute;vidas cl&iacute;nicas, procure um profissional de sa&uacute;de.</p>
        </footer>
      </section>

      <HubTools />

      <nav aria-label={"Navega\u00e7\u00e3o m\u00f3vel do HUB"} className={styles.mobileNav}>
        <Link href="/hub"><DashboardIcon name="home" /><span>Vis&atilde;o geral</span></Link>
        <Link href="/hub/relatorios"><DashboardIcon name="progress" /><span>Relat&oacute;rios</span></Link>
      </nav>
    </main>
  );
}




