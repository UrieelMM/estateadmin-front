import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

interface Slide13StaffProps { isActive: boolean; }

const features = [
  { icon: UsersIcon, title: "Directorio de personal", desc: "Registra empleados con datos de contacto, puesto, turno y documentos" },
  { icon: CalendarDaysIcon, title: "Control de asistencia", desc: "Registra entradas y salidas con hora exacta para calcular tiempo trabajado" },
  { icon: ClipboardDocumentCheckIcon, title: "Gestión de tareas", desc: "Asigna tareas al personal con prioridad, fecha límite y seguimiento" },
  { icon: ChartBarIcon, title: "Evaluaciones de desempeño", desc: "Aplica evaluaciones periódicas y genera reportes PDF por empleado" },
  { icon: DocumentTextIcon, title: "Reportes PDF", desc: "Genera reportes de asistencia, desempeño y actividad del personal" },
  { icon: BellAlertIcon, title: "Bitácora de actividad", desc: "Historial de todas las acciones del personal por fecha y módulo" },
];

const staffMembers = [
  { name: "Roberto Fuentes", role: "Guardia — Turno A", status: "Activo", perf: 92 },
  { name: "María Hernández", role: "Limpieza — Mañana", status: "Activo", perf: 88 },
  { name: "José Martínez", role: "Mantenimiento", status: "Activo", perf: 95 },
  { name: "Ana Pérez", role: "Administración", status: "Activo", perf: 97 },
];

const tabStats = [
  { val: "8", lbl: "Empleados activos", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { val: "96%", lbl: "Asistencia mensual", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { val: "14", lbl: "Tareas esta semana", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { val: "4.8", lbl: "Score promedio", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
];

const Slide13Staff = ({ isActive }: Slide13StaffProps) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { width: "0%" }, { width: `${staffMembers[i].perf}%`, duration: 0.6, ease: "power3.out", delay: 0.5 + i * 0.12 });
    });
    if (statsRef.current) {
      gsap.fromTo(statsRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)", delay: 0.3 });
    }
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  const tabs = ["Personal", "Asistencia", "Tickets", "Evaluaciones", "Actividad", "Reportes"];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060810] via-[#080a1c] to-[#050612]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(79,70,229,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-start lg:justify-center px-4 sm:px-8 lg:px-14 pt-20 pb-24 lg:py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s13" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8 items-start">

          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                Gestión de Personal
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Administración{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">integral</span>
                <br />
                <span className="text-slate-300 text-lg sm:text-xl lg:text-2xl font-semibold">del personal del condominio</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">Controla asistencia, tareas, evaluaciones y actividad de tu equipo en un solo lugar.</p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={card}>
              <div ref={statsRef} className="opacity-0 grid grid-cols-2 gap-3">
                {tabStats.map((s) => (
                  <div key={s.lbl} className={`rounded-xl border ${s.bg} p-3`}>
                    <UsersIcon className={`w-5 h-5 ${s.color} mb-1.5`} />
                    <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Module tabs preview */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Secciones del módulo</p>
              <div className="flex flex-wrap gap-2">
                {tabs.map((t, i) => (
                  <span key={t} className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${i === 0 ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-white/[0.04] text-slate-500 border-white/[0.07]"}`}>{t}</span>
                ))}
              </div>

              {/* Performance bars */}
              <div className="mt-4 space-y-2.5">
                {staffMembers.map((m, i) => (
                  <div key={m.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300 font-medium">{m.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">{m.role.split("—")[0].trim()}</span>
                        <span className="text-xs font-bold text-indigo-400">{m.perf}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div ref={(el) => { barRefs.current[i] = el; }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <motion.div key={feat.title} variants={card} className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-indigo-500/30 hover:bg-indigo-500/[0.04] transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20">
                      <Icon className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1 leading-tight">{feat.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
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

export default Slide13Staff;
