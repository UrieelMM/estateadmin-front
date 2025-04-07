import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import {
  BuildingOffice2Icon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/solid";
import { useFinancialAccountsStore } from "../../../../store/useAccountsStore";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";

interface FinancialAccount {
  id?: string;
  name: string;
  type: string;
  description?: string;
  initialBalance: number;
  active: boolean;
}

const FinancialAccounts = () => {
  const {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useFinancialAccountsStore();

  // Obtener el condominio seleccionado
  const selectedCondominium = useCondominiumStore(
    (state) => state.selectedCondominium
  );

  const [formData, setFormData] = useState<Partial<FinancialAccount>>({
    name: "",
    type: "",
    description: "",
    initialBalance: 0,
    active: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const condominiumId = localStorage.getItem("condominiumId");
    if (!condominiumId) {
      toast.error("Condominio no seleccionado");
      return;
    }
    fetchAccounts();
  }, [fetchAccounts]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "initialBalance" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isEditing && editingId) {
        await updateAccount(editingId, formData);
        toast.success("Cuenta actualizada correctamente");
      } else {
        await createAccount(formData);
        toast.success("Cuenta creada correctamente");
      }
      setFormData({
        name: "",
        type: "",
        description: "",
        initialBalance: 0,
        active: true,
      });
      setIsEditing(false);
      setEditingId(null);
      fetchAccounts();
    } catch (error: any) {
      toast.error("Error al guardar la cuenta");
    }
  };

  const handleEdit = (account: FinancialAccount) => {
    if (!account.id) return;
    setFormData({
      name: account.name,
      type: account.type,
      description: account.description || "",
      initialBalance: account.initialBalance,
      active: account.active,
    });
    setIsEditing(true);
    setEditingId(account.id);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("¿Estás seguro de desactivar esta cuenta?")) return;
    try {
      await deleteAccount(id);
      toast.success("Cuenta desactivada correctamente");
      fetchAccounts();
    } catch (error: any) {
      toast.error("Error al desactivar la cuenta");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-semibold text-black dark:text-gray-100">
          Cuentas Financieras
        </h2>
        {selectedCondominium && (
          <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium dark:bg-indigo-900 dark:text-indigo-200">
            {selectedCondominium.name}
          </span>
        )}
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form
        onSubmit={handleSubmit}
        className="mb-6 bg-white shadow-md rounded-lg p-6 dark:bg-gray-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre de la cuenta */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 dark:text-gray-100">
              Nombre de la cuenta
            </label>
            <div className="relative">
              <BuildingOffice2Icon className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name as string}
                onChange={handleInputChange}
                className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                required
              />
            </div>
          </div>
          {/* Tipo de cuenta */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 dark:text-gray-100">
              Tipo de cuenta
            </label>
            <div className="relative">
              <BanknotesIcon className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                name="type"
                value={formData.type as string}
                onChange={handleInputChange}
                className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                required
              >
                <option value="">Seleccione</option>
                <option value="bank">Banco</option>
                <option value="cash">Efectivo</option>
              </select>
            </div>
          </div>
          {/* Saldo Inicial */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 dark:text-gray-100">
              Saldo Inicial
            </label>
            <div className="relative">
              <CurrencyDollarIcon className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                name="initialBalance"
                value={formData.initialBalance as number}
                onChange={handleInputChange}
                className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                required
              />
            </div>
          </div>
          {/* Descripción */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 dark:text-gray-100">
              Descripción (opcional)
            </label>
            <div className="relative">
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <textarea
                name="description"
                value={formData.description as string}
                onChange={handleInputChange}
                className="w-full pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                rows={2}
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-2 text-md rounded-lg flex items-center transition-colors duration-200"
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            {isEditing ? "Actualizar Cuenta" : "Crear Cuenta"}
          </button>
        </div>
      </form>
      {loading ? (
        <p className="text-gray-600">Cargando cuentas...</p>
      ) : (
        <div className=" bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
          <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">
            Lista de Cuentas
          </h3>
          {accounts.length === 0 ? (
            <p className="text-gray-600">No hay cuentas registradas.</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-100">
                    Nombre
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-100">
                    Tipo
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-100">
                    Saldo Inicial
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-100">
                    Activo
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-100">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="py-3 px-4">{account.name}</td>
                    <td className="py-3 px-4 capitalize">{account.type}</td>
                    <td className="py-3 px-4">{account.initialBalance}</td>
                    <td className="py-3 px-4">
                      {account.active ? "Sí" : "No"}
                    </td>
                    <td className="py-3 px-4 flex space-x-3">
                      <button
                        onClick={() => handleEdit(account)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialAccounts;
