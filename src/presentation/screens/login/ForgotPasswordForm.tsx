import { useState } from 'react';
import { usePasswordResetStore } from '../../../store/usePasswordResetStore';
import toast from 'react-hot-toast';
import axios from 'axios';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const { loading } = usePasswordResetStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Implementación directa para tener control total del proceso
      const response = await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/reset-password`,
        { email }
      );

      // La API responde con { status, code, message } en caso de éxito
      if (response.data.status === true || response.data.code === 200) {
        // Usar el mensaje exacto que proporciona la API
        const message = response.data.message || "Se ha enviado un correo con las instrucciones para restablecer tu contraseña";
        toast.success(message);
        setApiMessage(message);
        setEmailSent(true);
      } else {
        // Toast de error para mensajes de error
        toast.error(response.data.message || "No se pudo enviar el correo de recuperación");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error al enviar el correo de recuperación";
      toast.error(errorMessage);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ¡Correo enviado correctamente!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{apiMessage}</p>
                <p className="mt-2">Se ha enviado a: <span className="font-semibold">{email}</span></p>
                <p className="mt-2">Por favor, revisa tu bandeja de entrada y sigue los pasos indicados en el correo.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white hover:bg-indigo-500"
          >
            Volver al inicio de sesión
          </button>
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ¿No recibiste el correo? Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="recovery-email"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Email
        </label>
        <div className="mt-2">
          <input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md py-1.5 text-gray-900 shadow-sm outline-none border border-solid px-4 border-indigo-300 placeholder:text-gray-400 sm:text-sm sm:leading-6"
            placeholder="Ingresa tu correo electrónico"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex w-full justify-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-200"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-indigo-100 rounded-full"
              viewBox="0 0 24 24"
            ></svg>
          ) : (
            "Enviar correo"
          )}
        </button>
      </div>
    </form>
  );
}; 