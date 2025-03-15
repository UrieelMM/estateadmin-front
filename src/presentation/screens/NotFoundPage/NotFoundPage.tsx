
const NotFoundPage = () => {
  return (
    <div className="lg:px-24 lg:py-24 md:py-20 md:px-44 px-4 py-24 items-center h-screen flex justify-center flex-col-reverse lg:flex-row md:gap-28 gap-16 bg-indigo-100 dark:bg-gray-900">
            <div className="xl:pt-24 w-full xl:w-1/2 relative pb-12 lg:pb-0">
                <div >
                    <div>
                        <div className="">
                            <h1 className="my-2 text-gray-800 font-bold text-2xl dark:text-gray-100">
                              ¡Oops! 404: Este contenido debe haberse perdido en una línea temporal diferente.
                            </h1>
                            <p className="text-md my-4 text-gray-600 dark:text-gray-100">Lo sentimos, no hemos encontrado lo que buscabas.</p>
                            <button className="sm:w-[160px] lg:w-auto md:text-md my-2 rounded md py-4 px-8 text-center bg-indigo-700 text-white hover:bg-indigo-800 focus:outline-none shadow-[0_0_15px_rgba(79,70,229,0.3),0_0_250px_#8093e87b,0_0_100px_#c2abe6c5] dark:shadow-[0_0_50px_rgba(79,70,229,0.3),0_0_100px_#8093e8d1,0_0_300px_#c2abe6d3] cursor-pointer ">
                              <a href="/dashboard/home">Ir a casa</a>
                            </button>
                        </div>
                    </div>
                    <div className="w-auto h-96">
                        <img className="w-full h-full bg-contain" src="https://firebasestorage.googleapis.com/v0/b/administracioncondominio-93419.appspot.com/o/estateAdminUploads%2Fassets%2F404ErrorPageEstateAdmin.svg?alt=media&token=b9a82a09-f184-46c3-9bff-e8265c8f575e" alt="Error page 404"/>
                    </div>
                </div>
            </div>
        </div>
  )
}

export default NotFoundPage