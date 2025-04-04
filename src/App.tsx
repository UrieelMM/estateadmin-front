// App.tsx
import { ThemeProvider } from "./context/Theme/ThemeContext";
import Notifications from "./presentation/components/shared/notifications/Notifications";
import { AppRouterPage } from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <HelmetProvider>
      <UserProvider>
        <ThemeProvider>
          <AppRouterPage />
          <Notifications />
          <Toaster position="top-right" />
        </ThemeProvider>
      </UserProvider>
    </HelmetProvider>
  );
}

export default App;
