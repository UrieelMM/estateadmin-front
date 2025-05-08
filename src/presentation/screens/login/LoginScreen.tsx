import { useEffect, useState, useRef } from "react";
import useAuthStore from "../../../store/AuthStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "../../../firebase/firebase";
import Loading from "../../components/shared/loaders/Loading";
import logo from "../../../assets/logo.png";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { motion } from "framer-motion";

const LoginScreen = () => {
  const loginWithEmailAndPassword = useAuthStore(
    (state) => state.loginWithEmailAndPassword
  );
  const authError = useAuthStore((state) => state.authError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loasingSession, setLoadingSession] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  //validar si hay un usuario logeado
  useEffect(() => {
    setLoadingSession(true);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Verificar el rol del usuario
        try {
          const tokenResult = await user.getIdTokenResult();
          const role = tokenResult.claims.role;

          if (role === "super-provider-admin") {
            navigate("/super-admin/dashboard");
          } else {
            navigate("/dashboard/home");
          }
        } catch (error) {
          console.error("Error al verificar rol:", error);
          navigate("/dashboard/home");
        }
      }
    });
    setTimeout(() => {
      setLoadingSession(false);
      setFormVisible(true);
    }, 400);
    return () => unsubscribe();
  }, [navigate]);

  const handleLoginWithEmailAndPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const successLogingUser = await loginWithEmailAndPassword!({
        email,
        password,
      });
      if (successLogingUser) {
        // Verificar el rol del usuario
        try {
          const user = auth.currentUser;
          if (user) {
            const tokenResult = await user.getIdTokenResult();
            const role = tokenResult.claims.role;

            if (role === "super-provider-admin") {
              navigate("/super-admin/dashboard");
            } else {
              navigate("/dashboard/home");
            }
          }
        } catch (error) {
          console.error("Error al verificar rol:", error);
          navigate("/dashboard/home");
        }
      }
    } catch (error) {
      if (authError) {
        toast.error(authError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handlers para el foco de los campos
  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField("");
  };

  if (loasingSession) return <Loading />;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      {/* Card container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden">
          {/* Logo section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="p-8 flex flex-col items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-6"
            >
              <img className="w-12 h-auto" src={logo} alt="Estate Admin" />
            </motion.div>

            <motion.h2
              className="text-2xl font-bold text-gray-800"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {showForgotPassword
                ? "Recuperar contraseña"
                : "Bienvenido de nuevo"}
            </motion.h2>

            <motion.p
              className="text-gray-500 text-center mt-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {showForgotPassword
                ? "Enviaremos un correo para recuperar tu acceso"
                : "Inicia sesión para continuar"}
            </motion.p>
          </motion.div>

          <div className="px-8 pb-8">
            {showForgotPassword ? (
              <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: formVisible ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                onSubmit={(e) => handleLoginWithEmailAndPassword(e)}
                className="space-y-8"
                action="#"
                method="POST"
              >
                {/* Email field with animation */}
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
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
                  <div
                    className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                      focusedField === "email"
                        ? "ring-2 ring-indigo-500 shadow-lg"
                        : "shadow"
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <motion.svg
                        animate={{
                          color:
                            focusedField === "email" ? "#4f46e5" : "#9ca3af",
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
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => handleFocus("email")}
                      onBlur={handleBlur}
                      className="block w-full pl-12 pr-4 py-2 bg-white/60 text-gray-900 border-0 outline-none text-base mt-1.5"
                    />
                  </div>
                </motion.div>

                {/* Password field with animation */}
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      y: focusedField === "password" || password ? -35 : 0,
                      scale: focusedField === "password" || password ? 0.9 : 1,
                      color:
                        focusedField === "password" ? "#4f46e5" : "#6b7280",
                    }}
                    transition={{ type: "tween", duration: 0.2 }}
                    className="absolute left-12 top-2.5 text-gray-500 pointer-events-none origin-left z-10"
                  >
                    Contraseña
                  </motion.div>
                  <div
                    className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                      focusedField === "password"
                        ? "ring-2 ring-indigo-500 shadow-lg"
                        : "shadow"
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <motion.svg
                        animate={{
                          color:
                            focusedField === "password" ? "#4f46e5" : "#9ca3af",
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </motion.svg>
                    </div>
                    <input
                      ref={passwordRef}
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => handleFocus("password")}
                      onBlur={handleBlur}
                      className="block w-full pl-12 pr-4 py-2 bg-white/60 text-gray-900 border-0 outline-none text-base mt-1.5"
                    />
                  </div>
                </motion.div>

                {/* Forgot password link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.85 }}
                  className="flex justify-end"
                >
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </motion.button>
                </motion.div>

                {/* Submit button */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.9 }}
                >
                  <motion.button
                    whileHover={{
                      backgroundColor: "#4338ca", // indigo-700
                    }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="relative w-full flex justify-center items-center py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium shadow-md overflow-hidden transition-all duration-200"
                  >
                    {loading ? (
                      <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="h-6 w-6 text-white"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
                        />
                      </motion.svg>
                    ) : (
                      <>
                        <span>Iniciar sesión</span>
                        <motion.span
                          className="absolute right-4"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.3 }}
                        >
                          <svg
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
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </motion.span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            )}

            {/* Bottom link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.4 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-gray-500 mb-2">
                ¿No tienes una cuenta?
              </p>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="/contact"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Contáctanos para unirte a nuestros servicios
              </motion.a>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
