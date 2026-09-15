"use client";

import { useState } from "react";

type Point = { day: string; created: number; completed: number };

/**
 * Gráfico de linhas (2 séries) de 14 dias. Paleta validada (dataviz): --chart-1 / --chart-2.
 * Um eixo, legenda + rótulo direto no último ponto, crosshair com tooltip, grid recessivo.
 */
export function ActivityChart({ series }: { series: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 900, H = 200, PAD = { l: 28, r: 16, t: 12, b: 24 };
  const max = Math.max(3, ...series.flatMap((p) => [p.created, p.completed]));
  const x = (i: number) => PAD.l + (i / (series.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
  const path = (key: "created" | "completed") => series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const ticks = [0, Math.round(max / 2), max];
  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const total = series.reduce((a, p) => ({ c: a.c + p.created, d: a.d + p.completed }), { c: 0, d: 0 });

  return (
    <div>
      <div className="row-between mb-2">
        <div className="legend" aria-hidden="true">
          <span><i className="dot" style={{ background: "var(--chart-1)" }} /> Criadas ({total.c})</span>
          <span><i className="dot" style={{ background: "var(--chart-2)" }} /> Concluídas ({total.d})</span>
        </div>
        <span className="subtle text-xs">Últimos 14 dias</span>
      </div>
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Tarefas criadas e concluídas por dia nos últimos 14 dias: ${total.c} criadas, ${total.d} concluídas.`}
          onMouseLeave={() => setHover(null)} onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * W;
            const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (series.length - 1));
            setHover(Math.max(0, Math.min(series.length - 1, i)));
          }}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth="1" />
              <text x={PAD.l - 6} y={y(t) + 4} fontSize="10" textAnchor="end" fill="var(--color-subtle)">{t}</text>
            </g>
          ))}
          {series.map((p, i) => (i % 3 === 0 || i === series.length - 1) && (
            <text key={p.day} x={x(i)} y={H - 6} fontSize="10" textAnchor="middle" fill="var(--color-subtle)">{fmt(p.day)}</text>
          ))}
          <path d={path("created")} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={path("completed")} fill="none" stroke="var(--chart-2)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--color-border-strong)" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(series[hover].created)} r="5" fill="var(--chart-1)" stroke="var(--color-card)" strokeWidth="2" />
              <circle cx={x(hover)} cy={y(series[hover].completed)} r="5" fill="var(--chart-2)" stroke="var(--color-card)" strokeWidth="2" />
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="chart-tooltip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(Math.min(y(series[hover].created), y(series[hover].completed)) / H) * 100}%` }}>
            <div className="font-semibold">{fmt(series[hover].day)}</div>
            <div>Criadas: <b className="tabular">{series[hover].created}</b></div>
            <div>Concluídas: <b className="tabular">{series[hover].completed}</b></div>
          </div>
        )}
      </div>
      <details className="mt-2"><summary className="subtle text-xs" style={{ cursor: "pointer" }}>Ver como tabela</summary>
        <div className="table-wrap mt-2"><table className="table"><thead><tr><th>Dia</th><th>Criadas</th><th>Concluídas</th></tr></thead>
          <tbody>{series.map((p) => <tr key={p.day}><td>{fmt(p.day)}</td><td className="tabular">{p.created}</td><td className="tabular">{p.completed}</td></tr>)}</tbody></table></div>
      </details>
    </div>
  );
}
