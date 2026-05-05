import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  ArchiveBoxIcon,
  TagIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  PlusCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

interface Slide10InventoryProps { isActive: boolean; }

const features = [
  { icon: ArchiveBoxIcon, title: "Catálogo de artículos", desc: "Registra herramientas, materiales de limpieza, equipos y suministros del condominio" },
  { icon: TagIcon, title: "Categorías personalizadas", desc: "Organiza el inventario por tipo: eléctrico, plomería, jardinería, limpieza y más" },
  { icon: ArrowsRightLeftIcon, title: "Movimientos de stock", desc: "Registra entradas, salidas y consumos con responsable y fecha" },
  { icon: ExclamationTriangleIcon, title: "Alertas de stock bajo", desc: "Notificación automática cuando un artículo cae por debajo del mínimo configurado" },
  { icon: MagnifyingGlassIcon, title: "Búsqueda y filtros", desc: "Localiza cualquier artículo por nombre, categoría, estado o ubicación" },
  { icon: DocumentChartBarIcon, title: "Valoración del inventario", desc: "Calcula el valor total del inventario con precio unitario y cantidad disponible" },
];

const sampleItems = [
  { name: "Foco LED 100W", category: "Eléctrico", qty: 24, min: 10, status: "ok" },
  { name: "Manguera 25m", category: "Jardinería", qty: 3, min: 2, status: "ok" },
  { name: "Pintura blanca 4L", category: "Materiales", qty: 2, min: 5, status: "low" },
  { name: "Llave inglesa 12\"", category: "Plomería", qty: 1, min: 2, status: "low" },
  { name: "Escoba industrial", category: "Limpieza", qty: 8, min: 3, status: "ok" },
];

const Slide10Inventory = ({ isActive }: Slide10InventoryProps) => {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", delay: 0.5 + i * 0.12 });
    });
    if (counterRef.current) {
      gsap.fromTo(counterRef.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)", delay: 0.3 });
    }
  }, [isActive]);

  const wrap = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
  const card = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };
  const hdr = { hidden: { opacity: 0, y: -18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] as [number,number,number,number] } } };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060810] via-[#08091c] to-[#050610]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_50%,rgba(79,70,229,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-start lg:justify-center px-4 sm:px-8 lg:px-14 pt-20 pb-24 lg:py-8 max-w-7xl mx-auto w-full">
        <motion.div key="s10" variants={wrap} initial="hidden" animate={isActive ? "visible" : "hidden"} className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8 items-start">

          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.div variants={hdr}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-widest uppercase mb-4">
                <BoltIcon className="w-3.5 h-3.5" />
                Módulo de Inventario
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Control de{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">inventario</span>
                <br />
                <span className="text-slate-300 text-lg sm:text-xl lg:text-2xl font-semibold">activos y suministros</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm">Controla cada artículo del condominio: desde focos hasta equipos de mantenimiento.</p>
            </motion.div>

            {/* Summary counters */}
            <motion.div variants={card}>
              <div ref={counterRef} className="opacity-0 grid grid-cols-2 gap-3">
                {[
                  { val: "5", lbl: "Categorías activas", icon: TagIcon, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                  { val: "2", lbl: "Alertas de stock", icon: ExclamationTriangleIcon, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                  { val: "+38", lbl: "Artículos registrados", icon: ArchiveBoxIcon, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                  { val: "100%", lbl: "Trazabilidad", icon: DocumentChartBarIcon, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.lbl} className={`rounded-xl border ${s.bg} p-3`}>
                      <Icon className={`w-5 h-5 ${s.color} mb-1.5`} />
                      <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">{s.lbl}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Movement types */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Tipos de movimiento</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Entrada", icon: PlusCircleIcon, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                  { label: "Salida", icon: MinusCircleIcon, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
                  { label: "Consumo", icon: ArrowsRightLeftIcon, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${m.bg} ${m.color}`}>
                      <Icon className="w-3.5 h-3.5" />{m.label}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <motion.div key={feat.title} variants={card} className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-indigo-500/30 hover:bg-indigo-500/[0.04] transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20">
                        <Icon className="w-5 h-5 text-indigo-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1 leading-tight">{feat.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                  </motion.div>
                );
              })}
            </div>

            {/* Live inventory table */}
            <motion.div variants={card} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <MagnifyingGlassIcon className="w-3.5 h-3.5 text-indigo-400" />
                Muestra de artículos
              </p>
              <div className="space-y-1.5">
                {sampleItems.map((item, i) => (
                  <div key={item.name} ref={(el) => { rowRefs.current[i] = el; }} className="opacity-0 flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.status === "low" ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <span className="text-xs text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-600 hidden sm:block">{item.category}</span>
                      <span className={`text-xs font-bold tabular-nums ${item.status === "low" ? "text-amber-400" : "text-slate-300"}`}>{item.qty} uds</span>
                      {item.status === "low" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">Stock bajo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Slide10Inventory;
