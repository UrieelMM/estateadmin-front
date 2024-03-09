import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
    Outlet,
  } from "react-router-dom";
  import LayoutDashboard from "../presentation/screens/layout/LayoutDashboard";
import LoginScreen from "../presentation/screens/login/LoginScreen";
  import { routesApp } from "./routes";

  
  export const AppRouterPage = () => {
  
    return (
      <Router>
      <Routes>
        {/* Página de inicio de sesión */}
        <Route path="/login" element={<LoginScreen />} />
    
        {/* Rutas dentro del Layout */}
        <Route
          path="/"
          element={
            <LayoutDashboard>
              <Outlet />
            </LayoutDashboard>
          }
        >
          {routesApp.map((route) => (
            <Route
              key={route.to}
              path={route.to}
              element={route.component}
            />
          ))}
          <Route index element={<Navigate to={routesApp[0].to} />} />
        </Route>
      </Routes>
    </Router>
    );
  };
  