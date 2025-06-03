import ConfigForm from "./ConfigForm/ConfigForm";

const ClientConfig = () => {
  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-2">
        <div className="-mx-4 mt-8 sm:-mx-0 py-4">
          <ConfigForm />
          <div className="w-full flex just-start mt-8"></div>
        </div>
      </div>
    </>
  );
};

export default ClientConfig;
