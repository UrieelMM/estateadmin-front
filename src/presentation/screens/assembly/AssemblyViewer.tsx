import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { useAssemblyStore } from "../../../store/useAssemblyStore";
import { AssemblyPresentation, AssemblySlideData } from "../../../interfaces/assembly";
import { AssemblyCoverSlide } from "./slides/AssemblyCoverSlide";
import { AssemblyExecutiveSummarySlide } from "./slides/AssemblyExecutiveSummarySlide";
import { AssemblyFinancialSlide } from "./slides/AssemblyFinancialSlide";
import { AssemblyFinancialBreakdownSlide } from "./slides/AssemblyFinancialBreakdownSlide";
import { AssemblyCollectionsSlide } from "./slides/AssemblyCollectionsSlide";
import { AssemblyCollectionsTopSlide } from "./slides/AssemblyCollectionsTopSlide";
import { AssemblyMaintenanceSlide } from "./slides/AssemblyMaintenanceSlide";
import { AssemblyProjectsSlide } from "./slides/AssemblyProjectsSlide";
import { AssemblyComparisonSlide } from "./slides/AssemblyComparisonSlide";
import { AssemblyAgendaSlide } from "./slides/AssemblyAgendaSlide";
import { AssemblyAgreementsSlide } from "./slides/AssemblyAgreementsSlide";
import { AssemblyCustomTextSlide } from "./slides/AssemblyCustomTextSlide";

// ── Slide renderer ────────────────────────────────────────────────────────────
function SlideRenderer({ slide, isActive }: { slide: AssemblySlideData; isActive: boolean }) {
  switch (slide.type) {
    case "cover":                return <AssemblyCoverSlide data={slide} isActive={isActive} />;
    case "executive_summary":    return <AssemblyExecutiveSummarySlide data={slide} isActive={isActive} />;
    case "financial":            return <AssemblyFinancialSlide data={slide} isActive={isActive} />;
    case "financial_breakdown":  return <AssemblyFinancialBreakdownSlide data={slide} isActive={isActive} />;
    case "collections":          return <AssemblyCollectionsSlide data={slide} isActive={isActive} />;
    case "collections_top":      return <AssemblyCollectionsTopSlide data={slide} isActive={isActive} />;
    case "maintenance":          return <AssemblyMaintenanceSlide data={slide} isActive={isActive} />;
    case "projects":             return <AssemblyProjectsSlide data={slide} isActive={isActive} />;
    case "comparison":           return <AssemblyComparisonSlide data={slide} isActive={isActive} />;
    case "agenda":               return <AssemblyAgendaSlide data={slide} isActive={isActive} />;
    case "agreements":           return <AssemblyAgreementsSlide data={slide} isActive={isActive} />;
    case "custom_text":          return <AssemblyCustomTextSlide data={slide} isActive={isActive} />;
    default:                     return null;
  }
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#07070f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-slate-500 text-sm">Cargando presentación…</p>
      </div>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#07070f]">
      <div className="text-center">
        <p className="text-6xl font-black text-white/10 mb-4">404</p>
        <p className="text-slate-400">Presentación no encontrada o no publicada.</p>
      </div>
    </div>
  );
}

// ── Main viewer ───────────────────────────────────────────────────────────────
const AssemblyViewer = () => {
  const { id } = useParams<{ id: string }>();
  const { fetchById } = useAssemblyStore();

  const [presentation, setPresentation] = useState<AssemblyPresentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Load presentation
  useEffect(() => {
    if (!id) return;
    fetchById(id).then((p) => {
      setPresentation(p);
      setLoading(false);
    });
  }, [id, fetchById]);

  // Fullscreen
  const requestFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else (el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.();
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else (document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
  }, []);

  useEffect(() => {
    const handler = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      setIsFullscreen(!!fsEl);
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  // Navigation
  const total = presentation?.slides?.length ?? 0;

  const goTo = useCallback((index: number) => {
    if (isAnimating || index === current || !presentation) return;
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    setIsAnimating(true);
  }, [current, isAnimating, presentation]);

  const goNext = useCallback(() => { if (current < total - 1) goTo(current + 1); }, [current, total, goTo]);
  const goPrev = useCallback(() => { if (current > 0) goTo(current - 1); }, [current, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  useEffect(() => {
    if (progressRef.current && total > 0) {
      gsap.to(progressRef.current, { width: `${((current + 1) / total) * 100}%`, duration: 0.6, ease: "power2.out" });
    }
  }, [current, total]);

  if (loading) return <LoadingScreen />;
  if (!presentation || presentation.status !== "published") return <NotFoundScreen />;

  const slides = presentation.slides;

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden select-none bg-[#07070f]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-40 h-[2px] bg-white/5">
        <div ref={progressRef} className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>

      {/* Slides */}
      <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{
            x: direction === 1 ? "8%" : "-8%",
            opacity: 0,
            scale: 0.985,
            filter: "blur(6px)",
          }}
          animate={{
            x: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
          }}
          exit={{
            x: direction === 1 ? "-6%" : "6%",
            opacity: 0,
            scale: 0.985,
            filter: "blur(6px)",
          }}
          transition={{ duration: 0.6, ease: [0.32, 0, 0.12, 1] }}
        >
          <SlideRenderer slide={slides[current]} isActive={true} />
        </motion.div>
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm font-semibold tracking-wider">{presentation.condominiumName}</span>
          <span className="text-white/20">·</span>
          <span className="text-slate-500 text-xs">{presentation.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {isFullscreen ? (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={exitFullscreen} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white text-xs transition-all">
              <ArrowsPointingInIcon className="w-3.5 h-3.5" /><span>Esc</span>
            </motion.button>
          ) : (
            <button onClick={requestFullscreen} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white text-xs transition-all">
              <ArrowsPointingOutIcon className="w-3.5 h-3.5" /><span>Pantalla completa</span>
            </button>
          )}
          <span className="text-slate-500 text-xs tabular-nums">
            <span className="text-slate-300 font-semibold">{String(current + 1).padStart(2, "0")}</span>
            {" / "}
            {String(total).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Left arrow */}
      <motion.button onClick={goPrev} disabled={current === 0 || isAnimating} animate={{ opacity: current === 0 ? 0 : 1 }} transition={{ duration: 0.3 }} whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white hover:bg-indigo-500/10 disabled:opacity-0 disabled:pointer-events-none transition-all">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </motion.button>

      {/* Right arrow */}
      <motion.button onClick={goNext} disabled={current === total - 1 || isAnimating} animate={{ opacity: current === total - 1 ? 0 : 1 }} transition={{ duration: 0.3 }} whileHover={{ scale: 1.05, x: 2 }} whileTap={{ scale: 0.95 }} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white hover:bg-indigo-500/10 disabled:opacity-0 disabled:pointer-events-none transition-all">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
      </motion.button>

      {/* Bottom nav — dots + mobile arrows */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center items-center gap-3">
        <motion.button onClick={goPrev} disabled={current === 0 || isAnimating} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </motion.button>

        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} disabled={isAnimating} className="flex items-center justify-center py-1">
              <motion.div
                animate={{ width: i === current ? 20 : 4, opacity: i === current ? 1 : 0.25 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-1 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
              />
            </button>
          ))}
        </div>

        <motion.button onClick={goNext} disabled={current === total - 1 || isAnimating} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-indigo-500/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </motion.button>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-6 right-6 z-30 hidden lg:flex items-center gap-1.5 text-[10px] text-slate-600">
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">←</kbd>
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">→</kbd>
        <span className="ml-1">para navegar</span>
      </div>
    </div>
  );
};

export default AssemblyViewer;
