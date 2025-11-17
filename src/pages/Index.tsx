import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="text-center space-y-8 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">
          Cobranza POINT
        </h1>
        <p className="text-xl text-muted-foreground">
          Sistema de gestión de cobranza y análisis de datos
        </p>
        <Button 
          size="lg" 
          onClick={() => navigate("/login")}
          className="text-lg px-8 py-6"
        >
          Iniciar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Index;
