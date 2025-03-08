// App.tsx
import { ThemeProvider } from "./context/Theme/ThemeContext";
import Notifications from "./presentation/components/shared/notifications/Notifications";
import { AppRouterPage } from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <ThemeProvider>
      <AppRouterPage />
      <Notifications />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
