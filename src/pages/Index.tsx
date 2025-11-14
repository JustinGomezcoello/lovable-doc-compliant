import { Navigate } from "react-router-dom";

const Index = () => {
  // Check authentication status and redirect accordingly
  const authenticated = sessionStorage.getItem("authenticated");
  
  return <Navigate to={authenticated ? "/dashboard" : "/login"} replace />;
};

export default Index;
