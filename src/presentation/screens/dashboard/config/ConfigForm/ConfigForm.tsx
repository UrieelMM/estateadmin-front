import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useConfigStore } from "../../../../../store/useConfigStore";
import { countriesList } from "../../../../../utils/countriesList";
import { useDropzone } from "react-dropzone";
import {
  CheckIcon, 
  PhotoIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  GlobeAltIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/solid";
import FinancialAccounts from "../FinancialAccounts";
import { useTheme } from "../../../../../context/Theme/ThemeContext";

const ConfigForm = () => {
  const { config, loading, error, fetchConfig, updateConfig } = useConfigStore();
  const { isDarkMode, toggleDarkMode } = useTheme(); // <-- Valor del ThemeContext (debe ser boolean)

  // Estados de la pestaña de configuración
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [RFC, setRFC] = useState("");
  const [country, setCountry] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [logoReportsFile, setLogoReportsFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // Tab actual
  const [activeTab, setActiveTab] = useState("config");

  // Estados para la pestaña de pagos y facturas (ejemplo)
  const invoiceOptions = [
    { id: "inv1", concept: "Factura Enero" },
    { id: "inv2", concept: "Factura Febrero" },
    { id: "inv3", concept: "Factura Marzo" },
  ];
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  // Datos dummy para la tabla de facturas
  const [invoices, _setInvoices] = useState([
    { id: "inv1", date: "2025-01-10", concept: "Factura Enero", downloadUrl: "#" },
    { id: "inv2", date: "2025-02-10", concept: "Factura Febrero", downloadUrl: "#" },
  ]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config) {
      setCompanyName(config.companyName || "");
      setEmail(config.email || "");
      setPhoneNumber(config.phoneNumber || "");
      setAddress(config.address || "");
      setRFC(config.RFC || "");
      setCountry(config.country || "");
      if (config.logo) {
        setLogoPreviewUrl(config.logo);
      }
    }
  }, [config]);

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [logoFile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Verifica qué valor es isDarkMode
      console.log("isDarkMode =>", isDarkMode, "Type:", typeof isDarkMode);

      // Enviamos darkMode asegurándonos de que sea boolean (con !!)
      await updateConfig(
        {
          companyName,
          email,
          phoneNumber,
          address,
          RFC,
          country,
          darkMode: !!isDarkMode, // <-- Asegura que sea un boolean
        },
        logoFile || undefined,
        signatureFile || undefined,
        logoReportsFile || undefined
      );

      toast.success("Configuración actualizada correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la configuración");
    }
  };

  // Manejador para el formulario de pago
  const handlePaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedInvoice) {
      toast.error("Seleccione una factura");
      return;
    }
    if (!paymentProof) {
      toast.error("Suba el comprobante de pago");
      return;
    }
    // Simulación
    toast.success("Pago enviado correctamente");
    setSelectedInvoice("");
    setPaymentProof(null);
  };

  // Configuración de react-dropzone
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      if (files && files.length > 0) {
        setPaymentProof(files[0]);
      }
    },
  });

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-gray-900 rounded-lg">
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {/* Layout de pestañas */}
      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`mr-4 py-2 px-4 ${
            activeTab === "config"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("config")}
        >
          Configuración
        </button>
        <button
          className={`mr-4 py-2 px-4 ${
            activeTab === "payments"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("payments")}
        >
          Pagos y Facturas
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "cuentas"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("cuentas")}
        >
          Cuentas
        </button>
      </div>

      {activeTab === "config" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <div className="flex mb-6 items-center">
            <div className="h-full w-[120px] dark:bg-white rounded-lg mr-4">
              {logoPreviewUrl && (
                <img
                  src={logoPreviewUrl}
                  alt="Logo de la empresa"
                  className="mr-4 h-28 w-auto rounded-full bg-cover"
                />
              )}
            </div>
            <div>
              {companyName && (
                <h2 className="text-2xl font-semibold text-black mb-4 dark:text-gray-100">
                  {companyName}
                </h2>
              )}
            </div>
          </div>

          {/* DATOS DE LA EMPRESA */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 dark:text-indigo-500">Datos de la empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* companyName */}
              <div className="mb-4">
                <label
                  htmlFor="companyName"
                  className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
                >
                  Nombre de la empresa
                </label>
                <div className="relative">
                  <BuildingOffice2Icon
                    className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  />
                </div>
              </div>
              {/* email */}
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon
                    className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  />
                </div>
              </div>
              {/* phoneNumber */}
              <div className="mb-4">
                <label
                  htmlFor="phoneNumber"
                  className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
                >
                  Teléfono
                </label>
                <div className="relative">
                  <PhoneIcon
                    className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  />
                </div>
              </div>
              {/* address */}
              <div className="mb-4">
                <label
                  htmlFor="address"
                  className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
                >
                  Dirección
                </label>
                <div className="relative">
                  <MapPinIcon
                    className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  />
                </div>
              </div>
              {/* RFC */}
              <div className="mb-4">
                <label
                  htmlFor="RFC"
                  className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
                >
                  RFC
                </label>
                <div className="relative">
                  <IdentificationIcon
                    className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    id="RFC"
                    value={RFC}
                    onChange={(e) => setRFC(e.target.value)}
                    className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  />
                </div>
              </div>
              {/* country */}
              <div>
                <label
                  htmlFor="country"
                  className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
                >
                  País
                </label>
                <div className="relative">
                  <GlobeAltIcon
                    className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  >
                    <option value="">Seleccione un país</option>
                    {countriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Archivos */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 dark:text-indigo-500">Archivos</h2>
            {/* Logo */}
            <div className="mb-4">
              <label
                htmlFor="logo"
                className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
              >
                Logo de la empresa (PNG o JPG)
              </label>
              <label
                htmlFor="logo"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:border-none"
              >
                {logoFile ? (
                  <CheckIcon className="h-5 w-5 mr-2 text-green-300" />
                ) : (
                  <PhotoIcon className="h-5 w-5 mr-2 text-gray-200" />
                )}
                {logoFile ? "Archivo seleccionado" : "Seleccionar archivo"}
              </label>
              <input
                type="file"
                id="logo"
                accept="image/png, image/jpeg"
                onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
              />
            </div>
            {/* Firma */}
            <div className="mb-4">
              <label
                htmlFor="signature"
                className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
              >
                Firma (para reportes)
              </label>
              <label
                htmlFor="signature"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:border-none"
              >
                {signatureFile ? (
                  <CheckIcon className="h-5 w-5 mr-2 text-green-300" />
                ) : (
                  <PhotoIcon className="h-5 w-5 mr-2 text-gray-200" />
                )}
                {signatureFile ? "Archivo seleccionado" : "Seleccionar archivo"}
              </label>
              <input
                type="file"
                id="signature"
                accept="image/png, image/jpeg"
                onChange={(e) => setSignatureFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
              />
            </div>
            {/* Logo para reportes */}
            <div className="mb-4">
              <label
                htmlFor="logoReports"
                className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
              >
                Logo para Reportes (PNG o JPG)
              </label>
              <label
                htmlFor="logoReports"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:border-none"
              >
                {logoReportsFile ? (
                  <CheckIcon className="h-5 w-5 mr-2 text-green-300" />
                ) : (
                  <PhotoIcon className="h-5 w-5 mr-2 text-gray-200" />
                )}
                {logoReportsFile ? "Archivo seleccionado" : "Seleccionar archivo"}
              </label>
              <input
                type="file"
                id="logoReports"
                accept="image/png, image/jpeg"
                onChange={(e) => setLogoReportsFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
              />
            </div>
          </div>

          {/* Toggle de Dark Mode */}
          <div className="mb-6 text-start font-bold">
            <p className="text-gray-900 dark:text-gray-100 mb-2">Elige tu tema</p>
            <div className="flex items-center justify-start space-x-4">
              <SunIcon className={`h-6 w-6 ${isDarkMode ? "text-gray-400" : "text-yellow-500"}`} />
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full
                  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
                ></div>
              </label>
              <MoonIcon className={`h-6 w-6 ${isDarkMode ? "text-indigo-400" : "text-gray-400"}`} />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {loading ? "Actualizando..." : "Guardar configuración"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "payments" && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-semibold text-black mb-4 dark:text-gray-100">Pagos y Facturas</h2>
          {/* Formulario para subir comprobante de pago */}
          <form onSubmit={handlePaymentSubmit} className="mb-8">
            <div className="flex flex-row md:flex-col gap-4 mb-8">
              <div>
                <label
                  htmlFor="invoiceSelect"
                  className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
                >
                  Seleccione la factura a pagar
                </label>
                <select
                  id="invoiceSelect"
                  value={selectedInvoice}
                  onChange={(e) => setSelectedInvoice(e.target.value)}
                    className="w-full pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  <option value="">Seleccione una factura</option>
                  {invoiceOptions.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.concept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2">
                  Subir comprobante de pago
                </label>
                <div
                  {...getRootProps()}
                  className="flex items-center justify-center p-4 border-dashed dark:text-gray-100 border-2 border-indigo-300 rounded-lg text-center cursor-pointer dark:border-indigo-600"
                >
                  <input {...getInputProps()} />
                  {paymentProof ? (
                    <CheckIcon className="h-5 w-5 mr-2 text-green-300" />
                  ) : (
                    <PhotoIcon className="h-5 w-5 mr-2 text-gray-200" />
                  )}
                  {paymentProof
                    ? paymentProof.name
                    : "Arrastra y suelta el archivo, o haz clic para seleccionar"}
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Enviar comprobante
            </button>
          </form>
          {/* Tabla de facturas */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 dark:text-gray-100">Fecha</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 dark:text-gray-100">Concepto</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 dark:text-gray-100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 dark:text-gray-100">
                      {inv.date}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 dark:text-gray-100">
                      {inv.concept}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 dark:text-gray-100">
                      <button
                        onClick={() => window.open(inv.downloadUrl, "_blank")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded"
                      >
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "cuentas" && <FinancialAccounts />}
    </div>
  );
};

export default ConfigForm;
