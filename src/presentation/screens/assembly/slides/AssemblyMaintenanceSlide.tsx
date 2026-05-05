import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { MaintenanceSlideData } from "../../../../interfaces/assembly";
import { WrenchScrewdriverIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, FireIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: MaintenanceSlideData; isActive: boolean; }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  abierto: { label: "Abierto", color: "text-amber-400" },
  en_progreso: { label: "En progreso", color: "text-indigo-400" },
  cerrado: { label: "Cerrado", color: "text-emerald-400" },
};

const PRIORITY_COLOR: Record<string, string> = {
  alta: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  media: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  baja: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export const AssemblyMaintenanceSlide = ({ data, isActive }: Props) => {
  const arcRef = useRef<SVGCircleElement>(null);

  const closedPct = data.totalTickets > 0 ? (data.closedTickets / data.totalTickets) * 100 : 0;
  const circumference = 2 * Math.PI * 52;

  useEffect(() => {
    if (!isActive || !arcRef.current) return;
    const offset = circumference - (closedPct / 100) * circumference;
    gsap.fromTo(arcRef.current,
      { strokeDashoffset: circumference },
      { strokeDashoffset: offset, duration: 1.2, ease: "power3.out", delay: 0.4 }
    );
  }, [isActive, closedPct, circumference]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
  const up = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const statCards = [
    { label: "Abiertos", value: data.openTickets, icon: ExclamationTriangleIcon, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "En progreso", value: data.inProgressTickets, icon: ClockIcon, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { label: "Cerrados", value: data.closedTickets, icon: CheckCircleIcon, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Total", value: data.totalTickets, icon: WrenchScrewdriverIcon, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060810] via-[#08091e] to-[#050612]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(79,70,229,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-5">

          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-2">
              <BoltIcon className="w-3.5 h-3.5" />
              Mantenimiento
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Reporte de{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">tickets</span>
              <span className="text-slate-400 text-lg font-semibold block mt-1">{data.period}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-3 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-3">
                {statCards.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      variants={up}
                      whileHover={{ y: -3, scale: 1.025, transition: { duration: 0.25 } }}
                      className={`relative rounded-2xl border ${s.bg} p-4 overflow-hidden`}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent"
                        initial={{ x: "-150%" }}
                        animate={isActive ? { x: "150%" } : { x: "-150%" }}
                        transition={{ duration: 1.4, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                      />
                      <Icon className={`w-5 h-5 ${s.color} mb-2`} />
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: "backOut" }}
                        className={`text-3xl font-black ${s.color} tabular-nums`}
                      >
                        {s.value}
                      </motion.div>
                      <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Sub-KPIs: prioridad alta + tiempo promedio */}
              <motion.div variants={up} className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 flex items-center gap-3">
                  <FireIcon className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Alta prioridad</p>
                    <p className="text-lg font-black text-rose-400">{data.highPriorityTickets ?? 0}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tiempo prom. resol.</p>
                    <p className="text-lg font-black text-indigo-300">
                      {data.avgResolutionHours !== undefined && data.avgResolutionHours > 0
                        ? data.avgResolutionHours >= 24
                          ? `${(data.avgResolutionHours / 24).toFixed(1)} d`
                          : `${data.avgResolutionHours.toFixed(1)} h`
                        : "—"}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Áreas con más tickets */}
              {data.topAreas && data.topAreas.length > 0 && (
                <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <p className="text-sm font-bold text-white mb-3">Áreas con más tickets</p>
                  <div className="space-y-2">
                    {data.topAreas.map((a, i) => {
                      const max = Math.max(...data.topAreas!.map((x) => x.count), 1);
                      const pct = (a.count / max) * 100;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="text-slate-300">{a.area}</span>
                            <span className="text-white font-bold">{a.count}</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right — donut + highlights */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 flex flex-col items-center gap-2">
                <p className="text-sm text-slate-400 font-medium">Tickets resueltos</p>
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    <circle
                      ref={arcRef}
                      cx="60" cy="60" r="52"
                      fill="none"
                      stroke="url(#assemblyGrad)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference}
                    />
                    <defs>
                      <linearGradient id="assemblyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">{closedPct.toFixed(0)}%</span>
                    <span className="text-[10px] text-slate-500">resueltos</span>
                  </div>
                </div>
              </motion.div>

              {data.highlights && data.highlights.length > 0 && (
                <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <p className="text-xs font-bold text-white mb-2">Tickets destacados</p>
                  <div className="space-y-1.5">
                    {data.highlights.slice(0, 5).map((t, i) => {
                      const status = STATUS_LABEL[t.status] ?? { label: t.status, color: "text-slate-400" };
                      return (
                        <div key={i} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-[10px] font-mono text-slate-500">{t.folio}</span>
                            {t.priority && (
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${PRIORITY_COLOR[t.priority] ?? ""}`}>
                                {t.priority}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-white truncate">{t.title}</span>
                            <span className={`text-[10px] font-semibold ${status.color}`}>{status.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
