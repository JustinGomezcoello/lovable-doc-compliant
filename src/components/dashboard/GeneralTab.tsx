import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "./MetricCard";
import { 
  FileText, 
  Headphones, 
  UserCheck, 
  PackageX, 
  Wrench,
  Search,
  CheckCircle,
  CalendarIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const GeneralTab = () => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  // Fetch Chatwoot metrics via edge function
  const { data: chatwootMetrics, isLoading: loadingChatwoot } = useQuery({
    queryKey: ["chatwoot-general", dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      if (!dateFrom || !dateTo) {
        throw new Error("Fechas requeridas");
      }

      console.log("Fetching metrics for:", {
        dateFrom: format(dateFrom, "yyyy-MM-dd"),
        dateTo: format(dateTo, "yyyy-MM-dd")
      });

      const { data, error } = await supabase.functions.invoke("chatwoot-metrics", {
        body: { 
          type: "range",
          dateFrom: format(dateFrom, "yyyy-MM-dd"),
          dateTo: format(dateTo, "yyyy-MM-dd")
        }
      });
      
      if (error) {
        console.error("Error fetching metrics:", error);
        throw error;
      }
      
      console.log("Metrics received:", data);
      return data;
    },
    retry: 1,
    enabled: !!dateFrom && !!dateTo
  });

  if (loadingChatwoot) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Métricas Generales</h2>
        <p className="text-muted-foreground mb-4">Vista general de campañas y conversaciones</p>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Fecha Inicio</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal min-w-[200px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Fecha Fin</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal min-w-[200px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Comprobantes Enviados"
          value={chatwootMetrics?.comprobante_enviado || "0"}
          icon={FileText}
        />
        <MetricCard
          title="Facturas Enviadas"
          value={chatwootMetrics?.factura_enviada || "0"}
          icon={FileText}
        />
        <MetricCard
          title="Consultas Saldo"
          value={chatwootMetrics?.consulto_saldo || "0"}
          icon={Search}
        />
        <MetricCard
          title="Soporte"
          value={chatwootMetrics?.soporte || "0"}
          icon={Headphones}
        />
        <MetricCard
          title="Cobrador"
          value={chatwootMetrics?.cobrador || "0"}
          icon={UserCheck}
        />
        <MetricCard
          title="Devolución Producto"
          value={chatwootMetrics?.devolucion_producto || "0"}
          icon={PackageX}
        />
        <MetricCard
          title="Servicio Técnico"
          value={chatwootMetrics?.servicio_tecnico || "0"}
          icon={Wrench}
        />
        <MetricCard
          title="Casos Resueltos"
          value={chatwootMetrics?.resuelto || "0"}
          icon={CheckCircle}
          description="Soporte, devoluciones, cobrador"
        />
      </div>
    </div>
  );
};

export default GeneralTab;
