import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { FinancialSlideData } from "../../../../interfaces/assembly";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: FinancialSlideData; isActive: boolean; }

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

/** Hook para animar números desde 0 hasta valor objetivo */
function useCountUp(target: number, isActive: boolean, duration = 1200, delay = 200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!isActive) {
      setValue(0);
      return;
    }
    let raf = 0;
    let start = 0;
    const begin = performance.now() + delay;
    const animate = (t: number) => {
      if (t < begin) {
        raf = requestAnimationFrame(animate);
        return;
      }
      if (start === 0) start = t;
      const progress = Math.min(1, (t - begin) / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, isActive, duration, delay]);
  return value;
}

export const AssemblyFinancialSlide = ({ data, isActive }: Props) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const maxVal = Math.max(...data.monthlyStats.map((m) => Math.max(m.income, m.expenses)), 1);

  useEffect(() => {
    if (!isActive) return;
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { scaleY: 0, transformOrigin: "bottom" },
        { scaleY: 1, duration: 0.7, ease: "elastic.out(1, 0.7)", delay: 0.45 + i * 0.05 }
      );
    });
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.15 } } };
  const up = { hidden: { opacity: 0, y: 20, filter: "blur(4px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

  const incomeAnim = useCountUp(data.totalIncome, isActive, 1300, 250);
  const expenseAnim = useCountUp(data.totalExpenses, isActive, 1300, 350);
  const balanceAnim = useCountUp(data.balance, isActive, 1400, 450);
  const pendingAnim = useCountUp(data.totalPending, isActive, 1300, 550);

  const kpis = [
    { label: "Ingresos", value: fmt(incomeAnim), icon: ArrowTrendingUpIcon, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Egresos", value: fmt(expenseAnim), icon: ArrowTrendingDownIcon, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    { label: "Balance", value: fmt(balanceAnim), icon: ScaleIcon, color: data.balance >= 0 ? "text-indigo-400" : "text-amber-400", bg: data.balance >= 0 ? "bg-indigo-500/10 border-indigo-500/20" : "bg-amber-500/10 border-amber-500/20" },
    { label: "Por cobrar", value: fmt(pendingAnim), icon: ExclamationTriangleIcon, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#07070e] via-[#0a0a1a] to-[#060610]" />
      <motion.div
        className="absolute -top-40 left-1/4 w-[40vw] h-[40vw] rounded-full bg-indigo-500/[0.10] blur-[100px]"
        animate={{ x: [0, 40, -20, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 right-0 w-[35vw] h-[35vw] rounded-full bg-emerald-500/[0.06] blur-[100px]"
        animate={{ x: [0, -30, 15, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(79,70,229,0.12)_0%,transparent_65%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-5">
          {/* Header */}
          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-2">
              <SparklesIcon className="w-3.5 h-3.5" />
              Resumen Financiero
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Estado{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">financiero</span>
              <span className="text-slate-400 text-lg font-semibold block mt-1">{data.period}</span>
            </h2>
          </motion.div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div
                  key={k.label}
                  variants={up}
                  whileHover={{ y: -3, scale: 1.02, transition: { duration: 0.25 } }}
                  className={`relative rounded-xl border ${k.bg} p-4 overflow-hidden`}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent"
                    initial={{ x: "-150%" }}
                    animate={isActive ? { x: "150%" } : { x: "-150%" }}
                    transition={{ duration: 1.4, delay: 0.6 + i * 0.12, ease: "easeOut" }}
                  />
                  <div className="flex items-start justify-between mb-2 relative">
                    <p className="text-xs text-slate-500 font-medium">{k.label}</p>
                    <Icon className={`w-4 h-4 ${k.color}`} />
                  </div>
                  <p className={`text-xl lg:text-2xl font-black ${k.color} tabular-nums relative`}>{k.value}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly chart */}
            {data.monthlyStats.length > 0 && (
              <motion.div variants={up} className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="text-sm font-bold text-white mb-1">Ingresos vs Egresos por mes</p>
                <p className="text-[10px] text-slate-500 mb-3">{data.period}</p>
                <div className="flex items-end gap-1.5 h-28">
                  {data.monthlyStats.map((m, i) => {
                    const incH = (m.income / maxVal) * 100;
                    const expH = (m.expenses / maxVal) * 100;
                    const barIdx = i * 2;
                    return (
                      <div key={`${m.month}-${i}`} className="flex-1 flex flex-col items-stretch gap-1">
                        <div className="flex-1 flex gap-0.5 items-end">
                          <div className="flex-1 flex flex-col items-center gap-1">
                            <div ref={(el) => { barRefs.current[barIdx] = el; }} className="w-full rounded-t-sm bg-emerald-500/40" style={{ height: `${incH}%` }} />
                          </div>
                          <div className="flex-1 flex flex-col items-center gap-1">
                            <div ref={(el) => { barRefs.current[barIdx + 1] = el; }} className="w-full rounded-t-sm bg-rose-500/40" style={{ height: `${expH}%` }} />
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-600 text-center">{MONTH_LABELS[parseInt(m.month, 10) - 1] ?? m.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" /><span className="text-[10px] text-slate-500">Ingresos</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-rose-500/60" /><span className="text-[10px] text-slate-500">Egresos</span></div>
                </div>
              </motion.div>
            )}

            {/* Comparativa con periodo anterior */}
            {data.previousPeriod && (
              <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="text-sm font-bold text-white mb-1">vs Periodo anterior</p>
                <p className="text-[10px] text-slate-500 mb-4">{data.previousPeriod.label}</p>
                <div className="space-y-3">
                  <ComparisonRow label="Ingresos" current={data.totalIncome} previous={data.previousPeriod.totalIncome} higherIsBetter />
                  <ComparisonRow label="Egresos" current={data.totalExpenses} previous={data.previousPeriod.totalExpenses} higherIsBetter={false} />
                  <ComparisonRow label="Balance" current={data.balance} previous={data.previousPeriod.balance} higherIsBetter />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function ComparisonRow({
  label,
  current,
  previous,
  higherIsBetter,
}: {
  label: string;
  current: number;
  previous: number;
  higherIsBetter: boolean;
}) {
  const change = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : current === 0 ? 0 : 100;
  const isUp = current > previous;
  const isGood = (isUp && higherIsBetter) || (!isUp && !higherIsBetter);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[11px] text-slate-500">{label}</span>
        <span className={`text-[11px] font-bold ${isGood ? "text-emerald-400" : "text-rose-400"}`}>
          {change >= 0 ? "+" : ""}{change.toFixed(1)}%
        </span>
      </div>
      <div className="text-xs text-white font-semibold">{fmt(current)}</div>
      <div className="text-[10px] text-slate-600">antes: {fmt(previous)}</div>
    </div>
  );
}
