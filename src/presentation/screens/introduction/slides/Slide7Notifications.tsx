import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  BellAlertIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  InboxArrowDownIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

interface Slide7NotificationsProps { isActive: boolean; }

// Solo dos canales reales del sistema: WhatsApp (Twilio) y Email (MailerSend).
const channels = [
  {
    icon: ChatBubbleLeftRightIcon,
    label: "WhatsApp",
    desc: "Mensajes con plantilla aprobada vía Twilio",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: EnvelopeIcon,
    label: "Correo electrónico",
    desc: "Envío transaccional con PDFs adjuntos",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
];

// Eventos reales del sistema con su canal real
const notificationTypes = [
  {
    icon: CurrencyDollarIcon,
    title: "Pago aplicado",
    desc: "Al registrar un pago, el residente recibe el recibo en PDF por WhatsApp y correo automáticamente",
    tag: "Finanzas",
    channels: ["WhatsApp", "Correo"],
    highlight: true,
  },
  {
    icon: CalendarDaysIcon,
    title: "Reserva de área común",
    desc: "Confirmación inmediata por WhatsApp y correo cuando un residente reserva alberca, salón u otra área",
    tag: "Reservas",
    channels: ["WhatsApp", "Correo"],
    highlight: true,
  },
  {
    icon: InboxArrowDownIcon,
    title: "Paquete recibido",
    desc: "Cuando llega un paquete a caseta, el residente recibe correo con foto y comprobante de recepción",
    tag: "Paquetería",
    channels: ["Correo"],
    highlight: true,
  },
  {
    icon: DocumentTextIcon,
    title: "Cargo nuevo",
    desc: "Notificación por correo cuando se genera un cargo de mantenimiento o cuota especial",
    tag: "Finanzas",
    channels: ["Correo"],
  },
  {
    icon: ExclamationTriangleIcon,
    title: "Aviso de morosidad",
    desc: "Correo con el detalle de adeudos cuando un residente acumula meses sin pagar",
    tag: "Finanzas",
    channels: ["Correo"],
  },
  {
    icon: MegaphoneIcon,
    title: "Comunicado o aviso",
    desc: "El administrador publica un aviso y se envía a todos los residentes seleccionados",
    tag: "Avisos",
    channels: ["Correo"],
  },
];

const mockNotifs = [
  {
    time: "Hace 2 min",
    text: "Pago de cuota mayo aplicado — Torre A, Depto. 401. Recibo enviado.",
    channels: ["WhatsApp", "Correo"],
  },
  {
    time: "Hace 18 min",
    text: "Reservación del salón social confirmada para sábado 19:00 hrs.",
    channels: ["WhatsApp", "Correo"],
  },
  {
    time: "Hace 1 h",
    text: "Llegó un paquete a caseta a nombre del Depto. 102.",
    channels: ["Correo"],
  },
];

const channelColor: Record<string, string> = {
  WhatsApp: "text-emerald-400",
  Correo: "text-indigo-400",
};

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
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#08080f] via-[#0b0b1e] to-[#060610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(16,185,129,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(79,70,229,0.07)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-start lg:justify-center px-4 sm:px-8 lg:px-14 pt-20 pb-24 lg:py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s7" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8 items-start">
          {/* Left */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                WhatsApp & Correo
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                El residente se{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400">entera al instante</span>
              </h2>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Cada acción importante dispara una notificación automática al residente. Sin trabajo
                manual: el sistema envía el recibo por WhatsApp al aplicar un pago, confirma la
                reserva del área común y avisa por correo cuando llega un paquete.
              </p>
            </motion.div>

            {/* Channels */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Canales del sistema</p>
              <div className="flex flex-col gap-2">
                {channels.map((ch, i) => {
                  const Icon = ch.icon;
                  return (
                    <div
                      key={ch.label}
                      ref={(el) => { iconRefs.current[i] = el; }}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border ${ch.bg} opacity-0`}
                    >
                      <Icon className={`w-5 h-5 ${ch.color} mt-0.5 shrink-0`} />
                      <div>
                        <p className={`text-sm font-bold ${ch.color}`}>{ch.label}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">{ch.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Live feed */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <BellAlertIcon className="w-3.5 h-3.5 text-emerald-400" />
                Actividad reciente
              </p>
              <div ref={notifsRef} className="space-y-3">
                {mockNotifs.map((n, i) => (
                  <div key={i} className="notif-item opacity-0 flex items-start gap-2.5">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-300 leading-snug">{n.text}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-600">{n.time}</span>
                        {n.channels.map((c) => (
                          <span key={c} className={`text-[10px] font-medium ${channelColor[c]}`}>· {c}</span>
                        ))}
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
                <motion.div
                  key={nt.title}
                  variants={card}
                  className={`group relative rounded-xl border p-4 transition-all duration-300 ${
                    nt.highlight
                      ? "border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/45"
                      : "border-white/[0.07] bg-white/[0.03] hover:border-indigo-500/30 hover:bg-indigo-500/[0.04]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 p-2 rounded-lg border ${
                      nt.highlight
                        ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30"
                        : "bg-gradient-to-br from-indigo-500/15 to-purple-600/15 border-indigo-500/20"
                    }`}>
                      <Icon className={`w-5 h-5 ${nt.highlight ? "text-emerald-300" : "text-indigo-300"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h4 className="text-sm font-bold text-white leading-tight">{nt.title}</h4>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">{nt.tag}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-2">{nt.desc}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {nt.channels.map((c) => (
                          <span
                            key={c}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              c === "WhatsApp"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                            }`}
                          >
                            {c === "WhatsApp" ? "✦ WhatsApp" : "✉ Correo"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
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

export default Slide7Notifications;
