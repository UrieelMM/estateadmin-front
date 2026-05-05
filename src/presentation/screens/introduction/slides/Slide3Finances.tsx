import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { CurrencyDollarIcon, DocumentChartBarIcon, WalletIcon, BuildingLibraryIcon, MagnifyingGlassCircleIcon, BanknotesIcon, ReceiptRefundIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

interface Slide3FinancesProps { isActive: boolean; }

const stats = [
  { label: "Recibo automático al pagar", value: "PDF" },
  { label: "Conciliación bancaria", value: "CSV" },
  { label: "Reportes disponibles", value: "24/7" },
];

const features = [
  { icon: CurrencyDollarIcon, title: "Estado de cuenta por residente", desc: "Historial de cargos, pagos, saldos a favor y morosidad por unidad" },
  { icon: WalletIcon, title: "Cobro de cuotas y cargos extras", desc: "Cargos ordinarios y extraordinarios con folio, recordatorios y recibos" },
  { icon: DocumentChartBarIcon, title: "Egresos con comprobante", desc: "Categorías, proveedores, factura adjunta y vinculación con proyectos" },
  { icon: ArrowsRightLeftIcon, title: "Conciliación bancaria", desc: "Carga el CSV de tu banco y el sistema empareja movimientos con pagos y egresos" },
  { icon: MagnifyingGlassCircleIcon, title: "Pagos no identificados", desc: "Bandeja para asignar transferencias sin referencia al residente correcto" },
  { icon: BanknotesIcon, title: "Caja chica", desc: "Transacciones, umbrales y cortes con auditoría" },
  { icon: BuildingLibraryIcon, title: "Cuentas financieras", desc: "Múltiples cuentas con saldo inicial y desglose por movimiento" },
  { icon: ReceiptRefundIcon, title: "Reversiones y recibos masivos", desc: "Anula pagos con bitácora y reenvía paquetes de recibos por correo" },
];

const barData = [40, 65, 50, 80, 60, 90, 75, 95];

const Slide3Finances = ({ isActive }: Slide3FinancesProps) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) return;
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.fromTo(bar, { scaleY: 0, transformOrigin: "bottom center" }, { scaleY: 1, duration: 0.6, ease: "power3.out", delay: 0.4 + i * 0.07 });
    });
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } } };
  const up = { hidden: { opacity: 0, y: 25 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const lft = { hidden: { opacity: 0, x: -25 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#070714] via-[#0a0a1e] to-[#050510]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(79,70,229,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-start lg:justify-center px-4 sm:px-8 lg:px-14 pt-20 pb-24 lg:py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s3" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <motion.div variants={up}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
                <SparklesIcon className="w-3.5 h-3.5" />
                Módulo de Finanzas
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Control{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">financiero</span>
                <br />
                <span className="text-slate-300 text-xl sm:text-2xl lg:text-3xl font-semibold">sin complicaciones</span>
              </h2>
            </motion.div>

            <motion.div variants={up} className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                  <div className="text-2xl font-black mb-0.5 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{s.value}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{s.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={up} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cobros mensuales</span>
                <span className="text-xs text-indigo-400 font-medium">2024</span>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {barData.map((h, i) => (
                  <div key={i} ref={(el) => { barRefs.current[i] = el; }} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i === barData.length - 1 ? "linear-gradient(180deg,#818cf8,#6366f1)" : "rgba(99,102,241,0.3)" }} />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {["E","F","M","A","M","J","J","A"].map((m) => (
                  <span key={m} className="flex-1 text-center text-[10px] text-slate-600">{m}</span>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <motion.div key={feat.title} variants={lft} className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20">
                      <Icon className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1 leading-tight">{feat.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                    <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Slide3Finances;
