import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  PlusIcon,
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
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
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
    setShowForm(true);
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

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      initialBalance: 0,
      active: true,
    });
    setIsEditing(false);
    setEditingId(null);
    setShowForm(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bank":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cash":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "bank":
        return "Banco";
      case "cash":
        return "Efectivo";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                Cuentas Financieras
              </h1>
              {selectedCondominium && (
                <div className="mt-2 flex items-center gap-2">
                  <BuildingOffice2Icon className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCondominium.name}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-2 rounded-xl shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="h-5 w-5" />
              Nueva Cuenta
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? "Editar Cuenta" : "Nueva Cuenta"}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre de la cuenta */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nombre de la cuenta *
                    </label>
                    <div className="relative group">
                      <BuildingOffice2Icon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name as string}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400 transition-all duration-200"
                        placeholder="Ingresa el nombre de la cuenta"
                        required
                      />
                    </div>
                  </div>

                  {/* Tipo de cuenta */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Tipo de cuenta *
                    </label>
                    <div className="relative group">
                      <BanknotesIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <select
                        name="type"
                        value={formData.type as string}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400 transition-all duration-200 appearance-none"
                        required
                      >
                        <option value="">Seleccione un tipo</option>
                        <option value="bank">Banco</option>
                        <option value="cash">Efectivo</option>
                      </select>
                    </div>
                  </div>

                  {/* Saldo Inicial */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Saldo Inicial *
                    </label>
                    <div className="relative group">
                      <CurrencyDollarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="number"
                        name="initialBalance"
                        value={formData.initialBalance as number}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400 transition-all duration-200"
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Descripción (opcional)
                    </label>
                    <div className="relative group">
                      <ChatBubbleBottomCenterTextIcon className="h-5 w-5 absolute left-3 top-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <textarea
                        name="description"
                        value={formData.description as string}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400 transition-all duration-200 resize-none"
                        rows={3}
                        placeholder="Descripción adicional de la cuenta..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 sm:flex-none px-2 py-2 text-m border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none inline-flex items-center text-md justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-2 rounded-xl shadow-lg hover:shadow-xl"
                  >
                    <CheckIcon className="h-5 w-5" />
                    {isEditing ? "Actualizar Cuenta" : "Crear Cuenta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Accounts List */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Lista de Cuentas
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gestiona todas tus cuentas financieras
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Cargando cuentas...
              </p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                <BanknotesIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay cuentas registradas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comienza creando tu primera cuenta financiera
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="h-5 w-5" />
                Crear Primera Cuenta
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Tipo
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Saldo Inicial
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {accounts.map((account) => (
                      <tr
                        key={account.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {account.name}
                            </div>
                            {account.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {account.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                              account.type
                            )}`}
                          >
                            {getTypeLabel(account.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${account.initialBalance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              account.active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {account.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(account)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                              title="Editar cuenta"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(account.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                              title="Desactivar cuenta"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden p-4 space-y-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {account.name}
                        </h3>
                        {account.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {account.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(account)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tipo
                        </p>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getTypeColor(
                            account.type
                          )}`}
                        >
                          {getTypeLabel(account.type)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Saldo Inicial
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white mt-1">
                          ${account.initialBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          account.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {account.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialAccounts;
