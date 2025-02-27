import { Fragment, useEffect, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { PhotoIcon, XMarkIcon, CurrencyDollarIcon, ClipboardIcon, CreditCardIcon, CalendarIcon, PencilIcon } from "@heroicons/react/24/solid";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useExpenseStore } from "../../../../store/expenseStore";
import { ExpenseCreateInput } from "../../../../store/expenseStore";

interface ExpenseFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const EXPENSE_CONCEPTS = [
    "Caja Chica", "Agua", "Luz", "Internet", "Teléfono", "Jardinería", "Limpieza",
    "Mantenimiento de Elevadores", "Seguridad Privada", "Pintura General", "Reparaciones Varias",
    "Papelería y Suministros", "Honorarios de Contador", "Honorarios de Abogado", "Publicidad",
    "Gas", "Servicios de Plomería", "Servicios de Electricidad", "Sistema de Alarma", "Póliza de Seguro",
    "Mobiliario", "Equipo de Cómputo", "Alquiler de Salón", "Servicio de Basura", "Honorarios de Administración",
    "Pago de Impuestos", "Material de Construcción", "Servicio de Cerrajería", "Reparación de Bombas de Agua",
    "Artículos de Limpieza"
];

const PAYMENT_TYPES = ["Efectivo", "Transferencia", "Tarjeta", "Cheque", "Depósito"];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, setOpen }) => {
    const [amount, setAmount] = useState<string>("");
    const [concept, setConcept] = useState<string>("");
    const [paymentType, setPaymentType] = useState<string>("");
    const [expenseDate, setExpenseDate] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const { addExpense } = useExpenseStore();

    const dropzoneOptions = {
        onDrop: (acceptedFiles: File[]) => {
            if (acceptedFiles && acceptedFiles.length > 0) {
                setFile(acceptedFiles[0]);
                setFileName(acceptedFiles[0].name);
            }
        },
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

    useEffect(() => {
        if (open) {
            setAmount("");
            setConcept("");
            setPaymentType("");
            setExpenseDate("");
            setDescription("");
            setFile(null);
            setFileName("");
            setLoading(false);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        if (!amount) {
            toast.error("El campo 'monto del egreso' es obligatorio.");
            setLoading(false);
            return;
        }
        if (!concept) {
            toast.error("Selecciona un concepto de egreso.");
            setLoading(false);
            return;
        }
        if (!paymentType) {
            toast.error("Selecciona un tipo de pago.");
            setLoading(false);
            return;
        }
        if (!expenseDate) {
            toast.error("Selecciona la fecha en que se generó el egreso.");
            setLoading(false);
            return;
        }

        try {
            const dataToCreate: ExpenseCreateInput = {
                amount: Number(amount),
                concept,
                paymentType,
                expenseDate,
                description,
                file: file || undefined,
            };
            await addExpense(dataToCreate);

            toast.success("Egreso registrado correctamente");
            setOpen(false);
        } catch (error) {
            console.error("Error al crear egreso:", error);
            toast.error("Ocurrió un error al registrar el egreso.");
        } finally {
            setLoading(false);
        }
    };

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
                                                        Registrar Egreso
                                                    </Dialog.Title>
                                                    <div className="ml-3 flex h-7 items-center">
                                                        <button
                                                            type="button"
                                                            className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none"
                                                            onClick={() => setOpen(false)}
                                                        >
                                                            <span className="absolute -inset-2.5" />
                                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-1">
                                                    <p className="text-sm text-indigo-300">
                                                        Registra un nuevo egreso para el condominio.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 flex-col justify-between">
                                                <div className="divide-y divide-gray-200 px-4 sm:px-6">
                                                    <div className="space-y-6 pb-5 pt-6">
                                                        {/* Monto del egreso */}
                                                        <div>
                                                            <label htmlFor="amount" className="block text-sm font-medium leading-6 text-gray-900">
                                                                Monto del Egreso
                                                            </label>
                                                            <div className="mt-2 relative">
                                                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                                                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    id="amount"
                                                                    name="amount"
                                                                    type="number"
                                                                    className="block w-full rounded-md border-0 pl-10 pr-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 placeholder:animate-pulse"
                                                                    placeholder="0.00"
                                                                    value={amount}
                                                                    onChange={(e) => setAmount(e.target.value)}
                                                                    step="any"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Concepto */}
                                                        <div>
                                                            <label htmlFor="concept" className="block text-sm font-medium leading-6 text-gray-900">
                                                                Concepto de Egreso
                                                            </label>
                                                            <div className="mt-2 relative">
                                                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                                                    <ClipboardIcon className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                                <select
                                                                    id="concept"
                                                                    name="concept"
                                                                    className="block w-full rounded-md border-0 pl-10 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                                    value={concept}
                                                                    onChange={(e) => setConcept(e.target.value)}
                                                                >
                                                                    <option value="">-- Selecciona un concepto --</option>
                                                                    {EXPENSE_CONCEPTS.map((c) => (
                                                                        <option key={c} value={c}>
                                                                            {c}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Tipo de pago */}
                                                        <div>
                                                            <label htmlFor="paymentType" className="block text-sm font-medium leading-6 text-gray-900">
                                                                Tipo de pago
                                                            </label>
                                                            <div className="mt-2 relative">
                                                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                                                    <CreditCardIcon className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                                <select
                                                                    id="paymentType"
                                                                    name="paymentType"
                                                                    className="block w-full rounded-md border-0 pl-10 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                                    value={paymentType}
                                                                    onChange={(e) => setPaymentType(e.target.value)}
                                                                >
                                                                    <option value="">-- Selecciona el tipo de pago --</option>
                                                                    {PAYMENT_TYPES.map((pt) => (
                                                                        <option key={pt} value={pt}>
                                                                            {pt}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Fecha de egreso */}
                                                        <div>
                                                            <label htmlFor="expenseDate" className="block text-sm font-medium leading-6 text-gray-900">
                                                                Fecha del egreso
                                                            </label>
                                                            <div className="mt-2 relative">
                                                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-[60%]">
                                                                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    id="expenseDate"
                                                                    name="expenseDate"
                                                                    type="datetime-local"
                                                                    className="block w-full rounded-md border-0 pl-10 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                                    value={expenseDate}
                                                                    onChange={(e) => setExpenseDate(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Descripción */}
                                                        <div>
                                                            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                                                                Descripción (opcional)
                                                            </label>
                                                            <div className="mt-2 relative">
                                                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                                                    <PencilIcon className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                                <textarea
                                                                    id="description"
                                                                    name="description"
                                                                    rows={3}
                                                                    className="block w-full rounded-md border-0 pl-10 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 placeholder:animate-pulse"
                                                                    placeholder="Detalles adicionales del egreso"
                                                                    value={description}
                                                                    onChange={(e) => setDescription(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Dropzone para factura/recibo */}
                                                        <div>
                                                            <label className="block text-sm font-medium leading-6 text-gray-900">
                                                                Factura o Comprobante (opcional)
                                                            </label>
                                                            <div
                                                                {...getRootProps()}
                                                                className="mt-2 h-auto flex items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4 cursor-pointer"
                                                            >
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
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botones al final */}
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
                                                className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                                            >
                                                {loading ? (
                                                    <svg
                                                        className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-white rounded-full"
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

export default ExpenseForm;
