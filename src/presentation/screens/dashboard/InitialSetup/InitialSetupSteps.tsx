import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  CheckIcon,
  CreditCardIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  BanknotesIcon,
  PencilSquareIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  GlobeAltIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../../../assets/logo.png";

const InitialSetupSteps = () => {
  // Estado del paso actual (1 a 5)
  const [currentStep, setCurrentStep] = useState(1);
  // Estado para dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Actualiza la clase "dark" en el elemento raíz según el estado
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Datos para el paso 2: Confirma tus datos
  const userData = {
    companyName: "Mi Empresa S.A.",
    email: "contacto@miempresa.com",
    phoneNumber: "555-123456",
    address: "Av. Principal 123",
    RFC: "ABC123456789",
    country: "México",
  };

  // Estados para archivos en el paso 3
  const [logoReportsFile, setLogoReportsFile] = useState<File | null>(null);
  const [signReportsFile, setSignReportsFile] = useState<File | null>(null);
  const [logoReportsPreview, setLogoReportsPreview] = useState<string | null>(null);
  const [signReportsPreview, setSignReportsPreview] = useState<string | null>(null);

  // Estado para el formulario del paso 4
  const [accountData, setAccountData] = useState({
    name: "",
    type: "",
    initialBalance: 0,
    description: "",
  });

  // Función para avanzar pasos con validaciones
  const nextStep = () => {
    if (currentStep === 2) {
      const { companyName, email, phoneNumber, address, RFC, country } = userData;
      if (!companyName || !email || !phoneNumber || !address || !RFC || !country) {
        toast.error("Datos incompletos. Comunícate con soporte.");
        return;
      }
    } else if (currentStep === 3) {
      if (!logoReportsFile || !signReportsFile) {
        toast.error("Debes cargar logoReports y signReports.");
        return;
      }
    } else if (currentStep === 4) {
      if (!accountData.name) {
        toast.error("Debes crear al menos una cuenta financiera.");
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  // Handlers para archivos
  const handleLogoReportsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoReportsFile(e.target.files[0]);
      setLogoReportsPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSignReportsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSignReportsFile(e.target.files[0]);
      setSignReportsPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Handler para el formulario del paso 4
  const handleAccountInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({
      ...prev,
      [name]: name === "initialBalance" ? parseFloat(value) : value,
    }));
  };

  // Finalizar el proceso (en el paso 5)
  const handleFinish = () => {
    toast.success("¡Configuración inicial completada!");
    // Aquí actualizarías Firestore o cambiarías el estado global para cerrar el modal
  };

  // Header (título e ícono) según el paso actual
  const getHeaderData = () => {
    switch (currentStep) {
      case 1:
        return { title: "Bienvenido a EstateAdmin", icon: <SparklesIcon className="h-8 w-8 text-indigo-400" /> };
      case 2:
        return { title: "Confirma tus datos", icon: <UserCircleIcon className="h-8 w-8 text-indigo-400" /> };
      case 3:
        return { title: "Carga logoReports y signReports", icon: <PhotoIcon className="h-8 w-8 text-indigo-400" /> };
      case 4:
        return { title: "Crea al menos una cuenta financiera", icon: <CurrencyDollarIcon className="h-8 w-8 text-indigo-400" /> };
      case 5:
        return {
          title: "Elige tu tema",
          icon: isDarkMode 
            ? <MoonIcon className="h-8 w-8 text-indigo-400" />
            : <SunIcon className="h-8 w-8 text-indigo-400" />,
        };
      default:
        return { title: "", icon: null };
    }
  };

  const { title, icon } = getHeaderData();

  // Variantes para la animación de cada step
  const stepVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  // Lista de pasos (5 pasos)
  const steps = [
    { label: "Bienvenido" },
    { label: "Datos" },
    { label: "Imágenes" },
    { label: "Cuenta Financiera" },
    { label: "Tema" },
  ];

  // Renderizado de los pasos en formato vertical (desktop)
  const renderStepsVertical = () => (
    <div className="flex flex-col space-y-6">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;
        return (
          <div key={step.label} className="flex items-center space-x-4">
            <motion.div
              layout
              animate={{ scale: isActive ? 1.2 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-lg transition-colors duration-300 ${
                isCompleted
                  ? "bg-indigo-400 text-white border-indigo-400"
                  : isActive
                  ? "bg-indigo-100 text-indigo-500 border-indigo-500"
                  : "bg-white text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              }`}
            >
              {isCompleted ? <CheckIcon className="h-5 w-5" /> : stepNumber}
            </motion.div>
            <div className="text-base font-medium text-gray-800 dark:text-gray-200">{step.label}</div>
          </div>
        );
      })}
    </div>
  );

  // Renderizado de los pasos en formato horizontal (mobile)
  const renderStepsHorizontal = () => (
    <div className="flex justify-center space-x-4 overflow-x-auto">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;
        return (
          <div key={step.label} className="flex flex-col items-center">
            <motion.div
              layout
              animate={{ scale: isActive ? 1.2 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-lg transition-colors duration-300 ${
                isCompleted
                  ? "bg-indigo-400 text-white border-indigo-400"
                  : isActive
                  ? "bg-indigo-100 text-indigo-500 border-indigo-500"
                  : "bg-white text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              }`}
            >
              {isCompleted ? <CheckIcon className="h-5 w-5" /> : stepNumber}
            </motion.div>
            <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{step.label}</div>
          </div>
        );
      })}
    </div>
  );

  // Cuerpo de cada paso (sin header ni botones)
  const renderStepBody = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 text-center md:text-left">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Aquí podrás gestionar toda la información de tu condominio, desde la configuración inicial hasta el control de ingresos, egresos y cuentas financieras.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Haz clic en <strong>Siguiente</strong> para continuar.
            </p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 mt-2 text-center md:text-left">
            <div className="text-gray-700 dark:text-gray-300 space-y-4">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <BuildingOffice2Icon className="h-5 w-5 text-gray-300" />
                <span><strong>Empresa:</strong> {userData.companyName}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <EnvelopeIcon className="h-5 w-5 text-gray-300" />
                <span><strong>Email:</strong> {userData.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <PhoneIcon className="h-5 w-5 text-gray-300" />
                <span><strong>Teléfono:</strong> {userData.phoneNumber}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <MapPinIcon className="h-5 w-5 text-gray-300" />
                <span><strong>Dirección:</strong> {userData.address}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <IdentificationIcon className="h-5 w-5 text-gray-300" />
                <span><strong>RFC:</strong> {userData.RFC}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <GlobeAltIcon className="h-5 w-5 text-gray-300" />
                <span><strong>País:</strong> {userData.country}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Si alguno de estos datos no es correcto, comunícate con <span className="font-bold">soporte.</span>
            </p>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 text-center md:text-left">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Logo para Reportes</label>
              <label className="inline-flex items-center space-x-2 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors">
                {logoReportsFile ? <CheckIcon className="h-5 w-5" /> : <PhotoIcon className="h-5 w-5" />}
                <span>{logoReportsFile ? "Cambiar Logo" : "Seleccionar"}</span>
                <input type="file" accept="image/*" onChange={handleLogoReportsChange} className="hidden" />
              </label>
              {logoReportsPreview && (
                <img src={logoReportsPreview} alt="Logo Reports Preview" className="mt-2 h-20 w-auto rounded" />
              )}
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Firma para Reportes</label>
              <label className="inline-flex items-center space-x-2 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors">
                {signReportsFile ? <CheckIcon className="h-5 w-5" /> : <PhotoIcon className="h-5 w-5" />}
                <span>{signReportsFile ? "Cambiar Firma" : "Seleccionar"}</span>
                <input type="file" accept="image/*" onChange={handleSignReportsChange} className="hidden" />
              </label>
              {signReportsPreview && (
                <img src={signReportsPreview} alt="Sign Reports Preview" className="mt-2 h-20 w-auto rounded" />
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 text-center md:text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de la cuenta */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Nombre de la cuenta</label>
                <div className="relative">
                  <CreditCardIcon className="h-5 w-5 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    value={accountData.name}
                    onChange={handleAccountInputChange}
                    className="w-full h-[42px] pl-9 pr-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-0.5 focus:ring-indigo-300 dark:bg-gray-700 dark:text-gray-200"
                    required
                  />
                </div>
              </div>
              {/* Tipo */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Tipo</label>
                <div className="relative">
                  <BanknotesIcon className="h-5 w-5 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" />
                  <select
                    name="type"
                    value={accountData.type}
                    onChange={handleAccountInputChange}
                    className="w-full h-[42px] pl-9 pr-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-0.5 focus:ring-indigo-300 dark:bg-gray-700 dark:text-gray-200"
                    required
                  >
                    <option value="">Seleccione</option>
                    <option value="bank">Banco</option>
                    <option value="cash">Efectivo</option>
                    <option value="credit">Crédito</option>
                  </select>
                </div>
              </div>
              {/* Saldo Inicial */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Saldo Inicial</label>
                <div className="relative">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="initialBalance"
                    value={accountData.initialBalance}
                    onChange={handleAccountInputChange}
                    className="w-full h-[42px] pl-9 pr-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-0.5 focus:ring-indigo-300 dark:bg-gray-700 dark:text-gray-200"
                    required
                  />
                </div>
              </div>
              {/* Descripción */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Descripción (opcional)</label>
                <div className="relative">
                  <PencilSquareIcon className="h-5 w-5 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" />
                  <textarea
                    name="description"
                    value={accountData.description}
                    onChange={handleAccountInputChange}
                    className="w-full h-[42px] pl-9 pr-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-0.5 focus:ring-indigo-300 dark:bg-gray-700 dark:text-gray-200 resize-none"
                    rows={1}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 text-start">
            <p className="text-gray-700 dark:text-gray-300">
              Elige si deseas Modo Día o Modo Noche
            </p>
            <div className="flex items-center justify-start space-x-4">
              {/* Icono del sol: se ilumina cuando dark mode NO está activado */}
              <SunIcon className={`h-6 w-6 ${isDarkMode ? "text-gray-400" : "text-yellow-500"}`} />
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={() => setIsDarkMode(!isDarkMode)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full 
                  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
                ></div>
              </label>
              {/* Icono de la luna: se ilumina cuando dark mode está activado */}
              <MoonIcon className={`h-6 w-6 ${isDarkMode ? "text-indigo-400" : "text-gray-400"}`} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    // Animación inicial del contenedor
    <motion.div
      className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 dark:from-gray-900 to-white dark:to-gray-800 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Contenedor principal con posición relativa para el logo */}
      <div className="relative w-full max-w-5xl h-auto md:h-[500px] min-h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-[0_0_10px_rgba(79,70,229,0.5),0_0_200px_#8093e8ac,0_0_100px_#c2abe6c1] p-8 flex flex-col md:flex-row">
        {/* Mobile: Steps en horizontal */}
        <div className="md:hidden mb-4">{renderStepsHorizontal()}</div>
        {/* Desktop: Steps en vertical */}
        <div className="hidden md:block md:w-1/3 md:border-r md:pr-6">{renderStepsVertical()}</div>

        {/* Contenedor de contenido */}
        <div className="flex-1 pl-0 md:pl-6 pr-6 flex flex-col items-center md:items-start text-center md:text-left">
          {/* Header con título e ícono */}
          <div className="mb-4 w-full flex justify-center md:justify-start">
            <div className="flex items-center space-x-2">
              {icon}
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            </div>
          </div>

          {/* Contenido scrollable con animación de step */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {renderStepBody()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navegación inferior: botones alineados */}
          <div className="mt-4 flex items-center justify-between w-full px-4">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Anterior
              </button>
            ) : (
              <div />
            )}
            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Siguiente
                <ChevronRightIcon className="h-5 w-5 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Finalizar
                <CheckIcon className="h-5 w-5 ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* Logo de la empresa en la esquina inferior izquierda */}
        <img
          src={logo}
          alt="Logo de la empresa"
          className="absolute bottom-4 left-8 h-[40px] w-[40px]"
        />
      </div>
    </motion.div>
  );
};

export default InitialSetupSteps;
