import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import useCommitteeStore, {
  CommitteeMember,
} from "../../../../../store/useCommitteeStore";
import {
  UserIcon,
  UserPlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

// Lista de roles comunes para miembros de comité de condominio
const COMMITTEE_ROLES = [
  "Presidente",
  "Vicepresidente",
  "Secretario",
  "Tesorero",
  "Vocal",
  "Coordinador de Mantenimiento",
  "Coordinador de Seguridad",
  "Coordinador de Eventos",
  "Coordinador de Áreas Comunes",
  "Coordinador de Comunicación",
  "Auditor",
  "Asesor Legal",
  "Asesor Financiero",
  "Supervisor de Obras",
  "Representante de Torre/Sección",
  "Coordinador de Sostenibilidad",
  "Mediador de Conflictos",
  "Coordinador de Protección Civil",
  "Representante de Propietarios",
  "Comisario",
];

// Días de la semana
const DAYS_OF_WEEK = [
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

// Horas del día (formato 24 horas)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    const formattedHour = hour.toString().padStart(2, "0");
    options.push(`${formattedHour}:00`);
    options.push(`${formattedHour}:30`);
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

interface MemberFormProps {
  memberToEdit?: CommitteeMember | null;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

const CommitteeForm = ({
  memberToEdit,
  onSubmitSuccess,
  onCancel,
}: MemberFormProps) => {
  const { addCommitteeMember, updateCommitteeMember, isLoading } =
    useCommitteeStore();

  // Estados locales para el formulario
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState(COMMITTEE_ROLES[0]);
  const [reportsPreferences, setReportsPreferences] = useState({
    maintenance: false,
    financialReports: false,
  });
  const [scheduleDay, setScheduleDay] = useState<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
  >("monday");
  const [scheduleTime, setScheduleTime] = useState("06:00");
  const [receiveReports, setReceiveReports] = useState(true);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    "weekly"
  );

  // Cargar datos si estamos editando
  useEffect(() => {
    if (memberToEdit) {
      setFirstName(memberToEdit.firstName);
      setLastName(memberToEdit.lastName);
      setEmail(memberToEdit.email);
      setPhone(memberToEdit.phone || "");
      setDepartment(memberToEdit.department);
      setRole(memberToEdit.role);
      setReportsPreferences(memberToEdit.reportsPreferences);
      setScheduleDay(memberToEdit.scheduleDay);
      setScheduleTime(memberToEdit.scheduleTime);
      setReceiveReports(memberToEdit.receiveReports);
      setFrequency(memberToEdit.frequency);
    }
  }, [memberToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!firstName || !lastName || !email || !department || !role) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return;
    }

    try {
      const memberData = {
        firstName,
        lastName,
        email,
        phone,
        department,
        role,
        reportsPreferences,
        scheduleDay,
        scheduleTime,
        receiveReports,
        frequency,
      };

      if (memberToEdit) {
        await updateCommitteeMember(memberToEdit.id, memberData);
      } else {
        await addCommitteeMember(memberData);
      }

      // Limpiar el formulario y notificar éxito
      resetForm();
      onSubmitSuccess();
    } catch (error: any) {
      console.error("Error en el formulario:", error);
      toast.error(error.message || "Error al guardar el miembro del comité");
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setRole(COMMITTEE_ROLES[0]);
    setReportsPreferences({
      maintenance: false,
      financialReports: false,
    });
    setScheduleDay("monday");
    setScheduleTime("06:00");
    setReceiveReports(true);
    setFrequency("weekly");
  };

  const handleReportPreferenceChange = (
    key: keyof typeof reportsPreferences
  ) => {
    setReportsPreferences({
      ...reportsPreferences,
      [key]: !reportsPreferences[key],
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
        {memberToEdit
          ? "Editar miembro del comité"
          : "Agregar nuevo miembro al comité"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Nombre */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nombre*
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-10 pr-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder="Nombre"
                required
              />
            </div>
          </div>

          {/* Apellidos */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Apellidos*
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserPlusIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-10 pr-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder="Apellidos"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Correo electrónico*
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-10 pr-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
          </div>

          {/* Teléfono (opcional) */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Teléfono (opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-10 pr-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder="Teléfono"
              />
            </div>
          </div>

          {/* Departamento/casa */}
          <div>
            <label
              htmlFor="department"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Departamento/Casa*
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HomeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-10 pr-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder="Depto./Casa (ej: Torre A, 101)"
                required
              />
            </div>
          </div>

          {/* Rol en el comité */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Cargo en el comité*
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              required
            >
              {COMMITTEE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preferencias de reportes */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
            Enviar reportes de:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleReportPreferenceChange("maintenance")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  reportsPreferences.maintenance
                    ? "bg-indigo-600"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`${
                    reportsPreferences.maintenance
                      ? "translate-x-6"
                      : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                Mantenimiento
              </span>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleReportPreferenceChange("financialReports")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  reportsPreferences.financialReports
                    ? "bg-indigo-600"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`${
                    reportsPreferences.financialReports
                      ? "translate-x-6"
                      : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                Ingresos y Egresos
              </span>
            </div>
          </div>
        </div>

        {/* Programación de envío de reportes */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
            Programación de reportes
          </h3>

          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={() => setReceiveReports(!receiveReports)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                receiveReports
                  ? "bg-indigo-600"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`${
                  receiveReports ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
              Recibir reportes automáticos
            </span>
          </div>

          {receiveReports && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Frecuencia */}
              <div>
                <label
                  htmlFor="frequency"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Frecuencia
                </label>
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(
                      e.target.value as "daily" | "weekly" | "monthly"
                    )
                  }
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>

              {/* Día de envío */}
              <div>
                <label
                  htmlFor="scheduleDay"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Día de envío
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="scheduleDay"
                    value={scheduleDay}
                    onChange={(e) => setScheduleDay(e.target.value as any)}
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-10 pr-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hora de envío */}
              <div>
                <label
                  htmlFor="scheduleTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Hora de envío
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="scheduleTime"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-10 pr-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <XMarkIcon className="h-5 w-5 mr-1" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon className="h-5 w-5 mr-1" />
            {isLoading
              ? "Guardando..."
              : memberToEdit
              ? "Actualizar miembro"
              : "Agregar miembro"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommitteeForm;
