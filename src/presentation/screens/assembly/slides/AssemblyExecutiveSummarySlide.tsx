import { motion } from "framer-motion";
import { ExecutiveSummarySlideData } from "../../../../interfaces/assembly";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
  HomeIcon,
  SparklesIcon as SparklesOutline,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: ExecutiveSummarySlideData; isActive: boolean; }

const ICONS = {
  income: ArrowTrendingUpIcon,
  expense: ArrowTrendingDownIcon,
  balance: ScaleIcon,
  pending: ExclamationTriangleIcon,
  compliance: CheckBadgeIcon,
  tickets: WrenchScrewdriverIcon,
  projects: RocketLaunchIcon,
  units: HomeIcon,
};

const ICON_COLORS = {
  income: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  expense: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  balance: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  compliance: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  tickets: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  projects: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  units: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

export const AssemblyExecutiveSummarySlide = ({ data, isActive }: Props) => {
  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } } };
  const up = {
    hidden: { opacity: 0, y: 24, scale: 0.96, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#07070e] via-[#0a0a1a] to-[#060610]" />
      <motion.div
        className="absolute -top-1/4 left-1/3 w-[40vw] h-[40vw] rounded-full bg-indigo-500/[0.12] blur-[120px]"
        animate={{ x: [0, 50, -30, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(79,70,229,0.15)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-5">

          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-2">
              <SparklesIcon className="w-3.5 h-3.5" />
              Resumen Ejecutivo
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Vista{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">general</span>
              <span className="text-slate-400 text-lg font-semibold block mt-1">{data.period}</span>
            </h2>
          </motion.div>

          {/* KPIs grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {data.kpis.map((k, i) => {
              const Icon = (k.icon && ICONS[k.icon]) ?? SparklesOutline;
              const colorClass = (k.icon && ICON_COLORS[k.icon]) ?? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
              return (
                <motion.div
                  key={i}
                  variants={up}
                  whileHover={{ y: -4, scale: 1.025, transition: { duration: 0.25 } }}
                  className={`relative rounded-2xl border ${colorClass} p-4 overflow-hidden`}
                >
                  {/* Shimmer al entrar */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent"
                    initial={{ x: "-150%" }}
                    animate={isActive ? { x: "150%" } : { x: "-150%" }}
                    transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                  />
                  <div className="flex items-start justify-between mb-2 relative">
                    <p className="text-xs text-slate-300 font-semibold">{k.label}</p>
                    <Icon className="w-4 h-4 opacity-80" />
                  </div>
                  <motion.p
                    className="text-2xl lg:text-3xl font-black tabular-nums relative"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {k.value}
                  </motion.p>
                  <div className="flex items-center justify-between mt-1.5 relative">
                    {k.sublabel && <span className="text-[10px] text-slate-500">{k.sublabel}</span>}
                    {k.delta && (
                      <motion.span
                        initial={{ opacity: 0, x: 8 }}
                        animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
                        transition={{ duration: 0.45, delay: 0.7 + i * 0.08 }}
                        className={`ml-auto text-[10px] font-bold ${k.deltaPositive ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {k.delta}
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Highlights */}
          {data.highlights && data.highlights.length > 0 && (
            <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-indigo-400" />
                Aspectos destacados
              </p>
              <ul className="space-y-2">
                {data.highlights.map((h, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                    transition={{ duration: 0.45, delay: 0.9 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>{h}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
