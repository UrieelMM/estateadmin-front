import { ThemeProvider } from "./context/Theme/ThemeContext";
import { AppRouterPage } from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";


function App() {
  return (
    <ThemeProvider>
      <AppRouterPage />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
