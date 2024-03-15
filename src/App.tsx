import { AppRouterPage } from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <AppRouterPage />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
