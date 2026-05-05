import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { QrCodeIcon, ShieldCheckIcon, ClockIcon, UserCircleIcon, TruckIcon, CheckBadgeIcon, DevicePhoneMobileIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { BoltIcon, LockClosedIcon } from "@heroicons/react/24/solid";

interface Slide8AccessControlProps { isActive: boolean; }

const features = [
  { icon: QrCodeIcon, title: "QR por residente", desc: "Cada residente genera un código QR único para autorizar el ingreso de sus visitas" },
  { icon: ShieldCheckIcon, title: "Validación en puerta", desc: "El guardia escanea el QR desde cualquier dispositivo para confirmar el acceso" },
  { icon: DevicePhoneMobileIcon, title: "Notificación al residente", desc: "El residente recibe un aviso cuando su visita llega al condominio" },
  { icon: UserCircleIcon, title: "Visitas frecuentes", desc: "Registra visitantes recurrentes para agilizar entradas futuras" },
  { icon: TruckIcon, title: "Control de proveedores", desc: "Gestiona accesos de repartidores, técnicos y contratistas con tiempo limitado" },
  { icon: ClipboardDocumentListIcon, title: "Bitácora de accesos", desc: "Historial completo de entradas y salidas con fecha, hora y responsable" },
];

const recentVisits = [
  { name: "Carlos Ramos", type: "Visita", dept: "Depto. 302", status: "Autorizado", time: "Hace 5 min" },
  { name: "Amazon Delivery", type: "Proveedor", dept: "Torre B", status: "Autorizado", time: "Hace 22 min" },
  { name: "Juan Pérez", type: "Visita", dept: "Depto. 105", status: "Pendiente", time: "Hace 40 min" },
];

const stats = [
  { value: "100%", label: "Trazabilidad" },
  { value: "< 10s", label: "Tiempo de validación" },
  { value: "24/7", label: "Registro activo" },
];

const Slide8AccessControl = ({ isActive }: Slide8AccessControlProps) => {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out", delay: 0.5 + i * 0.16 });
    });
    if (qrRef.current) {
      gsap.fromTo(qrRef.current, { opacity: 0, scale: 0.85, rotate: -4 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.6, ease: "back.out(1.4)", delay: 0.35 });
    }
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060810] via-[#090b1c] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(79,70,229,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(147,51,234,0.07)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s8" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                Acceso de Visitas
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Control de{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">acceso</span>
                <br />
                <span className="text-slate-300 text-2xl font-semibold">inteligente con QR</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">Registra y autoriza el ingreso de visitas en segundos, con trazabilidad total.</p>
            </motion.div>

            {/* QR mockup */}
            <motion.div variants={card}>
              <div ref={qrRef} className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-5 opacity-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-white">QR de Acceso</p>
                    <p className="text-[10px] text-slate-500">Torre A — Depto. 401</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    <LockClosedIcon className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-semibold">Activo</span>
                  </div>
                </div>

                {/* QR pattern (SVG visual) */}
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-xl bg-white p-2 shadow-lg">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                      {/* Corner squares */}
                      <rect x="5" y="5" width="28" height="28" rx="3" fill="#0f0f1a" />
                      <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
                      <rect x="13" y="13" width="12" height="12" rx="1" fill="#0f0f1a" />
                      <rect x="67" y="5" width="28" height="28" rx="3" fill="#0f0f1a" />
                      <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
                      <rect x="75" y="13" width="12" height="12" rx="1" fill="#0f0f1a" />
                      <rect x="5" y="67" width="28" height="28" rx="3" fill="#0f0f1a" />
                      <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
                      <rect x="13" y="75" width="12" height="12" rx="1" fill="#0f0f1a" />
                      {/* Data pattern */}
                      {[40,46,52,58,64,40,52,64,40,46,58,64].map((x,i)=> <rect key={i} x={x} y={40+Math.floor(i/4)*6} width="4" height="4" rx="0.5" fill="#0f0f1a"/>)}
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {stats.map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{s.value}</div>
                      <div className="text-[9px] text-slate-500 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent visits */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <ClockIcon className="w-3.5 h-3.5 text-indigo-400" />
                Últimas entradas
              </p>
              <div className="space-y-2">
                {recentVisits.map((v, i) => (
                  <div key={i} ref={(el) => { rowRefs.current[i] = el; }} className="opacity-0 flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-white leading-none">{v.name}</p>
                      <p className="text-[10px] text-slate-500">{v.type} · {v.dept}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${v.status === "Autorizado" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>{v.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — features */}
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
                  <div className="absolute top-3 right-3">
                    <CheckBadgeIcon className="w-4 h-4 text-indigo-500/30 group-hover:text-indigo-400/60 transition-colors duration-300" />
                  </div>
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Slide8AccessControl;
