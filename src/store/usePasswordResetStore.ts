import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

interface PasswordResetState {
  loading: boolean;
  error: string | null;
  sendPasswordResetEmail: (email: string) => Promise<boolean>;
  resetPassword: (oobCode: string, newPassword: string) => Promise<boolean>;
}

export const usePasswordResetStore = create<PasswordResetState>((set) => ({
  loading: false,
  error: null,

  sendPasswordResetEmail: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/reset-password`,
        {
          email,
        }
      );

      if (response.data.success) {
        toast.success(
          "Se ha enviado un correo con las instrucciones para restablecer tu contraseña"
        );
        return true;
      }
      return false;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Error al enviar el correo de recuperación";
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (oobCode: string, newPassword: string) => {
    set({ loading: true, error: null });
    try {
      if (!oobCode) {
        throw new Error("Código de verificación inválido");
      }

      if (newPassword.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }

      // Limpiar el oobCode de cualquier parámetro adicional
      const cleanOobCode = oobCode.split("&")[0];

      const response = await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/reset-password/confirm`,
        {
          oobCode: cleanOobCode,
          newPassword,
        }
      );

      if (response.data.message) {
        toast.success(response.data.message);
        return true;
      }

      throw new Error(
        response.data.message || "Error al restablecer la contraseña"
      );
    } catch (error: any) {
      let errorMessage = "Error al restablecer la contraseña";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Manejar errores específicos de Firebase
      if (error.response?.data?.error?.code) {
        switch (error.response.data.error.code) {
          case "auth/invalid-action-code":
            errorMessage =
              "El código de restablecimiento ha expirado o es inválido";
            break;
          case "auth/weak-password":
            errorMessage = "La contraseña es demasiado débil";
            break;
          case "auth/expired-action-code":
            errorMessage = "El código de restablecimiento ha expirado";
            break;
          default:
            errorMessage = error.response.data.error.message || errorMessage;
        }
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },
}));
