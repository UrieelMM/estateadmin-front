import React, { useMemo, useState } from "react";
import {
  ProjectExpense,
  ProjectQuote,
  Project,
} from "../../../../../store/projectStore";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  TrophyIcon,
  DocumentCheckIcon,
  PlayIcon,
  StopIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/solid";
import moment from "moment";
import "moment/locale/es";

interface ProjectTimelineProgressProps {
  project: Project;
  expenses: ProjectExpense[];
  quotes: ProjectQuote[];
}

interface TimelineEvent {
  id: string;
  type:
    | "project_created"
    | "quote_added"
    | "quote_selected"
    | "expense_added"
    | "budget_milestone"
    | "status_change"
    | "project_completed";
  title: string;
  description: string;
  date: string;
  amount?: number;
  category?: string;
  icon: React.ComponentType<any>;
  color: "blue" | "green" | "yellow" | "red" | "indigo" | "purple" | "gray";
  importance: "low" | "medium" | "high";
}

const ProjectTimelineProgress: React.FC<ProjectTimelineProgressProps> = ({
  project,
  expenses,
  quotes,
}) => {
  // Estado para controlar mostrar más/menos eventos
  const [showAllEvents, setShowAllEvents] = useState(false);
  const INITIAL_EVENTS_LIMIT = 5;

  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // 1. Evento de creación del proyecto
    events.push({
      id: `project-created-${project.id}`,
      type: "project_created",
      title: "Proyecto Iniciado",
      description: `Proyecto "${
        project.name
      }" creado con presupuesto inicial de $${project.initialBudget.toLocaleString(
        "es-MX",
        { minimumFractionDigits: 2 }
      )}`,
      date: project.createdAt,
      amount: project.initialBudget,
      icon: PlayIcon,
      color: "blue",
      importance: "high",
    });

    // 2. Eventos de cotizaciones agregadas
    quotes.forEach((quote) => {
      events.push({
        id: `quote-added-${quote.id}`,
        type: "quote_added",
        title: "Nueva Cotización",
        description: `Cotización de ${
          quote.providerName
        } por $${quote.amount.toLocaleString("es-MX", {
          minimumFractionDigits: 2,
        })} - ${quote.concept}`,
        date: quote.createdAt,
        amount: quote.amount,
        category: quote.category,
        icon: DocumentTextIcon,
        color: "indigo",
        importance: "medium",
      });
    });

    // 3. Eventos de cotizaciones seleccionadas
    const selectedQuotes = quotes.filter((quote) => quote.isSelected);
    selectedQuotes.forEach((quote) => {
      events.push({
        id: `quote-selected-${quote.id}`,
        type: "quote_selected",
        title: "Cotización Seleccionada",
        description: `Se seleccionó la cotización de ${
          quote.providerName
        } por $${quote.amount.toLocaleString("es-MX", {
          minimumFractionDigits: 2,
        })}`,
        date: quote.createdAt, // Nota: En un proyecto real, tendrías una fecha de selección separada
        amount: quote.amount,
        category: quote.category,
        icon: DocumentCheckIcon,
        color: "green",
        importance: "high",
      });
    });

    // 4. Eventos de gastos importantes (>= 10% del presupuesto inicial)
    const importantExpenses = expenses.filter(
      (expense) => expense.amount >= project.initialBudget * 0.1
    );
    importantExpenses.forEach((expense) => {
      events.push({
        id: `expense-${expense.id}`,
        type: "expense_added",
        title: "Gasto Significativo",
        description: `${expense.concept} - $${expense.amount.toLocaleString(
          "es-MX",
          { minimumFractionDigits: 2 }
        )}`,
        date: expense.registerDate,
        amount: expense.amount,
        icon: CurrencyDollarIcon,
        color: "yellow",
        importance: "medium",
      });
    });

    // 5. Hitos de presupuesto automáticos
    const totalSpent = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const budgetUsedPercent = (totalSpent / project.initialBudget) * 100;

    const budgetMilestones = [25, 50, 75, 90, 100];
    budgetMilestones.forEach((milestone) => {
      if (budgetUsedPercent >= milestone) {
        // Encontrar el gasto que hizo que se alcanzara este hito
        let runningTotal = 0;
        let milestoneDate = project.createdAt;

        for (const expense of [...expenses].sort(
          (a, b) =>
            new Date(a.expenseDate).getTime() -
            new Date(b.expenseDate).getTime()
        )) {
          runningTotal += expense.amount;
          const percentAtExpense = (runningTotal / project.initialBudget) * 100;

          if (percentAtExpense >= milestone) {
            milestoneDate = expense.registerDate;
            break;
          }
        }

        events.push({
          id: `budget-milestone-${milestone}`,
          type: "budget_milestone",
          title: `${milestone}% del Presupuesto Utilizado`,
          description: `Se ha utilizado el ${milestone}% del presupuesto inicial ($${(
            project.initialBudget *
            (milestone / 100)
          ).toLocaleString("es-MX", { minimumFractionDigits: 2 })})`,
          date: milestoneDate,
          amount: project.initialBudget * (milestone / 100),
          icon: milestone >= 90 ? ExclamationTriangleIcon : BanknotesIcon,
          color: milestone >= 90 ? "red" : milestone >= 75 ? "yellow" : "green",
          importance: milestone >= 75 ? "high" : "medium",
        });
      }
    });

    // 6. Evento de finalización/cancelación del proyecto
    if (project.status === "completed" && project.completedAt) {
      events.push({
        id: `project-completed-${project.id}`,
        type: "project_completed",
        title: "Proyecto Finalizado",
        description: `Proyecto completado exitosamente. Presupuesto final utilizado: $${totalSpent.toLocaleString(
          "es-MX",
          { minimumFractionDigits: 2 }
        )}`,
        date: project.completedAt,
        amount: totalSpent,
        icon: TrophyIcon,
        color: "green",
        importance: "high",
      });
    } else if (project.status === "cancelled" && project.completedAt) {
      events.push({
        id: `project-cancelled-${project.id}`,
        type: "status_change",
        title: "Proyecto Cancelado",
        description: `Proyecto cancelado. Total gastado: $${totalSpent.toLocaleString(
          "es-MX",
          { minimumFractionDigits: 2 }
        )}`,
        date: project.completedAt,
        amount: totalSpent,
        icon: StopIcon,
        color: "red",
        importance: "high",
      });
    }

    // Ordenar eventos por fecha (más recientes primero)
    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [project, expenses, quotes]);

  const getColorClasses = (color: string, importance: string) => {
    const baseClasses = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      red: "bg-red-100 text-red-800 border-red-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const darkClasses = {
      blue: "dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800",
      green: "dark:bg-green-900 dark:text-green-100 dark:border-green-800",
      yellow: "dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800",
      red: "dark:bg-red-900 dark:text-red-100 dark:border-red-800",
      indigo: "dark:bg-indigo-900 dark:text-indigo-100 dark:border-indigo-800",
      purple: "dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800",
      gray: "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800",
    };

    return `${baseClasses[color as keyof typeof baseClasses]} ${
      darkClasses[color as keyof typeof darkClasses]
    } ${importance === "high" ? "ring-2 ring-opacity-50" : ""}`;
  };

  const getIconBgClasses = (color: string) => {
    const classes = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
      indigo: "bg-indigo-500",
      purple: "bg-purple-500",
      gray: "bg-gray-500",
    };
    return classes[color as keyof typeof classes];
  };

  return (
    <div className="flow-root">
      {/* Barra de progreso general del proyecto */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso General del Proyecto
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {timelineEvents.filter((e) => e.importance === "high").length} hitos
            importantes
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              project.status === "completed"
                ? "bg-green-500"
                : project.status === "cancelled"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  5,
                  project.status === "completed"
                    ? 100
                    : project.status === "cancelled"
                    ? (expenses.reduce(
                        (sum, expense) => sum + expense.amount,
                        0
                      ) /
                        project.initialBudget) *
                      100
                    : (expenses.reduce(
                        (sum, expense) => sum + expense.amount,
                        0
                      ) /
                        project.initialBudget) *
                      100
                )
              )}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Inicio</span>
          <span>
            {project.status === "completed"
              ? "Finalizado"
              : project.status === "cancelled"
              ? "Cancelado"
              : `${(
                  (expenses.reduce((sum, expense) => sum + expense.amount, 0) /
                    project.initialBudget) *
                  100
                ).toFixed(1)}% completado`}
          </span>
        </div>
      </div>

      {(() => {
        // Determinar qué eventos mostrar
        const eventsToShow = showAllEvents
          ? timelineEvents
          : timelineEvents.slice(0, INITIAL_EVENTS_LIMIT);
        const hasMoreEvents = timelineEvents.length > INITIAL_EVENTS_LIMIT;

        return (
          <>
            <ul role="list" className="-mb-8">
              {eventsToShow.map((event, eventIdx) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {eventIdx !== eventsToShow.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`${getIconBgClasses(
                            event.color
                          )} h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                            event.importance === "high"
                              ? "ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-800"
                              : ""
                          }`}
                        >
                          <event.icon
                            className="h-4 w-4 text-white"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div className="flex-1">
                          <div
                            className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${getColorClasses(
                              event.color,
                              event.importance
                            )}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium">
                                  {event.title}
                                </h4>
                                {event.type === "budget_milestone" && (
                                  <div className="flex items-center">
                                    <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          event.color === "red"
                                            ? "bg-red-500"
                                            : event.color === "yellow"
                                            ? "bg-yellow-500"
                                            : "bg-green-500"
                                        }`}
                                        style={{
                                          width: `${
                                            event.title.split("%")[0]
                                          }%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              {event.importance === "high" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75">
                                  ⭐ Importante
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm opacity-90">
                              {event.description}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {event.amount && (
                                  <div className="flex items-center text-sm font-medium">
                                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                    $
                                    {event.amount.toLocaleString("es-MX", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </div>
                                )}
                                {event.category && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-50">
                                    {event.category}
                                  </span>
                                )}
                              </div>
                              {event.type === "expense_added" && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Gasto #
                                  {expenses.findIndex(
                                    (e) => `expense-${e.id}` === event.id
                                  ) + 1}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={event.date}>
                            {moment(event.date).format("DD MMM YYYY")}
                          </time>
                          <div className="text-xs mt-1">
                            {moment(event.date).format("HH:mm")}
                          </div>
                          <div className="text-xs mt-1 font-medium">
                            {moment(event.date).locale("es").fromNow()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Botón Mostrar más/menos */}
            {hasMoreEvents && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  {showAllEvents ? (
                    <>
                      <ChevronUpIcon className="h-4 w-4 mr-2" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="h-4 w-4 mr-2" />
                      Mostrar más (
                      {timelineEvents.length - INITIAL_EVENTS_LIMIT} eventos
                      adicionales)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        );
      })()}

      {timelineEvents.length === 0 && (
        <div className="text-center py-8">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Sin actividad registrada
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            El timeline se poblará automáticamente conforme avance el proyecto.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectTimelineProgress;
