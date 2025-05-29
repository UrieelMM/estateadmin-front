import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { usePersonalAdministrationStore } from "../../../../store/PersonalAdministration";
import { useTicketsStore } from "../maintenance/tickets/ticketsStore";
import EmployeeList from "./EmployeeList";
import PerformanceEvaluations from "./PerformanceEvaluations";
import ScheduleManagement from "./ScheduleManagement";
import TaskManagement from "./TaskManagement";
import Reports from "./Reports";
import ActivityLog from "./ActivityLog";

interface TabItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

const tabs: TabItem[] = [
  {
    id: "employees",
    name: "Personal",
    icon: UsersIcon,
    component: EmployeeList,
  },
  {
    id: "schedule",
    name: "Asistencia",
    icon: CalendarIcon,
    component: ScheduleManagement,
  },
  {
    id: "tickets",
    name: "Tickets",
    icon: CheckCircleIcon,
    component: TaskManagement,
  },
  {
    id: "evaluations",
    name: "Evaluaciones",
    icon: ChartBarIcon,
    component: PerformanceEvaluations,
  },
  {
    id: "activity",
    name: "Bitácora",
    icon: DocumentTextIcon,
    component: ActivityLog,
  },
  {
    id: "reports",
    name: "Reportes",
    icon: DocumentTextIcon,
    component: Reports,
  },
];

const PersonalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("employees");
  const {
    employees,
    shifts,
    getExpiringDocuments,
    getFilteredEmployees,
    fetchEmployees,
  } = usePersonalAdministrationStore();
  const { tickets } = useTicketsStore();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    openTickets: 0,
    todayShifts: 0,
    expiringDocuments: 0,
  });

  useEffect(() => {
    // Cargar empleados desde Firestore
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const filteredEmployees = getFilteredEmployees();
    const activeEmployees = employees.filter(
      (emp) => emp.employmentInfo.status === "activo"
    );
    const openTickets = tickets.filter((ticket) => ticket.status === "abierto");
    const today = new Date();
    const todayShifts = shifts.filter(
      (shift) => shift.date.toDateString() === today.toDateString()
    );
    const expiringDocs = getExpiringDocuments(30);

    setStats({
      totalEmployees: filteredEmployees.length,
      activeEmployees: activeEmployees.length,
      openTickets: openTickets.length,
      todayShifts: todayShifts.length,
      expiringDocuments: expiringDocs.length,
    });
  }, [employees, tickets, shifts, getFilteredEmployees, getExpiringDocuments]);

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || EmployeeList;

  const statCards = [
    {
      title: "Total Empleados",
      value: stats.totalEmployees,
      icon: UsersIcon,
      color: "bg-blue-500",
    },
    {
      title: "Empleados Activos",
      value: stats.activeEmployees,
      icon: UsersIcon,
      color: "bg-green-500",
    },
    {
      title: "Tickets Abiertos",
      value: stats.openTickets,
      icon: CheckCircleIcon,
      color: "bg-yellow-500",
    },
    {
      title: "Turnos Hoy",
      value: stats.todayShifts,
      icon: ClockIcon,
      color: "bg-purple-500",
    },
    {
      title: "Documentos por Vencer",
      value: stats.expiringDocuments,
      icon: ExclamationTriangleIcon,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestión de Personal
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Administra el personal del condominio
              </p>
            </div>

            {/* Notifications */}
            {stats.expiringDocuments > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-lg"
              >
                <BellIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {stats.expiringDocuments} documento(s) por vencer
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                      ${
                        isActive
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <tab.icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PersonalDashboard;
