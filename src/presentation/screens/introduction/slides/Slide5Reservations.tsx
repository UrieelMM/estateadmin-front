import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { CalendarDaysIcon, CheckCircleIcon, ClockIcon, MapPinIcon, BellIcon, UserGroupIcon, ChatBubbleLeftRightIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

interface Slide5ReservationsProps { isActive: boolean; }

const areas = [
  { name: "Salón de eventos", available: true, time: "09:00 – 14:00" },
  { name: "Alberca", available: false, time: "Ocupada" },
  { name: "Gimnasio", available: true, time: "Disponible" },
  { name: "Cancha deportiva", available: true, time: "16:00 – 18:00" },
];

const chatMessages = [
  { from: "bot", text: "✅ Reserva confirmada — Salón de eventos" },
  { from: "bot", text: "Sábado 14 jun · 10:00 a 15:00" },
  { from: "bot", text: "Te enviamos también el detalle a tu correo. ¡Disfruta!" },
];

const features = [
  { icon: CalendarDaysIcon, title: "Calendario en tiempo real", desc: "Visualiza disponibilidad de todas las áreas al instante" },
  { icon: ChatBubbleLeftRightIcon, title: "Confirmación por WhatsApp", desc: "Al reservar el residente recibe el detalle por WhatsApp y correo" },
  { icon: BellIcon, title: "Aviso al administrador", desc: "El admin se entera cada vez que se realiza una reserva" },
  { icon: ClockIcon, title: "Reglas y horarios por área", desc: "Define horarios, duración máxima y costo por reservación" },
  { icon: UserGroupIcon, title: "Control de aforo", desc: "Limita capacidad máxima por área y franja horaria" },
  { icon: MapPinIcon, title: "Múltiples amenidades", desc: "Alberca, salón, gimnasio, cancha, asadores y más" },
];

const Slide5Reservations = ({ isActive }: Slide5ReservationsProps) => {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    chatRef.current?.querySelectorAll(".chat-msg").forEach((msg, i) => {
      gsap.fromTo(msg, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.6 + i * 0.25 });
    });
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#07080f] via-[#0a0c1e] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_20%,rgba(147,51,234,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-start lg:justify-center px-4 sm:px-8 lg:px-14 pt-20 pb-24 lg:py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s5" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium tracking-widest uppercase mb-4">
                <SparklesIcon className="w-3.5 h-3.5" />
                Reservas inteligentes
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Áreas comunes{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">sin fricciones</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">Los residentes reservan desde la app y reciben confirmación inmediata por WhatsApp y correo.</p>
            </motion.div>

            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <CalendarDaysIcon className="w-3.5 h-3.5 text-purple-400" />
                Disponibilidad — hoy
              </p>
              {areas.map((a) => (
                <div key={a.name} className="flex items-center justify-between py-1 border-b border-white/[0.05] last:border-0">
                  <span className="text-xs text-slate-300">{a.name}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${a.available ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"}`}>{a.time}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <DevicePhoneMobileIcon className="w-3.5 h-3.5 text-indigo-400" />
                Chatbot EstatAdmin — WhatsApp
              </p>
              <div ref={chatRef} className="space-y-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-msg opacity-0 flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-[11px] leading-relaxed ${msg.from === "user" ? "bg-indigo-600/40 text-indigo-100 rounded-br-sm" : "bg-white/[0.08] text-slate-300 rounded-bl-sm"}`}>{msg.text}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <motion.div key={feat.title} variants={card} className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-purple-500/30 hover:bg-purple-500/[0.04] transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-purple-500/20">
                      <Icon className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1 leading-tight">{feat.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <CheckCircleIcon className="w-4 h-4 text-indigo-500/40 group-hover:text-purple-400/60 transition-colors duration-300" />
                  </div>
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

export default Slide5Reservations;
