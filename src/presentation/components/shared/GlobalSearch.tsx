import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MagnifyingGlassIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { SEARCH_INDEX, SearchItem } from "../../../data/searchIndex";

// ─── Emil-style easing constants ────────────────────────────────────────────
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

// ─── Fuzzy scoring (no external deps) ───────────────────────────────────────
function scoreItem(item: SearchItem, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const title = item.title.toLowerCase();
  const breadcrumb = item.breadcrumb.toLowerCase();
  const keywords = (item.keywords ?? []).join(" ").toLowerCase();
  const combined = `${title} ${breadcrumb} ${keywords}`;

  // Exact match in title → highest score
  if (title === q) return 100;
  // Title starts with query
  if (title.startsWith(q)) return 90;
  // Title contains the full query
  if (title.includes(q)) return 80;
  // Breadcrumb contains the query
  if (breadcrumb.includes(q)) return 70;
  // Keywords contain query
  if (keywords.includes(q)) return 65;

  // Partial word matching — each query word that appears in combined scores
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const matched = words.filter((w) => combined.includes(w));
    if (matched.length === words.length) return 60;
    if (matched.length > 0) return 40 * (matched.length / words.length);
  }

  // Fuzzy character-level containment (each char in query appears in title in order)
  let ti = 0;
  let qi = 0;
  while (ti < title.length && qi < q.length) {
    if (title[ti] === q[qi]) qi++;
    ti++;
  }
  if (qi === q.length) return 20;

  return 0;
}

function search(query: string): SearchItem[] {
  if (!query.trim()) return [];
  return SEARCH_INDEX
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ item }) => item);
}

// ─── Highlight matching substring ────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const q = query.trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </span>
  );
}

// ─── Group results by section ─────────────────────────────────────────────────
function groupBySection(items: SearchItem[]): Map<string, SearchItem[]> {
  const map = new Map<string, SearchItem[]>();
  for (const item of items) {
    const key = item.section;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

// ─── Section icon color ───────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, string> = {
  "General":        "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "Usuarios":       "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "Finanzas":       "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Comunidad":      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "Paquetería":     "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  "Mantenimiento":  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  "Proveedores":    "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Inventario":     "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  "Personal":       "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  "Asambleas":      "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  "Configuración":  "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
};

function sectionColor(section: string) {
  return SECTION_COLORS[section] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      // Slight delay so AnimatePresence finishes mounting
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Run search on query change
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) { setResults([]); return; }
    setResults(search(trimmed));
    setActiveIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      navigate(item.href);
      onClose();
    },
    [navigate, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && results[activeIndex]) {
      handleSelect(results[activeIndex]);
    }
  };

  const grouped = groupBySection(results);
  // Build flat list of items in order (for keyboard nav index tracking)
  const flatItems = Array.from(grouped.values()).flat();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Panel ── */}
          <motion.div
            key="search-panel"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="fixed left-1/2 top-[6vh] z-[61] w-full max-w-xl -translate-x-1/2 px-4 sm:px-0"
            role="dialog"
            aria-modal="true"
            aria-label="Búsqueda global"
          >
            <div className="overflow-hidden rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-2xl shadow-black/20 ring-1 ring-black/[0.06] dark:ring-white/[0.08]">

              {/* ── Input row ── */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-white/[0.07]">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar en el sistema…"
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
                <kbd className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-400">
                  ESC
                </kbd>
              </div>

              {/* ── Results ── */}
              <div className="max-h-[55vh] overflow-y-auto overscroll-contain">
                {query && results.length === 0 && (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sin resultados para{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        "{query}"
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Intenta con otra búsqueda
                    </p>
                  </div>
                )}

                {!query && (
                  <div className="px-4 py-8 text-center">
                    <MagnifyingGlassIcon className="mx-auto w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Escribe para buscar en menús, tabs y configuraciones
                    </p>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="py-2">
                    {Array.from(grouped.entries()).map(([section, items]) => (
                      <div key={section}>
                        {/* Section header */}
                        <div className="px-4 pt-3 pb-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sectionColor(section)}`}>
                            {section}
                          </span>
                        </div>

                        {/* Items */}
                        {items.map((item) => {
                          const flatIdx = flatItems.indexOf(item);
                          const isActive = flatIdx === activeIndex;
                          return (
                            <button
                              key={item.id}
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              onClick={() => handleSelect(item)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75 ${
                                isActive
                                  ? "bg-indigo-50 dark:bg-indigo-500/10"
                                  : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                              }`}
                            >
                              {/* Title + breadcrumb */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isActive
                                    ? "text-indigo-700 dark:text-indigo-300"
                                    : "text-gray-800 dark:text-gray-200"
                                }`}>
                                  <Highlight text={item.title} query={query} />
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                  <Highlight text={item.breadcrumb} query={query} />
                                </p>
                              </div>

                              {/* Arrow indicator on active */}
                              <ArrowRightIcon
                                className={`w-4 h-4 shrink-0 transition-all duration-100 ${
                                  isActive
                                    ? "opacity-100 text-indigo-400 translate-x-0"
                                    : "opacity-0 -translate-x-1"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Footer hint ── */}
              {results.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                    <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-1 py-px text-[10px]">↑↓</kbd>
                    Navegar
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                    <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-1 py-px text-[10px]">↵</kbd>
                    Ir
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                    <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-1 py-px text-[10px]">ESC</kbd>
                    Cerrar
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GlobalSearch;
