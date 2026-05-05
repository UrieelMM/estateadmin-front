import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { RocketLaunchIcon, CurrencyDollarIcon, ClipboardDocumentCheckIcon, CalendarDaysIcon, UsersIcon, ChartBarIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

interface Slide4ProjectsProps { isActive: boolean; }

const features = [
  { icon: RocketLaunchIcon, title: "Creación de proyectos", desc: "Define alcance, fechas y responsables desde un solo panel" },
  { icon: CurrencyDollarIcon, title: "Control de presupuesto", desc: "Asigna y monitorea el presupuesto con alertas de desviación" },
  { icon: ClipboardDocumentCheckIcon, title: "Tareas y avances", desc: "Divide el proyecto en tareas, asigna equipos y registra el progreso" },
  { icon: CalendarDaysIcon, title: "Cronograma", desc: "Visualiza fechas de inicio y cierre con vista de línea de tiempo" },
  { icon: UsersIcon, title: "Proveedores y contratistas", desc: "Vincula proveedores al proyecto con historial de contratos" },
  { icon: ChartBarIcon, title: "Reportes de avance", desc: "Informes ejecutivos con porcentaje y costo real vs. estimado" },
];

const phases = [
  { label: "Planificación", pct: 100 },
  { label: "Ejecución", pct: 68 },
  { label: "Revisión", pct: 34 },
  { label: "Cierre", pct: 10 },
];

const Slide4Projects = ({ isActive }: Slide4ProjectsProps) => {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) return;
    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.fromTo(bar, { width: 0 }, { width: bar.dataset.pct + "%", duration: 0.8, ease: "power3.out", delay: 0.5 + i * 0.12 });
    });
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#080816] via-[#0c0b20] to-[#060510]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(124,58,237,0.1)_0%,transparent_65%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s4" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                Módulo de Proyectos
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Gestión de{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">proyectos</span>
                <br />
                <span className="text-slate-300 text-2xl font-semibold">y obras del condominio</span>
              </h2>
            </motion.div>

            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-violet-400" />
                Proyecto ejemplo — Pintura exterior
              </p>
              {phases.map((ph, i) => (
                <div key={ph.label}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>{ph.label}</span>
                    <span className="text-slate-300 font-medium">{ph.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div ref={(el) => { barsRef.current[i] = el; }} data-pct={ph.pct} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: 0 }} />
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={card} className="grid grid-cols-2 gap-3">
              {[{ val: "100%", lbl: "Trazabilidad de gastos" }, { val: "Multi", lbl: "Proyectos simultáneos" }].map((s) => (
                <div key={s.lbl} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
                  <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{s.val}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.lbl}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <motion.div key={feat.title} variants={card} className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-violet-500/20">
                      <Icon className="w-5 h-5 text-violet-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1 leading-tight">{feat.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Slide4Projects;
