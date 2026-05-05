import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

interface Slide2FeaturesProps {
  isActive: boolean;
}

const modules = [
  { number: "01", title: "Finanzas", description: "Cargos, pagos, egresos, conciliación bancaria y caja chica con recibos automáticos", gradient: "from-indigo-500 to-blue-600", border: "group-hover:border-indigo-500/40" },
  { number: "02", title: "Proyectos", description: "Obras con presupuesto, cotizaciones, hitos y gastos por proyecto", gradient: "from-violet-500 to-indigo-600", border: "group-hover:border-violet-500/40" },
  { number: "03", title: "Reservas", description: "Áreas comunes con calendario, disponibilidad y confirmación por WhatsApp", gradient: "from-pink-500 to-rose-600", border: "group-hover:border-pink-500/40" },
  { number: "04", title: "Mantenimiento", description: "Tickets con prioridad, asignación, evidencias y citas con técnicos", gradient: "from-purple-500 to-pink-600", border: "group-hover:border-purple-500/40" },
  { number: "05", title: "Notificaciones", description: "WhatsApp y correo automáticos al aplicar pagos, reservar y recibir paquetes", gradient: "from-emerald-500 to-teal-600", border: "group-hover:border-emerald-500/40" },
  { number: "06", title: "Acceso de visitas", description: "QR firmado, programación por chatbot WhatsApp y registro en caseta con PIN", gradient: "from-purple-500 to-indigo-600", border: "group-hover:border-purple-500/40" },
  { number: "07", title: "Inventario", description: "Items con stock mínimo, movimientos y alertas de bajo stock", gradient: "from-amber-500 to-orange-600", border: "group-hover:border-amber-500/40" },
  { number: "08", title: "Paquetería", description: "Recepción de paquetes con foto y aviso al residente por correo", gradient: "from-cyan-500 to-blue-600", border: "group-hover:border-cyan-500/40" },
  { number: "09", title: "Personal y avisos", description: "Empleados, turnos, asistencia y comunicados masivos a residentes", gradient: "from-rose-500 to-pink-600", border: "group-hover:border-rose-500/40" },
];

const Slide2Features = ({ isActive }: Slide2FeaturesProps) => {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    if (lineRef.current) {
      gsap.fromTo(lineRef.current, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.2, ease: "power3.out", delay: 0.3 });
    }
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 30, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#080818] via-[#0c0c22] to-[#06060f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(79,70,229,0.1)_0%,transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-8 lg:px-16 py-10 max-w-7xl mx-auto w-full">
        <motion.div key="s2-hdr" variants={hdr} initial="hidden" animate={isActive ? "visible" : "hidden"} className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Módulos del sistema
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-3">
            Todo lo que necesitas,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              en un solo lugar
            </span>
          </h2>
          <div ref={lineRef} className="h-0.5 w-32 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" />
        </motion.div>

        <motion.div key="s2-grid" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <motion.div key={mod.title} variants={card} className="group relative">
              <div className={`relative rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-sm p-5 hover:bg-white/[0.07] transition-all duration-300 hover:scale-[1.02] ${mod.border}`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-bold text-slate-600 tracking-widest">{mod.number}</span>
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${mod.gradient} shadow-lg`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1.5">{mod.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{mod.description}</p>
                <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${mod.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Slide2Features;
