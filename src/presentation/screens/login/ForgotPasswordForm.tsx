import { useState } from 'react';
import { usePasswordResetStore } from '../../../store/usePasswordResetStore';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const { sendPasswordResetEmail, loading } = usePasswordResetStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendPasswordResetEmail(email);
    if (success) {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Correo enviado
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Hemos enviado un correo a <span className="font-semibold">{email}</span> con las instrucciones para restablecer tu contraseña.</p>
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