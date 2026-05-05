import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SlideConfigDraft } from "../../../interfaces/assembly";
import { useProjectStore, ProjectStatus } from "../../../store/projectStore";

interface Props {
  draft: SlideConfigDraft;
  onChange: (patch: Partial<SlideConfigDraft>) => void;
}

/**
 * Editor inline de un slide del builder. Muestra UI específica según el tipo
 * (custom_text, projects, agenda, agreements, collections_top, comparison).
 */
export const AssemblySlideEditor = ({ draft, onChange }: Props) => {
  switch (draft.type) {
    case "custom_text":
      return <CustomTextEditor draft={draft} onChange={onChange} />;
    case "projects":
      return <ProjectsEditor draft={draft} onChange={onChange} />;
    case "agenda":
      return <AgendaEditor draft={draft} onChange={onChange} />;
    case "agreements":
      return <AgreementsEditor draft={draft} onChange={onChange} />;
    case "collections_top":
      return <CollectionsTopEditor draft={draft} onChange={onChange} />;
    case "comparison":
      return <ComparisonEditor draft={draft} onChange={onChange} />;
    case "cover":
      return <CoverEditor draft={draft} onChange={onChange} />;
    default:
      return null;
  }
};

// ── Editores ───────────────────────────────────────────────────────────────

function CoverEditor({ draft, onChange }: Props) {
  return (
    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200 dark:border-white/[0.06]">
      <input
        value={draft.customTitle ?? ""}
        onChange={(e) => onChange({ customTitle: e.target.value })}
        placeholder='Título de la portada (ej. "Asamblea Ordinaria")'
        className="w-full bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
      />
      <input
        value={draft.customBody ?? ""}
        onChange={(e) => onChange({ customBody: e.target.value })}
        placeholder="Subtítulo (ej. nombre del condominio)"
        className="w-full bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
      />
    </div>
  );
}

function CustomTextEditor({ draft, onChange }: Props) {
  return (
    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200 dark:border-white/[0.06]">
      <input
        value={draft.customTitle ?? ""}
        onChange={(e) => onChange({ customTitle: e.target.value })}
        placeholder="Título del comunicado"
        className="w-full bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
      />
      <input
        value={draft.customTag ?? ""}
        onChange={(e) => onChange({ customTag: e.target.value })}
        placeholder="Etiqueta (ej: Acuerdo, Aviso)"
        className="w-full bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
      />
      <textarea
        value={draft.customBody ?? ""}
        onChange={(e) => onChange({ customBody: e.target.value })}
        placeholder="Contenido del comunicado…"
        rows={4}
        className="w-full bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none"
      />
    </div>
  );
}

