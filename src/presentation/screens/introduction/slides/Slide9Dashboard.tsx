import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  HomeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

interface Slide9DashboardProps { isActive: boolean; }

const kpis = [
  { label: "Cobros del mes", value: "$48,200", sub: "+12% vs mes anterior", trend: "up", icon: ArrowTrendingUpIcon },
  { label: "Gastos del mes", value: "$21,500", sub: "−4% vs mes anterior", trend: "down", icon: ArrowTrendingDownIcon },
  { label: "Balance", value: "$26,700", sub: "Saldo disponible", trend: "neutral", icon: ScaleIcon },
  { label: "Unidades", value: "120", sub: "Residentes registrados", trend: "neutral", icon: HomeIcon },
];

const operationalItems = [
  { icon: WrenchScrewdriverIcon, label: "Tickets abiertos", value: "11", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: UserGroupIcon, label: "Residentes activos", value: "118", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: CalendarDaysIcon, label: "Reservas esta semana", value: "7", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { icon: BellAlertIcon, label: "Notificaciones enviadas", value: "234", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
];

const weekActivity = [65, 80, 55, 90, 70, 85, 60];
const weekLabels = ["L", "M", "M", "J", "V", "S", "D"];

const Slide9Dashboard = ({ isActive }: Slide9DashboardProps) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const kpiRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) return;
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.fromTo(bar, { scaleY: 0, transformOrigin: "bottom" },
        { scaleY: 1, duration: 0.5, ease: "power3.out", delay: 0.5 + i * 0.07 });
    });
    kpiRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", delay: 0.3 + i * 0.1 });
    });
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
  const up = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#07070e] via-[#0a0a1a] to-[#060610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(79,70,229,0.12)_0%,transparent_65%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-start lg:justify-center px-4 sm:px-8 lg:px-14 pt-20 pb-24 lg:py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s9" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-6">

          {/* Header */}
          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-3">
              <SparklesIcon className="w-3.5 h-3.5" />
              Panel Principal
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              Vista de{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">operaciones</span>
              <span className="text-slate-400 text-lg sm:text-xl lg:text-2xl font-semibold block mt-1">Todo el condominio en un vistazo</span>
            </h2>
          </motion.div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <div key={k.label} ref={(el) => { kpiRefs.current[i] = el; }} className="opacity-0 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-slate-500 font-medium">{k.label}</p>
                    <div className={`p-1.5 rounded-lg ${k.trend === "up" ? "bg-emerald-500/15" : k.trend === "down" ? "bg-rose-500/15" : "bg-indigo-500/15"}`}>
                      <Icon className={`w-4 h-4 ${k.trend === "up" ? "text-emerald-400" : k.trend === "down" ? "text-rose-400" : "text-indigo-400"}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white">{k.value}</p>
                  <p className={`text-[10px] mt-0.5 ${k.trend === "up" ? "text-emerald-400" : k.trend === "down" ? "text-rose-400" : "text-slate-500"}`}>{k.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Bottom: activity chart + operational health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weekly activity chart */}
            <motion.div variants={up} className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-white">Actividad semanal</p>
                  <p className="text-[10px] text-slate-500">Cobros + tickets + reservas</p>
                </div>
                <ChartBarIcon className="w-5 h-5 text-indigo-400/60" />
              </div>
              <div className="flex items-end gap-2 h-20">
                {weekActivity.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div ref={(el) => { barRefs.current[i] = el; }} className="w-full rounded-t-sm" style={{ height: `${h}%`, background: i === 3 ? "linear-gradient(180deg,#a78bfa,#6366f1)" : "rgba(99,102,241,0.25)" }} />
                    <span className="text-[9px] text-slate-600">{weekLabels[i]}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Operational health */}
            <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="text-sm font-bold text-white mb-3">Estado operativo</p>
              <div className="space-y-2.5">
                {operationalItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${item.bg}`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-xs text-slate-300">{item.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Slide9Dashboard;
