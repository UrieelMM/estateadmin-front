import React, { useEffect, useState } from "react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Combobox } from "@headlessui/react";
import useSuperAdminStore from "../../../../../store/superAdmin/SuperAdminStore";



interface RecipientSelectorProps {
  selectedRecipients: string[];
  onChange: (recipients: string[]) => void;
  recipientType: "all" | "single" | "multiple";
  onTypeChange: (type: "all" | "single" | "multiple") => void;
}

const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  selectedRecipients,
  onChange,
  recipientType,
  onTypeChange,
}) => {
  const { clients, fetchClients } = useSuperAdminStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (clients.length === 0) {
      fetchClients();
    }
  }, [clients, fetchClients]);

  const filteredClients =
    query === ""
      ? clients
      : clients.filter((client) =>
          client.companyName.toLowerCase().includes(query.toLowerCase())
        );

  const handleToggleRecipient = (clientId: string) => {
    if (recipientType === "single") {
      onChange([clientId]);
    } else {
      if (selectedRecipients.includes(clientId)) {
        onChange(selectedRecipients.filter((id) => id !== clientId));
      } else {
        onChange([...selectedRecipients, clientId]);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Destinatarios
        </label>
        <div className="mt-2 flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-indigo-600"
              name="recipientType"
              value="all"
              checked={recipientType === "all"}
              onChange={() => onTypeChange("all")}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">Todos los Clientes</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-indigo-600"
              name="recipientType"
              value="single"
              checked={recipientType === "single"}
              onChange={() => onTypeChange("single")}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">Un Cliente</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-indigo-600"
              name="recipientType"
              value="multiple"
              checked={recipientType === "multiple"}
              onChange={() => onTypeChange("multiple")}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">Varios Clientes</span>
          </label>
        </div>
      </div>

      {recipientType !== "all" && (
        <div className="relative mt-1">
          <Combobox
            value={selectedRecipients}
            onChange={() => {}} // Controlled manually via onClick in Option
            multiple
          >
            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
              <Combobox.Input
                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 bg-transparent focus:ring-0"
                displayValue={(recipients: string[]) =>
                  recipients
                    .map((id) => clients.find((c) => c.id === id)?.companyName)
                    .join(", ")
                }
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar clientes..."
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </Combobox.Button>
            </div>
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
              {filteredClients.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                  No se encontraron clientes.
                </div>
              ) : (
                filteredClients.map((client) => (
                  <Combobox.Option
                    key={client.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-indigo-600 text-white" : "text-gray-900 dark:text-gray-100"
                      }`
                    }
                    value={client.id}
                    onClick={() => handleToggleRecipient(client.id)}
                  >
                    {({ active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selectedRecipients.includes(client.id) ? "font-medium" : "font-normal"
                          }`}
                        >
                          {client.companyName} ({client.email})
                        </span>
                        {selectedRecipients.includes(client.id) ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-indigo-600"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Combobox>
        </div>
      )}
    </div>
  );
};

export default RecipientSelector;
