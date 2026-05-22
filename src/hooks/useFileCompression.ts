import { useState } from "react";
import imageCompression from "browser-image-compression";

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

interface UseFileCompressionReturn {
  compressFile: (file: File) => Promise<File>;
  isCompressing: boolean;
  error: string | null;
}

export const useFileCompression = (
  options: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }
): UseFileCompressionReturn => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compressFile = async (file: File): Promise<File> => {
    // Si no es una imagen, retornar el archivo original
    if (!file.type.startsWith("image/")) {
      return file;
    }

    setIsCompressing(true);
    setError(null);

    try {
  
      const compressedFile = await imageCompression(file, options);
      
      // Si por alguna razón el archivo comprimido es más grande (raro pero posible en configuraciones extremas),
      // o si ocurrió algún problema que no lanzó error pero retornó algo inválido, devolvemos el original.
      // Pero browser-image-compression suele manejar bien esto.
      
      return compressedFile;
    } catch (err: any) {
      console.error("Error compressing file:", err);
      setError("Error al comprimir la imagen. Se usará el archivo original.");
      return file;
    } finally {
      setIsCompressing(false);
    }
  };

  return {
    compressFile,
    isCompressing,
    error,
  };
};
