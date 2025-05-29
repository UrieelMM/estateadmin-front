import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  usePersonalAdministrationStore,
  PersonalProfile,
} from "../../../../store/PersonalAdministration";
import EmployeeModal from "./EmployeeModal";

const EmployeeList: React.FC = () => {
  const {
    getFilteredEmployees,
    setSearchTerm,
    setFilters,
    clearFilters,
    searchTerm,
    filters,
    setSelectedEmployee,
    deleteEmployee,
    fetchEmployees,
    loading,
  } = usePersonalAdministrationStore();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedEmployee, setSelectedEmployeeLocal] =
    useState<PersonalProfile | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] =
    useState<PersonalProfile | null>(null);

  // Cargar empleados al montar el componente
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = getFilteredEmployees();

  const handleCreateEmployee = () => {
    setModalMode("create");
    setSelectedEmployeeLocal(null);
    setSelectedEmployee(null);
    setShowModal(true);
  };

  const handleViewEmployee = (employee: PersonalProfile) => {
    setModalMode("view");
    setSelectedEmployeeLocal(employee);
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleEditEmployee = (employee: PersonalProfile) => {
    setModalMode("edit");
    setSelectedEmployeeLocal(employee);
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleDeleteEmployee = (employee: PersonalProfile) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDeleteEmployee = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete.id);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    }
  };

  const cancelDeleteEmployee = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "inactivo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      case "suspendido":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "vacaciones":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getPositionLabel = (position: string) => {
    const labels = {
      vigilante: "Vigilante",
      conserje: "Conserje",
      jardinero: "Jardinero",
      limpieza: "Limpieza",
      mantenimiento: "Mantenimiento",
      administrador: "Administrador",
    };
    return labels[position as keyof typeof labels] || position;
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Personal del Condominio
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredEmployees.length} empleado(s) encontrado(s)
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateEmployee}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Empleado
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o número de empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posición
                </label>
                <select
                  value={filters.position || ""}
                  onChange={(e) =>
                    setFilters({ position: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las posiciones</option>
                  <option value="vigilante">Vigilante</option>
                  <option value="conserje">Conserje</option>
                  <option value="jardinero">Jardinero</option>
                  <option value="limpieza">Limpieza</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={filters.status || ""}
                  onChange={(e) =>
                    setFilters({ status: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="vacaciones">Vacaciones</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Área
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por área"
                  value={filters.area || ""}
                  onChange={(e) =>
                    setFilters({ area: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Limpiar filtros
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading state
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Cargando empleados...
            </span>
          </div>
        ) : (
          filteredEmployees.map((employee, index) => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
            >
              {/* Employee Photo and Basic Info */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0">
                  {employee.photo ? (
                    <img
                      src={employee.photo}
                      alt={`${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {employee.personalInfo.firstName}{" "}
                    {employee.personalInfo.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getPositionLabel(employee.employmentInfo.position)}
                  </p>
                </div>
              </div>

              {/* Employee Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    No. Empleado:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {employee.employmentInfo.employeeNumber}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Área:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {employee.employmentInfo.area}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Estado:
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      employee.employmentInfo.status
                    )}`}
                  >
                    {employee.employmentInfo.status.charAt(0).toUpperCase() +
                      employee.employmentInfo.status.slice(1)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Ingreso:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {employee.employmentInfo.startDate.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewEmployee(employee)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Ver
                </button>

                <button
                  onClick={() => handleEditEmployee(employee)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </button>

                <button
                  onClick={() => handleDeleteEmployee(employee)}
                  className="inline-flex items-center justify-center px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && filteredEmployees.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No se encontraron empleados
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || Object.keys(filters).length > 0
              ? "Intenta ajustar los filtros de búsqueda"
              : "Comienza agregando un nuevo empleado"}
          </p>
          {!searchTerm && Object.keys(filters).length === 0 && (
            <div className="mt-6">
              <button
                onClick={handleCreateEmployee}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar Empleado
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Employee Modal */}
      {showModal && (
        <EmployeeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mode={modalMode}
          employee={selectedEmployee}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={cancelDeleteEmployee}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    ¿Estás seguro de que deseas eliminar a{" "}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {employeeToDelete?.personalInfo.firstName}{" "}
                      {employeeToDelete?.personalInfo.lastName}
                    </span>
                    ? Esta acción no se puede deshacer.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={cancelDeleteEmployee}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDeleteEmployee}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeList;
