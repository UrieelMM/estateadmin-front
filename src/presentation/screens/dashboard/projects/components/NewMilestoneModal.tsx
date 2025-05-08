// src/presentation/screens/dashboard/projects/components/NewMilestoneModal.tsx
import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  useProjectMilestoneStore,
  ProjectMilestoneCreateInput,
} from "../../../../../store/projectMilestoneStore";
import { toast } from "react-hot-toast";

interface NewMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const NewMilestoneModal: React.FC<NewMilestoneModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { addMilestone, loading, error } = useProjectMilestoneStore();
  const [form, setForm] = useState<
    Omit<ProjectMilestoneCreateInput, "projectId">
  >({
    title: "",
    description: "",
    date: "",
  });

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) {
      toast.error("Título y fecha son obligatorios");
      return;
    }
    try {
      await addMilestone({ projectId, ...form });
      toast.success("Hito creado");
      onClose();
      setForm({ title: "", description: "", date: "" });
    } catch {
      toast.error(error || "Error al crear hito");
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !loading && onClose()}
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="flex items-start justify-between">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Nuevo Hito
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Título *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={form.title}
                      onChange={handleChange}
                      className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={form.description}
                      onChange={handleChange}
                      className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Fecha *
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      value={form.date}
                      onChange={handleChange}
                      className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"
                    >
                      {loading ? "Guardando..." : "Crear Hito"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default NewMilestoneModal;
