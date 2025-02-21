import { useState } from "react";
import CalendarForm from "../../../components/shared/forms/CalendarForm"
import Events from "./Events"

const Calendar = () => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
    <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
      <header className="bg-gray-50  font-medium shadow-md flex w-full h-16 justify-between px-2 rounded-md items-center mb-2">
        <p className="tex-md">Calendario de Eventos</p>
        <button className="btn-primary  h-10 mb-3" onClick={() => setOpen(!open)}>
            Registrar Evento
        </button>
      </header>
      <div className="-mx-4 mt-8 sm:-mx-0 py-4">
      <h2 className="text-2xl font-bold text-indigo-600 mb-4">Resumen de Eventos</h2>
        <Events />
      </div>
    </div>
    <CalendarForm isOpen={open} onClose={() => setOpen(false)} />
  </>
  )
}

export default Calendar