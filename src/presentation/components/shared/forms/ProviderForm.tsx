

interface FormCalendarProps {
    isOpen: boolean;
    onClose: () => void;
}

const FormProvider = ({ isOpen, onClose }: FormCalendarProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-5 rounded-lg max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Registrar Proveedor</h2>
                    <button onClick={onClose} className="text-black font-bold bg-indigo-100 rounded-full py-1 px-3">
                        X
                    </button>
                </div>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="resident" className="block mb-2 text-sm font-medium text-gray-900">Nombre del Proveedor</label>
                        <input type="text" id="resident" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Nombre del residente" required />
                    </div>
                    <div>
                        <label htmlFor="eventDate" className="block mb-2 text-sm font-medium text-gray-900">Servicio</label>
                        <input type="text" id="eventDate" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                    <div>
                        <label htmlFor="eventDate" className="block mb-2 text-sm font-medium text-gray-900">Télefono</label>
                        <input type="phone" id="eventDate" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                    <div>
                        <label htmlFor="eventDate" className="block mb-2 text-sm font-medium text-gray-900">Correo</label>
                        <input type="email" id="eventDate" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="comments" className="block mb-2 text-sm font-medium text-gray-900">Comentarios</label>
                        <textarea id="comments" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Comentarios sobre el evento"></textarea>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="btn-secundary ">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormProvider;