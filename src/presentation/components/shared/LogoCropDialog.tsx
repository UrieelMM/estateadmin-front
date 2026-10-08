import { useEffect, useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";

interface LogoCropDialogProps {
  file: File | null;
  aspect?: "square" | "wide";
  onClose: () => void;
  onConfirm: (file: File) => void | Promise<void>;
}

/** Encuadra el logo antes de subirlo. El PNG conserva áreas transparentes. */
export const LogoCropDialog = ({
  file, aspect = "wide", onClose, onConfirm,
}: LogoCropDialogProps) => {
  const [url, setUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const width = aspect === "square" ? 600 : 1200;
  const height = aspect === "square" ? 600 : 400;

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const draw = (context: CanvasRenderingContext2D, image: HTMLImageElement) => {
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width / image.width, height / image.height) * zoom;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    context.drawImage(image,
      (width - drawWidth) / 2 + offsetX * width / 200,
      (height - drawHeight) / 2 + offsetY * height / 200,
      drawWidth, drawHeight);
  };

  useEffect(() => {
    if (!url || !previewRef.current) return;
    const image = new Image();
    image.onload = () => {
      const context = previewRef.current?.getContext("2d");
      if (context) draw(context, image);
    };
    image.src = url;
  }, [url, zoom, offsetX, offsetY, width, height]);

  const save = async () => {
    if (!file || !url) return;
    setBusy(true);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo preparar el recorte");
      draw(context, image);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("No se pudo guardar el recorte")), "image/png"),
      );
      await onConfirm(new File([blob], file.name.replace(/\.[^.]+$/, "") + "-encuadrado.png", { type: "image/png" }));
      onClose();
    } catch (error) {
      console.error("Error al encuadrar logo", error);
      toast.error("No se pudo encuadrar el logo");
    } finally {
      setBusy(false);
    }
  };

  return <Dialog open={!!file} onClose={onClose} className="relative z-[100]">
    <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
      <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
        <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">Encuadrar logo</Dialog.Title>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Amplía y mueve el logo para reducir bordes blancos antes de guardarlo.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border bg-white" style={{ aspectRatio: `${width}/${height}` }}>
          <canvas ref={previewRef} width={width} height={height} aria-label="Vista previa del encuadre"
            className="h-full w-full object-contain" />
        </div>
        <div className="mt-4 grid gap-3 text-sm dark:text-gray-100">
          <label>Ampliación: {zoom.toFixed(1)}×
            <input type="range" min="1" max="4" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="block w-full" />
          </label>
          <label>Posición horizontal
            <input type="range" min="-100" max="100" value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} className="block w-full" />
          </label>
          <label>Posición vertical
            <input type="range" min="-100" max="100" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} className="block w-full" />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm dark:text-white">Cancelar</button>
          <button type="button" onClick={save} disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Usar este encuadre
          </button>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>;
};
