import { motion } from "framer-motion";
import { AgendaSlideData } from "../../../../interfaces/assembly";
import { ListBulletIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: AgendaSlideData; isActive: boolean; }

export const AssemblyAgendaSlide = ({ data, isActive }: Props) => {
  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
  const up = {
    hidden: { opacity: 0, x: -24, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06081a] via-[#0a0a22] to-[#050614]" />
      <motion.div
        className="absolute -top-1/3 left-1/4 w-[40vw] h-[40vw] rounded-full bg-indigo-500/[0.12] blur-[120px]"
        animate={{ x: [0, 50, 20, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(99,102,241,0.13)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <div className="relative z-10 px-8 lg:px-14 py-8 max-w-5xl mx-auto w-full">
        <motion.div variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col gap-6">
          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-2">
              <BoltIcon className="w-3.5 h-3.5" />
              Asamblea
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{data.title}</span>
            </h2>
          </motion.div>

          {data.items.length === 0 ? (
            <motion.p variants={up} className="text-slate-500 text-sm italic">
              No se han definido puntos para el orden del día.
            </motion.p>
          ) : (
            <motion.ol variants={up} className="space-y-3">
              {data.items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -28, scale: 0.97 }}
                  animate={isActive ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -28, scale: 0.97 }}
                  transition={{ duration: 0.55, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ x: 6, borderColor: "rgba(99,102,241,0.4)", transition: { duration: 0.2 } }}
                  className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] transition-colors p-4 cursor-default"
                >
                  <div className="shrink-0 w-9 h-9 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center">
                    <span className="text-sm font-black text-indigo-300">{item.number ?? String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="text-white text-base leading-snug pt-1.5">{item.text}</p>
                </motion.li>
              ))}
            </motion.ol>
          )}

          <motion.div variants={up} className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
            <ListBulletIcon className="w-3.5 h-3.5" />
            <span>{data.items.length} punto{data.items.length === 1 ? "" : "s"} a tratar</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
