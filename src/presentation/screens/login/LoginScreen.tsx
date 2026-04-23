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
import { CheckBadgeIcon, BoltIcon, SparklesIcon } from "@heroicons/react/24/solid";

// Easing curve suave para entradas — ease out expo
const EASE_OUT = [ 0.16, 1, 0.3, 1 ] as const;

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
    setTimeout( () => setLoadingSession( false ), 400 );
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

      {/* Fondo: grid sutil + blob estático (sin animación continua) */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />
        {/* Blob superior — estático, solo color ambiente */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 opacity-40">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#c4b5fd] to-[#818cf8] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={ {
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            } }
          />
        </div>
      </div>

      {/* Card — entra una sola vez, limpio */}
      <motion.div
        initial={ { opacity: 0, y: 14 } }
        animate={ { opacity: 1, y: 0 } }
        transition={ { duration: 0.45, ease: EASE_OUT } }
        className="relative z-10 w-full max-w-md"
      >
        {/* Glass Card */}
        <div className="bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">

          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex flex-col items-center">
            {/* Logo con spring en hover — delight sutil */}
            <motion.div
              whileHover={ { scale: 1.06 } }
              whileTap={ { scale: 0.96 } }
              transition={ { type: "spring", stiffness: 350, damping: 20 } }
              className="mb-5 cursor-default"
            >
              <img className="w-12 h-auto drop-shadow-md" src={ logo } alt="Estate Admin" />
            </motion.div>

            <h1 className="text-3xl font-black tracking-tight text-center">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                EstateAdmin
              </span>
            </h1>

            <p className="text-gray-500 dark:text-gray-400 text-center mt-2 text-sm">
              { showForgotPassword
                ? "Enviaremos un correo para recuperar tu acceso"
                : "Inicia sesión para continuar" }
            </p>
          </div>

          <div className="px-8 pb-8 pt-2">
            { showForgotPassword ? (
              <ForgotPasswordForm onBack={ () => setShowForgotPassword( false ) } />
            ) : (
              <form
                onSubmit={ handleLoginWithEmailAndPassword }
                className="space-y-5"
                action="#"
                method="POST"
              >
                {/* Email field */}
                <div className="relative">
                  <label
                    htmlFor="email"
                    className={ `block text-xs font-semibold mb-1 transition-colors duration-150 ${ focusedField === "email"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 dark:text-gray-400"
                      }` }
                  >
                    Correo electrónico
                  </label>
                  <div
                    className={ `relative rounded-xl overflow-hidden transition-shadow transition-[outline-color] duration-150 ${ focusedField === "email"
                      ? "ring-2 ring-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-950/40"
                      : "ring-1 ring-gray-200 dark:ring-gray-700"
                      }` }
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className={ `h-5 w-5 transition-colors duration-150 ${ focusedField === "email" ? "text-indigo-500" : "text-gray-400" }` }
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
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
                </div>

                {/* Password field */}
                <div className="relative">
                  <label
                    htmlFor="password"
                    className={ `block text-xs font-semibold mb-1 transition-colors duration-150 ${ focusedField === "password"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 dark:text-gray-400"
                      }` }
                  >
                    Contraseña
                  </label>
                  <div
                    className={ `relative rounded-xl overflow-hidden transition-shadow duration-150 ${ focusedField === "password"
                      ? "ring-2 ring-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-950/40"
                      : "ring-1 ring-gray-200 dark:ring-gray-700"
                      }` }
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className={ `h-5 w-5 transition-colors duration-150 ${ focusedField === "password" ? "text-indigo-500" : "text-gray-400" }` }
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={ () => setShowForgotPassword( true ) }
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-150"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Submit button — spring press, sin glow blur extra */}
                <motion.button
                  whileHover={ { scale: 1.015 } }
                  whileTap={ { scale: 0.97 } }
                  transition={ { type: "spring", stiffness: 400, damping: 22 } }
                  type="submit"
                  disabled={ loading }
                  className="group w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-950/50 transition-[box-shadow,background] duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  { loading ? (
                    <motion.svg
                      animate={ { rotate: 360 } }
                      transition={ { duration: 0.8, repeat: Infinity, ease: "linear" } }
                      className="h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                    >
                      <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                    </motion.svg>
                  ) : (
                    <>
                      Iniciar sesión
                      <svg
                        className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  ) }
                </motion.button>
              </form>
            ) }

            {/* Trust indicators */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
              <div className="flex items-center gap-1.5">
                <CheckBadgeIcon className="h-3.5 w-3.5 text-green-500" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BoltIcon className="h-3.5 w-3.5 text-yellow-500" />
                <span>Rápido</span>
              </div>
              <div className="flex items-center gap-1.5">
                <SparklesIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Fácil de usar</span>
              </div>
            </div>

            {/* Bottom link */}
            <div className="mt-5 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ¿No tienes una cuenta?{ " " }
                <a
                  href="/contacto"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-150"
                >
                  Contáctanos →
                </a>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
