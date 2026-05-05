import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  ShieldCheckIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

interface Slide15AuditProps { isActive: boolean; }

const features = [
  { icon: ShieldCheckIcon, title: "Registro inmutable", desc: "Cada acción en el sistema queda registrada con usuario, fecha y detalle del cambio" },
  { icon: FunnelIcon, title: "Filtros avanzados", desc: "Filtra la bitácora por módulo, tipo de acción, usuario o rango de fechas" },
  { icon: DocumentMagnifyingGlassIcon, title: "Detalle de cada evento", desc: "Visualiza el estado anterior y posterior de cada cambio realizado" },
  { icon: ArrowDownTrayIcon, title: "Exportación CSV", desc: "Descarga la bitácora completa o filtrada para auditorías externas o reportes" },
  { icon: UserCircleIcon, title: "Trazabilidad por usuario", desc: "Identifica qué administrador o empleado realizó cada acción en el sistema" },
  { icon: CalendarDaysIcon, title: "Historial ilimitado", desc: "Accede al historial completo de operaciones sin restricción de tiempo" },
];

const auditLogs = [
  { user: "Admin Principal", module: "Finanzas", action: "Registro de pago", detail: "Depto. 401 — Cuota mayo $1,200", time: "Hace 3 min", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { user: "Recepcionista", module: "Paquetes", action: "Nuevo paquete", detail: "Amazon — Depto. 205, García L.", time: "Hace 15 min", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { user: "Admin Principal", module: "Personal", action: "Evaluación creada", detail: "Roberto Fuentes — Score 92%", time: "Hace 1 hora", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { user: "Técnico EstateFix", module: "Mantenimiento", action: "Ticket actualizado", detail: "#204 → En progreso", time: "Hace 2 horas", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { user: "Admin Principal", module: "Inventario", action: "Salida de stock", detail: "Pintura blanca 4L × 2 uds", time: "Hace 3 horas", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
];

const moduleStats = [
  { mod: "Finanzas", actions: 142 },
  { mod: "Mantenimiento", actions: 98 },
  { mod: "Acceso", actions: 87 },
  { mod: "Inventario", actions: 54 },
  { mod: "Personal", actions: 41 },
];

const Slide15Audit = ({ isActive }: Slide15AuditProps) => {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) return;
    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", delay: 0.5 + i * 0.1 });
    });
    const maxActions = Math.max(...moduleStats.map(m => m.actions));
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      const pct = (moduleStats[i].actions / maxActions) * 100;
      gsap.fromTo(el, { width: "0%" }, { width: `${pct}%`, duration: 0.6, ease: "power3.out", delay: 0.4 + i * 0.1 });
    });
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060810] via-[#080a1c] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(79,70,229,0.09)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(147,51,234,0.07)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s15" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                Bitácora de Auditoría
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Trazabilidad{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">total</span>
                <br />
                <span className="text-slate-300 text-2xl font-semibold">de cada acción en el sistema</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">Monitorea todo lo que ocurre en EstatAdmin con filtros, exportación y trazabilidad completa.</p>
            </motion.div>

            {/* Activity by module */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <MagnifyingGlassIcon className="w-3.5 h-3.5 text-indigo-400" />
                Actividad por módulo (mes)
              </p>
              <div className="space-y-2.5">
                {moduleStats.map((m, i) => (
                  <div key={m.mod}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">{m.mod}</span>
                      <span className="text-xs font-bold text-slate-300">{m.actions} acciones</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div ref={(el) => { barRefs.current[i] = el; }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Export CTA */}
            <motion.div variants={card} className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Exportar bitácora</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Descarga el registro completo en CSV</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold">
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  Descargar CSV
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right — audit log feed + features */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Live audit feed */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <ClockIcon className="w-3.5 h-3.5 text-indigo-400" />
                Eventos recientes
              </p>
              <div className="space-y-1.5">
                {auditLogs.map((log, i) => (
                  <div key={i} ref={(el) => { rowRefs.current[i] = el; }} className="opacity-0 flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <span className={`shrink-0 mt-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${log.bg} ${log.color}`}>{log.module}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs text-slate-300 font-medium truncate">{log.action}</span>
                        <span className="text-[10px] text-slate-600 shrink-0">{log.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{log.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Feature cards (2 col) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.slice(0, 4).map((feat) => {
                const Icon = feat.icon;
                return (
                  <motion.div key={feat.title} variants={card} className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-indigo-500/30 hover:bg-indigo-500/[0.04] transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20">
                        <Icon className="w-5 h-5 text-indigo-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1 leading-tight">{feat.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Slide15Audit;
