import { Fragment, useEffect, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/16/solid";
import useUserStore from "../../../../store/UserDataStore";
import { UserData } from "../../../../interfaces/UserData";
import { usePaymentStore } from "../../../../store/usePaymentStore";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface FormParcelReceptionProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface SelectedCharge {
  chargeId: string;
  amount: number;
}

/**
 * Este componente registra pagos permitiendo distribuir un monto entre cargos.
 * Si se usa saldo a favor, se considera el total efectivo = monto abonado + crédito disponible.
 * La validación se realiza en función de:
 * - Si se usa crédito: la suma asignada debe ser igual a (monto abonado + crédito disponible).
 * - De lo contrario: debe ser igual a monto abonado.
 */
const PaymentForm = ({ open, setOpen }: FormParcelReceptionProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Campos del formulario
  const [email, setEmail] = useState<string>("");
  const [numberCondominium, setNumberCondominium] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<string>(""); // Monto abonado
  const [amountPending, setAmountPending] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("");

  // Archivo adjunto
  const [file, setFile] = useState<File | File[] | null>(null);
  const [fileName, setFileName] = useState("");

  // Estado para el usuario seleccionado y para el uso de saldo a favor
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [useCreditBalance, setUseCreditBalance] = useState<boolean>(false);

  // Store de usuarios
  const fetchCondominiumsUsers = useUserStore((state) => state.fetchCondominiumsUsers);
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

  // Store de pagos y cargos
  const addMaintenancePayment = usePaymentStore((state) => state.addMaintenancePayment);
  const fetchUserCharges = usePaymentStore((state) => state.fetchUserCharges);
  const charges = usePaymentStore((state) => state.charges);

  // Estado para cargos seleccionados (multi-cargo o único)
  const [selectedCharges, setSelectedCharges] = useState<SelectedCharge[]>([]);

  useEffect(() => {
    fetchCondominiumsUsers();
    if (condominiumsUsers) {
      setUsers(condominiumsUsers);
    }
  }, [fetchCondominiumsUsers, condominiumsUsers]);

  const handleRecipientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uid = e.target.value;
    const user = users.find((u) => u.uid === uid);
    if (user) {
      setEmail(user.email);
      setNumberCondominium(user.number || "");
      setSelectedUser(user);
      if (user.number) {
        fetchUserCharges(user.number).catch((err) =>
          console.error("Error fetching user charges:", err)
        );
      }
      setSelectedCharges([]);
    }
  };

  const handleToggleCharge = (chargeId: string, checked: boolean) => {
    if (checked) {
      setSelectedCharges((prev) => [...prev, { chargeId, amount: 0 }]);
    } else {
      setSelectedCharges((prev) => prev.filter((sc) => sc.chargeId !== chargeId));
    }
  };

  const handleAmountChange = (chargeId: string, newAmount: number) => {
    setSelectedCharges((prev) =>
      prev.map((sc) => (sc.chargeId === chargeId ? { ...sc, amount: newAmount } : sc))
    );
  };

  // Sumar los montos asignados
  const totalAssigned = selectedCharges.reduce((sum, sc) => sum + sc.amount, 0);

  // Si se usa crédito, el total efectivo es: monto abonado + crédito disponible; de lo contrario, es solo monto abonado.
  const effectiveTotal =
    useCreditBalance && selectedUser
      ? Number(amountPaid) + Number(selectedUser.totalCreditBalance || 0)
      : Number(amountPaid);

  const remainingEffective = effectiveTotal - totalAssigned;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    // Validar campos obligatorios
    if (!amountPaid && !useCreditBalance) {
      toast.error("El campo 'monto abonado' es obligatorio.");
      setLoading(false);
      return;
    }
    if (!amountPending) {
      toast.error("El campo 'monto pendiente' es obligatorio.");
      setLoading(false);
      return;
    }
    if (!paymentType) {
      toast.error("El campo 'tipo de pago' es obligatorio.");
      setLoading(false);
      return;
    }
    if (selectedCharges.length === 0) {
      toast.error("Debes seleccionar al menos un cargo para aplicar el pago.");
      setLoading(false);
      return;
    }

    // Validar que la suma asignada sea la esperada:
    // Si se usa crédito, se espera que totalAssigned sea igual al effectiveTotal.
    // De lo contrario, totalAssigned debe igualar al monto abonado.
    if (useCreditBalance) {
      if (Number(effectiveTotal).toFixed(2) !== Number(totalAssigned).toFixed(2)) {
        toast.error(
          "En pago con saldo a favor, la suma de montos asignados debe ser igual a (monto abonado + crédito disponible)."
        );
        setLoading(false);
        return;
      }
    } else {
      if (Number(amountPaid).toFixed(2) !== Number(totalAssigned).toFixed(2)) {
        toast.error("El monto abonado debe coincidir exactamente con la suma de los cargos asignados.");
        setLoading(false);
        return;
      }
    }

    // Validar que, si se quiere usar saldo a favor, el usuario tenga crédito disponible
    if (useCreditBalance && (!selectedUser?.totalCreditBalance || Number(selectedUser.totalCreditBalance) <= 0)) {
      toast.error("No tienes saldo a favor disponible.");
      setLoading(false);
      return;
    }

    try {
      const paymentObj: any = {
        email,
        numberCondominium,
        amountPaid: Number(amountPaid),
        amountPending: Number(amountPending),
        comments,
        file,
        selectedCharges,
        useCreditBalance,
        paymentType,
      };

      await addMaintenancePayment(paymentObj);

      // Resetear formulario
      setEmail("");
      setNumberCondominium("");
      setAmountPaid("");
      setAmountPending("");
      setComments("");
      setPaymentType("");
      setFile(null);
      setFileName("");
      setSelectedCharges([]);
      setSelectedUser(null);
      setUseCreditBalance(false);

      setOpen(false);
      setLoading(false);
      toast.success("Pago registrado correctamente");
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error("Error al registrar el pago");
    }
  };

  const dropzoneOptions = {
    accept: [".xls", ".xlsx"] as any,
    onDrop: (acceptedFiles: File[]) => {
      setFile(acceptedFiles[0]);
      setFileName(acceptedFiles[0].name);
    },
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <div className="fixed inset-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="overlay-forms absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <form onSubmit={handleSubmit} className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                    <div className="h-0 flex-1 overflow-y-auto">
                      <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-white">
                            Registrar pago
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                              onClick={() => setOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-indigo-300">
                            Registra un nuevo pago para un condómino.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="divide-y divide-gray-200 px-4 sm:px-6">
                          <div className="space-y-6 pb-5 pt-6">
                            {/* Selección de condomino */}
                            <div>
                              <label htmlFor="nameRecipient" className="block text-sm font-medium leading-6 text-gray-900">
                                Condomino
                              </label>
                              <div className="mt-2">
                                <select
                                  onChange={handleRecipientChange}
                                  name="nameRecipient"
                                  id="nameRecipient"
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                  value={users.find((u) => u.number === numberCondominium)?.uid || ""}
                                >
                                  <option value="">Selecciona un condomino</option>
                                  {users
                                    .filter(
                                      (user) =>
                                        user.role !== "admin" &&
                                        user.role !== "super-admin" &&
                                        user.role !== "security"
                                    )
                                    .map((user) => (
                                      <option key={user.uid} value={user.uid}>
                                        {user.number} {user.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            {/* Monto abonado */}
                            <div>
                              <label htmlFor="amountPaid" className="block text-sm font-medium leading-6 text-gray-900">
                                Monto abonado
                              </label>
                              <div className="mt-2">
                                <div className="relative">
                                  <span className="absolute left-2 top-1">$</span>
                                  <input
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    type="number"
                                    name="amountPaid"
                                    id="amountPaid"
                                    className="block w-full rounded-md border-0 pl-5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    value={amountPaid}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Tipo de pago */}
                            <div>
                              <label htmlFor="paymentType" className="block text-sm font-medium leading-6 text-gray-900">
                                Tipo de pago
                              </label>
                              <div className="mt-2">
                                <select
                                  onChange={(e) => setPaymentType(e.target.value)}
                                  name="paymentType"
                                  id="paymentType"
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                  value={paymentType}
                                >
                                  <option value="">Selecciona un tipo de pago</option>
                                  <option value="Transferencia">Transferencia</option>
                                  <option value="Efectivo">Efectivo</option>
                                  <option value="Tarjeta">Tarjeta</option>
                                </select>
                              </div>
                            </div>

                            {/* Monto pendiente */}
                            <div>
                              <label htmlFor="amountPending" className="block text-sm font-medium leading-6 text-gray-900">
                                Monto pendiente
                              </label>
                              <div className="mt-2">
                                <div className="relative">
                                  <span className="absolute left-2 top-1">$</span>
                                  <input
                                    onChange={(e) => setAmountPending(e.target.value)}
                                    type="number"
                                    name="amountPending"
                                    id="amountPending"
                                    className="block w-full rounded-md border-0 pl-5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    value={amountPending}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Sección para usar saldo a favor (solo si hay crédito disponible) */}
                            {selectedUser && Number(selectedUser.totalCreditBalance) > 0 && (
                              <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">
                                  Saldo a favor disponible: ${Number(selectedUser.totalCreditBalance).toFixed(2)}
                                </label>
                                <div className="mt-2 flex items-center space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="useCreditBalance"
                                      value="false"
                                      checked={!useCreditBalance}
                                      onChange={() => setUseCreditBalance(false)}
                                      className="mr-2"
                                    />
                                    No utilizar saldo a favor
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="useCreditBalance"
                                      value="true"
                                      checked={useCreditBalance}
                                      onChange={() => setUseCreditBalance(true)}
                                      className="mr-2"
                                    />
                                    Utilizar saldo a favor
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* Lista de cargos pendientes para selección múltiple */}
                            {numberCondominium && charges.length > 0 && (
                              <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">
                                  Selecciona cargos a pagar
                                </label>
                                <div className="mt-2 space-y-2">
                                  {charges.map((charge) => {
                                    const isChecked = selectedCharges.some((sc) => sc.chargeId === charge.id);
                                    return (
                                      <div key={charge.id} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => handleToggleCharge(charge.id, e.target.checked)}
                                        />
                                        <span className="flex-1">
                                          {`${charge.concept} | Mes: ${charge.month || "Sin mes"} | Monto: $${charge.amount}`}
                                        </span>
                                        {isChecked && (
                                          <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            className="w-18 rounded-md border-gray-300"
                                            placeholder="Monto a aplicar"
                                            value={selectedCharges.find((sc) => sc.chargeId === charge.id)?.amount || ""}
                                            onChange={(e) => handleAmountChange(charge.id, Number(e.target.value))}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-2">
                                  <span className="text-sm font-bold">
                                    Saldo restante: ${remainingEffective.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Dropzone para archivo */}
                            <div {...getRootProps()} className="mt-12 h-auto flex items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4">
                              <input {...getInputProps()} />
                              <div className="text-center">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                {fileName ? (
                                  <p className="mt-4 text-sm leading-6 text-gray-600">{fileName}</p>
                                ) : (
                                  <p className="mt-4 text-sm leading-6 font-medium text-indigo-600">
                                    {isDragActive
                                      ? "Suelta el archivo aquí..."
                                      : "Arrastra y suelta el comprobante aquí o haz click para seleccionarlo"}
                                  </p>
                                )}
                                <p className="text-xs leading-5 text-gray-600">Hasta 10MB</p>
                              </div>
                            </div>

                            {/* Comentarios */}
                            <div>
                              <label htmlFor="comments" className="block text-sm font-medium leading-6 text-gray-900">
                                Comentarios
                              </label>
                              <div className="mt-2">
                                <textarea
                                  onChange={(e) => setComments(e.target.value)}
                                  id="comments"
                                  name="comments"
                                  rows={4}
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                  value={comments}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-shrink-0 justify-end px-4 py-4">
                      <button
                        type="button"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        onClick={() => setOpen(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        {loading ? (
                          <svg
                            className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-indigo-100 rounded-full"
                            viewBox="0 0 24 24"
                          ></svg>
                        ) : (
                          "Guardar"
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default PaymentForm;