function ProjectsEditor({ draft, onChange }: Props) {
  const { projects, fetchProjects, loading } = useProjectStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const condominiumId = localStorage.getItem("condominiumId");
    if (condominiumId && !loaded) {
      fetchProjects(condominiumId).finally(() => setLoaded(true));
    }
  }, [fetchProjects, loaded]);

  const visible = (projects ?? []).filter((p) => p.status !== ProjectStatus.CANCELLED);
  const selected = new Set(draft.selectedProjectIds ?? []);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ selectedProjectIds: Array.from(next) });
  };

  return (
    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200 dark:border-white/[0.06]">
      <p className="text-[10px] text-gray-500 dark:text-slate-500">
        Si no seleccionas ninguno, se mostrarán todos los proyectos activos.
      </p>
      {loading && !loaded ? (
        <p className="text-[10px] text-gray-400">Cargando proyectos…</p>
      ) : visible.length === 0 ? (
        <p className="text-[10px] text-gray-400 italic">No hay proyectos activos.</p>
      ) : (
        <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
          {visible.map((p) => {
            const checked = selected.has(p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                  checked
                    ? "border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-white/[0.06] text-gray-700 dark:text-slate-400 hover:border-gray-300 dark:hover:border-white/[0.1]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p.id)}
                  className="w-3 h-3 accent-indigo-600"
                />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-[10px] opacity-60 capitalize">{p.status.replace("_", " ")}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AgendaEditor({ draft, onChange }: Props) {
  const items = draft.agendaItems ?? [];

  const updateItem = (i: number, value: string) => {
    const next = items.slice();
    next[i] = { ...next[i], text: value };
    onChange({ agendaItems: next });
  };
  const addItem = () => {
    onChange({ agendaItems: [...items, { text: "" }] });
  };
  const removeItem = (i: number) => {
    onChange({ agendaItems: items.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200 dark:border-white/[0.06]">
      <input
        value={draft.agendaTitle ?? ""}
        onChange={(e) => onChange({ agendaTitle: e.target.value })}
        placeholder="Título (ej. Orden del Día)"
        className="w-full bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
      />
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 text-center text-[10px] text-gray-400 font-mono shrink-0">{i + 1}.</span>
            <input
              value={it.text}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder="Punto a tratar…"
              className="flex-1 bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 transition-colors"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 dark:border-white/[0.1] text-gray-500 dark:text-slate-400 text-[11px] hover:border-indigo-400 hover:text-indigo-500 transition-colors"
      >
        <PlusIcon className="w-3 h-3" />
        Agregar punto
      </button>
    </div>
  );
}

function AgreementsEditor({ draft, onChange }: Props) {
  const items = draft.previousAgreements ?? [];

  const update = (i: number, patch: Partial<typeof items[number]>) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    onChange({ previousAgreements: next });
  };
  const add = () => onChange({ previousAgreements: [...items, { text: "", status: "pendiente" }] });
  const remove = (i: number) => onChange({ previousAgreements: items.filter((_, idx) => idx !== i) });

  return (
    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200 dark:border-white/[0.06]">
      <input
        value={draft.agreementsTitle ?? ""}
        onChange={(e) => onChange({ agreementsTitle: e.target.value })}
        placeholder="Título (ej. Acuerdos de la Asamblea Anterior)"
        className="w-full bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
      />
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-white/[0.06] p-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={it.date ?? ""}
                onChange={(e) => update(i, { date: e.target.value })}
                className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-gray-900 dark:text-white"
              />
              <select
                value={it.status ?? "pendiente"}
                onChange={(e) => update(i, { status: e.target.value as any })}
                className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-gray-900 dark:text-white"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
                <option value="cumplido">Cumplido</option>
              </select>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-auto p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 transition-colors"
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </div>
            <textarea
              value={it.text}
              onChange={(e) => update(i, { text: e.target.value })}
              placeholder="Descripción del acuerdo…"
              rows={2}
              className="w-full bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 dark:border-white/[0.1] text-gray-500 dark:text-slate-400 text-[11px] hover:border-indigo-400 hover:text-indigo-500 transition-colors"
      >
        <PlusIcon className="w-3 h-3" />
        Agregar acuerdo
      </button>
    </div>
  );
}

function CollectionsTopEditor({ draft, onChange }: Props) {
  return (
    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200 dark:border-white/[0.06]">
      <label className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.anonymized ?? true}
          onChange={(e) => onChange({ anonymized: e.target.checked })}
          className="w-3 h-3 accent-indigo-600"
        />
        Anonimizar lista (no mostrar números reales de unidad)
      </label>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500 dark:text-slate-400">Mostrar top:</span>
        <input
          type="number"
          min={1}
          max={50}
          value={draft.topDebtorsLimit ?? 10}
          onChange={(e) => onChange({ topDebtorsLimit: Math.max(1, parseInt(e.target.value, 10) || 10) })}
          className="w-20 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}

function ComparisonEditor({ draft, onChange }: Props) {
  return (
    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200 dark:border-white/[0.06]">
      <p className="text-[10px] text-gray-500 dark:text-slate-500">
        Compara automáticamente el periodo seleccionado contra el periodo anterior equivalente
        (ej. enero 2026 vs enero 2025, o 3 meses vs 3 meses anteriores).
      </p>
      <select
        value={draft.comparisonType ?? "monthly"}
        onChange={(e) => onChange({ comparisonType: e.target.value as any })}
        className="w-full bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
      >
        <option value="monthly">Comparativa mensual (vs mismo mes año anterior)</option>
        <option value="period">Comparativa de periodo (vs periodo anterior equivalente)</option>
      </select>
    </div>
  );
}

// Helper para crear nuevo draft
export function createSlideDraft(type: SlideConfigDraft["type"]): SlideConfigDraft {
  return { localId: uuidv4(), type };
}
