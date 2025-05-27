import { useState, useEffect } from "react";
import {
  EyeIcon,
  CheckIcon,
  ArrowPathIcon,
  DocumentIcon,
} from "@heroicons/react/24/solid";
import { usePaymentVouchersStore } from "../../../../../store/paymentVouchersStore";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";
import { formatDateToSpanish } from "../../../../../utils/curreyncy";
import { usePaymentStore } from "../../../../../store/usePaymentStore";
import useUserStore from "../../../../../store/UserDataStore";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 20;

// Función para vaciar el caché de vouchersCache
// Esto es un workaround ya que no podemos modificar directamente el store
const clearVouchersCache = () => {
  // Podemos usar localStorage como señal para indicar al store que debe invalidar su caché
  const timestamp = Date.now();
  localStorage.setItem("vouchers_cache_invalidation", timestamp.toString());
};

const InvoicesByCondominiums = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<any[]>([null]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [filters, setFilters] = useState<{ status?: string }>({});
  const [reloadCounter, setReloadCounter] = useState(0);
  const [showExtractedDataModal, setShowExtractedDataModal] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [extractingData, setExtractingData] = useState(false);
  const [currentVoucherId, setCurrentVoucherId] = useState<string>("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // Estados para campos editables en el modal
  const [selectedFinancialAccountId, setSelectedFinancialAccountId] =
    useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [paymentComments, setPaymentComments] = useState<string>("");

  // Estados adicionales para formulario completo
  const [formPaymentDate, setFormPaymentDate] = useState<Date | null>(null);
  const [formAmountPaid, setFormAmountPaid] = useState<string>("");
  const [formAmountPaidDisplay, setFormAmountPaidDisplay] =
    useState<string>("");
  const [formSelectedCharges, setFormSelectedCharges] = useState<
    { chargeId: string; amount: number }[]
  >([]);
  const [formChargeDisplayValues, setFormChargeDisplayValues] = useState<{
    [key: string]: string;
  }>({});
  const [formUseCreditBalance, setFormUseCreditBalance] =
    useState<boolean>(false);

  const {
    vouchers,
    fetchVouchers,
    applyVoucher,
    loading,
    lastVoucherDoc,
    extractReceiptData,
  } = usePaymentVouchersStore((state) => ({
    vouchers: state.vouchers,
    fetchVouchers: state.fetchVouchers,
    applyVoucher: state.applyVoucher,
    loading: state.loading,
    lastVoucherDoc: state.lastVoucherDoc,
    extractReceiptData: state.extractReceiptData,
  }));

  const {
    charges,
    addMaintenancePayment,
    fetchUserCharges,
    financialAccounts,
    fetchFinancialAccounts,
    userCreditBalance,
  } = usePaymentStore((state) => ({
    charges: state.charges,
    addMaintenancePayment: state.addMaintenancePayment,
    fetchUserCharges: state.fetchUserCharges,
    financialAccounts: state.financialAccounts,
    fetchFinancialAccounts: state.fetchFinancialAccounts,
    userCreditBalance: state.userCreditBalance,
  }));

  const { condominiumsUsers, fetchCondominiumsUsers } = useUserStore(
    (state) => ({
      condominiumsUsers: state.condominiumsUsers,
      fetchCondominiumsUsers: state.fetchCondominiumsUsers,
    })
  );

  const { fetchSummary, selectedYear, setupRealtimeListeners } =
    usePaymentSummaryStore((state) => ({
      fetchSummary: state.fetchSummary,
      selectedYear: state.selectedYear,
      setupRealtimeListeners: state.setupRealtimeListeners,
    }));

  // Función para determinar el tipo de archivo
  const getFileType = (url: string): "image" | "pdf" | "other" => {
    if (!url) return "other";

    const extension = url.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return "pdf";
    } else if (
      ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension || "")
    ) {
      return "image";
    }

    // Para URLs que no tienen una extensión clara, intentamos adivinar por la URL
    if (url.includes("image") || url.includes("img")) {
      return "image";
    } else if (url.includes("pdf")) {
      return "pdf";
    }

    return "other";
  };

  // Función para recargar los datos
  const handleRefresh = async () => {
    if (loadingPayments || loading) return;

    setLoadingPayments(true);
    try {
      // Forzar invalidación del caché antes de recargar
      clearVouchersCache();

      // Forzar recarga completa limpiando el cursor y volviendo a la primera página
      setPageCursors([null]);
      setCurrentPage(1);

      // Incrementar el contador de recarga para forzar el efecto
      setReloadCounter((prev) => prev + 1);

      // Limpiar filtros para forzar recarga completa
      const tempFilters = { ...filters };
      await fetchVouchers(ITEMS_PER_PAGE, null, tempFilters);
    } catch (error) {
      console.error("Error al recargar comprobantes:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Cargar la primera página al montar o cuando cambian los filtros o se solicita una recarga
  useEffect(() => {
    const loadInitialVouchers = async () => {
      setLoadingPayments(true);
      try {
        // Si es una recarga forzada por el botón, invalidar caché primero
        if (reloadCounter > 0) {
          clearVouchersCache();
        }

        const count = await fetchVouchers(ITEMS_PER_PAGE, null, filters);
        setHasMore(count === ITEMS_PER_PAGE);
        if (lastVoucherDoc) {
          setPageCursors([null, lastVoucherDoc]);
        } else {
          setPageCursors([null]);
        }
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al cargar comprobantes iniciales:", error);
      } finally {
        setLoadingPayments(false);
      }
    };
    loadInitialVouchers();
  }, [fetchVouchers, filters, reloadCounter]);

  // Manejo de cambio de página
  const handlePageChange = async (newPage: number) => {
    if (loadingPayments) return;
    if (newPage === currentPage) return;
    setLoadingPayments(true);
    try {
      let startAfter: any = null;
      if (newPage === 1) {
        startAfter = null;
      } else {
        startAfter = pageCursors[newPage - 1];
      }
      const count = await fetchVouchers(ITEMS_PER_PAGE, startAfter, filters);
      if (newPage > currentPage && count === 0) {
        setHasMore(false);
        return;
      }
      setHasMore(count === ITEMS_PER_PAGE);
      if (newPage > pageCursors.length - 1 && lastVoucherDoc && count > 0) {
        setPageCursors((prev) => [...prev, lastVoucherDoc]);
      }
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error al cambiar de página:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleApplyVoucher = async (voucherId: string) => {
    try {
      setExtractingData(true);
      setCurrentVoucherId(voucherId);

      // Buscar el voucher por su ID para obtener la URL del archivo
      const voucher = vouchers.find((v) => v.id === voucherId);
      if (!voucher) {
        throw new Error("Comprobante no encontrado");
      }

      // Obtener datos del usuario por número de departamento
      await fetchCondominiumsUsers();
      const userData = condominiumsUsers.find(
        (user) => user.number === voucher.departmentNumber
      );

      if (!userData) {
        throw new Error(
          `No se encontró el usuario con departamento ${voucher.departmentNumber}`
        );
      }

      // Obtener cargos del usuario
      await fetchUserCharges(voucher.departmentNumber);

      // Obtener cuentas financieras si no están cargadas
      if (financialAccounts.length === 0) {
        await fetchFinancialAccounts();
      }

      // Extraer los datos del comprobante
      const extractedInfo = await extractReceiptData(voucher.paymentProofUrl);

      // ===== PRECARGAR CAMPOS DEL FORMULARIO =====

      // 1. Fecha de pago: usar la extraída o la de creación del voucher
      let paymentDate = new Date();
      if (extractedInfo?.date) {
        const extractedDate = new Date(extractedInfo.date);
        if (!isNaN(extractedDate.getTime())) {
          paymentDate = extractedDate;
        }
      } else if (voucher.createdAt) {
        paymentDate = voucher.createdAt.toDate
          ? voucher.createdAt.toDate()
          : new Date(voucher.createdAt);
      }
      setFormPaymentDate(paymentDate);

      // 2. Tipo de pago: usar el extraído o "Transferencia" por defecto
      const defaultPaymentType =
        extractedInfo?.paymentMethod || "Transferencia";
      setSelectedPaymentType(defaultPaymentType);

      // 3. Cuenta financiera: usar la primera disponible
      if (financialAccounts.length > 0) {
        setSelectedFinancialAccountId(financialAccounts[0].id);
      }

      // 4. Comentarios: combinar descripción extraída con información del chatbot
      const defaultComments = extractedInfo?.description
        ? `${extractedInfo.description} - Pago aplicado desde comprobante del ChatBot`
        : "Pago aplicado desde comprobante del ChatBot";
      setPaymentComments(defaultComments);

      // 5. Monto pagado: usar el extraído o calcular del voucher
      let amountPaid = 0;
      if (extractedInfo?.amount) {
        // Limpiar el monto extraído y convertir a número
        const cleanAmount = String(extractedInfo.amount).replace(
          /[^0-9.]/g,
          ""
        );
        amountPaid = parseFloat(cleanAmount) || 0;
      }

      // Si no hay monto extraído, usar la suma de los cargos del voucher
      if (amountPaid === 0 && voucher.charges) {
        amountPaid = voucher.charges.reduce(
          (sum, charge) =>
            sum + (charge.chargeAmountReference || charge.amount),
          0
        );
      }

      setFormAmountPaid(amountPaid.toString());
      setFormAmountPaidDisplay(formatCurrency(amountPaid));

      // 6. Mapear y preseleccionar cargos del voucher
      const preselectedCharges: { chargeId: string; amount: number }[] = [];
      const preselectedDisplayValues: { [key: string]: string } = {};

      if (voucher.charges && voucher.charges.length > 0) {
        for (const voucherCharge of voucher.charges) {
          // Buscar el cargo correspondiente en el sistema
          const systemCharge = charges.find(
            (charge) =>
              charge.concept === voucherCharge.concept &&
              charge.startAt === voucherCharge.startAt
          );

          if (systemCharge) {
            const chargeAmount =
              voucherCharge.chargeAmountReference || voucherCharge.amount;
            preselectedCharges.push({
              chargeId: systemCharge.id,
              amount: chargeAmount,
            });
            preselectedDisplayValues[systemCharge.id] =
              formatCurrency(chargeAmount);
          }
        }
      }

      setFormSelectedCharges(preselectedCharges);
      setFormChargeDisplayValues(preselectedDisplayValues);

      // 7. No usar saldo a favor por defecto
      setFormUseCreditBalance(false);

      // Mostrar los datos extraídos en el modal
      setExtractedData(extractedInfo);
      setShowExtractedDataModal(true);
    } catch (error) {
      console.error("Error al extraer datos del comprobante:", error);
      // Si hay error en la extracción, mostrar el error pero permitir aplicar el voucher manualmente
      toast.error(
        `Error al extraer datos: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setExtractingData(false);
    }
  };

  const handleConfirmApplyVoucher = async (voucherId: string) => {
    try {
      setApplyingVoucher(true);

      // ===== VALIDACIONES DEL FORMULARIO =====
      if (!formPaymentDate) {
        throw new Error("La fecha de pago es obligatoria");
      }

      if (!selectedFinancialAccountId) {
        throw new Error("Debe seleccionar una cuenta financiera");
      }

      if (!selectedPaymentType) {
        throw new Error("Debe seleccionar un tipo de pago");
      }

      if (!formAmountPaid && !formUseCreditBalance) {
        throw new Error("El monto abonado es obligatorio");
      }

      if (formSelectedCharges.length === 0) {
        throw new Error(
          "Debe seleccionar al menos un cargo para aplicar el pago"
        );
      }

      // Validar que la suma de montos asignados coincida con el monto pagado
      const totalAmountPaid = Number(formAmountPaid);
      const effectiveTotal = formUseCreditBalance
        ? totalAmountPaid + userCreditInPesos
        : totalAmountPaid;

      if (Math.abs(effectiveTotal - totalAssignedModal) > 0.01) {
        throw new Error(
          `El monto total (${formatCurrency(
            effectiveTotal
          )}) debe coincidir con la suma de cargos asignados (${formatCurrency(
            totalAssignedModal
          )})`
        );
      }

      // Buscar el voucher
      const voucher = vouchers.find((v) => v.id === voucherId);
      if (!voucher) {
        throw new Error("Comprobante no encontrado");
      }

      // Obtener datos del usuario por número de departamento
      await fetchCondominiumsUsers();
      const userData = condominiumsUsers.find(
        (user) => user.number === voucher.departmentNumber
      );

      if (!userData) {
        throw new Error(
          `No se encontró el usuario con departamento ${voucher.departmentNumber}`
        );
      }

      // Obtener cuentas financieras si no están cargadas
      if (financialAccounts.length === 0) {
        await fetchFinancialAccounts();
      }

      if (financialAccounts.length === 0) {
        throw new Error("No se encontraron cuentas financieras disponibles");
      }

      // ===== USAR DATOS DEL FORMULARIO =====

      // Extraer conceptos y startAts de los cargos seleccionados en el formulario
      const concepts: string[] = [];
      const startAts: string[] = [];

      formSelectedCharges.forEach((selectedCharge) => {
        const charge = charges.find((c) => c.id === selectedCharge.chargeId);
        if (charge) {
          concepts.push(charge.concept);
          if (charge.startAt) {
            startAts.push(charge.startAt);
          }
        }
      });

      // Preparar fecha de pago en formato ISO
      const paymentDateString = formPaymentDate.toISOString();

      // Calcular el monto pendiente
      const amountPending = totalPendingOriginalModal - totalAssignedModal;

      // Construir el objeto MaintenancePayment con la misma estructura que PaymentForm.tsx
      const paymentObj = {
        email: userData.email,
        numberCondominium: voucher.departmentNumber,
        amountPaid: totalAmountPaid,
        amountPending: amountPending,
        comments: paymentComments,
        file: null, // No hay archivo nuevo, usamos la URL existente
        selectedCharges: formSelectedCharges, // Usar los cargos del formulario
        useCreditBalance: formUseCreditBalance,
        paymentType: selectedPaymentType,
        paymentDate: paymentDateString,
        financialAccountId: selectedFinancialAccountId,
        creditUsed: formUseCreditBalance ? userCreditInPesos : 0,
        isUnidentifiedPayment: false,
        appliedToUser: true,
        attachmentPayment: voucher.paymentProofUrl, // URL del comprobante existente
        concepts,
        startAts,
      };

      // Registrar el pago usando la misma función que PaymentForm.tsx
      await addMaintenancePayment(paymentObj);

      // Marcar el voucher como aplicado en la base de datos
      await applyVoucher(voucherId);

      // Actualizar todos los datos relacionados para reflejar los cambios
      await Promise.all([
        setupRealtimeListeners(selectedYear),
        fetchSummary(selectedYear),
        fetchUserCharges(voucher.departmentNumber),
        fetchCondominiumsUsers(),
        handleRefresh(),
      ]);

      // Cerrar modal y notificar éxito
      handleCloseModal();
      toast.success("Comprobante aplicado correctamente");
    } catch (error: any) {
      console.error("Error al aplicar el comprobante:", error);
      toast.error(
        error.message ||
          "Error al aplicar el comprobante. Por favor, intenta nuevamente."
      );
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Función para limpiar estados del modal
  const handleCloseModal = () => {
    setShowExtractedDataModal(false);
    setExtractedData(null);
    setCurrentVoucherId("");
    setSelectedFinancialAccountId("");
    setSelectedPaymentType("");
    setPaymentComments("");
    // Limpiar estados adicionales del formulario
    setFormPaymentDate(null);
    setFormAmountPaid("");
    setFormAmountPaidDisplay("");
    setFormSelectedCharges([]);
    setFormChargeDisplayValues({});
    setFormUseCreditBalance(false);
  };

  // Helper para formatear a pesos mexicanos
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  // Funciones para manejar cargos en el formulario del modal
  const handleToggleChargeModal = (chargeId: string, checked: boolean) => {
    if (checked) {
      setFormSelectedCharges((prev) => [...prev, { chargeId, amount: 0 }]);
    } else {
      setFormSelectedCharges((prev) =>
        prev.filter((sc) => sc.chargeId !== chargeId)
      );
    }
  };

  const handleAmountChangeModal = (chargeId: string, newAmount: number) => {
    setFormSelectedCharges((prev) =>
      prev.map((sc) =>
        sc.chargeId === chargeId ? { ...sc, amount: newAmount } : sc
      )
    );
  };

  // Calcular totales para el formulario del modal
  const totalAssignedModal = formSelectedCharges.reduce(
    (sum, sc) => sum + sc.amount,
    0
  );
  const totalPendingOriginalModal = formSelectedCharges.reduce((sum, sc) => {
    const charge = charges.find((c) => c.id === sc.chargeId);
    return sum + (charge ? charge.amount / 100 : 0);
  }, 0);

  // Convertir el saldo a favor del usuario (que viene en centavos) a pesos
  const userCreditInPesos = userCreditBalance
    ? Number(userCreditBalance) / 100
    : 0;

  const handleViewFile = (fileUrl: string) => {
    const fileType = getFileType(fileUrl);

    if (fileType === "image") {
      setSelectedImage(fileUrl);
      setShowImageModal(true);
    } else {
      // Para PDFs y otros tipos de archivos, abrir en una nueva pestaña
      window.open(fileUrl, "_blank");
    }
  };

  const totalPages = hasMore ? currentPage + 1 : currentPage;

  return (
    <div className="px-4 sm:px-6 lg:px-8 dark:bg-gray-900 p-4 rounded-lg">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Comprobantes de Pago
          </h1>
          <p className="mt-2 text-xs font-medium px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg inline-block dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700">
            Lista de comprobantes enviados a través del{" "}
            <span className="font-bold">ChatBot de EstateAdmin</span>
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex gap-4">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({
                status: e.target.value || undefined,
              })
            }
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
          >
            <option value="">Todos los estados</option>
            <option value="pending_review">Pendiente de revisión</option>
            <option value="applied">Aplicado</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading || loadingPayments}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`h-4 w-4 mr-1.5 ${
                loadingPayments ? "animate-spin" : ""
              }`}
              aria-hidden="true"
            />
            Recargar
          </button>
        </div>
      </div>

      {/* Estado de carga */}
      {(loading || loadingPayments) && (
        <div className="flex justify-center items-center py-8">
          <LoadingApp />
        </div>
      )}

      {/* Tabla de datos cuando no está cargando */}
      {!loading && !loadingPayments && vouchers.length > 0 && (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                      >
                        Fecha en que se envió el comprobante
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Departamento
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Condomino
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Conceptos seleccionados
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Monto Total
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id} className="cursor-pointer">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200 sm:pl-6">
                          {voucher.createdAt?.toDate
                            ? formatDateToSpanish(
                                voucher.createdAt.toDate().toISOString()
                              )
                            : formatDateToSpanish(voucher.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {voucher.departmentNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {`${voucher.userName || ""} ${
                            voucher.userLastName || ""
                          }`}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {voucher.charges?.map((charge) => (
                            <div key={charge.concept}>
                              {charge.concept} -{" "}
                              {formatDateToSpanish(charge.startAt)}
                            </div>
                          ))}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {formatCurrency(
                            voucher.charges?.reduce(
                              (sum, charge) =>
                                sum +
                                (charge.chargeAmountReference !== undefined
                                  ? charge.chargeAmountReference
                                  : charge.amount),
                              0
                            ) || 0
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              voucher.status === "applied"
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {voucher.status === "applied"
                              ? "Aplicar"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleViewFile(voucher.paymentProofUrl)
                              }
                              className="flex items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                            >
                              {getFileType(voucher.paymentProofUrl) ===
                              "image" ? (
                                <EyeIcon className="h-3 w-3 mr-1" />
                              ) : (
                                <DocumentIcon className="h-3 w-3 mr-1" />
                              )}
                              Ver
                            </button>
                            {voucher.status !== "applied" && (
                              <button
                                onClick={() => handleApplyVoucher(voucher.id)}
                                disabled={
                                  extractingData &&
                                  currentVoucherId === voucher.id
                                }
                                className={`flex items-center justify-center text-white px-3 py-1 rounded-md transition-all duration-150 ease-in-out
                                            ${
                                              extractingData &&
                                              currentVoucherId === voucher.id
                                                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 cursor-not-allowed"
                                                : "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                                            }`}
                              >
                                {extractingData &&
                                currentVoucherId === voucher.id ? (
                                  <>
                                    <svg
                                      className="animate-spin h-4 w-4 mr-2 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    <span className="font-semibold text-xs">
                                      IA Procesando...
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <CheckIcon className="h-4 w-4 mr-1.5" />
                                    <span className="text-xs">Aplicar</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No hay resultados */}
      {!loading && !loadingPayments && vouchers.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No hay comprobantes disponibles.
          </p>
        </div>
      )}

      {/* Paginación */}
      {!loading && !loadingPayments && vouchers.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loadingPayments}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={loadingPayments || !hasMore}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Página <span className="font-medium">{currentPage}</span> de{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loadingPayments}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 mr-2"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        page === currentPage
                          ? "z-10 bg-indigo-700 border-2 text-white border-indigo-700 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                          : "z-10 border-2 border-indigo-700 rounded-md text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={loadingPayments || !hasMore}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 ml-2"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver la imagen */}
      {showImageModal && (
        <div className="fixed inset-0 bg-indigo-400 bg-opacity-15 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowImageModal(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                    Comprobante de Pago
                  </h3>
                  <div className="mt-2">
                    <img
                      src={selectedImage}
                      alt="Comprobante de pago"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para mostrar los datos extraídos */}
      {showExtractedDataModal && (
        <div className="fixed inset-0 bg-indigo-400 bg-opacity-15 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl sm:p-6">
                {/* Header del modal */}
                <div className="bg-indigo-700 dark:bg-gray-800 -mx-4 -mt-5 px-6 py-4 mb-6 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                          <CheckIcon
                            className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold leading-6 text-white">
                          Aplicar Comprobante de Pago
                        </h3>
                        <p className="text-sm text-indigo-200">
                          Revisa y edita la información antes de aplicar el
                          comprobante
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-indigo-700 dark:bg-gray-800 text-indigo-200 hover:text-white focus:outline-none"
                      onClick={handleCloseModal}
                    >
                      <span className="sr-only">Cerrar</span>
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Formulario completo */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirmApplyVoucher(currentVoucherId);
                  }}
                  className="space-y-6"
                >
                  {/* Resumen de datos extraídos con IA */}
                  {extractedData && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700 mb-6">
                      <div className="flex items-center mb-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6 mr-2 text-yellow-300"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 14.25l-1.25-2.25L13.5 11l2.25-1.25L17 7.5l1.25 2.25L20.5 11l-2.25 1.25z"
                          />
                        </svg>
                        <h4 className="text-md font-semibold">
                          Análisis IA del Comprobante
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        {extractedData.amount ? (
                          <div className="bg-white/10 p-3 rounded-md backdrop-blur-sm">
                            <span className="block text-xs opacity-80">
                              Monto Detectado:
                            </span>
                            <span className="font-bold text-lg">
                              {formatCurrency(
                                parseFloat(
                                  String(extractedData.amount).replace(
                                    /[^0-9.]/g,
                                    ""
                                  )
                                ) || 0
                              )}
                              {extractedData.currency &&
                              extractedData.currency !== "MXN"
                                ? ` ${extractedData.currency}`
                                : ""}
                            </span>
                          </div>
                        ) : null}
                        {extractedData.date ? (
                          <div className="bg-white/10 p-3 rounded-md backdrop-blur-sm">
                            <span className="block text-xs opacity-80">
                              Fecha Estimada:
                            </span>
                            <span className="font-semibold">
                              {new Date(extractedData.date).toLocaleDateString(
                                "es-ES",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        ) : null}
                        {extractedData.paymentMethod ? (
                          <div className="bg-white/10 p-3 rounded-md backdrop-blur-sm">
                            <span className="block text-xs opacity-80">
                              Método Sugerido:
                            </span>
                            <span className="font-semibold">
                              {extractedData.paymentMethod}
                            </span>
                          </div>
                        ) : null}
                        {!extractedData.amount &&
                          !extractedData.date &&
                          !extractedData.paymentMethod && (
                            <div className="col-span-full bg-white/10 p-3 rounded-md backdrop-blur-sm">
                              <p className="text-sm opacity-90 text-center">
                                La IA no pudo extraer datos automáticamente.{" "}
                                <br />
                                Por favor, completa el formulario manualmente.
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha y hora de pago */}
                    <div>
                      <label
                        htmlFor="formPaymentDate"
                        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        📅 Fecha de pago *
                      </label>
                      <input
                        type="date"
                        id="formPaymentDate"
                        value={
                          formPaymentDate
                            ? formPaymentDate.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setFormPaymentDate(
                            new Date(e.target.value + "T00:00:00")
                          )
                        }
                        className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                        required
                      />
                    </div>

                    {/* Monto abonado */}
                    <div>
                      <label
                        htmlFor="formAmountPaid"
                        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        💰 Monto abonado *
                      </label>
                      <input
                        type="text"
                        id="formAmountPaid"
                        value={formAmountPaidDisplay}
                        onChange={(e) => {
                          setFormAmountPaid(e.target.value);
                          setFormAmountPaidDisplay(e.target.value);
                        }}
                        onFocus={() => setFormAmountPaidDisplay(formAmountPaid)}
                        onBlur={() => {
                          const num = parseFloat(formAmountPaid);
                          if (!isNaN(num)) {
                            setFormAmountPaidDisplay(formatCurrency(num));
                          }
                        }}
                        placeholder="$1,000.00"
                        className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                        required
                      />
                    </div>

                    {/* Tipo de pago */}
                    <div>
                      <label
                        htmlFor="selectedPaymentType"
                        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        💳 Tipo de pago *
                      </label>
                      <select
                        id="selectedPaymentType"
                        value={selectedPaymentType}
                        onChange={(e) => setSelectedPaymentType(e.target.value)}
                        className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                        required
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Depósito">Depósito</option>
                      </select>
                    </div>

                    {/* Cuenta financiera */}
                    <div>
                      <label
                        htmlFor="selectedFinancialAccountId"
                        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        🏦 Cuenta financiera *
                      </label>
                      <select
                        id="selectedFinancialAccountId"
                        value={selectedFinancialAccountId}
                        onChange={(e) =>
                          setSelectedFinancialAccountId(e.target.value)
                        }
                        className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                        required
                      >
                        <option value="">Seleccionar cuenta</option>
                        {financialAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Saldo a favor */}
                  {userCreditBalance !== null && userCreditBalance > 0 && (
                    <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
                      <label className="block text-sm font-medium leading-6 text-green-800 dark:text-green-200 mb-3">
                        💎 Saldo a favor disponible:{" "}
                        {formatCurrency(userCreditInPesos)}
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center text-green-700 dark:text-green-300">
                          <input
                            type="radio"
                            name="formUseCreditBalance"
                            checked={!formUseCreditBalance}
                            onChange={() => setFormUseCreditBalance(false)}
                            className="mr-2"
                          />
                          No utilizar saldo a favor
                        </label>
                        <label className="flex items-center text-green-700 dark:text-green-300">
                          <input
                            type="radio"
                            name="formUseCreditBalance"
                            checked={formUseCreditBalance}
                            onChange={() => setFormUseCreditBalance(true)}
                            className="mr-2"
                          />
                          Utilizar saldo a favor
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Lista de cargos */}
                  {charges.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-3">
                        📋 Cargos a pagar *
                      </label>
                      <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                        {charges.map((charge) => {
                          const isChecked = formSelectedCharges.some(
                            (sc) => sc.chargeId === charge.id
                          );
                          return (
                            <div
                              key={charge.id}
                              className="flex items-center space-x-3 py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  handleToggleChargeModal(
                                    charge.id,
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {charge.concept}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Mes: {charge.month || "Sin mes"} | Monto:{" "}
                                  {formatCurrency(charge.amount / 100)}
                                </p>
                              </div>
                              {isChecked && (
                                <div className="flex-shrink-0">
                                  <input
                                    type="text"
                                    placeholder="$0.00"
                                    value={
                                      formChargeDisplayValues[charge.id] || ""
                                    }
                                    onChange={(e) => {
                                      const rawValue = e.target.value;
                                      const newNumber =
                                        parseFloat(
                                          rawValue.replace(/[^0-9.]/g, "")
                                        ) || 0;
                                      handleAmountChangeModal(
                                        charge.id,
                                        newNumber
                                      );
                                      setFormChargeDisplayValues((prev) => ({
                                        ...prev,
                                        [charge.id]: rawValue,
                                      }));
                                    }}
                                    onFocus={() => {
                                      setFormChargeDisplayValues((prev) => ({
                                        ...prev,
                                        [charge.id]: "",
                                      }));
                                    }}
                                    onBlur={() => {
                                      const selected = formSelectedCharges.find(
                                        (sc) => sc.chargeId === charge.id
                                      );
                                      if (selected && selected.amount > 0) {
                                        setFormChargeDisplayValues((prev) => ({
                                          ...prev,
                                          [charge.id]: formatCurrency(
                                            selected.amount
                                          ),
                                        }));
                                      } else {
                                        setFormChargeDisplayValues((prev) => ({
                                          ...prev,
                                          [charge.id]: "",
                                        }));
                                      }
                                    }}
                                    className="w-24 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-100"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Resumen de montos */}
                      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">
                              Total asignado:
                            </span>
                            <p className="text-indigo-900 dark:text-indigo-100 font-semibold">
                              {formatCurrency(totalAssignedModal)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">
                              Monto pagado:
                            </span>
                            <p className="text-indigo-900 dark:text-indigo-100 font-semibold">
                              {formatCurrency(Number(formAmountPaid) || 0)}
                            </p>
                          </div>
                          {formUseCreditBalance && (
                            <div>
                              <span className="font-medium text-green-700 dark:text-green-300">
                                Crédito usado:
                              </span>
                              <p className="text-green-900 dark:text-green-100 font-semibold">
                                {formatCurrency(userCreditInPesos)}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">
                              Total efectivo:
                            </span>
                            <p className="text-indigo-900 dark:text-indigo-100 font-semibold">
                              {formatCurrency(
                                (Number(formAmountPaid) || 0) +
                                  (formUseCreditBalance ? userCreditInPesos : 0)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comentarios */}
                  <div>
                    <label
                      htmlFor="paymentComments"
                      className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      💬 Comentarios
                    </label>
                    <textarea
                      id="paymentComments"
                      value={paymentComments}
                      onChange={(e) => setPaymentComments(e.target.value)}
                      rows={3}
                      className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                      placeholder="Comentarios adicionales sobre el pago..."
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <button
                      type="submit"
                      disabled={
                        applyingVoucher || formSelectedCharges.length === 0
                      }
                      className="flex-1 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyingVoucher ? (
                        <>
                          <ArrowPathIcon
                            className="h-5 w-5 mr-2 animate-spin"
                            aria-hidden="true"
                          />
                          Aplicando...
                        </>
                      ) : (
                        <>
                          <CheckIcon
                            className="h-5 w-5 mr-2"
                            aria-hidden="true"
                          />
                          Aplicar Comprobante
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={applyingVoucher}
                      className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200 disabled:opacity-50"
                    >
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesByCondominiums;
