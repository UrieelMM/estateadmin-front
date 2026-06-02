import { useEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  CreditCardIcon,
  TicketIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ArrowLeftEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import useClientInvoicesStore from "../../../../store/useClientInvoicesStore";
import useAuthStore from "../../../../store/AuthStore";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";
import { INITIAL_SETUP_STRIPE_PENDING_KEY } from "../../../../routes/initialSetupStatus";

interface Props {
  clientId: string;
  condominiumId: string;
  onResolved?: () => void;
}

interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  concept?: string;
  invoiceType?: string;
  dueDate?: any;
  invoiceURL?: string;
}

type PaymentUiState = "pending" | "checking" | "success" | "cancel" | "error";

const formatMXN = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatDate = (raw: any): string => {
  if (!raw) return "";
  try {
    const date =
      typeof raw?.toDate === "function"
        ? raw.toDate()
        : raw instanceof Date
        ? raw
        : new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const isSubscriptionInvoice = (data: Record<string, any>) => {
  const invoiceType = String(data.invoiceType || "").toLowerCase();
  const concept = String(data.concept || "").toLowerCase();
  return invoiceType === "subscription" || concept.includes("suscrip");
};

const CondominiumPaymentGate = ({
  clientId,
  condominiumId,
  onResolved,
}: Props) => {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<PendingInvoice | null>(null);
  const [condominiumName, setCondominiumName] = useState<string>("");
  const [hasActiveCoupon, setHasActiveCoupon] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentUiState>("pending");
  const stripeReturnHandled = useRef(false);

  const { initiateStripePayment, checkPaymentStatus } = useClientInvoicesStore();
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const {
    condominiums,
    selectedCondominium,
    fetchCondominiums,
    setSelectedCondominium,
  } = useCondominiumStore();
  const [switchingCondominiumId, setSwitchingCondominiumId] = useState<
    string | null
  >(null);

  // Carga el listado de condominios del admin para poder ofrecer un cambio
  // rápido a otro condominio sin cerrar sesión.
  useEffect(() => {
    if (condominiums.length === 0) {
      fetchCondominiums().catch((err) => {
        console.error("Error cargando condominios para el gate:", err);
      });
    }
  }, [condominiums.length, fetchCondominiums]);

  const otherCondominiums = useMemo(
    () => condominiums.filter((c) => c.id !== condominiumId),
    [condominiums, condominiumId],
  );

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const db = getFirestore();

      const condoDocSnap = await getDoc(
        doc(db, `clients/${clientId}/condominiums/${condominiumId}`),
      );
      if (condoDocSnap.exists()) {
        const data = condoDocSnap.data() || {};
        setCondominiumName(
          String(data.name || data.condominiumName || "Tu condominio"),
        );
        setHasActiveCoupon(
          Boolean(data.coupon) &&
            String(data.couponStatus || "").toLowerCase() === "active",
        );
      }

      const invoicesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated`,
      );
      const pendingSnap = await getDocs(
        query(
          invoicesRef,
          where("paymentStatus", "in", ["pending", "overdue"]),
          orderBy("createdAt", "desc"),
          limit(20),
        ),
      );
      const subscriptionDoc = pendingSnap.docs.find((d) =>
        isSubscriptionInvoice(d.data() || {}),
      );

      if (subscriptionDoc) {
        const data = subscriptionDoc.data() as Record<string, any>;
        setInvoice({
          id: subscriptionDoc.id,
          invoiceNumber: String(data.invoiceNumber || ""),
          amount: Number(data.amount) || 0,
          currency: String(data.currency || "MXN"),
          concept: data.concept,
          invoiceType: data.invoiceType,
          dueDate: data.dueDate,
          invoiceURL: data.invoiceURL,
        });
      } else {
        setInvoice(null);
      }
    } catch (error) {
      console.error("Error cargando factura pendiente del condominio:", error);
      toast.error("No pudimos cargar la factura pendiente del condominio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [clientId, condominiumId]);

  // Detecta el regreso desde Stripe (?payment=success | ?payment=cancel)
  useEffect(() => {
    if (stripeReturnHandled.current) return;

    const params = new URLSearchParams(window.location.search);
    const paymentParam = params.get("payment");
    const sessionId = params.get("session_id");

    if (!paymentParam) return;
    stripeReturnHandled.current = true;

    const cleanUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("session_id");
      url.searchParams.delete("invoice_id");
      window.history.replaceState({}, "", url.toString());
    };

    if (paymentParam === "success") {
      setPaymentState("checking");
      (async () => {
        try {
          if (sessionId) {
            await checkPaymentStatus(sessionId);
          }
        } catch (err) {
          console.error("No se pudo verificar el pago con Stripe:", err);
        } finally {
          sessionStorage.removeItem(INITIAL_SETUP_STRIPE_PENDING_KEY);
          cleanUrl();
          toast.success(
            "Estamos confirmando tu pago. En unos segundos tendrás acceso al condominio.",
          );
          setPaymentState("success");
          // Damos un margen al webhook para marcar la factura como paid
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        }
      })();
    } else if (paymentParam === "cancel" || paymentParam === "cancelled") {
      sessionStorage.removeItem(INITIAL_SETUP_STRIPE_PENDING_KEY);
      cleanUrl();
      setPaymentState("cancel");
      toast("Cancelaste el pago. Puedes intentarlo de nuevo cuando estés listo.", {
        icon: "ℹ️",
      });
    }
  }, [checkPaymentStatus]);

  const handleApplyCoupon = async () => {
    const normalized = couponInput.trim().toUpperCase();
    if (normalized.length < 8) {
      toast.error("El cupón debe tener al menos 8 caracteres.");
      return;
    }

    setApplyingCoupon(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Sesión expirada. Inicia sesión de nuevo.");

      const response = await fetch(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/redeem-initial-setup-coupon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            coupon: normalized,
            condominiumId,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "No se pudo validar el cupón.");
      }

      toast.success("Cupón aplicado. Tu factura inicial fue condonada.");
      setPaymentState("success");
      setTimeout(() => {
        if (onResolved) onResolved();
        else window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Error aplicando cupón en condominio:", error);
      toast.error(error?.message || "No se pudo validar el cupón.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePay = async () => {
    if (!invoice) return;
    setSubmittingPayment(true);
    try {
      const currentDomain = window.location.origin || "http://localhost:3000";
      const successUrl = `${currentDomain}${window.location.pathname}?payment=success`;
      const cancelUrl = `${currentDomain}${window.location.pathname}?payment=cancel`;

      const invoicePayload: any = {
        ...invoice,
        clientId,
        condominiumId,
      };

      const { url } = await initiateStripePayment(
        invoicePayload,
        successUrl,
        cancelUrl,
      );

      if (!url) {
        throw new Error("Stripe no devolvió una URL de pago.");
      }

      sessionStorage.setItem(
        INITIAL_SETUP_STRIPE_PENDING_KEY,
        JSON.stringify({
          invoiceId: invoice.id,
          condominiumId,
          checkoutStartedAt: Date.now(),
        }),
      );
      window.location.href = url;
    } catch (error: any) {
      console.error("Error iniciando pago de condominio:", error);
      toast.error(error?.message || "No se pudo iniciar el pago con Stripe.");
      setPaymentState("error");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = "/login";
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      toast.error("No se pudo cerrar sesión.");
    }
  };

  const handleSwitchCondominium = async (target: {
    id: string;
    name: string;
  }) => {
    if (switchingCondominiumId) return;
    setSwitchingCondominiumId(target.id);
    try {
      await setSelectedCondominium({
        id: target.id,
        name: target.name,
      });
    } catch (err) {
      console.error("Error cambiando de condominio desde el gate:", err);
      toast.error("No se pudo cambiar de condominio.");
      setSwitchingCondominiumId(null);
    }
  };

  const dueLabel = useMemo(
    () => (invoice?.dueDate ? formatDate(invoice.dueDate) : ""),
    [invoice?.dueDate],
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
      >
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-2 backdrop-blur">
                <BuildingOffice2Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100">
                  Activa tu condominio
                </p>
                <h2 className="text-xl font-bold leading-tight">
                  {condominiumName || "Condominio adicional"}
                </h2>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
            >
              <ArrowLeftEndOnRectangleIcon className="h-4 w-4" />
              Salir
            </button>
          </div>
          <p className="mt-3 text-sm leading-snug text-indigo-50">
            Este condominio tiene una factura inicial pendiente. Págala con
            Stripe o aplica tu cupón de regalo para empezar a usarlo.
          </p>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {paymentState === "success" && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/20">
              <CheckBadgeIcon className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Listo, estamos preparando tu condominio.
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Cargando dashboard en unos segundos…
                </p>
              </div>
            </div>
          )}

          {paymentState === "checking" && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/40 dark:bg-indigo-900/20">
              <ArrowPathIcon className="h-6 w-6 shrink-0 animate-spin text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  Verificando tu pago con Stripe…
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  No cierres esta ventana, tardamos unos segundos.
                </p>
              </div>
            </div>
          )}

          {(paymentState === "cancel" || paymentState === "error") && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-900/20">
              <XCircleIcon className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                  {paymentState === "cancel"
                    ? "Cancelaste el pago."
                    : "Tuvimos un problema procesando tu pago."}
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  Vuelve a intentarlo o aplica un cupón si lo tienes.
                </p>
              </div>
            </div>
          )}

          {/* Invoice card */}
          {loading ? (
            <div className="animate-pulse space-y-3 rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-9 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ) : invoice ? (
            <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm dark:border-indigo-900/50 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-indigo-50 bg-indigo-50/60 px-5 py-3 dark:border-indigo-900/40 dark:bg-indigo-900/20">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Factura {invoice.invoiceNumber || "—"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  Pendiente de pago
                </span>
              </div>
              <div className="px-5 py-5">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total a pagar
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {formatMXN(invoice.amount)}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {invoice.currency.toUpperCase()}
                  </span>
                </p>

                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm dark:border-gray-700">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500 dark:text-gray-400">
                      Concepto
                    </span>
                    <span className="text-right font-medium text-gray-800 dark:text-gray-200">
                      {invoice.concept || "Suscripción inicial"}
                    </span>
                  </div>
                  {dueLabel && (
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500 dark:text-gray-400">
                        Fecha límite
                      </span>
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        {dueLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
              No encontramos una factura inicial pendiente para este condominio.
              Si crees que es un error, contacta a soporte.
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handlePay}
              disabled={
                !invoice ||
                submittingPayment ||
                paymentState === "checking" ||
                paymentState === "success"
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CreditCardIcon className="h-5 w-5" />
              {submittingPayment ? "Redirigiendo a Stripe…" : "Pagar con Stripe"}
            </button>

            {invoice?.invoiceURL && (
              <a
                href={invoice.invoiceURL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Ver factura
              </a>
            )}
          </div>

          {/* Coupon */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                <TicketIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  ¿Tienes un cupón de regalo?
                </p>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                  {hasActiveCoupon
                    ? "Este condominio tiene un cupón asignado. Ingrésalo para condonar la primera factura."
                    : "Si te dieron un código, ingrésalo aquí para activar el condominio sin costo."}
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase().trim())
                    }
                    placeholder="EJ. ABCD1234"
                    minLength={8}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase tracking-wider text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={
                      applyingCoupon ||
                      paymentState === "checking" ||
                      paymentState === "success"
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    {applyingCoupon ? "Validando…" : "Aplicar cupón"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Switcher a otro condominio */}
          {otherCondominiums.length > 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Mientras tanto, regresa a otro condominio
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Puedes pagar este condominio más tarde y seguir trabajando en
                otro que ya esté activo.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {otherCondominiums.map((c) => {
                  const isSwitching = switchingCondominiumId === c.id;
                  const isCurrent = selectedCondominium?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        handleSwitchCondominium({ id: c.id, name: c.name })
                      }
                      disabled={Boolean(switchingCondominiumId) || isCurrent}
                      className="group inline-flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <BuildingOffice2Icon className="h-4 w-4 text-indigo-500" />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="text-[11px] text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-300">
                        {isSwitching ? "Cambiando…" : "Ir"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex flex-col gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-1">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
              Pagos procesados de forma segura por Stripe.
            </span>
            <a
              href="mailto:soporte@estate-admin.com?subject=Necesito%20ayuda%20con%20mi%20condominio"
              className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <EnvelopeIcon className="h-4 w-4" />
              Contactar a soporte
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CondominiumPaymentGate;
