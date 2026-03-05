import { useEffect, useState, useRef } from "react";
import useAuthStore from "../../../store/AuthStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "../../../firebase/firebase";
import Loading from "../../components/shared/loaders/Loading";
import logo from "../../../assets/logo.png";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { SparklesIcon, CheckBadgeIcon, BoltIcon } from "@heroicons/react/24/solid";

const LoginScreen = () => {
  const loginWithEmailAndPassword = useAuthStore(
    ( state ) => state.loginWithEmailAndPassword
  );
  const authError = useAuthStore( ( state ) => state.authError );

  const [ email, setEmail ] = useState( "" );
  const [ password, setPassword ] = useState( "" );
  const [ loading, setLoading ] = useState( false );
  const [ loasingSession, setLoadingSession ] = useState( true );
  const [ showForgotPassword, setShowForgotPassword ] = useState( false );
  const [ formVisible, setFormVisible ] = useState( false );
  const [ focusedField, setFocusedField ] = useState( "" );

  const emailRef = useRef<HTMLInputElement>( null );
  const passwordRef = useRef<HTMLInputElement>( null );

  const navigate = useNavigate();

  useEffect( () => {
    setLoadingSession( true );
    const unsubscribe = auth.onAuthStateChanged( async ( user ) => {
      if ( user ) {
        try {
          const tokenResult = await user.getIdTokenResult();
          const role = tokenResult.claims.role;
          if ( role === "super-provider-admin" ) {
            navigate( "/super-admin/dashboard" );
          } else {
            navigate( "/dashboard/home" );
          }
        } catch ( error ) {
          console.error( "Error al verificar rol:", error );
          navigate( "/dashboard/home" );
        }
      }
    } );
    setTimeout( () => {
      setLoadingSession( false );
      setFormVisible( true );
    }, 400 );
    return () => unsubscribe();
  }, [ navigate ] );

  const handleLoginWithEmailAndPassword = async ( e: React.SyntheticEvent ) => {
    e.preventDefault();
    setLoading( true );
    try {
      const successLogingUser = await loginWithEmailAndPassword!( { email, password } );
      if ( successLogingUser ) {
        try {
          const user = auth.currentUser;
          if ( user ) {
            const tokenResult = await user.getIdTokenResult();
            const role = tokenResult.claims.role;
            if ( role === "super-provider-admin" ) {
              navigate( "/super-admin/dashboard" );
            } else {
              navigate( "/dashboard/home" );
            }
          }
        } catch ( error ) {
          console.error( "Error al verificar rol:", error );
          navigate( "/dashboard/home" );
        }
      }
    } catch ( error ) {
      if ( authError ) {
        toast.error( authError );
      }
    } finally {
      setLoading( false );
    }
  };

  const handleFocus = ( field: string ) => setFocusedField( field );
  const handleBlur = () => setFocusedField( "" );

  if ( loasingSession ) return <Loading />;

  return (
    <div className="relative isolate min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden flex items-center justify-center p-6">
      <Helmet>
        <title>Iniciar Sesión - EstateAdmin | Acceso a tu cuenta</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Inicia sesión en tu cuenta de EstateAdmin para acceder a todas las herramientas de gestión de condominios."
        />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://estate-admin.com/login" />
      </Helmet>

      {/* Grid Pattern Background */ }
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-400 dark:bg-indigo-600 opacity-20 blur-[100px]" />
      </div>

      {/* Animated Gradient Blob — top */ }
      <div className="fixed inset-x-0 -top-40 opacity-90 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-slow-pulse"
          style={ {
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          } }
        />
      </div>

      {/* Animated Gradient Blob — bottom */ }
      <div className="fixed inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl">
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] via-[#9c80ff] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] animate-pulse"
          style={ {
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            animationDuration: "4s",
          } }
        />
      </div>

      {/* Card */ }
      <motion.div
        initial={ { opacity: 0, y: 20 } }
        animate={ { opacity: 1, y: 0 } }
        transition={ { duration: 0.6 } }
        className="relative z-10 w-full max-w-md"
      >
        {/* Badge pill */ }
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <div className="relative rounded-full px-4 py-2 text-sm leading-6 bg-white dark:bg-gray-800 ring-1 ring-gray-900/10 dark:ring-gray-700/50 hover:ring-gray-900/20 dark:hover:ring-gray-600/50 transition-all">
              <SparklesIcon className="inline h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-1" />
              <span className="text-gray-600 dark:text-gray-100">
                Accede a tu panel de administración
              </span>
            </div>
          </div>
        </div>

        {/* Glsas Card */ }
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/20 dark:ring-gray-700/40">
          {/* Header */ }
          <div className="px-8 pt-8 pb-4 flex flex-col items-center">
            <motion.div
              whileHover={ { scale: 1.03 } }
              transition={ { type: "tween", duration: 0.2 } }
              className="mb-5"
            >
              <img className="w-12 h-auto drop-shadow-md" src={ logo } alt="Estate Admin" />
            </motion.div>

            {/* Gradient title */ }
            <div className="relative inline-block text-center">
              <h1 className="text-3xl font-black tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient">
                  EstateAdmin
                </span>
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-lg blur-2xl opacity-20 -z-10" />
            </div>

            <motion.p
              className="text-gray-500 dark:text-gray-400 text-center mt-2 text-sm"
              initial={ { y: 10, opacity: 0 } }
              animate={ { y: 0, opacity: 1 } }
              transition={ { delay: 0.4 } }
            >
              { showForgotPassword
                ? "Enviaremos un correo para recuperar tu acceso"
                : "Inicia sesión para continuar" }
            </motion.p>
          </div>

          <div className="px-8 pb-8 pt-2">
            { showForgotPassword ? (
              <ForgotPasswordForm onBack={ () => setShowForgotPassword( false ) } />
            ) : (
              <motion.form
                initial={ { opacity: 0 } }
                animate={ { opacity: formVisible ? 1 : 0 } }
                transition={ { duration: 0.5, delay: 0.5 } }
                onSubmit={ handleLoginWithEmailAndPassword }
                className="space-y-5"
                action="#"
                method="POST"
              >
                {/* Email field */ }
                <motion.div
                  initial={ { x: -10, opacity: 0 } }
                  animate={ { x: 0, opacity: 1 } }
                  transition={ { duration: 0.3, delay: 0.55 } }
                  className="relative"
                >
                  <label
                    htmlFor="email"
                    className={ `block text-xs font-semibold mb-1 transition-colors ${ focusedField === "email"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 dark:text-gray-400"
                      }` }
                  >
                    Correo electrónico
                  </label>
                  <div
                    className={ `relative rounded-xl overflow-hidden transition-all duration-300 ${ focusedField === "email"
                      ? "ring-2 ring-indigo-500 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/50"
                      : "ring-1 ring-gray-200 dark:ring-gray-700"
                      }` }
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className={ `h-5 w-5 transition-colors ${ focusedField === "email"
                          ? "text-indigo-500"
                          : "text-gray-400"
                          }` }
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={ 2 }
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      ref={ emailRef }
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={ email }
                      onChange={ ( e ) => setEmail( e.target.value ) }
                      onFocus={ () => handleFocus( "email" ) }
                      onBlur={ handleBlur }
                      placeholder="tu@correo.com"
                      className="block w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border-0 outline-none text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </motion.div>

                {/* Password field */ }
                <motion.div
                  initial={ { x: -10, opacity: 0 } }
                  animate={ { x: 0, opacity: 1 } }
                  transition={ { duration: 0.3, delay: 0.65 } }
                  className="relative"
                >
                  <label
                    htmlFor="password"
                    className={ `block text-xs font-semibold mb-1 transition-colors ${ focusedField === "password"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 dark:text-gray-400"
                      }` }
                  >
                    Contraseña
                  </label>
                  <div
                    className={ `relative rounded-xl overflow-hidden transition-all duration-300 ${ focusedField === "password"
                      ? "ring-2 ring-indigo-500 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/50"
                      : "ring-1 ring-gray-200 dark:ring-gray-700"
                      }` }
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className={ `h-5 w-5 transition-colors ${ focusedField === "password"
                          ? "text-indigo-500"
                          : "text-gray-400"
                          }` }
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={ 2 }
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      ref={ passwordRef }
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={ password }
                      onChange={ ( e ) => setPassword( e.target.value ) }
                      onFocus={ () => handleFocus( "password" ) }
                      onBlur={ handleBlur }
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border-0 outline-none text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </motion.div>

                {/* Forgot password */ }
                <div className="flex justify-end">
                  <motion.button
                    whileHover={ { scale: 1.005 } }
                    whileTap={ { scale: 0.995 } }
                    type="button"
                    onClick={ () => setShowForgotPassword( true ) }
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </motion.button>
                </div>

                {/* Submit button — same gradient CTA as Hero */ }
                <motion.div
                  initial={ { y: 10, opacity: 0 } }
                  animate={ { y: 0, opacity: 1 } }
                  transition={ { duration: 0.3, delay: 0.75 } }
                >
                  <motion.button
                    whileHover={ { scale: 1.005 } }
                    whileTap={ { scale: 0.995 } }
                    type="submit"
                    className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-200 overflow-hidden"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center gap-2">
                      { loading ? (
                        <motion.svg
                          animate={ { rotate: 360 } }
                          transition={ { duration: 1, repeat: Infinity, ease: "linear" } }
                          className="h-5 w-5 text-white"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
                          />
                        </motion.svg>
                      ) : (
                        <>
                          Iniciar sesión
                          <svg
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={ 2 }
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </>
                      ) }
                    </span>
                  </motion.button>
                </motion.div>
              </motion.form>
            ) }

            {/* Trust indicators — same as Hero */ }
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BoltIcon className="h-4 w-4 text-yellow-500" />
                <span>Rápido</span>
              </div>
              <div className="flex items-center gap-1.5">
                <SparklesIcon className="h-4 w-4 text-indigo-500" />
                <span>Fácil de usar</span>
              </div>
            </div>

            {/* Bottom link */ }
            <motion.div
              initial={ { opacity: 0 } }
              animate={ { opacity: 1 } }
              transition={ { duration: 0.4, delay: 1.0 } }
              className="mt-5 text-center"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ¿No tienes una cuenta?{ " " }
                <a
                  href="/contacto"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                >
                  Contáctanos →
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
