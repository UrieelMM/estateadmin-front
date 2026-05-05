import { motion, useReducedMotion } from "framer-motion";
import { CoverSlideData } from "../../../../interfaces/assembly";
import { BuildingOffice2Icon, CalendarDaysIcon } from "@heroicons/react/24/outline";

interface Props { data: CoverSlideData; isActive: boolean; }

export const AssemblyCoverSlide = ({ data }: Props) => {
  const reduce = useReducedMotion();
  const wrap = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  };
  const up = {
    hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  // Partículas decorativas
  const PARTICLES = Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    x: (Math.sin(i * 1.7) * 50 + 50),
    y: (Math.cos(i * 2.3) * 50 + 50),
    size: 1 + (i % 3),
    delay: i * 0.15,
  }));

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#07070f] via-[#0a0a1e] to-[#060610]" />

      {/* Aurora animada */}
      {!reduce && (
        <>
          <motion.div
            className="absolute -top-1/3 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-indigo-500/[0.18] blur-[120px]"
            animate={{ x: [0, 60, -30, 0], y: [0, 40, -20, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-1/3 -right-1/4 w-[55vw] h-[55vw] rounded-full bg-purple-500/[0.16] blur-[120px]"
            animate={{ x: [0, -50, 30, 0], y: [0, -30, 50, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full bg-pink-500/[0.12] blur-[120px]"
            animate={{ x: [0, 30, -40, 0], y: [0, 50, 20, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(79,70,229,0.18)_0%,transparent_65%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Partículas flotantes */}
      {!reduce && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-indigo-300/30"
              style={{
                width: p.size + "px",
                height: p.size + "px",
                left: p.x + "%",
                top: p.y + "%",
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 4 + (p.id % 4),
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Decorative rings con rotación lenta */}
      <motion.div
        className="absolute w-[520px] h-[520px] rounded-full border border-indigo-500/10"
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[380px] h-[380px] rounded-full border border-purple-500/10"
        animate={reduce ? {} : { rotate: -360 }}
        transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
      />

      <motion.div variants={wrap} initial="hidden" animate="visible" className="relative z-10 flex flex-col items-center text-center px-8 gap-6">
        {/* Logo / icon */}
        <motion.div variants={up} className="flex flex-col items-center gap-3">
          {data.logoUrl ? (
            <motion.div
              initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              whileHover={{ scale: 1.04 }}
              className="relative bg-white/95 rounded-2xl border border-white/15 p-3 shadow-2xl shadow-indigo-900/30"
            >
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-indigo-500/40 via-purple-500/20 to-pink-500/40 blur-xl opacity-60 -z-10 animate-pulse" />
              <img src={data.logoUrl} alt={data.condoName} className="h-32 w-32 object-contain rounded-xl" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10"
            >
              <BuildingOffice2Icon className="w-10 h-10 text-indigo-300" />
            </motion.div>
          )}
          <span className="text-xs font-semibold tracking-widest uppercase text-indigo-300/70">{data.condoName}</span>
        </motion.div>

        {/* Title */}
        <motion.div variants={up}>
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight">
            {data.title.split(" ").slice(0, -1).join(" ")}{" "}
            <motion.span
              className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 inline-block"
              initial={{ backgroundPosition: "0% 50%" }}
              animate={reduce ? {} : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 100%" }}
            >
              {data.title.split(" ").at(-1)}
            </motion.span>
          </h1>
        </motion.div>

        {/* Subtitle & date */}
        <motion.div variants={up} className="flex flex-col items-center gap-2">
          {data.subtitle && (
            <p className="text-slate-400 text-lg font-medium">{data.subtitle}</p>
          )}
          <div className="flex flex-wrap justify-center items-center gap-2">
            <motion.div
              whileHover={{ y: -2, borderColor: "rgba(99,102,241,0.4)" }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 text-sm transition-colors"
            >
              <CalendarDaysIcon className="w-4 h-4 text-indigo-300" />
              <span>{new Date(data.date).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</span>
            </motion.div>
            {data.periodLabel && (
              <motion.div
                whileHover={{ y: -2 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-200 text-sm"
              >
                <span className="opacity-70">Periodo:</span>
                <span className="font-semibold">{data.periodLabel}</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Powered by badge */}
        <motion.div variants={up}>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span>Generado con</span>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">EstatAdmin</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
