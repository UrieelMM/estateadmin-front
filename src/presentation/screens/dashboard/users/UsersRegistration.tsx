import UsersRegistrationForm from "../../../components/shared/forms/UsersRegistrationForm";
import { DocumentArrowUpIcon } from "@heroicons/react/24/solid";

const UsersRegistration = () => {
  return (
    <>
      <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-4 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
        <div className="flex items-center">
          <DocumentArrowUpIcon className="w-5 h-5 text-indigo-500 mr-2" />
          <h1 className="text-lg font-medium">Registro de Condóminos</h1>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Importación masiva de usuarios
        </div>
      </header>
      <UsersRegistrationForm />
    </>
  );
};

export default UsersRegistration;
