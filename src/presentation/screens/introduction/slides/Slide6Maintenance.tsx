import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { WrenchScrewdriverIcon, ClipboardDocumentListIcon, ClockIcon, DevicePhoneMobileIcon, CameraIcon, UserCircleIcon, ArrowPathIcon, CheckBadgeIcon, SignalIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

interface Slide6MaintenanceProps { isActive: boolean; }

const appFeatures = [
  { icon: ClipboardDocumentListIcon, title: "Tickets con prioridad", desc: "Folio, área, prioridad alta/media/baja y estado abierto · en progreso · cerrado" },
  { icon: CameraIcon, title: "Evidencia fotográfica", desc: "Adjunta fotos y archivos al crear el ticket o resolverlo" },
  { icon: UserCircleIcon, title: "Asignación a técnicos", desc: "Asigna a empleados internos o proveedores externos del directorio" },
  { icon: ClockIcon, title: "Citas con técnicos", desc: "Agenda visitas a domicilio y recibe recordatorios 24 horas antes" },
  { icon: ArrowPathIcon, title: "Bitácora completa", desc: "Cada cambio de estado, prioridad o asignación queda registrado con autor y fecha" },
  { icon: SignalIcon, title: "Fusión de tickets", desc: "Une tickets duplicados manteniendo el historial combinado" },
];

const ticketStatuses = [
  { label: "Nuevo", count: 4, gradient: "from-indigo-500 to-blue-600", bar: 30 },
  { label: "En proceso", count: 7, gradient: "from-purple-500 to-indigo-600", bar: 55 },
  { label: "Resuelto", count: 23, gradient: "from-indigo-400 via-purple-500 to-pink-500", bar: 100 },
];

const Slide6Maintenance = ({ isActive }: Slide6MaintenanceProps) => {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.fromTo(bar, { width: 0 }, { width: bar.dataset.pct + "%", duration: 0.7, ease: "power3.out", delay: 0.5 + i * 0.14 });
    });
    if (phoneRef.current) {
      gsap.fromTo(phoneRef.current, { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out", delay: 0.4 });
    }
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060811] via-[#080b1c] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(59,130,246,0.09)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-start lg:justify-center px-4 sm:px-8 lg:px-14 pt-20 pb-24 lg:py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s6" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                Mantenimiento + EstateFix
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Tickets de{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">mantenimiento</span>
                <br />
                <span className="text-slate-300 text-lg sm:text-xl lg:text-2xl font-semibold">con app móvil dedicada</span>
              </h2>
            </motion.div>

            <motion.div variants={card}>
              <div ref={phoneRef} className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-5 opacity-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <WrenchScrewdriverIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">EstateFix</p>
                    <p className="text-[10px] text-slate-500">App móvil para el personal</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <DevicePhoneMobileIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] text-indigo-400 font-medium">iOS · Android</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {ticketStatuses.map((s, i) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">{s.label}</span>
                        <span className="text-slate-300 font-semibold tabular-nums">{s.count} tickets</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div ref={(el) => { barsRef.current[i] = el; }} data-pct={s.bar} className={`h-full rounded-full bg-gradient-to-r ${s.gradient}`} style={{ width: 0 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-indigo-400">
                  <CheckBadgeIcon className="w-3.5 h-3.5" />
                  <span>Sincronización en tiempo real con EstatAdmin</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {appFeatures.map((feat) => {
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

export default Slide6Maintenance;
