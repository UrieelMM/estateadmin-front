import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

interface Slide2FeaturesProps {
  isActive: boolean;
}

const modules = [
  {
    number: "01",
    title: "Finanzas",
    description: "Control de pagos, cobros, gastos y presupuestos en tiempo real",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: "from-indigo-500 to-blue-600",
    glow: "rgba(99,102,241,0.3)",
    delay: 0,
  },
  {
    number: "02",
    title: "Mantenimiento",
    description: "Tickets, seguimiento y reportes de incidencias del condominio",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    gradient: "from-purple-500 to-pink-600",
    glow: "rgba(139,92,246,0.3)",
    delay: 0.08,
  },
  {
    number: "03",
    title: "Proyectos",
    description: "Planificación y control de obras con presupuesto y avances",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    gradient: "from-violet-500 to-indigo-600",
    glow: "rgba(124,58,237,0.3)",
    delay: 0.16,
  },
  {
    number: "04",
    title: "Reservas",
    description: "Gestión de áreas comunes con calendario y disponibilidad",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
    gradient: "from-blue-500 to-cyan-600",
    glow: "rgba(59,130,246,0.3)",
    delay: 0.24,
  },
  {
    number: "05",
    title: "Notificaciones",
    description: "Alertas automáticas por WhatsApp y correo electrónico",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    gradient: "from-pink-500 to-rose-600",
    glow: "rgba(236,72,153,0.3)",
    delay: 0.32,
  },
  {
    number: "06",
    title: "Acceso de Visitas",
    description: "Control de ingreso con QR, validación y registro en tiempo real",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.3)",
    delay: 0.4,
  },
];

const Slide2Features = ({ isActive }: Slide2FeaturesProps) => {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    if (lineRef.current) {
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 1.2, ease: "power3.out", delay: 0.3 }
      );
    }
  }, [isActive]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#080818] via-[#0c0c22] to-[#06060f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.1)_0%,transparent_70%)]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 px-8 lg:px-16 py-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          key="slide2-header"
          variants={headerVariants}
          initial="hidden"
          animate={isActive ? "visible" : "hidden"}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Módulos del sistema
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-3">
            Todo lo que necesitas,{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #a5b4fc, #c4b5fd, #818cf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              en un solo lugar
            </span>
          </h2>
          <div ref={lineRef} className="h-0.5 w-32 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
        </motion.div>

        {/* Cards grid */}
        <motion.div
          key="slide2-grid"
          variants={containerVariants}
          initial="hidden"
          animate={isActive ? "visible" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {modules.map((mod) => (
            <motion.div
              key={mod.title}
              variants={cardVariants}
              className="group relative"
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: mod.glow }}
              />

              {/* Card */}
              <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-sm p-5 hover:border-white/[0.15] transition-all duration-300 hover:bg-white/[0.07] group-hover:transform group-hover:scale-[1.02]">
                {/* Number + icon row */}
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-bold text-slate-600 tracking-widest">
                    {mod.number}
                  </span>
                  <div
                    className={`p-2 rounded-xl bg-gradient-to-br ${mod.gradient} shadow-lg text-white`}
                  >
                    {mod.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-white mb-1.5">{mod.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{mod.description}</p>

                {/* Bottom border accent */}
                <div
                  className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${mod.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-300`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Slide2Features;
