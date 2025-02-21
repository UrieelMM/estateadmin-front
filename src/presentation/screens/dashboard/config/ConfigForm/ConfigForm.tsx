import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useConfigStore } from "../../../../../store/useConfigStore";
import { countriesList } from "../../../../../utils/countriesList";
import { useDropzone } from "react-dropzone";

const ConfigForm = () => {
  const { config, loading, error, fetchConfig, updateConfig } = useConfigStore();

  // Estados de la pestaña de configuración
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [RFC, setRFC] = useState("");
  const [country, setCountry] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // Estados para el layout de tabs
  const [activeTab, setActiveTab] = useState("config");

  // Estados para la pestaña de pagos y facturas
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
      await updateConfig(
        { companyName, email, phoneNumber, address, RFC, country },
        logoFile || undefined,
        signatureFile || undefined
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
    // Simulación de envío de pago
    toast.success("Pago enviado correctamente");
    // Opcionalmente, se pueden reiniciar los campos
    setSelectedInvoice("");
    setPaymentProof(null);
  };

  // Configuración de react-dropzone para el comprobante
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      if (files && files.length > 0) {
        setPaymentProof(files[0]);
      }
    },
  });

  return (
    <div className="p-6 min-h-screen">
      {error && <p className="text-red-600">{error}</p>}

      {/* Layout de pestañas */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          className={`mr-4 py-2 px-4 ${
            activeTab === "config"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("config")}
        >
          Configuración
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "payments"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("payments")}
        >
          Pagos y Facturas
        </button>
      </div>

      {activeTab === "config" && (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex mb-6 items-center">
            <div>
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
                <h2 className="text-2xl font-semibold text-black-600 mb-4">{companyName}</h2>
              )}
            </div>
          </div>
          {/* Sección para cargar archivos */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4">Archivos</h2>
            <div className="mb-4">
              <label htmlFor="logo" className="block text-gray-900 text-sm font-bold mb-2">
                Logo de la empresa (PNG o JPG)
              </label>
              <label
                htmlFor="logo"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
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
            <div>
              <label htmlFor="signature" className="block text-gray-900 text-sm font-bold mb-2">
                Firma (para reportes)
              </label>
              <label
                htmlFor="signature"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {signatureFile ? "Archivo seleccionado" : "Seleccionar archivo"}
              </label>
              <input
                type="file"
                id="signature"
                accept="image/png, image/jpeg"
                onChange={(e) =>
                  setSignatureFile(e.target.files ? e.target.files[0] : null)
                }
                className="hidden"
              />
            </div>
          </div>
          {/* Sección de datos de la empresa */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4">Datos de la empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4 flex items-center">
                <div className="flex-grow">
                  <label htmlFor="companyName" className="block text-gray-900 text-sm font-bold mb-2">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2 border border-indigo-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-900 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-indigo-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label htmlFor="phoneNumber" className="block text-gray-900 text-sm font-bold mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2 border border-indigo-300 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="address" className="block text-gray-900 text-sm font-bold mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border border-indigo-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label htmlFor="RFC" className="block text-gray-900 text-sm font-bold mb-2">
                  RFC
                </label>
                <input
                  type="text"
                  id="RFC"
                  value={RFC}
                  onChange={(e) => setRFC(e.target.value)}
                  className="w-full p-2 border border-indigo-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-gray-900 text-sm font-bold mb-2">
                  País
                </label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-2 border border-indigo-300 rounded-lg"
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
          <div className="flex items-center justify-between">
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
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-semibold text-black-600 mb-4">Pagos y Facturas</h2>
          {/* Formulario para subir comprobante de pago */}
          <form onSubmit={handlePaymentSubmit} className="mb-8">
            <div className="flex flex-row md:flex-col gap-4 mb-8">
              <div>
                <label htmlFor="invoiceSelect" className="block text-gray-900 text-sm font-bold mb-2">
                  Seleccione la factura a pagar
                </label>
                <select
                  id="invoiceSelect"
                  value={selectedInvoice}
                  onChange={(e) => setSelectedInvoice(e.target.value)}
                  className="w-full p-2 border border-indigo-300 rounded-lg"
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
                <label className="block text-gray-900 text-sm font-bold mb-2">
                  Subir comprobante de pago
                </label>
                <div
                  {...getRootProps()}
                  className="p-4 border-dashed border-2 border-indigo-300 rounded-lg text-center cursor-pointer"
                >
                  <input {...getInputProps()} />
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
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Fecha</th>
                  <th className="py-2 px-4 border-b">Concepto</th>
                  <th className="py-2 px-4 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2 px-4 border-b">{inv.date}</td>
                    <td className="py-2 px-4 border-b">{inv.concept}</td>
                    <td className="py-2 px-4 border-b">
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
    </div>
  );
};

export default ConfigForm;
