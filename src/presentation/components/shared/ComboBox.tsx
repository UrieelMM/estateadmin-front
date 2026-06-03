import { Fragment, useEffect, useMemo, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  ChevronUpDownIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useCondominiumStore } from "../../../store/useCondominiumStore";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Paleta de colores para los avatares ─────────────────────────────────────
// Cada condominio recibe un color estable derivado de su ID. Hace que el
// admin reconozca visualmente el condominio activo de un vistazo.
const COLOR_PALETTE = [
  {
    gradient: "from-indigo-500 to-violet-600",
    ring: "ring-indigo-200/60",
    chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  },
  {
    gradient: "from-sky-500 to-blue-600",
    ring: "ring-sky-200/60",
    chip: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
  {
    gradient: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-200/60",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  {
    gradient: "from-amber-500 to-orange-500",
    ring: "ring-amber-200/60",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  {
    gradient: "from-rose-500 to-pink-600",
    ring: "ring-rose-200/60",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  {
    gradient: "from-fuchsia-500 to-purple-600",
    ring: "ring-fuchsia-200/60",
    chip: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
  },
];

const colorForId = (id: string) => {
  if (!id) return COLOR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
};

const initialsFromName = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const CondominiumAvatar = ({
  id,
  name,
  size = "md",
}: {
  id: string;
  name?: string;
  size?: "sm" | "md";
}) => {
  const color = colorForId(id);
  const dims = size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]";
  return (
    <span
      className={classNames(
        "relative inline-flex shrink-0 items-center justify-center rounded-md font-bold text-white shadow-sm ring-1",
        "bg-gradient-to-br",
        color.gradient,
        color.ring,
        dims,
      )}
    >
      {initialsFromName(name)}
    </span>
  );
};

// ─── Estados de bandeja vacía ────────────────────────────────────────────────
const PillBase = ({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "error";
}) => (
  <div
    className={classNames(
      "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
      tone === "error"
        ? "border-red-300/60 bg-red-50/90 text-red-700 dark:border-red-700/40 dark:bg-red-900/30 dark:text-red-200"
        : "border-white/20 bg-white/15 text-white/90 backdrop-blur dark:border-white/10 dark:bg-white/[0.07] dark:text-gray-200",
    )}
  >
    {children}
  </div>
);

const ComboBox = () => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const {
    condominiums,
    selectedCondominium,
    isLoading,
    error,
    fetchCondominiums,
    setSelectedCondominium,
  } = useCondominiumStore();

  useEffect(() => {
    if (!mounted) {
      fetchCondominiums().then(() => setMounted(true));
    }
  }, [mounted, fetchCondominiums]);

  const filteredCondominiums = useMemo(() => {
    if (!search.trim()) return condominiums;
    const q = search.trim().toLowerCase();
    return condominiums.filter((c) =>
      String(c.name || "")
        .toLowerCase()
        .includes(q),
    );
  }, [condominiums, search]);

  const triggerSize =
    "h-10 min-w-[180px] max-w-[230px] sm:min-w-[200px] sm:max-w-[260px]";

  if (isLoading || !mounted) {
    return (
      <PillBase>
        <span className="h-7 w-7 animate-pulse rounded-lg bg-white/30" />
        <div className="flex flex-col gap-1">
          <span className="h-2 w-20 animate-pulse rounded bg-white/30" />
          <span className="h-3 w-32 animate-pulse rounded bg-white/40" />
        </div>
      </PillBase>
    );
  }

  if (error) {
    return (
      <PillBase tone="error">
        <BuildingOffice2Icon className="h-4 w-4" />
        Error al cargar condominios
      </PillBase>
    );
  }

  if (condominiums.length === 0) {
    return (
      <PillBase>
        <BuildingOffice2Icon className="h-4 w-4" />
        Sin condominios asignados
      </PillBase>
    );
  }

  const activeId = selectedCondominium?.id || "";
  const activeName = selectedCondominium?.name || "Selecciona un condominio";
  const onlyOne = condominiums.length === 1;

  // Caso especial: un solo condominio → no abre dropdown, solo muestra la tarjeta.
  if (onlyOne) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={classNames(
          "inline-flex items-center gap-2.5 rounded-lg border border-white/25 bg-white/15 px-2.5 py-1 backdrop-blur-md",
          "dark:border-white/[0.08] dark:bg-white/[0.06]",
          triggerSize,
        )}
      >
        <CondominiumAvatar id={activeId} name={activeName} />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70 dark:text-gray-400">
            Condominio
          </span>
          <span className="truncate text-[13px] font-semibold text-white dark:text-gray-100">
            {activeName}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <Menu.Button
            className={classNames(
              "group inline-flex items-center gap-2.5 rounded-lg border px-2.5 py-1 transition-all duration-150",
              "border-white/25 bg-white/15 hover:bg-white/25 backdrop-blur-md",
              "dark:border-white/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.12]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 dark:focus-visible:ring-indigo-500/60",
              triggerSize,
              open && "ring-2 ring-white/40 dark:ring-indigo-500/60",
            )}
          >
            <CondominiumAvatar id={activeId} name={activeName} />
            <div className="flex min-w-0 flex-1 flex-col leading-tight text-left">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70 dark:text-gray-400">
                Condominio
              </span>
              <span className="truncate text-[13px] font-semibold text-white dark:text-gray-100">
                {activeName}
              </span>
            </div>
            <ChevronUpDownIcon
              className={classNames(
                "h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 dark:text-gray-400",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="transform opacity-0 scale-95 -translate-y-1"
            enterTo="transform opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="transform opacity-100 scale-100 translate-y-0"
            leaveTo="transform opacity-0 scale-95 -translate-y-1"
          >
            <Menu.Items
              className={classNames(
                "absolute left-0 z-[9999] mt-2 w-[320px] origin-top-left overflow-hidden rounded-2xl",
                "bg-white shadow-2xl ring-1 ring-black/[0.06] backdrop-blur-xl",
                "dark:bg-gray-900/95 dark:ring-white/[0.08]",
                "focus:outline-none",
              )}
            >
              {/* Header */}
              <div className="border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                  Cambiar de condominio
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Tienes {condominiums.length}{" "}
                  {condominiums.length === 1 ? "condominio" : "condominios"}{" "}
                  disponibles
                </p>
              </div>

              {/* Buscador (solo si hay 4+) */}
              {condominiums.length >= 4 && (
                <div className="border-b border-gray-100 px-3 py-2 dark:border-white/[0.06]">
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar condominio…"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>
              )}

              {/* Lista */}
              <div className="max-h-[60vh] overflow-y-auto p-1.5">
                {filteredCondominiums.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No encontramos condominios con ese nombre.
                  </div>
                ) : (
                  filteredCondominiums.map((condominium) => {
                    const isActive = condominium.id === activeId;
                    const color = colorForId(condominium.id);
                    return (
                      <Menu.Item key={condominium.id}>
                        {({ active }) => (
                          <button
                            onClick={() => {
                              if (!isActive) {
                                setSelectedCondominium(condominium);
                              }
                            }}
                            className={classNames(
                              "group/item flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-100",
                              isActive
                                ? "bg-indigo-50 dark:bg-indigo-500/10"
                                : active
                                  ? "bg-gray-50 dark:bg-white/[0.04]"
                                  : "",
                            )}
                          >
                            <CondominiumAvatar
                              id={condominium.id}
                              name={condominium.name}
                            />
                            <div className="flex min-w-0 flex-1 flex-col leading-tight">
                              <span
                                className={classNames(
                                  "truncate text-sm font-semibold",
                                  isActive
                                    ? "text-indigo-700 dark:text-indigo-300"
                                    : "text-gray-900 dark:text-gray-100",
                                )}
                              >
                                {condominium.name}
                              </span>
                              {isActive ? (
                                <span
                                  className={classNames(
                                    "mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                    color.chip,
                                  )}
                                >
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                                  </span>
                                  Activo
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                  Cambiar a este condominio
                                </span>
                              )}
                            </div>
                            {isActive && (
                              <CheckCircleIcon className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </button>
                        )}
                      </Menu.Item>
                    );
                  })
                )}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};

export default ComboBox;
