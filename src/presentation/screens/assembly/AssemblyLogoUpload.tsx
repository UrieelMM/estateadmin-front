import { useRef, useState } from "react";
import { ArrowUpTrayIcon, TrashIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useAssemblyStore } from "../../../store/useAssemblyStore";
import toast from "react-hot-toast";

interface Props {
  /** URL actual del logo (si existe) */
  value?: string;
  /** Callback cuando cambia el logo (string vacío para quitar) */
  onChange: (logoUrl: string | undefined) => void;
}

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

export const AssemblyLogoUpload = ({ value, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { uploadLogo, removeLogo } = useAssemblyStore();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("La imagen debe pesar menos de 3 MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      // Si había un logo previo, eliminarlo de Storage
      if (value) {
        try { await removeLogo(value); } catch {}
      }
      onChange(url);
      toast.success("Logo cargado");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo cargar el logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    try { await removeLogo(value); } catch {}
    onChange(undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
        Logo (170 × 170 px aprox.)
      </label>

      <div className="flex items-center gap-3">
        <div className="shrink-0 w-24 h-24 rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] overflow-hidden flex items-center justify-center">
          {value ? (
            <img src={value} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <PhotoIcon className="w-8 h-8 text-gray-300 dark:text-slate-600" />
          )}
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-50 self-start"
          >
            {uploading ? (
              <>
                <div className="w-3 h-3 rounded-full border-2 border-indigo-300 border-t-transparent animate-spin" />
                Cargando…
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                {value ? "Reemplazar" : "Subir logo"}
              </>
            )}
          </button>

          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-medium hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors self-start"
            >
              <TrashIcon className="w-3 h-3" />
              Quitar logo
            </button>
          )}

          <p className="text-[10px] text-gray-400 dark:text-slate-600">
            PNG, JPG, WEBP o SVG. Se mostrará en la esquina superior derecha de cada slide.
          </p>
        </div>
      </div>
    </div>
  );
};
