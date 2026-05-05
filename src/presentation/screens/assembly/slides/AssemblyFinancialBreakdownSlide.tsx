import { motion } from "framer-motion";
import { FinancialBreakdownSlideData } from "../../../../interfaces/assembly";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import { ChartPieIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: FinancialBreakdownSlideData; isActive: boolean; }

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const INCOME_PALETTE = ["#10b981", "#059669", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];
const EXPENSE_PALETTE = ["#f43f5e", "#fb7185", "#fda4af", "#fecdd3", "#f87171", "#fca5a5"];

export const AssemblyFinancialBreakdownSlide = ({ data, isActive }: Props) => {
  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };
  const up = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#070810] via-[#0a0a1c] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(99,102,241,0.13)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-5">

          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-2">
              <ChartPieIcon className="w-3.5 h-3.5" />
              Detalle Financiero
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Por{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">concepto</span>
              <span className="text-slate-400 text-lg font-semibold block mt-1">{data.period}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top ingresos */}
            <motion.div variants={up} className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm font-bold text-white">Top Ingresos</p>
                </div>
                <p className="text-xs text-slate-500">{fmt(data.totalIncome)}</p>
              </div>
              <div className="space-y-2">
                {data.topIncomeConcepts.length === 0 && (
                  <p className="text-xs text-slate-600 italic">Sin ingresos en este periodo.</p>
                )}
                {data.topIncomeConcepts.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="text-white truncate font-semibold">{c.concept}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 text-[10px]">{c.percentage.toFixed(1)}%</span>
                        <span className="text-emerald-300 font-bold tabular-nums">{fmt(c.amount)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={isActive ? { width: `${c.percentage}%` } : { width: 0 }}
                        transition={{ duration: 0.9, delay: 0.55 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: INCOME_PALETTE[i % INCOME_PALETTE.length] }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Top egresos */}
            <motion.div variants={up} className="rounded-2xl border border-rose-500/15 bg-rose-500/[0.04] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-rose-400" />
                  <p className="text-sm font-bold text-white">Top Egresos</p>
                </div>
                <p className="text-xs text-slate-500">{fmt(data.totalExpenses)}</p>
              </div>
              <div className="space-y-2">
                {data.topExpenseConcepts.length === 0 && (
                  <p className="text-xs text-slate-600 italic">Sin egresos en este periodo.</p>
                )}
                {data.topExpenseConcepts.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="text-white truncate font-semibold">{c.concept}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 text-[10px]">{c.percentage.toFixed(1)}%</span>
                        <span className="text-rose-300 font-bold tabular-nums">{fmt(c.amount)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={isActive ? { width: `${c.percentage}%` } : { width: 0 }}
                        transition={{ duration: 0.9, delay: 0.55 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: EXPENSE_PALETTE[i % EXPENSE_PALETTE.length] }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Métodos de pago */}
          {data.paymentMethods && data.paymentMethods.length > 0 && (
            <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCardIcon className="w-4 h-4 text-indigo-400" />
                <p className="text-sm font-bold text-white">Métodos de pago</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {data.paymentMethods.map((m, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <p className="text-[11px] text-slate-500 truncate">{m.method}</p>
                    <p className="text-base font-black text-indigo-200">{fmt(m.amount)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
