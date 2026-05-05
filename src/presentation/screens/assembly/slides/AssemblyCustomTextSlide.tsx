import { motion } from "framer-motion";
import { CustomTextSlideData } from "../../../../interfaces/assembly";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { AssemblySlideHeader } from "./AssemblySlideHeader";

interface Props { data: CustomTextSlideData; isActive: boolean; }

export const AssemblyCustomTextSlide = ({ data }: Props) => {
  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } } };
  const up = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#070810] via-[#090b1e] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(147,51,234,0.1)_0%,transparent_65%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <AssemblySlideHeader logoUrl={data.logoUrl} condoName={data.condoName} />

      <motion.div variants={wrap} initial="hidden" animate="visible" className="relative z-10 max-w-3xl mx-auto px-8 text-center flex flex-col items-center gap-6">
        {data.tag && (
          <motion.div variants={up}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold tracking-widest uppercase">
              <MegaphoneIcon className="w-3.5 h-3.5" />
              {data.tag}
            </div>
          </motion.div>
        )}

        <motion.div variants={up}>
          <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              {data.title}
            </span>
          </h2>
        </motion.div>

        <motion.div variants={up} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8 w-full">
          <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">{data.body}</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
