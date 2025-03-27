// App.tsx
import { ThemeProvider } from "./context/Theme/ThemeContext";
import Notifications from "./presentation/components/shared/notifications/Notifications";
import { AppRouterPage } from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AppRouterPage />
        <Notifications />
        <Toaster position="top-right" />
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
