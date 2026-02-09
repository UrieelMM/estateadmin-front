import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import {
  AcademicCapIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import { useTutorials, TutorialType } from "../../../../hooks/useTutorials";

interface TutorialOption {
  name: string;
  description: string;
  type: TutorialType;
  icon: typeof AcademicCapIcon;
  color: string;
  bgColor: string;
}

const tutorialOptions: TutorialOption[] = [
  {
    name: "Bienvenida",
    description: "Recorrido inicial",
    type: "welcome",
    icon: SparklesIcon,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    name: "Finanzas",
    description: "Cuotas y gastos",
    type: "finance",
    icon: CurrencyDollarIcon,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    name: "Comunidad",
    description: "Áreas y eventos",
    type: "community",
    icon: UserGroupIcon,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    name: "Operaciones",
    description: "Mtto. e inventario",
    type: "operations",
    icon: WrenchScrewdriverIcon,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
];

interface Props {
  collapsed?: boolean;
}

export default function TutorialsMenu( { collapsed = false }: Props ) {
  const { startTutorial } = useTutorials();

  return (
    <Popover className="relative">
      { ( { open, close } ) => (
        <>
          <Popover.Button
            className={ `
              group relative flex w-full items-center justify-center rounded-lg py-2 text-xs font-medium transition-all duration-300
              focus:outline-none outline-none ring-0
              ${ open
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/40 scale-[1.02]'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
              }
            `}
            title={ collapsed ? "Tutoriales" : undefined }
          >
            {/* Gradient border overlay for hover state - subtle effect */ }
            <div className={ `absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 transition-opacity duration-300 ${ !open && 'group-hover:opacity-5' }` } />

            <QuestionMarkCircleIcon
              className={ `relative h-5 w-5 transition-transform duration-500 ease-spring ${ open ? 'rotate-180 scale-110' : 'text-indigo-500 dark:text-indigo-400 group-hover:scale-110' }` }
              aria-hidden="true"
            />
          </Popover.Button>

          <Transition
            as={ Fragment }
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-x-2 scale-95"
            enterTo="opacity-100 translate-x-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-x-0 scale-100"
            leaveTo="opacity-0 translate-x-2 scale-95"
          >
            {/* 
              Posicionamiento: 
              - left-full: Empieza a la derecha del botón
              - bottom-0: Alineado con la parte inferior (o ajustado con mb)
              - ml-4: Separación del sidebar
            */}
            <Popover.Panel className="absolute left-full bottom-0 ml-4 z-[100] w-72 origin-bottom-left">
              <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-800 backdrop-blur-xl">

                {/* Header Gradient */ }
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AcademicCapIcon className="h-5 w-5 text-indigo-100" />
                    Centro de Aprendizaje
                  </h3>
                  <p className="text-xs text-indigo-100 mt-1 opacity-90">
                    Domina la plataforma paso a paso
                  </p>
                </div>

                <div className="p-2 grid gap-1 relative">
                  {/* Decorative background element */ }
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

                  { tutorialOptions.map( ( item ) => (
                    <button
                      key={ item.name }
                      onClick={ () => {
                        startTutorial( item.type );
                        close();
                      } }
                      className="group flex items-center rounded-xl p-2 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left relative overflow-hidden"
                    >
                      <div className={ `flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ item.bgColor } transition-colors group-hover:scale-110 duration-200` }>
                        <item.icon className={ `h-5 w-5 ${ item.color }` } aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          { item.name }
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          { item.description }
                        </p>
                      </div>
                      {/* Hover Arrow */ }
                      <div className="absolute right-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ) ) }
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-t border-gray-100 dark:border-gray-700/50">
                  <a
                    href="mailto:soporte@estateadmin.com"
                    className="flex w-full items-center justify-center rounded-lg border border-transparent bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                  >
                    ¿Necesitas soporte técnico?
                  </a>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      ) }
    </Popover>
  );
}
