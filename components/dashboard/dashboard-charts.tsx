"use client";

import { useMemo, useState } from "react";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import { ComposedChart } from "@/components/charts/composed-chart";
import { Gauge } from "@/components/charts/gauge";
import { Grid } from "@/components/charts/grid";
import {
  HeatmapCells,
  HeatmapChart,
  HeatmapTooltip,
  HeatmapXAxis,
  HeatmapYAxis,
  type HeatmapColumn,
} from "@/components/charts/heatmap";
import { Line } from "@/components/charts/line";
import { SeriesBar } from "@/components/charts/series-bar";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import styles from "@/components/dashboard/dashboard.module.css";
import type {
  HubAnalyticsDay,
  HubMedicationMetric,
} from "@/lib/vitalis-dashboard";

type Period = 7 | 30 | 90;

function buildHeatmap(days: HubAnalyticsDay[]): HeatmapColumn[] {
  const byWeek = new Map<number, HeatmapColumn>();
  const firstDate = new Date(`${days[0]?.dateKey ?? "2026-01-01"}T12:00:00Z`);
  const firstSunday = new Date(firstDate);
  firstSunday.setUTCDate(firstSunday.getUTCDate() - firstSunday.getUTCDay());

  for (const day of days) {
    const date = new Date(`${day.dateKey}T12:00:00Z`);
    const dayOffset = Math.round(
      (date.getTime() - firstSunday.getTime()) / 86_400_000,
    );
    const weekIndex = Math.floor(dayOffset / 7);
    const row = date.getUTCDay();
    const column = byWeek.get(weekIndex) ?? {
      bin: weekIndex,
      bins: Array.from({ length: 7 }, (_, bin) => {
        const ghostDate = new Date(firstSunday);
        ghostDate.setUTCDate(ghostDate.getUTCDate() + weekIndex * 7 + bin);
        return { bin, count: -1, date: ghostDate };
      }),
    };
    column.bins[row] = {
      bin: row,
      count: day.duePlanned ? day.adherence : -1,
      date,
    };
    byWeek.set(weekIndex, column);
  }

  return [...byWeek.values()].sort((a, b) => a.bin - b.bin);
}

function adherenceColor(value: number | null | undefined) {
  if (value == null || value < 0) return "#e9e5dc";
  if (value < 25) return "#dce9e2";
  if (value < 50) return "#b9dbc9";
  if (value < 75) return "#82c3a2";
  if (value < 100) return "#4ba879";
  return "#247d59";
}

export function AdherenceGauge({ value }: { value: number }) {
  return (
    <div className={styles.gaugeWrap} aria-label={`Ades\u00e3o de ${value}%`}>
      <Gauge
        activeGradient={["#2f78dc", "#37a477"]}
        centerValue={value}
        className={styles.gauge}
        defaultLabel={"ADES\u00c3O"}
        endAngle={135}
        enterStaggerScale={0.35}
        minWidth={0}
        startAngle={-135}
        suffix="%"
        totalNotches={32}
        useGradient
        value={value}
      />
    </div>
  );
}

