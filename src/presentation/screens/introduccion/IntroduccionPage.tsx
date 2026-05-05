import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import Slide1Hero from "./slides/Slide1Hero";
import Slide2Features from "./slides/Slide2Features";
import Slide3Finances from "./slides/Slide3Finances";

const TOTAL_SLIDES = 3;

const slideTitles = ["Inicio", "Módulos", "Finanzas"];

const slideVariants = {
  enterRight: { x: "100%", opacity: 0 },
  enterLeft: { x: "-100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitLeft: { x: "-100%", opacity: 0 },
  exitRight: { x: "100%", opacity: 0 },
};

const IntroduccionPage = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = forward, -1 = backward
  const [isAnimating, setIsAnimating] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index === current) return;
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
      setIsAnimating(true);
    },
    [current, isAnimating]
  );

  const goNext = useCallback(() => {
    if (current < TOTAL_SLIDES - 1) goTo(current + 1);
  }, [current, goTo]);

  const goPrev = useCallback(() => {
    if (current > 0) goTo(current - 1);
  }, [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  // Progress bar animation
  useEffect(() => {
    if (progressRef.current) {
      const pct = ((current + 1) / TOTAL_SLIDES) * 100;
      gsap.to(progressRef.current, {
        width: `${pct}%`,
        duration: 0.6,
        ease: "power2.out",
      });
    }
  }, [current]);

  const slides = [
    <Slide1Hero key="slide1" isActive={current === 0} />,
    <Slide2Features key="slide2" isActive={current === 1} />,
    <Slide3Finances key="slide3" isActive={current === 2} />,
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Slide container */}
      <AnimatePresence
        mode="wait"
        onExitComplete={() => setIsAnimating(false)}
      >
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={direction === 1 ? slideVariants.enterRight : slideVariants.enterLeft}
          animate={slideVariants.center}
          exit={direction === 1 ? slideVariants.exitLeft : slideVariants.exitRight}
          transition={{ duration: 0.55, ease: [0.32, 0, 0.12, 1] }}
        >
          {slides[current]}
        </motion.div>
      </AnimatePresence>

      {/* ─── Top bar ─── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4">
        {/* Logo text */}
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm font-semibold tracking-wider">EstatAdmin</span>
          <span className="text-white/20">·</span>
          <span className="text-slate-500 text-xs">{slideTitles[current]}</span>
        </div>

        {/* Slide counter */}
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-xs tabular-nums">
            <span className="text-slate-300 font-semibold">{String(current + 1).padStart(2, "0")}</span>
            {" / "}
            {String(TOTAL_SLIDES).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* ─── Progress bar (top) ─── */}
      <div className="absolute top-0 left-0 right-0 z-40 h-[2px] bg-white/5">
        <div
          ref={progressRef}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          style={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }}
        />
      </div>

      {/* ─── Dot navigation (bottom center) ─── */}
      <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center items-center gap-4">
        {/* Prev button */}
        <motion.button
          onClick={goPrev}
          disabled={current === 0 || isAnimating}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="group flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white/90 hover:bg-indigo-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Diapositiva anterior"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </motion.button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {[...Array(TOTAL_SLIDES)].map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              disabled={isAnimating}
              aria-label={`Ir a diapositiva ${i + 1}`}
              className="relative flex items-center justify-center transition-all duration-300"
            >
              <motion.div
                animate={{
                  width: i === current ? 28 : 6,
                  opacity: i === current ? 1 : 0.35,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
              />
            </button>
          ))}
        </div>

        {/* Next button */}
        <motion.button
          onClick={goNext}
          disabled={current === TOTAL_SLIDES - 1 || isAnimating}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="group flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white/90 hover:bg-indigo-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Siguiente diapositiva"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </motion.button>
      </div>

      {/* ─── Keyboard hint ─── */}
      <div className="absolute bottom-8 right-6 z-30 hidden lg:flex items-center gap-1.5 text-[10px] text-slate-600">
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">←</kbd>
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">→</kbd>
        <span className="ml-1">para navegar</span>
      </div>

      {/* ─── Side navigation arrows (large screens) ─── */}
      {/* Left arrow */}
      <motion.button
        onClick={goPrev}
        disabled={current === 0 || isAnimating}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: current === 0 ? 0 : 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.95 }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white hover:bg-indigo-500/10 disabled:opacity-0 transition-all duration-200"
        aria-label="Anterior"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </motion.button>

      {/* Right arrow */}
      <motion.button
        onClick={goNext}
        disabled={current === TOTAL_SLIDES - 1 || isAnimating}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: current === TOTAL_SLIDES - 1 ? 0 : 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05, x: 2 }}
        whileTap={{ scale: 0.95 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white hover:bg-indigo-500/10 disabled:opacity-0 transition-all duration-200"
        aria-label="Siguiente"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </motion.button>

      {/* ─── Slide title tabs (bottom left) ─── */}
      <div className="absolute bottom-8 left-6 z-30 hidden lg:flex items-center gap-2">
        {slideTitles.map((title, i) => (
          <button
            key={title}
            onClick={() => goTo(i)}
            disabled={isAnimating}
            className={`text-[10px] font-medium tracking-widest uppercase transition-all duration-200 ${
              i === current ? "text-indigo-400" : "text-slate-600 hover:text-slate-400"
            }`}
          >
            {title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default IntroduccionPage;
