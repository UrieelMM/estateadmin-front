import { useEffect, useState } from "react";
import useAuthStore from "../../../store/AuthStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "../../../firebase/firebase";
import Loading from "../../components/shared/loaders/Loading";
import logo from "../../../assets/logo.png";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

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

  const navigate = useNavigate();

  //validar si hay un usuario logeado
  useEffect(() => {
    setLoadingSession(true);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/dashboard/home");
      }
    });
    setTimeout(() => {
      setLoadingSession(false);
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
        navigate("/dashboard/home");
      }
    } catch (error) {
      if (authError) {
        toast.error(authError);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loasingSession) return <Loading />;

  return (
    <>
      <div className="flex min-h-full h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img className="mx-auto h-10 w-auto" src={logo} alt="Your Company" />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            {showForgotPassword
              ? "Recuperar contraseña"
              : "Ingresa a tu cuenta"}
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {showForgotPassword ? (
            <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
          ) : (
            <form
              onSubmit={(e) => handleLoginWithEmailAndPassword(e)}
              className="space-y-6"
              action="#"
              method="POST"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Email
                </label>
                <div className="mt-2">
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Correo electrónico"
                    required
                    className="block w-full rounded-md py-1.5 text-gray-900 shadow-sm outline-none border border-solid px-4 border-indigo-300   placeholder:text-gray-400   sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Contraseña
                  </label>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Contraseña"
                    className="block w-full rounded-md border outline-none border-solid border-indigo-300  px-4 py-1.5 text-gray-900 shadow-sm   placeholder:text-gray-400  sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {loading ? (
                    <svg
                      className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-indigo-100 rounded-full"
                      viewBox="0 0 24 24"
                    ></svg>
                  ) : (
                    "Iniciar sesión"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="flex-col justify-center items-center">
            <p className="mt-10 text-center text-sm text-gray-500">
              ¿No tienes una cuenta?{" "}
            </p>
            <a
              href="#"
              className="font-semibold leading-6 text-center block text-indigo-600 hover:text-indigo-500"
            >
              Contáctanos para unirte a nuestros servicios
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginScreen;
