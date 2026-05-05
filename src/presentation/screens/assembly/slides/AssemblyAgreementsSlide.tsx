import { motion } from "framer-motion";
import { AgreementsSlideData } from "../../../../interfaces/assembly";
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: AgreementsSlideData; isActive: boolean; }

const STATUS_META: Record<NonNullable<AgreementsSlideData["previousAgreements"][number]["status"]>, { label: string; color: string; bg: string; Icon: any }> = {
  cumplido: { label: "Cumplido", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", Icon: CheckCircleIcon },
  en_progreso: { label: "En progreso", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", Icon: ClockIcon },
  pendiente: { label: "Pendiente", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", Icon: ExclamationTriangleIcon },
};

export const AssemblyAgreementsSlide = ({ data, isActive }: Props) => {
  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };
  const up = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06081a] via-[#0a0a22] to-[#050614]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(168,85,247,0.13)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-5xl mx-auto w-full">
        <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-6">
          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium tracking-widest uppercase mb-2">
              <BoltIcon className="w-3.5 h-3.5" />
              Seguimiento
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{data.title}</span>
            </h2>
          </motion.div>

          {data.previousAgreements.length === 0 ? (
            <motion.p variants={up} className="text-slate-500 text-sm italic">
              No se han registrado acuerdos previos.
            </motion.p>
          ) : (
            <motion.div variants={up} className="space-y-3">
              {data.previousAgreements.map((a, i) => {
                const meta = a.status ? STATUS_META[a.status] : null;
                const Icon = meta?.Icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 18, scale: 0.97 }}
                    animate={isActive ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.97 }}
                    transition={{ duration: 0.55, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 4, scale: 1.005, transition: { duration: 0.2 } }}
                    className={`rounded-2xl border ${meta?.bg ?? "border-white/[0.07] bg-white/[0.03]"} p-4 transition-colors cursor-default`}
                  >
                    <div className="flex items-start gap-3">
                      {Icon && (
                        <div className="shrink-0 mt-0.5">
                          <Icon className={`w-5 h-5 ${meta!.color}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base leading-snug">{a.text}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {a.date && (
                            <span className="text-[10px] text-slate-500 font-mono">{a.date}</span>
                          )}
                          {meta && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
                              {meta.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
