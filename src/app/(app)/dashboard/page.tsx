'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useWorkspaceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import {
  Users, Briefcase, DollarSign, Trophy, TrendingUp, TrendingDown,
  Minus, AlertCircle, MessageSquare, UserX, ArrowRight,
  Phone, Mail, Calendar, Circle, Rocket, ListTodo, Bell, CheckCircle2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CurrencyConverter } from "@/components/ui/currency-converter";
import { 
  useDashboardMetrics, 
  useDashboardPipelineSummary, 
  useDashboardDealsOverTime, 
  useDashboardAttention, 
  useDashboardActivity, 
  useDashboardTasksSummary 
} from "@/hooks/use-dashboard";
import { useReminders, useUpdateReminder } from "@/hooks/use-reminders";
import { useExchangeRates } from "@/hooks/use-exchange-rates";

const ZK_RED = "#E8193C";

// ── Helpers ───────────────────────────────────────────────────────────────────
function greeting(nombre: string) {
  const h = new Date().getHours();
  const saludo = h >= 5 && h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  return { saludo, full: `${saludo}, ${nombre}` };
}

function todayDate() {
  const d = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  return d.charAt(0).toUpperCase() + d.slice(1).replace(/\.$/, "");
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString("es", { day: "numeric", month: "short" });
}

const CANAL_ICON: Record<string, React.ReactNode> = {
  whatsapp: <span style={{ fontSize: 10, fontWeight: 700, color: "#25d366" }}>W</span>,
  email: <Mail style={{ width: 11, height: 11 }} />,
  llamada: <Phone style={{ width: 11, height: 11 }} />,
  reunion: <Calendar style={{ width: 11, height: 11 }} />,
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  deal_created: <Briefcase style={{ width: 14, height: 14, color: "#E8193C" }} />,
  deal_won: <Trophy style={{ width: 14, height: 14, color: "#10b981" }} />,
  contact_created: <Users style={{ width: 14, height: 14, color: "#8b5cf6" }} />,
  conversation_created: <MessageSquare style={{ width: 14, height: 14, color: "#3b82f6" }} />,
  message_sent: <MessageSquare style={{ width: 14, height: 14, color: "#f59e0b" }} />,
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 20, radius = 6 }: { w?: string | number; h?: number; radius?: number }) {
  return <div className="animate-pulse" style={{ width: w, height: h, backgroundColor: "var(--zk-bg-elevated)", borderRadius: radius }} />;
}

