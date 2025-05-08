import { useState, useRef } from 'react';
import { usePasswordResetStore } from '../../../store/usePasswordResetStore';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [focusedField, setFocusedField] = useState("");
  const { loading } = usePasswordResetStore();
  
  const emailRef = useRef<HTMLInputElement>(null);
  
  // Handlers para el foco del campo
  const handleFocus = () => {
    setFocusedField("email");
  };

  const handleBlur = () => {
    setFocusedField("");
  };

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
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-md bg-green-50 p-4 border border-green-200"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <motion.svg 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 20, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-5 w-5 text-green-500" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </motion.svg>
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
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex flex-col gap-4"
        >
          <motion.button
            whileHover={{ backgroundColor: "#4338ca" }} // indigo-700
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onBack}
            className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold leading-6 text-white transition-all duration-200"
          >
            Volver al inicio de sesión
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setEmailSent(false)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ¿No recibiste el correo? Intentar nuevamente
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <motion.div
          animate={{
            y: focusedField === "email" || email ? -35 : 0,
            scale: focusedField === "email" || email ? 0.9 : 1,
            color: focusedField === "email" ? "#4f46e5" : "#6b7280",
          }}
          transition={{ type: "tween", duration: 0.2 }}
          className="absolute left-12 top-2.5 text-gray-500 pointer-events-none origin-left z-10"
        >
          Correo electrónico
        </motion.div>
        <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${focusedField === "email" ? "ring-2 ring-indigo-500 shadow-lg" : "shadow"}`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <motion.svg
              animate={{
                color: focusedField === "email" ? "#4f46e5" : "#9ca3af",
              }}
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </motion.svg>
          </div>
          <input
            ref={emailRef}
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="block w-full pl-12 pr-4 py-2 bg-white/60 text-gray-900 border-0 outline-none text-base mt-1.5"
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex gap-4 mt-6"
      >
        <motion.button
          whileHover={{ backgroundColor: "#e5e7eb" }} // gray-200
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onBack}
          className="flex w-full justify-center rounded-xl bg-gray-100 px-3 py-3 text-sm font-semibold leading-6 text-gray-900 transition-all duration-200"
        >
          Volver
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: "#4338ca" }} // indigo-700
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-md transition-all duration-200"
        >
          {loading ? (
            <motion.svg
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
              />
            </motion.svg>
          ) : (
            "Enviar correo"
          )}
        </motion.button>
      </motion.div>
    </form>
  );
}; 