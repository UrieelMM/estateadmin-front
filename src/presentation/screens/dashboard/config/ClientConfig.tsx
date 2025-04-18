import ConfigForm from "./ConfigForm/ConfigForm"

const ClientConfig = () => {
  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50  font-medium shadow-md flex w-full h-16 justify-between px-2 rounded-md items-center mb-2 dark:bg-gray-800">
          <p className="tex-md dark:text-gray-100">Configuración</p>
        </header>
        <div className="-mx-4 mt-8 sm:-mx-0 py-4">
        <h2 className="text-2xl font-bold text-indigo-600 mb-4 dark:text-gray-100">Configuración de la cuenta</h2>
            <ConfigForm />
          <div className="w-full flex just-start mt-8">
          </div>
        </div>
      </div>
    </>
  )
}

export default ClientConfig