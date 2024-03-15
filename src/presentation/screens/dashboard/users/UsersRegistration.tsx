import UsersRegistrationForm from "../../../components/shared/forms/UsersRegistrationForm"

const UsersRegistration = () => {
  return (
    <>
      <header className="bg-gray-50 shadow-md flex w-full h-16 justify-between px-2 rounded-md items-center mb-2">
        <p className="tex-md font-medium ">Registro de condominos</p>
      </header>
      <UsersRegistrationForm />
    </>
  )
}

export default UsersRegistration