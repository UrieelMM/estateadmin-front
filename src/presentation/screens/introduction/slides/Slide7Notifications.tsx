import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { BellAlertIcon, EnvelopeIcon, DevicePhoneMobileIcon, ChatBubbleLeftEllipsisIcon, MegaphoneIcon, CurrencyDollarIcon, WrenchScrewdriverIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

interface Slide7NotificationsProps { isActive: boolean; }

const channels = [
  { icon: DevicePhoneMobileIcon, label: "WhatsApp", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: EnvelopeIcon, label: "Correo", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { icon: BellAlertIcon, label: "Push App", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { icon: ChatBubbleLeftEllipsisIcon, label: "SMS", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
];

const notificationTypes = [
  { icon: CurrencyDollarIcon, title: "Recordatorio de pago", desc: "Alerta automática días antes del vencimiento de la cuota", tag: "Finanzas" },
  { icon: WrenchScrewdriverIcon, title: "Estado de ticket", desc: "Notifica al residente cada cambio de estado en su solicitud", tag: "Mantenimiento" },
  { icon: CalendarDaysIcon, title: "Confirmación de reserva", desc: "Aviso al reservar, recordatorio y cancelación de área común", tag: "Reservas" },
  { icon: MegaphoneIcon, title: "Avisos del administrador", desc: "Comunicados generales o por torre/piso a todos los residentes", tag: "General" },
  { icon: BellAlertIcon, title: "Adeudos y mora", desc: "Alerta cuando un residente supera el límite de días sin pagar", tag: "Finanzas" },
  { icon: DevicePhoneMobileIcon, title: "Acceso de visitas", desc: "Notifica al residente cuando su visita llega al condominio", tag: "Acceso" },
];

const mockNotifs = [
  { time: "Hace 2 min", text: "Pago de cuota de mayo confirmado — Torre A, Depto. 401", channel: "WhatsApp", color: "text-emerald-400" },
  { time: "Hace 1 hora", text: "Tu ticket #204 fue asignado a técnico. Fecha estimada: hoy", channel: "WhatsApp", color: "text-emerald-400" },
  { time: "Ayer", text: "Recordatorio: tu cuota de junio vence en 3 días", channel: "Correo", color: "text-indigo-400" },
];

const Slide7Notifications = ({ isActive }: Slide7NotificationsProps) => {
  const notifsRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) return;
    notifsRef.current?.querySelectorAll(".notif-item").forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out", delay: 0.5 + i * 0.18 });
    });
    iconRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)", delay: 0.3 + i * 0.1 });
    });
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#08080f] via-[#0b0b1e] to-[#060610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(147,51,234,0.09)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(79,70,229,0.07)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s7" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                Módulo de Notificaciones
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Comunicación{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">automática</span>
                <br />
                <span className="text-slate-300 text-2xl font-semibold">en tiempo real</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">Mantén informados a residentes y administradores sin esfuerzo manual.</p>
            </motion.div>

            {/* Channels */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Canales disponibles</p>
              <div className="grid grid-cols-2 gap-2">
                {channels.map((ch, i) => {
                  const Icon = ch.icon;
                  return (
                    <div key={ch.label} ref={(el) => { iconRefs.current[i] = el; }} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${ch.bg} opacity-0`}>
                      <Icon className={`w-4 h-4 ${ch.color}`} />
                      <span className={`text-xs font-semibold ${ch.color}`}>{ch.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Live feed */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <BellAlertIcon className="w-3.5 h-3.5 text-purple-400" />
                Actividad reciente
              </p>
              <div ref={notifsRef} className="space-y-3">
                {mockNotifs.map((n, i) => (
                  <div key={i} className="notif-item opacity-0 flex items-start gap-2.5">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-300 leading-snug">{n.text}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-600">{n.time}</span>
                        <span className={`text-[10px] font-medium ${n.color}`}>· {n.channel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — notification types */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notificationTypes.map((nt) => {
              const Icon = nt.icon;
              return (
                <motion.div key={nt.title} variants={card} className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-purple-500/30 hover:bg-purple-500/[0.04] transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-purple-500/20">
                      <Icon className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-white leading-tight">{nt.title}</h4>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{nt.tag}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{nt.desc}</p>
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

export default Slide7Notifications;
