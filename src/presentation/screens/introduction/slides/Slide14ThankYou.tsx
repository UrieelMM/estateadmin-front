import { motion, useReducedMotion } from "framer-motion";
import { PhoneIcon, EnvelopeIcon, HeartIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

interface Slide14ThankYouProps { isActive: boolean; }

const Slide14ThankYou = ({ isActive }: Slide14ThankYouProps) => {
  const reduce = useReducedMotion();
  const wrap = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.2 } },
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
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#07070f] via-[#0a0a1e] to-[#060610]" />

      {/* Aurora animada */}
      {!reduce && (
        <>
          <motion.div
            className="absolute -top-1/3 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-indigo-500/[0.18] blur-[120px]"
            animate={{ x: [0, 60, -30, 0], y: [0, 40, -20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-1/3 -right-1/4 w-[55vw] h-[55vw] rounded-full bg-purple-500/[0.16] blur-[120px]"
            animate={{ x: [0, -50, 30, 0], y: [0, -30, 50, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full bg-pink-500/[0.10] blur-[120px]"
            animate={{ x: [0, 30, -40, 0], y: [0, 50, 20, 0] }}
            transition={{ duration: 27, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(79,70,229,0.18)_0%,transparent_65%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Partículas */}
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

      {/* Anillos decorativos */}
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

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 pt-20 pb-24 lg:py-0">
      <motion.div
        variants={wrap}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        className="flex flex-col items-center text-center gap-6 lg:gap-8 max-w-3xl w-full"
      >
        {/* Eyebrow */}
        <motion.div variants={up}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 text-xs font-medium tracking-widest uppercase">
            <SparklesIcon className="w-3.5 h-3.5" />
            EstatAdmin
          </div>
        </motion.div>

        {/* Título principal */}
        <motion.div variants={up}>
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-none tracking-tight">
            <motion.span
              className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 inline-block"
              initial={{ backgroundPosition: "0% 50%" }}
              animate={reduce ? {} : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 100%" }}
            >
              ¡Gracias!
            </motion.span>
          </h1>
        </motion.div>

        {/* Subtítulo */}
        <motion.div variants={up}>
          <p className="text-slate-300 text-lg sm:text-xl lg:text-2xl font-medium leading-snug">
            Por tu tiempo y por considerar a EstatAdmin para tu condominio.
          </p>
          <p className="mt-3 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <HeartIcon className="w-4 h-4 text-pink-400" />
            <span>Estamos aquí para ayudarte cuando lo necesites.</span>
          </p>
        </motion.div>

        {/* Tarjetas de contacto */}
        <motion.div variants={up} className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-2">
          <motion.a
            href="tel:+525531139560"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="group relative overflow-hidden flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-left hover:border-emerald-400/60 hover:bg-emerald-500/15 transition-colors"
          >
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <PhoneIcon className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-emerald-300/70 font-semibold">Teléfono</p>
              <p className="text-lg font-black text-white tabular-nums">55 3113 9560</p>
            </div>
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/10 to-transparent"
              initial={{ x: "-100%" }}
              animate={isActive && !reduce ? { x: "150%" } : { x: "-100%" }}
              transition={{ duration: 1.6, delay: 1.2, ease: "easeOut" }}
            />
          </motion.a>

          <motion.a
            href="mailto:info@estate-admin.com"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="group relative overflow-hidden flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 text-left hover:border-indigo-400/60 hover:bg-indigo-500/15 transition-colors"
          >
            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
              <EnvelopeIcon className="w-6 h-6 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-indigo-300/70 font-semibold">Correo</p>
              <p className="text-base font-black text-white truncate">info@estate-admin.com</p>
            </div>
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-300/10 to-transparent"
              initial={{ x: "-100%" }}
              animate={isActive && !reduce ? { x: "150%" } : { x: "-100%" }}
              transition={{ duration: 1.6, delay: 1.4, ease: "easeOut" }}
            />
          </motion.a>
        </motion.div>

        {/* CTA */}
        <motion.div variants={up}>
          <p className="text-slate-500 text-sm">
            Escríbenos para agendar una <span className="text-indigo-300 font-semibold">demo personalizada</span> sin costo.
          </p>
        </motion.div>

        {/* Powered by */}
        <motion.div variants={up}>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span>Hecho con</span>
            <HeartIcon className="w-3 h-3 text-pink-400" />
            <span>por el equipo de</span>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">EstatAdmin</span>
          </div>
        </motion.div>
      </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Slide14ThankYou;
