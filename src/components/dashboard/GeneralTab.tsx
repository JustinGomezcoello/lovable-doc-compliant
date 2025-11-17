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
import { DateRange } from "react-day-picker";

const GeneralTab = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });

  // Fetch Chatwoot metrics via edge function
  const { data: chatwootMetrics, isLoading: loadingChatwoot } = useQuery({
    queryKey: ["chatwoot-general", dateRange?.from, dateRange?.to],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("chatwoot-metrics", {
        body: { 
          type: "range",
          dateFrom: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
          dateTo: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined
        }
      });
      
      if (error) throw error;
      return data;
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Métricas Generales</h2>
          <p className="text-muted-foreground">Vista general de campañas y conversaciones</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "PP")} - {format(dateRange.to, "PP")}
                  </>
                ) : (
                  format(dateRange.from, "PP")
                )
              ) : (
                "Seleccionar rango"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
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
