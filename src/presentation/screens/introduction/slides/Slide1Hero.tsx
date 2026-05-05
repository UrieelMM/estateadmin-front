import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ArrowsPointingOutIcon, PlayIcon } from "@heroicons/react/24/solid";
import logo from "../../../../assets/logo.png";

interface Slide1HeroProps {
  isActive: boolean;
  isFullscreen: boolean;
  onRequestFullscreen: () => void;
}

const Slide1Hero = ({ isActive, isFullscreen, onRequestFullscreen }: Slide1HeroProps) => {
  const particlesRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    if (glowRef.current) {
      gsap.to(glowRef.current, { scale: 1.15, opacity: 0.6, duration: 2.5, repeat: -1, yoyo: true, ease: "power1.inOut" });
    }
    const container = particlesRef.current;
    if (!container) return;
    container.querySelectorAll(".hf-particle").forEach((p, i) => {
      gsap.to(p, { y: `${-20 - i * 8}px`, x: `${Math.sin(i) * 10}px`, opacity: 0.3 + (i % 3) * 0.2, duration: 2 + i * 0.4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.2 });
    });
    return () => {
      gsap.killTweensOf(glowRef.current);
      container.querySelectorAll(".hf-particle").forEach((p) => gsap.killTweensOf(p));
    };
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.1 } } };
  const up = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } } };
  const sc = { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#050510]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(79,70,229,0.18)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(147,51,234,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.8) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div ref={glowRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)", filter: "blur(40px)" }} />

      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="hf-particle absolute rounded-full" style={{ width: `${3 + (i % 4)}px`, height: `${3 + (i % 4)}px`, background: i % 3 === 0 ? "rgba(99,102,241,0.7)" : i % 3 === 1 ? "rgba(147,51,234,0.7)" : "rgba(219,39,119,0.5)", left: `${8 + i * 7.5}%`, top: `${20 + (i % 5) * 13}%` }} />
        ))}
      </div>

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-6 pt-20 pb-24 lg:py-0">
      <motion.div key="s1" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="flex flex-col items-center text-center max-w-5xl mx-auto w-full">
        <motion.div variants={sc} className="mb-8">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 blur-xl scale-150" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-700/20 border border-indigo-500/30 backdrop-blur-sm flex items-center justify-center p-2 shadow-2xl">
              <img src={logo} alt="EstateAdmin" className="w-full h-full object-contain" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={up} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-sm font-medium tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Software de Gestión
          </span>
        </motion.div>

        <motion.h1 variants={up} className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            EstatAdmin
          </span>
        </motion.h1>

        <motion.div variants={up} className="w-24 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mb-6 lg:mb-8" />

        <motion.p variants={up} className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light text-slate-300 max-w-2xl leading-relaxed px-2">
          Software integral para la{" "}
          <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            gestión de condominios
          </span>
        </motion.p>

        {!isFullscreen && (
          <motion.div variants={up} className="mt-10">
            <motion.button onClick={onRequestFullscreen} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl overflow-hidden text-white font-semibold text-base shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-pink-600/40 blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2.5">
                <PlayIcon className="w-4 h-4" />
                Presentar
                <ArrowsPointingOutIcon className="w-4 h-4 opacity-70" />
              </span>
            </motion.button>
          </motion.div>
        )}

        <motion.div variants={up} className="mt-10 flex items-center gap-3">
          <div className="w-8 h-[2px] bg-gradient-to-r from-transparent to-indigo-500" />
          <span className="text-slate-500 text-sm tracking-widest uppercase font-medium">Presentación del sistema</span>
          <div className="w-8 h-[2px] bg-gradient-to-l from-transparent to-indigo-500" />
        </motion.div>
      </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Slide1Hero;