// ── New Workspace Welcome State ───────────────────────────────────────────────
function NewWorkspaceWelcome({ navigate }: { navigate: (to: string) => void }) {
  const steps = [
    { icon: <Users size={18} color="#8b5cf6" />, label: "Agregá tu primer contacto", action: () => navigate("/contacts"), cta: "Ir a Contactos" },
    { icon: <Briefcase size={18} color="#E8193C" />, label: "Creá tu primer deal en el pipeline", action: () => navigate("/pipeline"), cta: "Ir al Pipeline" },
    { icon: <MessageSquare size={18} color="#3b82f6" />, label: "Iniciá tu primera conversación", action: () => navigate("/conversations"), cta: "Ir a Conversaciones" },
  ];
  return (
    <div style={{ background: "var(--zk-bg-card)", border: "1px solid var(--zk-border)", borderRadius: 16, padding: "32px 28px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(232,25,60,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Rocket size={22} color="#E8193C" />
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--zk-text-primary)" }}>¡Bienvenido a tu workspace!</p>
          <p style={{ fontSize: 13, color: "var(--zk-text-muted)", marginTop: 2 }}>Tu CRM está listo. Empezá con estos primeros pasos.</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--zk-bg-surface)", border: "1px solid var(--zk-border-subtle)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--zk-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {step.icon}
              </div>
              <span style={{ fontSize: 13, color: "var(--zk-text-dim)", fontWeight: 500 }}>{step.label}</span>
            </div>
            <button onClick={step.action} style={{ background: "rgba(232,25,60,0.1)", border: "1px solid rgba(232,25,60,0.25)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", color: "#E8193C", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
              {step.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, delta, deltaLabel, isCurrency = false, loading, currency }: {
  icon: React.ReactNode; label: string; value: number; delta: number; deltaLabel: string; isCurrency?: boolean; loading?: boolean; currency?: string;
}) {
  const cur = currency ?? "USD";
  const formatted = isCurrency ? formatCurrency(value ?? 0, cur) : (value ?? 0).toLocaleString("es");
  const deltaColor = delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "#6b7280";
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div style={{ backgroundColor: "var(--zk-bg-card)", border: "1px solid var(--zk-border)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--zk-text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <div style={{ color: "var(--zk-text-muted)" }}>{icon}</div>
      </div>
      {loading ? (
        <><Skeleton h={32} w="60%" /><Skeleton h={14} w="80%" /></>
      ) : (
        <>
          <span style={{ fontSize: 28, fontWeight: 700, color: "var(--zk-text-primary)", lineHeight: 1 }}>{formatted}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <DeltaIcon style={{ width: 13, height: 13, color: deltaColor }} />
            <span style={{ fontSize: 12, color: deltaColor, fontWeight: 500 }}>
              {delta > 0 ? "+" : ""}{isCurrency ? formatCurrency(delta ?? 0, cur) : (delta ?? 0)}
            </span>
            <span style={{ fontSize: 12, color: "var(--zk-text-disabled)" }}>{deltaLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Custom bar chart tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "var(--zk-bg-elevated)", border: "1px solid var(--zk-border)", borderRadius: 8, padding: "8px 12px" }}>
      <p style={{ fontSize: 12, color: "var(--zk-text-secondary)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, color: "var(--zk-text-primary)", fontWeight: 600 }}>{payload[0].value} deals</p>
      {payload[1] && <p style={{ fontSize: 12, color: "#E8193C" }}>{formatCurrency(payload[1].value)}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const { workspace } = useWorkspaceStore();
  const workspaceCurrency: string = workspace?.currency ?? "USD";
  const router = useRouter();
  const navigate = (to: string) => router.push(to);
  const { saludo: _, full: greetingText } = greeting(user?.nombre ?? "");

  const { data: rates } = useExchangeRates();

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(workspace?.id, rates, workspaceCurrency);
  const { data: pipeline } = useDashboardPipelineSummary(workspace?.id, rates, workspaceCurrency);
  const { data: dealsTime } = useDashboardDealsOverTime(workspace?.id, rates, workspaceCurrency);
  const { data: attention } = useDashboardAttention(workspace?.id, rates, workspaceCurrency);
  const { data: activity } = useDashboardActivity(workspace?.id);
  const { data: tasksSummary } = useDashboardTasksSummary(workspace?.id);
  const { data: allReminders, isLoading: remindersLoading } = useReminders();
  const updateReminder = useUpdateReminder();

  const pendingReminders = allReminders?.filter(r => r.estado === 'pendiente') ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueReminders = pendingReminders.filter(r => {
    const d = new Date(r.fecha_recordatorio + 'T00:00:00');
    return d < today;
  });
  
  const todayReminders = pendingReminders.filter(r => {
    const d = new Date(r.fecha_recordatorio + 'T00:00:00');
    return d.getTime() === today.getTime();
  });

  const overdueDeals = attention?.overdue_deals ?? [];
  const staleConversations = attention?.stale_conversations ?? [];
  const contactsWithoutDeals = attention?.contacts_without_deals ?? [];
  const activityEvents = activity?.events ?? [];
  const pipelineStages = pipeline?.stages ?? [];
  const chartWeeks = dealsTime?.weeks ?? [];

  const overdueCount = overdueDeals.length;
  const staleCount = staleConversations.length;

  let attentionText: React.ReactNode;
  if (overdueCount > 0 && staleCount > 0) {
    attentionText = <>Tenés <strong style={{ color: "#f59e0b" }}>{overdueCount} deals vencidos</strong> y <strong style={{ color: "#f59e0b" }}>{staleCount} conversaciones</strong> sin responder.</>;
  } else if (overdueCount > 0) {
    attentionText = <>Tenés <strong style={{ color: "#f59e0b" }}>{overdueCount} deal{overdueCount > 1 ? "s" : ""} vencido{overdueCount > 1 ? "s" : ""}</strong> que necesitan atención.</>;
  } else if (staleCount > 0) {
    attentionText = <>Tenés <strong style={{ color: "#f59e0b" }}>{staleCount} conversación{staleCount > 1 ? "es" : ""}</strong> abierta{staleCount > 1 ? "s" : ""} sin actividad.</>;
  } else if (attention) {
    attentionText = "Todo en orden. Buen trabajo.";
  }

  const isNewWorkspace = !metricsLoading &&
    metrics &&
    (metrics.contacts.total ?? 0) === 0 &&
    (metrics.deals_active.total ?? 0) === 0 &&
    (metrics.pipeline_value.total ?? 0) === 0;

  const card: React.CSSProperties = { backgroundColor: "var(--zk-bg-card)", border: "1px solid var(--zk-border)", borderRadius: 12 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "32px 40px 40px", flex: 1 }}>

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-6 border-b border-border">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--zk-text-primary)", lineHeight: 1.2, marginBottom: 6 }}>{greetingText}</h1>
          <div style={{ fontSize: 14, color: "var(--zk-text-secondary)", lineHeight: 1.5 }}>
            {attentionText ?? <Skeleton h={16} w={300} />}
          </div>
        </div>
        <div className="hidden sm:block" style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 14, color: "var(--zk-text-muted)", fontWeight: 500 }}>{todayDate()}</p>
        </div>
      </div>

      {/* ── NEW WORKSPACE WELCOME ── */}
      {isNewWorkspace && <NewWorkspaceWelcome navigate={navigate} />}

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Contactos"
          value={metrics?.contacts.total ?? 0}
          delta={metrics?.contacts.delta ?? 0}
          deltaLabel="vs sem. pasada"
          loading={metricsLoading}
        />
        <KpiCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Deals activos"
          value={metrics?.deals_active.total ?? 0}
          delta={metrics?.deals_active.delta ?? 0}
          deltaLabel="vs sem. pasada"
          loading={metricsLoading}
        />
        <KpiCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Valor pipeline"
          value={metrics?.pipeline_value.total ?? 0}
          delta={metrics?.pipeline_value.delta ?? 0}
          deltaLabel="vs sem. pasada"
          isCurrency
          currency={workspaceCurrency}
          loading={metricsLoading}
        />
        <KpiCard
          icon={<Trophy className="h-4 w-4" />}
          label="Ganados este mes"
          value={metrics?.deals_won.this_month ?? 0}
          delta={metrics?.deals_won.delta ?? 0}
          deltaLabel="vs mes pasado"
          loading={metricsLoading}
        />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">

        {/* Bar chart */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--zk-text-primary)" }}>Deals creados (últimas 8 semanas)</p>
          </div>
          {dealsTime ? (
            chartWeeks.length === 0 || chartWeeks.every(w => w.deals_created === 0) ? (
              <div style={{ height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Briefcase size={28} color="#2a2a2a" />
                <p style={{ fontSize: 13, color: "var(--zk-text-disabled)" }}>Sin deals en las últimas 8 semanas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartWeeks} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="week_label" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                  <Bar dataKey="deals_created" fill="#E8193C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Skeleton h={200} />
            </div>
          )}
        </div>

        {/* Pipeline health bar */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--zk-text-primary)" }}>Pipeline por etapa</p>
            <button onClick={() => navigate("/pipeline")} style={{ fontSize: 12, color: "var(--zk-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E8193C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--zk-text-muted)")}>
              Ver pipeline <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </div>

          {pipeline ? (
            <>
              {/* Stacked bar */}
              <div style={{ display: "flex", height: 10, borderRadius: 9999, overflow: "hidden", backgroundColor: "var(--zk-bg-elevated)", marginBottom: 16 }}>
                {(pipeline.grand_total ?? 0) > 0 ? (
                  pipelineStages.filter((s: any) => s.total_value > 0).map((s: any) => (
                    <div key={s.id} style={{ flex: s.total_value / pipeline.grand_total, backgroundColor: s.color, minWidth: 3 }} title={s.nombre} />
                  ))
                ) : (
                  <div style={{ flex: 1, backgroundColor: "var(--zk-bg-elevated)" }} />
                )}
              </div>

              {/* Legend */}
              {pipelineStages.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--zk-text-disabled)", padding: "8px 0" }}>Sin etapas configuradas</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 168, scrollbarWidth: "thin", scrollbarColor: "var(--zk-border) transparent" }}>
                  {pipelineStages.map((s: any) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--zk-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nombre}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: "var(--zk-text-disabled)" }}>{s.deals_count} deal{s.deals_count !== 1 ? "s" : ""}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--zk-text-dim)" }}>{formatCurrency(s.total_value, workspaceCurrency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton h={10} radius={9999} />
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} h={16} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

        {/* ── Attention panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Tasks widget */}
          <div style={card}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--zk-border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
              <ListTodo style={{ width: 15, height: 15, color: ZK_RED }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--zk-text-primary)" }}>Mis tareas</span>
              <button onClick={() => navigate("/tasks")} style={{ fontSize: 12, color: "var(--zk-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, marginLeft: "auto" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = ZK_RED)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--zk-text-muted)")}>
                Ver todas <ArrowRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
            {/* KPI mini row */}
            {tasksSummary ? (
              <>
                <div style={{ display: "flex", padding: "10px 20px", gap: 0, borderBottom: "1px solid var(--zk-border-subtle)" }}>
                  {[
                    { label: "Pendientes", value: tasksSummary.tasks.pending_total, color: "var(--zk-text-muted)" },
                    { label: "Hoy", value: tasksSummary.tasks.today, color: "#f59e0b" },
                    { label: "Vencidas", value: tasksSummary.tasks.overdue, color: "#ef4444" },
                    { label: "✓ Esta semana", value: tasksSummary.tasks.completed_this_week, color: "#10b981" },
                  ].map((kpi, i) => (
                    <div key={kpi.label} style={{ flex: 1, textAlign: "center", padding: "4px 0", borderRight: i < 3 ? "1px solid var(--zk-border-subtle)" : "none" }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: kpi.color, margin: 0 }}>{kpi.value}</p>
                      <p style={{ fontSize: 10, color: "var(--zk-text-disabled)", marginTop: 1 }}>{kpi.label}</p>
                    </div>
                  ))}
                </div>
                {tasksSummary.tasks.top_today.length === 0 ? (
                  <p style={{ padding: "14px 20px", fontSize: 13, color: "var(--zk-text-disabled)" }}>Sin tareas pendientes</p>
                ) : (
                  tasksSummary.tasks.top_today.map((t: any, i: number) => (
                    <div key={t.id} onClick={() => navigate("/tasks")}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderBottom: i < tasksSummary.tasks.top_today.length - 1 ? "1px solid var(--zk-border-subtle)" : "none", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--zk-bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#3b82f6", flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 13, color: "var(--zk-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.text}</p>
                        {t.contact_nombre && <p style={{ fontSize: 11, color: "var(--zk-text-muted)" }}>{t.contact_nombre}</p>}
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              <div style={{ padding: "12px 20px" }}><Skeleton h={14} /></div>
            )}
          </div>

          {/* Recordatorios widget */}
          <div style={card}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--zk-border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
              <Bell style={{ width: 15, height: 15, color: "#f59e0b" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--zk-text-primary)" }}>Recordatorios</span>
              {pendingReminders.length > 0 && <span style={{ fontSize: 11, color: "var(--zk-text-disabled)", marginLeft: "auto" }}>{pendingReminders.length} pendientes</span>}
            </div>
            
            <div style={{ display: "flex", padding: "10px 20px", gap: 0, borderBottom: "1px solid var(--zk-border-subtle)" }}>
              {[
                { label: "Para hoy", value: todayReminders.length, color: "#f59e0b" },
                { label: "Vencidos", value: overdueReminders.length, color: "#ef4444" },
              ].map((kpi, i) => (
                <div key={kpi.label} style={{ flex: 1, textAlign: "center", padding: "4px 0", borderRight: i === 0 ? "1px solid var(--zk-border-subtle)" : "none" }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: kpi.color, margin: 0 }}>{kpi.value}</p>
                  <p style={{ fontSize: 10, color: "var(--zk-text-disabled)", marginTop: 1 }}>{kpi.label}</p>
                </div>
              ))}
            </div>

            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {remindersLoading ? (
                <div style={{ padding: "12px 20px" }}><Skeleton h={14} /></div>
              ) : pendingReminders.length === 0 ? (
                <p style={{ padding: "14px 20px", fontSize: 13, color: "var(--zk-text-disabled)" }}>No tenés recordatorios pendientes</p>
              ) : (
                [...overdueReminders, ...todayReminders].slice(0, 5).map((rem: any, i: number) => {
                  const isOverdue = new Date(rem.fecha_recordatorio + 'T00:00:00') < today;
                  return (
                    <div key={rem.id} 
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderBottom: i < 4 ? "1px solid var(--zk-border-subtle)" : "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--zk-bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                      <button
                        onClick={() => updateReminder.mutate({ id: rem.id, data: { estado: 'completado' }})}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#d1d5db', flexShrink: 0 }}
                      >
                        <Circle size={16} />
                      </button>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 13, color: "var(--zk-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rem.titulo}</p>
                        {rem.contact && <p style={{ fontSize: 11, color: "var(--zk-text-muted)" }}>{rem.contact.nombre}</p>}
                      </div>
                      <p style={{ fontSize: 11, color: isOverdue ? '#ef4444' : '#f59e0b', fontWeight: 500, flexShrink: 0 }}>
                        {isOverdue ? 'Vencido' : 'Hoy'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Contactos Fríos widget */}
          {!metricsLoading && (metrics?.contactos_frios_total ?? 0) > 0 && (
            <div style={card}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--zk-border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--zk-text-primary)" }}>Contactos fríos</span>
                <span style={{ fontSize: 11, color: "var(--zk-text-disabled)", marginLeft: "auto" }}>{metrics?.contactos_frios_total} totales</span>
              </div>
              {/* Progress bar */}
              <div style={{ padding: "12px 20px 4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--zk-text-muted)" }}>Agendados</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6" }}>
                    {metrics?.contactos_frios_agendados ?? 0} / {metrics?.contactos_frios_total ?? 0}
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--zk-bg-elevated)", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 9999, background: "#3b82f6",
                    width: `${(metrics?.contactos_frios_total ?? 0) > 0 ? Math.round(((metrics?.contactos_frios_agendados ?? 0) / (metrics?.contactos_frios_total ?? 1)) * 100) : 0}%`,
                    transition: "width 600ms ease",
                  }} />
                </div>
              </div>
              {/* List */}
              <div style={{ maxHeight: 160, overflowY: "auto" }}>
                {(metrics?.contactos_frios_list ?? []).map((c: any, i: number) => (
                  <div key={c.id} onClick={() => navigate("/contacts")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: i < (metrics?.contactos_frios_list?.length ?? 0) - 1 ? "1px solid var(--zk-border-subtle)" : "none", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--zk-bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: "var(--zk-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</p>
                        {c.empresa && <p style={{ fontSize: 11, color: "var(--zk-text-muted)" }}>{c.empresa}</p>}
                      </div>
                    </div>
                    {c.next_event && (
                      <p style={{ fontSize: 11, color: "var(--zk-text-muted)", flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
                        <Calendar style={{ width: 10, height: 10 }} />
                        {new Date(c.next_event).toLocaleDateString("es", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue deals */}
          <div style={card}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--zk-border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle style={{ width: 15, height: 15, color: "#ef4444" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--zk-text-primary)" }}>Deals vencidos</span>
              {attention && <span style={{ fontSize: 11, color: "var(--zk-text-disabled)", marginLeft: "auto" }}>{overdueDeals.length} items</span>}
            </div>
            <div>
              {!attention ? (
                <div style={{ padding: "12px 20px" }}><Skeleton h={14} /></div>
              ) : overdueDeals.length === 0 ? (
                <p style={{ padding: "14px 20px", fontSize: 13, color: "var(--zk-text-disabled)" }}>Sin deals vencidos</p>
              ) : (
                overdueDeals.map((d: any, i: number) => (
                  <div key={d.id} onClick={() => navigate("/pipeline")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < overdueDeals.length - 1 ? "1px solid var(--zk-border-subtle)" : "none", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--zk-bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: d.stage_color ?? "#6b7280", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: "var(--zk-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.titulo}</p>
                        {d.contact && <p style={{ fontSize: 11, color: "var(--zk-text-muted)" }}>{d.contact.nombre}</p>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 12, color: "#ef4444" }}>{new Date(d.fecha_cierre).toLocaleDateString("es", { day: "numeric", month: "short" })}</p>
                      <p style={{ fontSize: 12, color: "#E8193C", fontWeight: 600 }}>{formatCurrency(parseFloat(d.valor ?? "0"), workspaceCurrency)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stale conversations */}
          <div style={card}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--zk-border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare style={{ width: 15, height: 15, color: "#f59e0b" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--zk-text-primary)" }}>Conversaciones sin respuesta</span>
              {attention && <span style={{ fontSize: 11, color: "var(--zk-text-disabled)", marginLeft: "auto" }}>{staleConversations.length} items</span>}
            </div>
            <div>
              {!attention ? (
                <div style={{ padding: "12px 20px" }}><Skeleton h={14} /></div>
              ) : staleConversations.length === 0 ? (
                <p style={{ padding: "14px 20px", fontSize: 13, color: "var(--zk-text-disabled)" }}>Sin conversaciones estancadas</p>
              ) : (
                staleConversations.map((c: any, i: number) => (
                  <div key={c.id} onClick={() => navigate(`/conversations?select=${c.id}`)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < staleConversations.length - 1 ? "1px solid var(--zk-border-subtle)" : "none", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--zk-bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 8, height: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--zk-text-muted)" }}>
                        {CANAL_ICON[c.canal] ?? <Circle style={{ width: 8, height: 8 }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: "var(--zk-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.contact?.nombre ?? "Sin contacto"}</p>
                        {c.ultimo_mensaje && <p style={{ fontSize: 11, color: "var(--zk-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.ultimo_mensaje}</p>}
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: "#f59e0b", flexShrink: 0 }}>{timeAgo(c.ultimo_mensaje_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Currency Converter */}
          <div style={{ ...card, padding: 0 }}>
            <CurrencyConverter defaultFrom="MXN" defaultTo="USD" />
          </div>

          {/* Contacts without deals */}
          <div style={card}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--zk-border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
              <UserX style={{ width: 15, height: 15, color: "#8b5cf6" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--zk-text-primary)" }}>Contactos sin deals</span>
              {attention && <span style={{ fontSize: 11, color: "var(--zk-text-disabled)", marginLeft: "auto" }}>{contactsWithoutDeals.length} items</span>}
            </div>
            <div>
              {!attention ? (
                <div style={{ padding: "12px 20px" }}><Skeleton h={14} /></div>
              ) : contactsWithoutDeals.length === 0 ? (
                <p style={{ padding: "14px 20px", fontSize: 13, color: "var(--zk-text-disabled)" }}>Todos los contactos tienen deals</p>
              ) : (
                contactsWithoutDeals.map((c: any, i: number) => (
                  <div key={c.id} onClick={() => navigate("/contacts")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < contactsWithoutDeals.length - 1 ? "1px solid var(--zk-border-subtle)" : "none", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--zk-bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                    <div>
                      <p style={{ fontSize: 13, color: "var(--zk-text-primary)" }}>{c.nombre}</p>
                      {c.empresa && <p style={{ fontSize: 11, color: "var(--zk-text-muted)" }}>{c.empresa}</p>}
                    </div>
                    <p style={{ fontSize: 11, color: "var(--zk-text-disabled)" }}>{timeAgo(c.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Activity feed ── */}
        <div style={{ ...card, padding: 20, alignSelf: "flex-start" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--zk-text-primary)", marginBottom: 16 }}>Actividad reciente</p>

          {!activity ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <Skeleton w={28} h={28} radius={9999} />
                  <div style={{ flex: 1 }}>
                    <Skeleton h={13} w="85%" />
                    <div style={{ marginTop: 4 }}><Skeleton h={11} w="40%" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activityEvents.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--zk-text-disabled)" }}>Sin actividad reciente.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {activityEvents.map((event: any, i: number) => (
                <div key={`${event.entity_id}-${event.type}-${i}`}
                  style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < activityEvents.length - 1 ? "1px solid var(--zk-border-subtle)" : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "var(--zk-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {EVENT_ICONS[event.type] ?? <Circle style={{ width: 12, height: 12, color: "var(--zk-text-disabled)" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: "var(--zk-text-dim)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.label}</p>
                    <p style={{ fontSize: 11, color: "var(--zk-text-disabled)", marginTop: 2 }}>{timeAgo(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
