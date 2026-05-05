import { motion } from "framer-motion";
import { ComparisonSlideData } from "../../../../interfaces/assembly";
import { ArrowsRightLeftIcon, ArrowUpIcon, ArrowDownIcon, MinusIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: ComparisonSlideData; isActive: boolean; }

const fmtMxn = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

function formatValue(v: number, fmt: "currency" | "percent" | "number") {
  if (fmt === "currency") return fmtMxn(v);
  if (fmt === "percent") return `${v.toFixed(1)}%`;
  return v.toLocaleString("es-MX");
}

export const AssemblyComparisonSlide = ({ data, isActive }: Props) => {
  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
  const up = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06081a] via-[#0a0a22] to-[#050614]" />
      <motion.div
        className="absolute top-1/4 -left-1/4 w-[40vw] h-[40vw] rounded-full bg-purple-500/[0.10] blur-[120px]"
        animate={{ x: [0, 60, 20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full bg-pink-500/[0.08] blur-[120px]"
        animate={{ x: [0, -40, 30, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(168,85,247,0.12)_0%,transparent_65%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-5">

          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium tracking-widest uppercase mb-2">
              <BoltIcon className="w-3.5 h-3.5" />
              Comparativa {data.comparisonType === "monthly" ? "mensual" : "de periodo"}
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{data.currentLabel}</span>
              <span className="text-slate-500 mx-3">vs</span>
              <span className="text-slate-300">{data.previousLabel}</span>
            </h2>
          </motion.div>

          {/* Tabla de comparativa */}
          <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.07] bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              <div className="col-span-3">Métrica</div>
              <div className="col-span-3 text-right">{data.currentLabel}</div>
              <div className="col-span-3 text-right">{data.previousLabel}</div>
              <div className="col-span-3 text-right">Variación</div>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {data.metrics.map((m, i) => {
                const change = m.previous !== 0
                  ? ((m.current - m.previous) / Math.abs(m.previous)) * 100
                  : (m.current === 0 ? 0 : (m.current > 0 ? 100 : -100));
                const isUp = m.current > m.previous;
                const isFlat = m.current === m.previous;
                const isGood = (isUp && m.higherIsBetter) || (!isUp && !m.higherIsBetter && !isFlat);
                const Arrow = isFlat ? MinusIcon : isUp ? ArrowUpIcon : ArrowDownIcon;
                const variantColor = isFlat ? "text-slate-400" : isGood ? "text-emerald-400" : "text-rose-400";
                const variantBg = isFlat
                  ? "bg-white/[0.03] border-white/[0.05]"
                  : isGood
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-rose-500/10 border-rose-500/20";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                    transition={{ duration: 0.45, delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-default"
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <ArrowsRightLeftIcon className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-sm text-white font-semibold">{m.label}</span>
                    </div>
                    <div className="col-span-3 text-right text-base text-white font-bold tabular-nums">{formatValue(m.current, m.format)}</div>
                    <div className="col-span-3 text-right text-base text-slate-400 tabular-nums">{formatValue(m.previous, m.format)}</div>
                    <div className="col-span-3 flex justify-end">
                      <motion.span
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + i * 0.08, ease: "backOut" }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${variantBg} ${variantColor} text-xs font-bold`}
                      >
                        <motion.span
                          animate={!isFlat && isActive ? { y: isUp ? [-1, 1, -1] : [1, -1, 1] } : {}}
                          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Arrow className="w-3.5 h-3.5" />
                        </motion.span>
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={up} className="text-[11px] text-slate-500 text-center">
            Variaciones positivas en verde, negativas en rojo. Para egresos y morosidad la disminución se considera favorable.
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
