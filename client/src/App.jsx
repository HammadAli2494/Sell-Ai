import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3200} newestOnTop closeOnClick />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
