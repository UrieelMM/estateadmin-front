import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  StarIcon,
  CalendarIcon,
  UserIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import {
  usePersonalAdministrationStore,
  PerformanceEvaluation,
} from "../../../../store/PersonalAdministration";

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation?: PerformanceEvaluation;
  mode: "create" | "edit" | "view";
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  mode,
}) => {
  const { employees, createEvaluation, updateEvaluation } =
    usePersonalAdministrationStore();
  const [formData, setFormData] = useState({
    employeeId: "",
    evaluatorId: "",
    period: {
      startDate: "",
      endDate: "",
    },
    criteria: {
      punctuality: 3,
      taskCompletion: 3,
      residentRelations: 3,
      teamwork: 3,
      initiative: 3,
    },
    comments: "",
    improvementAreas: [] as string[],
    goals: [] as string[],
  });

  const [newImprovementArea, setNewImprovementArea] = useState("");
  const [newGoal, setNewGoal] = useState("");

  useEffect(() => {
    if (evaluation) {
      setFormData({
        employeeId: evaluation.employeeId,
        evaluatorId: evaluation.evaluatorId,
        period: {
          startDate: evaluation.period.startDate.toISOString().split("T")[0],
          endDate: evaluation.period.endDate.toISOString().split("T")[0],
        },
        criteria: evaluation.criteria,
        comments: evaluation.comments,
        improvementAreas: evaluation.improvementAreas,
        goals: evaluation.goals,
      });
    } else {
      setFormData({
        employeeId: "",
        evaluatorId: "",
        period: {
          startDate: "",
          endDate: "",
        },
        criteria: {
          punctuality: 3,
          taskCompletion: 3,
          residentRelations: 3,
          teamwork: 3,
          initiative: 3,
        },
        comments: "",
        improvementAreas: [],
        goals: [],
      });
    }
  }, [evaluation, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create") {
      createEvaluation({
        employeeId: formData.employeeId,
        evaluatorId: formData.evaluatorId,
        period: {
          startDate: new Date(formData.period.startDate),
          endDate: new Date(formData.period.endDate),
        },
        criteria: formData.criteria,
        overallScore: 0, // Se calcula automáticamente en el store
        comments: formData.comments,
        improvementAreas: formData.improvementAreas,
        goals: formData.goals,
      });
    } else if (mode === "edit" && evaluation) {
      updateEvaluation(evaluation.id, {
        employeeId: formData.employeeId,
        evaluatorId: formData.evaluatorId,
        period: {
          startDate: new Date(formData.period.startDate),
          endDate: new Date(formData.period.endDate),
        },
        criteria: formData.criteria,
        comments: formData.comments,
        improvementAreas: formData.improvementAreas,
        goals: formData.goals,
      });
    }

    onClose();
  };

  const addImprovementArea = () => {
    if (newImprovementArea.trim()) {
      setFormData({
        ...formData,
        improvementAreas: [
          ...formData.improvementAreas,
          newImprovementArea.trim(),
        ],
      });
      setNewImprovementArea("");
    }
  };

  const removeImprovementArea = (index: number) => {
    setFormData({
      ...formData,
      improvementAreas: formData.improvementAreas.filter((_, i) => i !== index),
    });
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setFormData({
        ...formData,
        goals: [...formData.goals, newGoal.trim()],
      });
      setNewGoal("");
    }
  };

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index),
    });
  };

  const StarRating: React.FC<{
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    label: string;
  }> = ({ value, onChange, disabled = false, label }) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => !disabled && onChange(star)}
              disabled={disabled}
              className={`${
                disabled ? "cursor-default" : "cursor-pointer hover:scale-110"
              } transition-transform`}
            >
              {star <= value ? (
                <StarIconSolid className="h-6 w-6 text-yellow-400" />
              ) : (
                <StarIcon className="h-6 w-6 text-gray-300 dark:text-gray-600" />
              )}
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {value}/5
          </span>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const averageScore =
    Object.values(formData.criteria).reduce((sum, score) => sum + score, 0) / 5;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === "create"
              ? "Nueva Evaluación"
              : mode === "edit"
              ? "Editar Evaluación"
              : "Detalles de Evaluación"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Empleado *
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) =>
                  setFormData({ ...formData, employeeId: e.target.value })
                }
                disabled={mode === "view"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                required
              >
                <option value="">Seleccionar empleado</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.personalInfo.firstName}{" "}
                    {employee.personalInfo.lastName} -{" "}
                    {employee.employmentInfo.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evaluador *
              </label>
              <select
                value={formData.evaluatorId}
                onChange={(e) =>
                  setFormData({ ...formData, evaluatorId: e.target.value })
                }
                disabled={mode === "view"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                required
              >
                <option value="">Seleccionar evaluador</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.personalInfo.firstName}{" "}
                    {employee.personalInfo.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Período de evaluación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={formData.period.startDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    period: { ...formData.period, startDate: e.target.value },
                  })
                }
                disabled={mode === "view"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de fin *
              </label>
              <input
                type="date"
                value={formData.period.endDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    period: { ...formData.period, endDate: e.target.value },
                  })
                }
                disabled={mode === "view"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                required
              />
            </div>
          </div>

          {/* Criterios de evaluación */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Criterios de Evaluación
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StarRating
                label="Puntualidad"
                value={formData.criteria.punctuality}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    criteria: { ...formData.criteria, punctuality: value },
                  })
                }
                disabled={mode === "view"}
              />

              <StarRating
                label="Cumplimiento de Tareas"
                value={formData.criteria.taskCompletion}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    criteria: { ...formData.criteria, taskCompletion: value },
                  })
                }
                disabled={mode === "view"}
              />

              <StarRating
                label="Relación con Residentes"
                value={formData.criteria.residentRelations}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    criteria: {
                      ...formData.criteria,
                      residentRelations: value,
                    },
                  })
                }
                disabled={mode === "view"}
              />

              <StarRating
                label="Trabajo en Equipo"
                value={formData.criteria.teamwork}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    criteria: { ...formData.criteria, teamwork: value },
                  })
                }
                disabled={mode === "view"}
              />

              <StarRating
                label="Iniciativa"
                value={formData.criteria.initiative}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    criteria: { ...formData.criteria, initiative: value },
                  })
                }
                disabled={mode === "view"}
              />

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Puntuación General
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comentarios
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) =>
                setFormData({ ...formData, comments: e.target.value })
              }
              disabled={mode === "view"}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              placeholder="Comentarios adicionales sobre el desempeño..."
            />
          </div>

          {/* Áreas de mejora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Áreas de Mejora
            </label>
            {mode !== "view" && (
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newImprovementArea}
                  onChange={(e) => setNewImprovementArea(e.target.value)}
                  placeholder="Agregar área de mejora..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addImprovementArea())
                  }
                />
                <button
                  type="button"
                  onClick={addImprovementArea}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                >
                  Agregar
                </button>
              </div>
            )}
            <div className="space-y-2">
              {formData.improvementAreas.map((area, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                >
                  <span className="text-gray-900 dark:text-white">{area}</span>
                  {mode !== "view" && (
                    <button
                      type="button"
                      onClick={() => removeImprovementArea(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Objetivos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Objetivos para el Próximo Período
            </label>
            {mode !== "view" && (
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Agregar objetivo..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addGoal())
                  }
                />
                <button
                  type="button"
                  onClick={addGoal}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
                >
                  Agregar
                </button>
              </div>
            )}
            <div className="space-y-2">
              {formData.goals.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                >
                  <span className="text-gray-900 dark:text-white">{goal}</span>
                  {mode !== "view" && (
                    <button
                      type="button"
                      onClick={() => removeGoal(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>

            {mode !== "view" && (
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                {mode === "create" ? "Crear Evaluación" : "Guardar Cambios"}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const PerformanceEvaluations: React.FC = () => {
  const { evaluations, employees, deleteEvaluation } =
    usePersonalAdministrationStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    employeeId: "",
    evaluatorId: "",
    scoreRange: "",
  });
  const [selectedEvaluation, setSelectedEvaluation] = useState<
    PerformanceEvaluation | undefined
  >();
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const employee = employees.find((emp) => emp.id === evaluation.employeeId);

    const matchesSearch =
      employee &&
      (employee.personalInfo.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        employee.personalInfo.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesEmployee =
      !filters.employeeId || evaluation.employeeId === filters.employeeId;
    const matchesEvaluator =
      !filters.evaluatorId || evaluation.evaluatorId === filters.evaluatorId;

    let matchesScore = true;
    if (filters.scoreRange) {
      const score = evaluation.overallScore;
      switch (filters.scoreRange) {
        case "excellent":
          matchesScore = score >= 4.5;
          break;
        case "good":
          matchesScore = score >= 3.5 && score < 4.5;
          break;
        case "average":
          matchesScore = score >= 2.5 && score < 3.5;
          break;
        case "poor":
          matchesScore = score < 2.5;
          break;
      }
    }

    return matchesSearch && matchesEmployee && matchesEvaluator && matchesScore;
  });

  const getScoreColor = (score: number) => {
    if (score >= 4.5)
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
    if (score >= 3.5)
      return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
    if (score >= 2.5)
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
    return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return "Excelente";
    if (score >= 3.5) return "Bueno";
    if (score >= 2.5) return "Regular";
    return "Necesita Mejora";
  };

  const getEmployee = (id: string) => employees.find((emp) => emp.id === id);

  const handleCreateEvaluation = () => {
    setSelectedEvaluation(undefined);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEditEvaluation = (evaluation: PerformanceEvaluation) => {
    setSelectedEvaluation(evaluation);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleViewEvaluation = (evaluation: PerformanceEvaluation) => {
    setSelectedEvaluation(evaluation);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleDeleteEvaluation = (evaluationId: string) => {
    if (
      window.confirm("¿Estás seguro de que deseas eliminar esta evaluación?")
    ) {
      deleteEvaluation(evaluationId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Evaluaciones de Desempeño
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestiona las evaluaciones de desempeño del personal
          </p>
        </div>
        <button
          onClick={handleCreateEvaluation}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Evaluación
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <select
            value={filters.employeeId}
            onChange={(e) =>
              setFilters({ ...filters, employeeId: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los empleados</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.personalInfo.firstName}{" "}
                {employee.personalInfo.lastName}
              </option>
            ))}
          </select>

          <select
            value={filters.evaluatorId}
            onChange={(e) =>
              setFilters({ ...filters, evaluatorId: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los evaluadores</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.personalInfo.firstName}{" "}
                {employee.personalInfo.lastName}
              </option>
            ))}
          </select>

          <select
            value={filters.scoreRange}
            onChange={(e) =>
              setFilters({ ...filters, scoreRange: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todas las puntuaciones</option>
            <option value="excellent">Excelente (4.5-5.0)</option>
            <option value="good">Bueno (3.5-4.4)</option>
            <option value="average">Regular (2.5-3.4)</option>
            <option value="poor">Necesita Mejora (1.0-2.4)</option>
          </select>
        </div>
      </div>

      {/* Lista de evaluaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredEvaluations.map((evaluation) => {
            const employee = getEmployee(evaluation.employeeId);
            const evaluator = getEmployee(evaluation.evaluatorId);

            return (
              <motion.div
                key={evaluation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {employee
                        ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`
                        : "Empleado no encontrado"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {employee?.employmentInfo.position}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-4">
                    <button
                      onClick={() => handleViewEvaluation(evaluation)}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditEvaluation(evaluation)}
                      className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvaluation(evaluation.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Puntuación general */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Puntuación General
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {evaluation.overallScore.toFixed(1)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(
                          evaluation.overallScore
                        )}`}
                      >
                        {getScoreLabel(evaluation.overallScore)}
                      </span>
                    </div>
                  </div>

                  {/* Período */}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>
                      {evaluation.period.startDate.toLocaleDateString()} -{" "}
                      {evaluation.period.endDate.toLocaleDateString()}
                    </span>
                  </div>

                  {/* Evaluador */}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span>
                      Evaluado por:{" "}
                      {evaluator
                        ? `${evaluator.personalInfo.firstName} ${evaluator.personalInfo.lastName}`
                        : "Evaluador no encontrado"}
                    </span>
                  </div>

                  {/* Criterios resumidos */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Puntualidad:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {evaluation.criteria.punctuality}/5
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tareas:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {evaluation.criteria.taskCompletion}/5
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Residentes:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {evaluation.criteria.residentRelations}/5
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Equipo:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {evaluation.criteria.teamwork}/5
                      </span>
                    </div>
                  </div>

                  {/* Fecha de evaluación */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                    Evaluado el {evaluation.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredEvaluations.length === 0 && (
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay evaluaciones
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || Object.values(filters).some((f) => f)
              ? "No se encontraron evaluaciones con los filtros aplicados."
              : "Comienza creando una nueva evaluación de desempeño."}
          </p>
          {!searchTerm && !Object.values(filters).some((f) => f) && (
            <button
              onClick={handleCreateEvaluation}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Crear Primera Evaluación
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <EvaluationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        evaluation={selectedEvaluation}
        mode={modalMode}
      />
    </div>
  );
};

export default PerformanceEvaluations;