export function CompactProgressChart({
  analytics,
}: {
  analytics: HubAnalyticsDay[];
}) {
  const chartData = useMemo(
    () => analytics.slice(-7).map((day) => ({
      adherence: day.adherence,
      date: new Date(`${day.dateKey}T12:00:00Z`),
      planejadas: day.planned,
      tomadas: day.taken,
    })),
    [analytics],
  );

  return (
    <div className={styles.compactChart}>
      <ComposedChart animationDuration={420} aspectRatio="2.8 / 1" barGap={3} data={chartData} margin={{ bottom: 28, left: 20, right: 24, top: 14 }} maxBarSize={14} revealSignature="overview-7">
        <Grid hideHorizontalEdgeLines strokeDasharray="2,6" />
        <SeriesBar dataKey="planejadas" fill="#e5eaed" radius={5} />
        <SeriesBar dataKey="tomadas" fill="#56ad88" radius={5} />
        <Line dataKey="adherence" fadeEdges={false} showMarkers stroke="#2d73d5" strokeWidth={2} yAxisId="percent" />
        <XAxis numTicks={7} />
        <YAxis numTicks={3} />
        <YAxis formatValue={(value) => `${value}%`} numTicks={3} orientation="right" yAxisId="percent" />
        <ChartTooltip rows={(point) => [
          { color: "#56ad88", label: "Tomadas", value: String(point.tomadas ?? 0) },
          { color: "#2d73d5", label: "Adesao", value: `${point.adherence ?? 0}%` },
        ]} showDots />
      </ComposedChart>
    </div>
  );
}
export function ProgressCharts({
  analytics,
  byMedication,
}: {
  analytics: HubAnalyticsDay[];
  byMedication: HubMedicationMetric[];
}) {
  const [period, setPeriod] = useState<Period>(30);
  const periodDays = useMemo(
    () => analytics.slice(-period),
    [analytics, period],
  );
  const chartData = useMemo(
    () =>
      periodDays.map((day) => ({
        adherence: day.adherence,
        date: new Date(`${day.dateKey}T12:00:00Z`),
        planejadas: day.planned,
        tomadas: day.taken,
      })),
    [periodDays],
  );
  const heatmapData = useMemo(() => buildHeatmap(analytics), [analytics]);
  const average = useMemo(() => {
    const planned = periodDays.reduce((sum, day) => sum + day.duePlanned, 0);
    const taken = periodDays.reduce((sum, day) => sum + day.dueTaken, 0);
    return planned ? Math.round((taken / planned) * 100) : 0;
  }, [periodDays]);

  return (
    <>
      <article className={`${styles.panel} ${styles.progressPanel}`}>
        <header className={styles.panelHeader}>
          <div>
            <span className={styles.panelKicker}>CONSIST&Ecirc;NCIA</span>
            <h2>Ritmo da rotina</h2>
            <p>Planejado, confirmado e ades&atilde;o no mesmo eixo temporal.</p>
          </div>
          <div className={styles.periodSelector} aria-label={"Per\u00edodo do gr\u00e1fico"}>
            {([7, 30, 90] as const).map((value) => (
              <button
                aria-pressed={period === value}
                className={period === value ? styles.periodActive : undefined}
                key={value}
                onClick={() => setPeriod(value)}
                type="button"
              >
                {value}d
              </button>
            ))}
          </div>
        </header>
        <div className={styles.chartSummary}>
          <strong>{average}%</strong>
          <span>ades&atilde;o no per&iacute;odo</span>
        </div>
        <div className={styles.composedChart}>
          <ComposedChart
            animationDuration={620}
            aspectRatio="2.35 / 1"
            barGap={3}
            data={chartData}
            margin={{ bottom: 42, left: 34, right: 42, top: 24 }}
            maxBarSize={18}
            revealSignature={String(period)}
          >
            <Grid hideHorizontalEdgeLines strokeDasharray="2,6" />
            <SeriesBar dataKey="planejadas" fill="#dfe7ec" radius={6} />
            <SeriesBar dataKey="tomadas" fill="#4ba879" radius={6} />
            <Line
              dataKey="adherence"
              fadeEdges={false}
              showMarkers={period === 7}
              stroke="#2d73d5"
              strokeWidth={2.4}
              yAxisId="percent"
            />
            <XAxis numTicks={period === 90 ? 6 : period === 30 ? 5 : 7} />
            <YAxis numTicks={4} />
            <YAxis
              formatValue={(value) => `${value}%`}
              numTicks={3}
              orientation="right"
              yAxisId="percent"
            />
            <ChartTooltip
              rows={(point) => [
                { color: "#4ba879", label: "Tomadas", value: String(point.tomadas ?? 0) },
                { color: "#d0d9df", label: "Planejadas", value: String(point.planejadas ?? 0) },
                { color: "#2d73d5", label: "Ades\u00e3o", value: `${point.adherence ?? 0}%` },
              ]}
              showDots
            />
          </ComposedChart>
        </div>
        <div className={styles.chartLegend} aria-hidden="true">
          <span><i className={styles.legendTaken} />Tomadas</span>
          <span><i className={styles.legendPlanned} />Planejadas</span>
          <span><i className={styles.legendLine} />Ades&atilde;o</span>
        </div>
      </article>

      <article className={`${styles.panel} ${styles.heatmapPanel}`}>
        <header className={styles.panelHeader}>
          <div>
            <span className={styles.panelKicker}>&Uacute;LTIMOS 90 DIAS</span>
            <h2>Mapa de consist&ecirc;ncia</h2>
            <p>Cada c&eacute;lula representa um dia da sua rotina.</p>
          </div>
          <div className={styles.heatScale} aria-hidden="true">
            <span>menos</span><i /><i /><i /><i /><i /><span>mais</span>
          </div>
        </header>
        <div className={styles.heatmapChart}>
          <HeatmapChart
            animate
            animationDuration={680}
            colorScale={adherenceColor}
            data={heatmapData}
            gap={3}
            layout="fluid"
            margin={{ bottom: 4, left: 38, right: 4, top: 24 }}
            weekStartDay={0}
          >
            <HeatmapCells
              activeScale={1.08}
              colorScale={adherenceColor}
              cornerRadius={3}
              inactiveOpacity={0.4}
            />
            <HeatmapXAxis />
            <HeatmapYAxis labelFormat="initial" tickFilter="odd" />
            <HeatmapTooltip
              formatLabel={(count) =>
                count < 0 ? "Sem tomadas previstas" : `${count}% de ades\u00e3o`
              }
            />
          </HeatmapChart>
        </div>
      </article>

      <article className={`${styles.panel} ${styles.medicationChartPanel}`} id="medicamentos">
        <header className={styles.panelHeader}>
          <div>
            <span className={styles.panelKicker}>POR MEDICAMENTO / 30 DIAS</span>
            <h2>Vis&atilde;o comparativa</h2>
            <p>Onde a rotina est&aacute; s&oacute;lida e onde merece aten&ccedil;&atilde;o.</p>
          </div>
        </header>
        {byMedication.length ? (
          <div className={styles.barChart}>
            <BarChart
              animationDuration={560}
              aspectRatio="2 / 1"
              barGap={0.36}
              data={byMedication}
              margin={{ bottom: 42, left: 34, right: 18, top: 20 }}
              xDataKey="medication"
            >
              <Grid hideHorizontalEdgeLines strokeDasharray="2,6" />
              <Bar dataKey="percent" fill="#2d73d5" lineCap={7} />
              <BarXAxis maxLabels={6} showAllLabels />
              <YAxis formatValue={(value) => `${value}%`} numTicks={4} />
              <ChartTooltip
                rows={(point) => [
                  { color: "#2d73d5", label: "Ades\u00e3o", value: `${point.percent ?? 0}%` },
                  { color: "#4ba879", label: "Tomadas", value: String(point.taken ?? 0) },
                ]}
              />
            </BarChart>
          </div>
        ) : (
          <div className={styles.emptyChart}>Os indicadores aparecem conforme a rotina &eacute; registrada.</div>
        )}
      </article>
    </>
  );
}




