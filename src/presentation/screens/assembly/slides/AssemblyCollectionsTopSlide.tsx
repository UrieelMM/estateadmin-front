import { motion } from "framer-motion";
import { CollectionsTopSlideData } from "../../../../interfaces/assembly";
import { ExclamationTriangleIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: CollectionsTopSlideData; isActive: boolean; }

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export const AssemblyCollectionsTopSlide = ({ data, isActive }: Props) => {
  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
  const up = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

  const totalDebt = data.topDebtors.reduce((a, d) => a + d.pendingAmount, 0);
  const max = Math.max(...data.topDebtors.map((d) => d.pendingAmount), 1);

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0610] via-[#0d0712] to-[#08050c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(244,63,94,0.13)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(244,63,94,1) 1px,transparent 1px),linear-gradient(90deg,rgba(244,63,94,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-6xl mx-auto w-full">
        <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-5">

          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-medium tracking-widest uppercase mb-2">
              <BoltIcon className="w-3.5 h-3.5" />
              Top morosos
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Unidades con{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-amber-400 to-orange-400">mayor adeudo</span>
              <span className="text-slate-400 text-lg font-semibold block mt-1">{data.period}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-1">
            <motion.div variants={up} className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
              <ExclamationTriangleIcon className="w-5 h-5 text-rose-400 mb-2" />
              <p className="text-2xl font-black text-rose-300">{data.topDebtors.length}</p>
              <p className="text-[11px] text-slate-500">Unidades en lista</p>
            </motion.div>
            <motion.div variants={up} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-[11px] text-slate-500 mb-1">Adeudo acumulado</p>
              <p className="text-xl font-black text-amber-300">{fmt(totalDebt)}</p>
            </motion.div>
            {data.anonymized && (
              <motion.div variants={up} className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 flex items-center gap-2">
                <EyeSlashIcon className="w-5 h-5 text-indigo-400" />
                <p className="text-[11px] text-indigo-200">Lista anonimizada</p>
              </motion.div>
            )}
          </div>

          {/* Lista */}
          <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="divide-y divide-white/[0.05] max-h-[420px] overflow-y-auto">
              {data.topDebtors.map((d, i) => {
                const pct = (d.pendingAmount / max) * 100;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                    transition={{ duration: 0.4, delay: 0.35 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.04)", transition: { duration: 0.2 } }}
                    className="px-5 py-3 flex items-center gap-4 cursor-default"
                  >
                    <span className="w-8 text-right text-xs font-mono text-slate-500 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2 mb-1">
                        <span className="text-sm font-bold text-white truncate">{d.label}</span>
                        <span className="text-sm font-black text-rose-300 shrink-0 tabular-nums">{fmt(d.pendingAmount)}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={isActive ? { width: `${pct}%` } : { width: 0 }}
                          transition={{ duration: 0.9, delay: 0.5 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-400"
                        />
                      </div>
                      {d.monthsBehind !== undefined && d.monthsBehind > 0 && (
                        <p className="text-[10px] text-slate-600 mt-1">
                          {d.monthsBehind} mes{d.monthsBehind === 1 ? "" : "es"} con adeudo
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {data.topDebtors.length === 0 && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-emerald-300 text-sm italic px-5 py-6 text-center"
                >
                  ✨ No hay unidades con adeudo en este periodo. ¡Excelente!
                </motion.p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
