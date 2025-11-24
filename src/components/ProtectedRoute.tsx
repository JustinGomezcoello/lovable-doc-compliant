import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Verificar autenticación ANTES de renderizar cualquier cosa
  const isAuthenticated = sessionStorage.getItem("authenticated") === "true";

  if (!isAuthenticated) {
    console.log("🚫 Ruta protegida - No autenticado - Redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ Ruta protegida - Autenticado - Permitiendo acceso");
  return <>{children}</>;
};

export default ProtectedRoute;
