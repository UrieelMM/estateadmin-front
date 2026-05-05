import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

interface Slide3FinancesProps {
  isActive: boolean;
}

const stats = [
  { label: "Cobros registrados", value: "100%", sublabel: "Trazabilidad total" },
  { label: "Tiempo de conciliación", value: "−80%", sublabel: "Menos trabajo manual" },
  { label: "Reportes automáticos", value: "24/7", sublabel: "Disponibles siempre" },
];

const features = [
  {
    title: "Estado de cuenta por residente",
    desc: "Historial detallado de pagos, adeudos y saldos por unidad",
    icon: "📊",
  },
  {
    title: "Cobro de cuotas y mantenimiento",
    desc: "Automatización de cargos ordinarios y extraordinarios",
    icon: "💳",
  },
  {
    title: "Registro de gastos y proveedores",
    desc: "Control de egresos con categorías y comprobantes",
    icon: "📋",
  },
  {
    title: "Reportes e informes financieros",
    desc: "Balances, flujo de caja y estados financieros exportables",
    icon: "📈",
  },
  {
    title: "Pagos no identificados",
    desc: "Conciliación de transferencias con QR de referencia único",
    icon: "🔍",
  },
  {
    title: "Presupuesto anual",
    desc: "Planeación presupuestal con alertas de desviación",
    icon: "🏦",
  },
];

const Slide3Finances = ({ isActive }: Slide3FinancesProps) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Bar heights for a fake mini chart
  const barData = [40, 65, 50, 80, 60, 90, 75, 95];

  useEffect(() => {
    if (!isActive) return;

    // Animate bars
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.fromTo(
        bar,
        { scaleY: 0, transformOrigin: "bottom center" },
        {
          scaleY: 1,
          duration: 0.6,
          ease: "power3.out",
          delay: 0.4 + i * 0.07,
        }
      );
    });
  }, [isActive]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  const itemUp = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  const itemLeft = {
    hidden: { opacity: 0, x: -25 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070714] via-[#0a0a1e] to-[#050510]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(99,102,241,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_50%,rgba(16,185,129,0.06)_0%,transparent_60%)]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div
          key="slide3-content"
          variants={containerVariants}
          initial="hidden"
          animate={isActive ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start"
        >
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Header */}
            <motion.div variants={itemUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Módulo de Finanzas
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Control{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, #a5b4fc, #6366f1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  financiero
                </span>
                <br />
                <span className="text-slate-300 text-3xl font-semibold">sin complicaciones</span>
              </h2>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemUp} className="grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center"
                >
                  <div
                    className="text-2xl font-black mb-0.5"
                    style={{
                      background: "linear-gradient(135deg, #a5b4fc, #818cf8)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Mini bar chart */}
            <motion.div
              variants={itemUp}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cobros mensuales
                </span>
                <span className="text-xs text-indigo-400 font-medium">2024</span>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {barData.map((h, i) => (
                  <div
                    key={i}
                    ref={(el) => { barRefs.current[i] = el; }}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${h}%`,
                      background:
                        i === barData.length - 1
                          ? "linear-gradient(180deg, #818cf8, #6366f1)"
                          : "rgba(99,102,241,0.3)",
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {["E", "F", "M", "A", "M", "J", "J", "A"].map((m) => (
                  <span key={m} className="flex-1 text-center text-[10px] text-slate-600">
                    {m}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column — feature list */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                variants={itemLeft}
                custom={i}
                className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-0.5">{feat.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1 leading-tight">
                      {feat.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>

                {/* Check mark */}
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                  <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Slide3Finances;
