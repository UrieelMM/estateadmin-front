import { Fragment, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { Menu, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { days, meetings } from "./data";
import CalendarForm from "../../../components/shared/forms/CalendarForm";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const CalendarEvents = () => {
    const [isOpen, setIsOpen] = useState(false);

    const onClose = () => {
        setIsOpen(!isOpen);
    }

  return (
    <>
      <header className="bg-gray-50 shadow-md flex w-full h-16 justify-between px-2 rounded-md items-center mb-4">
        <p className="tex-md font-medium ">Registro y reservaciones</p>
        <button className="btn-primary h-10 mb-3" onClick={onClose}>Agregar evento</button>
      </header>
      <div className="md:grid h-screen md:grid-cols-2 md:divide-x md:divide-gray-200">
        <div className="md:pr-14">
          <div className="flex items-center">
            <h2 className="flex-auto text-sm font-semibold text-gray-900">
              January 2022
            </h2>
            <button
              type="button"
              className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Previous month</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Next month</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-10 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
            <div>L</div>
            <div>M</div>
            <div>M</div>
            <div>J</div>
            <div>V</div>
            <div>S</div>
            <div>D</div>
          </div>
          <div className="mt-2 min-h-full grid grid-cols-7 text-sm">
            {days.map((day, dayIdx) => (
              <div
                key={day.date}
                className={classNames(
                  dayIdx > 6 ? "border-t border-gray-200" : "",
                  "py-2"
                )}
              >
                <button
                  type="button"
                  className={classNames(
                    day.isSelected ? "text-white" : "",
                    !day.isSelected && day.isToday ? "text-indigo-600" : "",
                    !day.isSelected && !day.isToday && day.isCurrentMonth
                      ? "text-gray-900"
                      : "",
                    !day.isSelected && !day.isToday && !day.isCurrentMonth
                      ? "text-gray-400"
                      : "",
                    day.isSelected && day.isToday ? "bg-indigo-600" : "",
                    day.isSelected && !day.isToday ? "bg-gray-900" : "",
                    !day.isSelected ? "hover:bg-gray-200" : "",
                    day.isSelected || day.isToday ? "font-semibold" : "",
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full"
                  )}
                >
                  <time dateTime={day.date}>
                    {day.date
                      ? day.date.split("-").pop()?.replace(/^0/, "") ??
                        "Fecha no disponible"
                      : "Fecha no disponible"}
                  </time>
                </button>
              </div>
            ))}
          </div>
        </div>
        <section className="mt-12 md:mt-0 md:pl-14">
          <h2 className="text-base font-semibold leading-6 text-gray-900">
            Reservas para <time dateTime="2022-01-21">Enero 21, 2024</time>
          </h2>
          <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
            {meetings.map((meeting) => (
              <li
                key={meeting.id}
                className="group flex items-center space-x-4 rounded-xl px-4 py-2 focus-within:bg-gray-100 hover:bg-gray-100"
              >
                <img
                  src={meeting.imageUrl}
                  alt=""
                  className="h-10 w-10 flex-none rounded-full"
                />
                <div className="flex-auto">
                  <p className="text-gray-900 font-bold">{meeting.name}</p>
                  <p className="text-gray-900">{meeting.commonArea}</p>
                  <p className="mt-0.5">
                    <time dateTime={meeting.startDatetime}>
                      {meeting.start}
                    </time>{" "}
                    - <time dateTime={meeting.endDatetime}>{meeting.end}</time>
                  </p>
                </div>
                <Menu
                  as="div"
                  className="relative opacity-0 focus-within:opacity-100 group-hover:opacity-100"
                >
                  <div>
                    <Menu.Button className="-m-2 flex items-center rounded-full p-1.5 text-gray-500 hover:text-gray-600">
                      <span className="sr-only">Open options</span>
                      <EllipsisVerticalIcon
                        className="h-6 w-6"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                  </div>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="#"
                              className={classNames(
                                active
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700",
                                "block px-4 py-2 text-sm"
                              )}
                            >
                              Edit
                            </a>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="#"
                              className={classNames(
                                active
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700",
                                "block px-4 py-2 text-sm"
                              )}
                            >
                              Cancel
                            </a>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <CalendarForm isOpen={isOpen} onClose={onClose} />
    </>
  );
}

export default CalendarEvents;