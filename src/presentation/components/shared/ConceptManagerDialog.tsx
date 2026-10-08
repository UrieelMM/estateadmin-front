import { FormEvent, useState } from "react";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";
import {
  ConceptKind,
  CustomConcept,
  conceptKey,
  sanitizeConcept,
  saveCustomConcept,
} from "../../../services/customConcepts";

interface Props {
  open: boolean;
  kind: ConceptKind;
  catalog: readonly string[];
  concepts: CustomConcept[];
  onClose: () => void;
  onSaved: (name: string) => Promise<void>;
}

export const ConceptManagerDialog = ({
  open, kind, catalog, concepts, onClose, onSaved,
}: Props) => {
  const [editingId, setEditingId] = useState<string | undefined>();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setEditingId(undefined);
    setDraft("");
    onClose();
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const name = sanitizeConcept(draft);
    if (catalog.some((item) => conceptKey(item) === conceptKey(name))) {
      toast.error("Ese concepto ya está en el catálogo");
      return;
    }
    setSaving(true);
    try {
      const savedName = await saveCustomConcept(kind, name, concepts, editingId);
      await onSaved(savedName);
      setDraft("");
      setEditingId(undefined);
      toast.success("Concepto guardado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el concepto");
    } finally {
      setSaving(false);
    }
  };

  return <Dialog open={open} onClose={close} className="relative z-[100]">
    <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
      <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
        <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
          Conceptos personalizados
        </Dialog.Title>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Puedes crear o editar conceptos. Los registros anteriores conservan su concepto original.
        </p>
        <ul className="my-4 max-h-52 divide-y overflow-y-auto dark:divide-gray-700">
          {concepts.length === 0 && <li className="py-3 text-sm text-gray-500">Aún no hay conceptos personalizados.</li>}
          {concepts.map((item) => <li key={item.id}
            className="flex items-center justify-between gap-3 py-2 text-sm dark:text-white">
            <span>{item.name}</span>
            <button type="button" className="font-semibold text-indigo-600 dark:text-indigo-300"
              onClick={() => { setEditingId(item.id); setDraft(item.name); }}>
              Editar
            </button>
          </li>)}
        </ul>
        <form onSubmit={save} className="space-y-3">
          <label htmlFor={`${kind}-custom-concept`} className="block text-sm font-semibold dark:text-white">
            {editingId ? "Editar concepto" : "Nuevo concepto"}
          </label>
          <input id={`${kind}-custom-concept`} value={draft} maxLength={100} required
            onChange={(event) => setDraft(event.target.value)}
            className="block w-full rounded-lg bg-white px-3 py-2.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
            placeholder="Escribe el concepto" />
          <div className="flex justify-end gap-2">
            {editingId && <button type="button" className="rounded-lg px-3 py-2 text-sm dark:text-white"
              onClick={() => { setEditingId(undefined); setDraft(""); }}>Cancelar edición</button>}
            <button type="button" className="rounded-lg px-3 py-2 text-sm dark:text-white" onClick={close}>Cerrar</button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Guardar
            </button>
          </div>
        </form>
      </Dialog.Panel>
    </div>
  </Dialog>;
};
