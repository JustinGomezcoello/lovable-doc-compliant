import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GeneralTab from "@/components/dashboard/GeneralTab";
import DayByDayTab from "@/components/dashboard/DayByDayTab";
import ConversationHistoryTab from "@/components/dashboard/ConversationHistoryTab";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general"); const handleLogout = () => {
    console.log("🚪 Cerrando sesión...");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleGoHome = () => {
    window.location.href = "https://id-preview--d33e7a35-34ae-4569-9721-254e26aa777d.lovable.app/simpliacollect";
  };

  return (
    <div className="min-h-screen bg-blue-50">      <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">
            Cobranza POINT Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Sistema de Gestión de Cobranzas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" onClick={handleGoHome}>
            <Home className="w-4 h-4 mr-2" />
            Volver al Inicio
          </Button>
          <Button variant="outline" onClick={handleLogout} className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header><main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 border-2 border-blue-600 bg-blue-100">
            <TabsTrigger value="general" className="text-blue-600 data-[state=active]:text-blue-800">General</TabsTrigger>
            <TabsTrigger value="day-by-day" className="text-blue-600 data-[state=active]:text-blue-800">Día a Día</TabsTrigger>
            <TabsTrigger value="conversations" className="text-blue-600 data-[state=active]:text-blue-800">Ver Conversaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <GeneralTab />
          </TabsContent>

          <TabsContent value="day-by-day" className="space-y-6">
            <DayByDayTab />
          </TabsContent>

          <TabsContent value="conversations" className="space-y-6">
            <ConversationHistoryTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
