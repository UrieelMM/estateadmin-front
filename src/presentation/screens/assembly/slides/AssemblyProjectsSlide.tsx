import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ProjectsSlideData } from "../../../../interfaces/assembly";
import { RocketLaunchIcon, CurrencyDollarIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: ProjectsSlideData; isActive: boolean; }

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: "Planeación", color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/30" },
  in_progress: { label: "En progreso", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  completed: { label: "Completado", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  cancelled: { label: "Cancelado", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30" },
  on_hold: { label: "En pausa", color: "text-slate-400", bg: "bg-slate-500/15 border-slate-500/30" },
};

export const AssemblyProjectsSlide = ({ data, isActive }: Props) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) return;
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      const pct = data.projects[i]?.progress ?? 0;
      gsap.fromTo(el, { width: "0%" }, { width: `${pct}%`, duration: 0.7, ease: "power3.out", delay: 0.4 + i * 0.1 });
    });
  }, [isActive, data]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
  const up = {
    hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const totalBudget = data.projects.reduce((a, p) => a + p.budget, 0);
  const totalSpent = data.projects.reduce((a, p) => a + p.spent, 0);

  // Single project mode: si solo hay 1, mostrar vista detallada
  const singleMode = data.projects.length === 1;
  const single = singleMode ? data.projects[0] : null;

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060810] via-[#08091c] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(147,51,234,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        {single ? (
          <SingleProjectView data={single} isActive={isActive} />
        ) : (
          <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* Left */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <motion.div variants={up}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium tracking-widest uppercase mb-2">
                  <BoltIcon className="w-3.5 h-3.5" />
                  Proyectos
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                  Avance de{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">proyectos</span>
                </h2>
              </motion.div>

              <motion.div variants={up} className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-purple-500/10 border-purple-500/20 p-4">
                  <RocketLaunchIcon className="w-5 h-5 text-purple-400 mb-2" />
                  <div className="text-2xl font-black text-purple-400">{data.projects.length}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Proyectos</div>
                </div>
                <div className="rounded-xl border bg-indigo-500/10 border-indigo-500/20 p-4">
                  <CurrencyDollarIcon className="w-5 h-5 text-indigo-400 mb-2" />
                  <div className="text-lg font-black text-indigo-400">{fmt(totalBudget)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Presupuesto total</div>
                </div>
              </motion.div>

              <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Ejercido</span>
                  <span>{totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    style={{ width: totalBudget > 0 ? `${Math.min((totalSpent / totalBudget) * 100, 100)}%` : "0%" }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                  <span>{fmt(totalSpent)} ejercido</span>
                  <span>{fmt(totalBudget)} total</span>
                </div>
              </motion.div>
            </div>

            {/* Right — project list */}
            <div className="lg:col-span-3 flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
              {data.projects.map((p, i) => {
                const s = STATUS_LABEL[p.status] ?? STATUS_LABEL["planning"];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 24, scale: 0.97 }}
                    animate={isActive ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 24, scale: 0.97 }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: -4, borderColor: "rgba(168,85,247,0.4)", transition: { duration: 0.2 } }}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-colors cursor-default"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-white leading-tight block truncate">{p.name}</span>
                        {(p.startDate || p.endDate) && (
                          <span className="text-[10px] text-slate-600">
                            {p.startDate ?? "?"} → {p.endDate ?? "?"}
                          </span>
                        )}
                      </div>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span>Avance</span>
                      <span className="font-bold text-white">{p.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div ref={(el) => { barRefs.current[i] = el; }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: "0%" }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                      <span>{fmt(p.spent)} ejercido</span>
                      <span>{fmt(p.budget)} presupuesto</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

function SingleProjectView({ data: p, isActive }: { data: ProjectsSlideData["projects"][number]; isActive: boolean }) {
  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
  const up = {
    hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };
  const s = STATUS_LABEL[p.status] ?? STATUS_LABEL["planning"];
  const remaining = Math.max(0, p.budget - p.spent);
  const overBudget = p.spent > p.budget;

  return (
    <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-5">
      <motion.div variants={up}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium tracking-widest uppercase mb-2">
          <BoltIcon className="w-3.5 h-3.5" />
          Proyecto
        </div>
        <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight">{p.name}</h2>
        {p.description && (
          <p className="text-sm text-slate-400 mt-2 max-w-3xl line-clamp-3">{p.description}</p>
        )}
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div variants={up} className={`rounded-xl border ${s.bg} p-4`}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Estado</p>
          <p className={`text-lg font-black ${s.color}`}>{s.label}</p>
        </motion.div>
        <motion.div variants={up} className="rounded-xl border bg-purple-500/10 border-purple-500/20 p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Avance</p>
          <p className="text-lg font-black text-purple-300">{p.progress}%</p>
        </motion.div>
        <motion.div variants={up} className="rounded-xl border bg-indigo-500/10 border-indigo-500/20 p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Presupuesto</p>
          <p className="text-lg font-black text-indigo-300">{fmt(p.budget)}</p>
        </motion.div>
        <motion.div variants={up} className={`rounded-xl border p-4 ${overBudget ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{overBudget ? "Excedente" : "Restante"}</p>
          <p className={`text-lg font-black ${overBudget ? "text-rose-300" : "text-emerald-300"}`}>{fmt(overBudget ? p.spent - p.budget : remaining)}</p>
        </motion.div>
      </div>

      {/* Progreso */}
      <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>{fmt(p.spent)} ejercido</span>
          <span>{fmt(p.budget)} presupuesto</span>
        </div>
        <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            style={{ width: p.budget > 0 ? `${Math.min((p.spent / p.budget) * 100, 100)}%` : "0%" }}
          />
        </div>
        {(p.startDate || p.endDate) && (
          <p className="text-[10px] text-slate-600 mt-2">
            {p.startDate ?? "?"} → {p.endDate ?? "?"}
          </p>
        )}
      </motion.div>

      {/* Top expenses */}
      {p.topExpenses && p.topExpenses.length > 0 && (
        <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardDocumentListIcon className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-bold text-white">Principales gastos</p>
            <span className="ml-auto text-[10px] text-slate-500">
              {p.expensesCount ?? p.topExpenses.length} gasto{(p.expensesCount ?? 0) === 1 ? "" : "s"} totales
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {p.topExpenses.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-white font-semibold truncate">{e.concept}</p>
                  <p className="text-[10px] text-slate-600">{e.date}</p>
                </div>
                <p className="text-sm font-black text-rose-400 shrink-0">{fmt(e.amount)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
