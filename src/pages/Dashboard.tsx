import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GeneralTab from "@/components/dashboard/GeneralTab";
import DayByDayTab from "@/components/dashboard/DayByDayTab";
import AnalysisTab from "@/components/dashboard/AnalysisTab";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    // Check authentication with Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Cobranza POINT Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Sistema de Gestión de Cobranzas</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="day-by-day">Día a Día</TabsTrigger>
            <TabsTrigger value="analysis">Conversaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <GeneralTab />
          </TabsContent>

          <TabsContent value="day-by-day" className="space-y-6">
            <DayByDayTab />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <AnalysisTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
