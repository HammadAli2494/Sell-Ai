import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <AppRoutes />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
