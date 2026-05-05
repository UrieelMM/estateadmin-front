import { motion } from "framer-motion";
import { BuildingOffice2Icon } from "@heroicons/react/24/outline";

interface Props {
  /** URL del logo (170x170) en esquina superior derecha. */
  logoUrl?: string;
  /** Nombre del condominio mostrado debajo del logo (opcional). */
  condoName?: string;
  /** Si true, oculta el placeholder cuando no hay logo. */
  hidePlaceholder?: boolean;
}

/**
 * Header con logo en la esquina superior derecha de cada slide.
 *
 * - Cuando hay logo: 170x170 px exactos.
 * - Cuando NO hay logo: placeholder reducido (80x80) con icono y un
 *   shimmer sutil para que no estorbe.
 *
 * Se posiciona con `absolute` dentro del contenedor del slide (que usa
 * `overflow-hidden`).
 */
export const AssemblySlideHeader = ({ logoUrl, condoName, hidePlaceholder }: Props) => {
  if (!logoUrl && hidePlaceholder) return null;

  const hasLogo = Boolean(logoUrl);

  return (
    <div className="absolute top-20 right-6 z-20 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="flex flex-col items-end gap-2"
      >
        {hasLogo ? (
          <motion.div
            whileHover={{ scale: 1.04, rotate: 0.5 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative bg-white/95 dark:bg-white/90 rounded-2xl border border-white/15 backdrop-blur-md p-2 shadow-2xl shadow-black/30"
          >
            {/* Glow sutil */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-transparent to-purple-500/20 blur-md opacity-60 -z-10" />
            <img
              src={logoUrl}
              alt={condoName ?? "Logo"}
              className="object-contain rounded-xl"
              style={{ width: "170px", height: "170px" }}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden"
            style={{ width: "80px", height: "80px" }}
          >
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            />
            <BuildingOffice2Icon className="w-7 h-7 text-white/30" />
          </motion.div>
        )}
        {condoName && (
          <span className="text-[11px] tracking-widest uppercase text-white/50 font-semibold pr-1">
            {condoName}
          </span>
        )}
      </motion.div>
    </div>
  );
};
