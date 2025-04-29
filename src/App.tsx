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
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              maxWidth: '500px',
            },
            success: {
              style: {
                background: '#4caf50',
                color: '#fff',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#4caf50',
              },
            },
            error: {
              style: {
                background: '#d32f2f',
                color: '#fff',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#d32f2f',
              },
            },
          }}
        />
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
