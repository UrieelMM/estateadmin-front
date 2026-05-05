import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ArrowsPointingInIcon } from "@heroicons/react/24/outline";
import Slide1Hero from "./slides/Slide1Hero";
import Slide2Features from "./slides/Slide2Features";
import Slide3Finances from "./slides/Slide3Finances";
import Slide4Projects from "./slides/Slide4Projects";
import Slide5Reservations from "./slides/Slide5Reservations";
import Slide6Maintenance from "./slides/Slide6Maintenance";
import Slide7Notifications from "./slides/Slide7Notifications";
import Slide8AccessControl from "./slides/Slide8AccessControl";
import Slide9Dashboard from "./slides/Slide9Dashboard";
import Slide10Inventory from "./slides/Slide10Inventory";
import Slide11Parcels from "./slides/Slide11Parcels";
import Slide12Publications from "./slides/Slide12Publications";
import Slide13Staff from "./slides/Slide13Staff";
import Slide14ThankYou from "./slides/Slide14ThankYou";

const TOTAL_SLIDES = 14;

const slideTitles = [
  "Inicio",
  "Módulos",
  "Finanzas",
  "Proyectos",
  "Reservas",
  "Mantenimiento",
  "Notificaciones",
  "Acceso",
  "Dashboard",
  "Inventario",
  "Paquetes",
  "Publicaciones",
  "Personal",
  "Gracias",
];

const IntroductionPage = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // ── Fullscreen API ──────────────────────────────────────────────
  const requestFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {/* silently fail */});
    } else {
      (el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {/* silently fail */});
    } else {
      (document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      setIsFullscreen(!!fsEl);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  // ── Navigation ──────────────────────────────────────────────────
  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index === current) return;
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
      setIsAnimating(true);
    },
    [current, isAnimating]
  );

  const goNext = useCallback(() => { if (current < TOTAL_SLIDES - 1) goTo(current + 1); }, [current, goTo]);
  const goPrev = useCallback(() => { if (current > 0) goTo(current - 1); }, [current, goTo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, { width: `${((current + 1) / TOTAL_SLIDES) * 100}%`, duration: 0.6, ease: "power2.out" });
    }
  }, [current]);

  // ── Slides ──────────────────────────────────────────────────────
  const slides = [
    <Slide1Hero key="s1" isActive={current === 0} isFullscreen={isFullscreen} onRequestFullscreen={requestFullscreen} />,
    <Slide2Features key="s2" isActive={current === 1} />,
    <Slide3Finances key="s3" isActive={current === 2} />,
    <Slide4Projects key="s4" isActive={current === 3} />,
    <Slide5Reservations key="s5" isActive={current === 4} />,
    <Slide6Maintenance key="s6" isActive={current === 5} />,
    <Slide7Notifications key="s7" isActive={current === 6} />,
    <Slide8AccessControl key="s8" isActive={current === 7} />,
    <Slide9Dashboard key="s9" isActive={current === 8} />,
    <Slide10Inventory key="s10" isActive={current === 9} />,
    <Slide11Parcels key="s11" isActive={current === 10} />,
    <Slide12Publications key="s12" isActive={current === 11} />,
    <Slide13Staff key="s13" isActive={current === 12} />,
    <Slide14ThankYou key="s14" isActive={current === 13} />,
  ];

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-40 h-[2px] bg-white/5">
        <div ref={progressRef} className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" style={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }} />
      </div>

      {/* Slides */}
      <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ x: direction === 1 ? "100%" : "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction === 1 ? "-100%" : "100%", opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.32, 0, 0.12, 1] }}
        >
          {slides[current]}
        </motion.div>
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm font-semibold tracking-wider">EstatAdmin</span>
          <span className="text-white/20">·</span>
          <span className="text-slate-500 text-xs">{slideTitles[current]}</span>
        </div>
        <div className="flex items-center gap-3">
          {isFullscreen && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={exitFullscreen} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 transition-all text-xs" aria-label="Salir de pantalla completa">
              <ArrowsPointingInIcon className="w-3.5 h-3.5" />
              <span>Esc</span>
            </motion.button>
          )}
          <span className="text-slate-500 text-xs tabular-nums">
            <span className="text-slate-300 font-semibold">{String(current + 1).padStart(2, "0")}</span>
            {" / "}
            {String(TOTAL_SLIDES).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Left arrow */}
      <motion.button onClick={goPrev} disabled={current === 0 || isAnimating} animate={{ opacity: current === 0 ? 0 : 1 }} transition={{ duration: 0.3 }} whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white hover:bg-indigo-500/10 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200" aria-label="Anterior">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </motion.button>

      {/* Right arrow */}
      <motion.button onClick={goNext} disabled={current === TOTAL_SLIDES - 1 || isAnimating} animate={{ opacity: current === TOTAL_SLIDES - 1 ? 0 : 1 }} transition={{ duration: 0.3 }} whileHover={{ scale: 1.05, x: 2 }} whileTap={{ scale: 0.95 }} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white hover:bg-indigo-500/10 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200" aria-label="Siguiente">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
      </motion.button>

      {/* Bottom nav — dots centrados + flechas en mobile */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center items-center gap-3">
        {/* Prev — solo mobile */}
        <motion.button onClick={goPrev} disabled={current === 0 || isAnimating} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all" aria-label="Anterior">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </motion.button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {[...Array(TOTAL_SLIDES)].map((_, i) => (
            <button key={i} onClick={() => goTo(i)} disabled={isAnimating} aria-label={slideTitles[i]} className="flex items-center justify-center py-1">
              <motion.div
                animate={{ width: i === current ? 20 : 4, opacity: i === current ? 1 : 0.25 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-1 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
              />
            </button>
          ))}
        </div>

        {/* Next — solo mobile */}
        <motion.button onClick={goNext} disabled={current === TOTAL_SLIDES - 1 || isAnimating} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all" aria-label="Siguiente">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </motion.button>
      </div>

      {/* Keyboard hint — bottom right (desktop) */}
      <div className="absolute bottom-6 right-6 z-30 hidden lg:flex items-center gap-1.5 text-[10px] text-slate-600">
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">←</kbd>
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">→</kbd>
        <span className="ml-1">para navegar</span>
      </div>
    </div>
  );
};

export default IntroductionPage;
