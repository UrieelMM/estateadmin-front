import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

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
      const response = await axios.post(`${import.meta.env.VITE_URL_SERVER}/users-auth/reset-password`, {
        email
      });

      if (response.data.success) {
        toast.success('Se ha enviado un correo con las instrucciones para restablecer tu contraseña');
        return true;
      }
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al enviar el correo de recuperación';
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
      const response = await axios.post(`${import.meta.env.VITE_URL_SERVER}/users-auth/reset-password/confirm`, {
        oobCode,
        newPassword
      });
      if (response.data.success) {
        toast.success('Contraseña actualizada exitosamente');
        return true;
      }
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al restablecer la contraseña';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      set({ loading: false });
    }
  }
})); 