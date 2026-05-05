import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { CollectionsSlideData } from "../../../../interfaces/assembly";
import { HomeIcon, CheckCircleIcon, ExclamationTriangleIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: CollectionsSlideData; isActive: boolean; }

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export const AssemblyCollectionsSlide = ({ data, isActive }: Props) => {
  const compBarRef = useRef<HTMLDivElement>(null);
  const delinqBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    if (compBarRef.current)
      gsap.fromTo(compBarRef.current, { width: "0%" }, { width: `${data.complianceRate}%`, duration: 1, ease: "power3.out", delay: 0.5 });
    if (delinqBarRef.current)
      gsap.fromTo(delinqBarRef.current, { width: "0%" }, { width: `${data.delinquencyRate}%`, duration: 1, ease: "power3.out", delay: 0.65 });
  }, [isActive, data]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
  const up = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const stats = [
    { label: "Total unidades", value: data.totalUnits, icon: HomeIcon, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { label: "Al corriente", value: data.paidUnits, icon: CheckCircleIcon, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Con adeudo", value: data.pendingUnits, icon: ExclamationTriangleIcon, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Monto pendiente", value: fmt(data.pendingAmount), icon: CurrencyDollarIcon, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  ];

  const showMonthlyChart = data.monthlyCompliance && data.monthlyCompliance.length > 1;

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060810] via-[#08091c] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(79,70,229,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-6">

          {/* Header */}
          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-2">
              <BoltIcon className="w-3.5 h-3.5" />
              Estado de Cobros
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Cumplimiento de{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">pagos</span>
              <span className="text-slate-400 text-lg font-semibold block mt-1">{data.period}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left */}
            <div className="flex flex-col gap-5">
              <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-300 font-medium">Tasa de cumplimiento</span>
                    <span className="text-sm font-black text-emerald-400">{data.complianceRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                    <div ref={compBarRef} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: "0%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-300 font-medium">Tasa de morosidad</span>
                    <span className="text-sm font-black text-rose-400">{data.delinquencyRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                    <div ref={delinqBarRef} className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: "0%" }} />
                  </div>
                </div>

                {data.previousPeriod && (
                  <div className="pt-3 border-t border-white/[0.06]">
                    <p className="text-[11px] text-slate-500 mb-2">vs {data.previousPeriod.label}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Cumplimiento</span>
                        <span className="text-white font-bold">{data.previousPeriod.complianceRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Pendiente</span>
                        <span className="text-white font-bold">{fmt(data.previousPeriod.pendingAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {showMonthlyChart && (
                <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                  <p className="text-sm font-bold text-white mb-3">Cumplimiento mensual</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {data.monthlyCompliance!.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-emerald-500/40 rounded-t-sm" style={{ height: `${Math.max(2, m.complianceRate)}%` }} />
                        <span className="text-[9px] text-slate-600">{MONTH_LABELS[parseInt(m.month, 10) - 1] ?? m.month}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right — stat grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    variants={up}
                    whileHover={{ y: -3, scale: 1.03, transition: { duration: 0.25 } }}
                    className={`relative rounded-2xl border ${s.bg} p-5 overflow-hidden`}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent"
                      initial={{ x: "-150%" }}
                      animate={isActive ? { x: "150%" } : { x: "-150%" }}
                      transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                    />
                    <Icon className={`w-6 h-6 ${s.color} mb-3`} />
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.5, delay: 0.45 + i * 0.08, ease: "backOut" }}
                      className={`text-3xl font-black ${s.color} tabular-nums`}
                    >
                      {s.value}
                    </motion.div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-tight">{s.label}</div>
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
