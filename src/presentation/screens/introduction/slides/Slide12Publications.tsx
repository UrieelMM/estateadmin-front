import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  MegaphoneIcon,
  DocumentTextIcon,
  TagIcon,
  SparklesIcon as SparklesOutline,
  EyeIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon, SparklesIcon } from "@heroicons/react/24/solid";

interface Slide12PublicationsProps { isActive: boolean; }

const features = [
  { icon: MegaphoneIcon, title: "Comunicados generales", desc: "Publica avisos para todos los residentes o segmentados por torre o piso" },
  { icon: SparklesOutline, title: "Redacción con IA", desc: "El asistente IA ayuda a redactar comunicados claros y profesionales en segundos" },
  { icon: TagIcon, title: "Categorías y etiquetas", desc: "Organiza publicaciones por tipo: aviso, urgente, evento, mantenimiento, etc." },
  { icon: EyeIcon, title: "Vista previa enriquecida", desc: "Editor de texto con formato, listas y estilos para publicaciones profesionales" },
  { icon: BellAlertIcon, title: "Notificación automática", desc: "Al publicar, los residentes reciben un aviso push, WhatsApp o correo" },
  { icon: CalendarDaysIcon, title: "Historial de publicaciones", desc: "Accede a todas las publicaciones anteriores con fecha, autor y audiencia" },
];

const mockPosts = [
  { title: "Mantenimiento preventivo elevadores", tag: "Urgente", author: "Administración", date: "Hace 1 hora", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { title: "Recordatorio asamblea de condóminos — Junio", tag: "Evento", author: "Comité", date: "Hace 3 horas", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "Corte de agua programado — Torre B", tag: "Aviso", author: "Administración", date: "Ayer", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { title: "Bienvenida a nuevos residentes — Mayo", tag: "General", author: "Administración", date: "Hace 2 días", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

const Slide12Publications = ({ isActive }: Slide12PublicationsProps) => {
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);
  const aiCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    postRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", delay: 0.5 + i * 0.12 });
    });
    if (aiCardRef.current) {
      gsap.fromTo(aiCardRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)", delay: 0.35 });
    }
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#070810] via-[#090b1e] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_20%,rgba(147,51,234,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s12" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                Módulo de Publicaciones
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Comunicados{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">inteligentes</span>
                <br />
                <span className="text-slate-300 text-2xl font-semibold">con asistencia de IA</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">Mantén informados a los residentes con publicaciones profesionales creadas en segundos.</p>
            </motion.div>

            {/* AI assist card */}
            <motion.div variants={card}>
              <div ref={aiCardRef} className="opacity-0 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
                    <SparklesIcon className="w-4 h-4 text-purple-300" />
                  </div>
                  <span className="text-xs font-bold text-white">Redacción con IA</span>
                  <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">PRO</span>
                </div>
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 mb-2">
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">"Redacta un aviso de corte de agua para el miércoles de 9am a 2pm en la Torre B, tono formal."</p>
                </div>
                <div className="rounded-lg bg-indigo-500/[0.06] border border-indigo-500/[0.15] p-3">
                  <p className="text-[11px] text-slate-300 leading-relaxed">Estimados residentes de Torre B: Les comunicamos que el día miércoles se realizará un corte programado de agua de 9:00 a 14:00 hrs por mantenimiento a la red hidráulica...</p>
                </div>
              </div>
            </motion.div>

            {/* Recent posts */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <DocumentTextIcon className="w-3.5 h-3.5 text-purple-400" />
                Publicaciones recientes
              </p>
              <div className="space-y-2">
                {mockPosts.map((p, i) => (
                  <div key={i} ref={(el) => { postRefs.current[i] = el; }} className="opacity-0 flex items-center justify-between gap-2 py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${p.bg} ${p.color}`}>{p.tag}</span>
                      <span className="text-xs text-slate-300 font-medium truncate">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <UserCircleIcon className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] text-slate-600 hidden sm:block">{p.date}</span>
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

export default Slide12Publications;
