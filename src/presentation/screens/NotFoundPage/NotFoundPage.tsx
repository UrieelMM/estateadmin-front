
const NotFoundPage = () => {
  return (
    <div className="lg:px-24 lg:py-24 md:py-20 md:px-44 px-4 py-24 items-center h-screen flex justify-center flex-col-reverse lg:flex-row md:gap-28 gap-16">
            <div className="xl:pt-24 w-full xl:w-1/2 relative pb-12 lg:pb-0">
                <div className="relative">
                    <div className="absolute">
                        <div className="">
                            <h1 className="my-2 text-gray-800 font-bold text-2xl">
                              ¡Oops! 404: Este contenido debe haberse perdido en una línea temporal diferente.
                            </h1>
                            <p className="my-2 text-gray-800">Lo sentimos, no hemos encontrado lo que buscabas</p>
                            <button className="sm:w-full lg:w-auto my-2 border rounded md py-4 px-8 text-center bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none">
                              <a href="/dashboard/home">Ir a casa</a>
                            </button>
                        </div>
                    </div>
                    <div>
                        <img src="https://i.ibb.co/G9DC8S0/404-2.png" />
                    </div>
                </div>
            </div>
            <div>
                <img src="https://i.ibb.co/ck1SGFJ/Group.png" />
            </div>
        </div>
  )
}

export default NotFoundPage