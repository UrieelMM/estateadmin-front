import UsersScreen from "../presentation/screens/dashboard/UsersScreen";

export const routesApp = [
    {
        to: "/dashboard/users",
        icon: "fa-solid fa-spell-check",
        title: "Usuarios",
        description: "Gestión de usuarios",
        component: <UsersScreen />,
      },
];
