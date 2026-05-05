import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  DocumentChartBarIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  PaperClipIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  BoltIcon as BoltOutline,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

interface Slide14AIProps { isActive: boolean; }

const features = [
  { icon: ChatBubbleOvalLeftEllipsisIcon, title: "Asistente conversacional", desc: "Consulta balances, pagos, egresos y reportes mediante lenguaje natural" },
  { icon: DocumentChartBarIcon, title: "Reportes ejecutivos IA", desc: "Genera resúmenes financieros y operativos con análisis automático de tendencias" },
  { icon: PaperClipIcon, title: "Análisis de recibos", desc: "Sube una foto del recibo y la IA extrae monto, proveedor, fecha y categoría" },
  { icon: MegaphoneIcon, title: "Redacción de comunicados", desc: "Crea publicaciones profesionales con el asistente en segundos" },
  { icon: CurrencyDollarIcon, title: "Control de tokens", desc: "Monitorea el consumo de IA por condominio con alertas de límite configurable" },
  { icon: ShieldCheckIcon, title: "Contexto especializado", desc: "Entrenado para gestión de condominios: pagos, mantenimiento, reservas y más" },
];

const chatMessages = [
  { role: "user", text: "¿Cuál fue el balance de abril?" },
  { role: "bot", text: "En abril los cobros sumaron $48,200 y los gastos $21,500, dejando un balance positivo de $26,700 — un incremento del 12% respecto a marzo." },
  { role: "user", text: "¿Cuántos tickets de mantenimiento están abiertos?" },
  { role: "bot", text: "Hay 11 tickets abiertos: 4 críticos asignados, 5 en progreso y 2 pendientes de asignar técnico." },
];

const tokenData = [
  { module: "Asistente IA", used: 72, total: 100, color: "from-indigo-500 to-purple-500" },
  { module: "Reportes", used: 45, total: 100, color: "from-purple-500 to-pink-500" },
  { module: "Publicaciones", used: 28, total: 100, color: "from-pink-500 to-rose-500" },
];

const Slide14AI = ({ isActive }: Slide14AIProps) => {
  const msgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) return;
    msgRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", delay: 0.5 + i * 0.2 });
    });
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { width: "0%" }, { width: `${tokenData[i].used}%`, duration: 0.7, ease: "power3.out", delay: 0.6 + i * 0.15 });
    });
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#07070f] via-[#0a0a1e] to-[#060610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(147,51,234,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,rgba(79,70,229,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s14" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium tracking-widest uppercase mb-4">
                <SparklesIcon className="w-3.5 h-3.5" />
                Inteligencia Artificial
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                EstatAdmin{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">con IA</span>
                <br />
                <span className="text-slate-300 text-2xl font-semibold">tu asistente siempre activo</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">Potencia la administración con reportes automáticos, análisis de recibos y redacción inteligente.</p>
            </motion.div>

            {/* Chat mockup */}
            <motion.div variants={card} className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
                  <CpuChipIcon className="w-4 h-4 text-purple-300" />
                </div>
                <span className="text-xs font-bold text-white">Asistente IA</span>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400">En línea</span>
                </div>
              </div>
              <div className="space-y-2">
                {chatMessages.map((m, i) => (
                  <div key={i} ref={(el) => { msgRefs.current[i] = el; }} className={`opacity-0 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-snug ${m.role === "user" ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 rounded-tr-sm" : "bg-white/[0.06] text-slate-300 border border-white/[0.08] rounded-tl-sm"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Token usage */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <BoltOutline className="w-3.5 h-3.5 text-purple-400" />
                Consumo de IA este mes
              </p>
              <div className="space-y-3">
                {tokenData.map((t, i) => (
                  <div key={t.module}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">{t.module}</span>
                      <span className="text-xs font-bold text-slate-300">{t.used}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div ref={(el) => { barRefs.current[i] = el; }} className={`h-full rounded-full bg-gradient-to-r ${t.color}`} style={{ width: "0%" }} />
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
                  <div className="absolute top-3 right-3">
                    <SparklesIcon className="w-4 h-4 text-purple-500/30 group-hover:text-purple-400/60 transition-colors duration-300" />
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

export default Slide14AI;
