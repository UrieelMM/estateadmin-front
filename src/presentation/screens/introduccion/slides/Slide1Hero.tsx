import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import logo from "../../../../assets/logo.png";

interface Slide1HeroProps {
  isActive: boolean;
}

const Slide1Hero = ({ isActive }: Slide1HeroProps) => {
  const particlesRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    // Animated glow pulse
    if (glowRef.current) {
      gsap.to(glowRef.current, {
        scale: 1.15,
        opacity: 0.6,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }

    // Floating particles
    const container = particlesRef.current;
    if (!container) return;
    const particles = container.querySelectorAll(".particle");
    particles.forEach((p, i) => {
      gsap.to(p, {
        y: `${-20 - i * 8}px`,
        x: `${Math.sin(i) * 10}px`,
        opacity: 0.3 + (i % 3) * 0.2,
        duration: 2 + i * 0.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.2,
      });
    });

    return () => {
      gsap.killTweensOf(glowRef.current);
      if (container) {
        container.querySelectorAll(".particle").forEach((p) => gsap.killTweensOf(p));
      }
    };
  }, [isActive]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.18, delayChildren: 0.1 },
    },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const itemUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };

  const itemScale = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#050510]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.18)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(139,92,246,0.12)_0%,transparent_60%)]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Central glow */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Floating particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle absolute rounded-full"
            style={{
              width: `${3 + (i % 4)}px`,
              height: `${3 + (i % 4)}px`,
              background: i % 3 === 0
                ? "rgba(99,102,241,0.7)"
                : i % 3 === 1
                ? "rgba(139,92,246,0.7)"
                : "rgba(167,139,250,0.5)",
              left: `${8 + i * 7.5}%`,
              top: `${20 + (i % 5) * 13}%`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        key="slide1-content"
        variants={containerVariants}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto"
      >
        {/* Logo */}
        <motion.div variants={itemScale} className="mb-8">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 blur-xl scale-150" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-700/20 border border-indigo-500/30 backdrop-blur-sm flex items-center justify-center p-2 shadow-2xl">
              <img src={logo} alt="EstateAdmin" className="w-full h-full object-contain" />
            </div>
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div variants={itemUp} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-sm font-medium tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Software de Gestión
          </span>
        </motion.div>

        {/* Main title */}
        <motion.h1 variants={itemUp} className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight leading-none mb-6">
          <span
            className="block"
            style={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 40%, #818cf8 70%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            EstatAdmin
          </span>
        </motion.h1>

        {/* Divider */}
        <motion.div variants={itemUp} className="w-24 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mb-8" />

        {/* Tagline */}
        <motion.p variants={itemUp} className="text-xl sm:text-2xl lg:text-3xl font-light text-slate-300 max-w-2xl leading-relaxed">
          Software integral para la{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #a5b4fc, #c4b5fd)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 500,
            }}
          >
            gestión de condominios
          </span>
        </motion.p>

        {/* Bottom indicator */}
        <motion.div variants={itemUp} className="mt-14 flex items-center gap-3">
          <div className="w-8 h-[2px] bg-gradient-to-r from-transparent to-indigo-500" />
          <span className="text-slate-500 text-sm tracking-widest uppercase font-medium">
            Presentación del sistema
          </span>
          <div className="w-8 h-[2px] bg-gradient-to-l from-transparent to-indigo-500" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Slide1Hero;
