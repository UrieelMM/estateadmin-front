import UsersRegistrationForm from "../../../components/shared/forms/UsersRegistrationForm"

const UsersRegistration = () => {
  return (
    <>
      <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
        <p className="tex-md font-medium ">Registro de condominos</p>
      </header>
      <UsersRegistrationForm />
    </>
  )
}

export default UsersRegistration