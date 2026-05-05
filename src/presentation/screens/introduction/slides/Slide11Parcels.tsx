import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  TruckIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  CameraIcon,
  CheckCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

interface Slide11ParcelsProps { isActive: boolean; }

const features = [
  { icon: TruckIcon, title: "Registro en caseta", desc: "El guardia registra paquete con remitente, descripción y unidad destino" },
  { icon: CameraIcon, title: "Foto del paquete", desc: "Al recibirlo se sube una foto que queda asociada al comprobante" },
  { icon: EnvelopeIcon, title: "Aviso por correo al residente", desc: "El residente recibe correo automático con la foto y datos del envío" },
  { icon: UserCircleIcon, title: "Identificación del destinatario", desc: "Liga cada paquete al usuario y unidad correctos del condominio" },
  { icon: MagnifyingGlassIcon, title: "Búsqueda y filtros", desc: "Localiza paquetes por residente, fecha, remitente o estado" },
  { icon: CheckCircleIcon, title: "Entrega y bitácora", desc: "Marca como entregado y consulta el historial completo con fecha y responsable" },
];

const sampleParcels = [
  { resident: "Depto. 401 — Torres, A.", sender: "Amazon", received: "Hoy 10:15", status: "pending" },
  { resident: "Depto. 205 — García, L.", sender: "DHL Express", received: "Hoy 09:42", status: "pending" },
  { resident: "Depto. 312 — Ramírez, C.", sender: "Mercado Libre", received: "Ayer 16:30", status: "delivered" },
  { resident: "Depto. 108 — López, M.", sender: "FedEx", received: "Ayer 14:05", status: "delivered" },
];

const stats = [
  { val: "12", lbl: "Paquetes hoy", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { val: "4", lbl: "Pendientes", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { val: "8", lbl: "Entregados", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { val: "100%", lbl: "Trazabilidad", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
];

const Slide11Parcels = ({ isActive }: Slide11ParcelsProps) => {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", delay: 0.5 + i * 0.12 });
    });
    if (statsRef.current) {
      gsap.fromTo(statsRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)", delay: 0.3 });
    }
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060810] via-[#08091c] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(79,70,229,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s11" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                Recepción de Paquetes
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Control de{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">paquetería</span>
                <br />
                <span className="text-slate-300 text-2xl font-semibold">sin pérdidas ni olvidos</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">Registra, notifica y confirma la entrega de cada paquete en el condominio.</p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={card}>
              <div ref={statsRef} className="opacity-0 grid grid-cols-2 gap-3">
                {stats.map((s) => (
                  <div key={s.lbl} className={`rounded-xl border ${s.bg} p-3`}>
                    <ArchiveBoxIcon className={`w-5 h-5 ${s.color} mb-1.5`} />
                    <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Package list */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <ClockIcon className="w-3.5 h-3.5 text-indigo-400" />
                Paquetes recientes
              </p>
              <div className="space-y-1.5">
                {sampleParcels.map((p, i) => (
                  <div key={i} ref={(el) => { rowRefs.current[i] = el; }} className="opacity-0 flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === "pending" ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <div>
                        <span className="text-xs text-slate-300 font-medium block leading-none">{p.resident}</span>
                        <span className="text-[10px] text-slate-600">{p.sender}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-600 hidden sm:block">{p.received}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${p.status === "pending" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"}`}>
                        {p.status === "pending" ? "Pendiente" : "Entregado"}
                      </span>
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
  );
};

export default Slide11Parcels;
