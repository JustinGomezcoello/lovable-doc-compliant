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
  CalendarIcon,
  AlertCircle,
  CreditCard,
  Banknote,
  UserX,
  PhoneOff,
  Handshake
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingState from "@/components/ui/loading-state";

const GeneralTab = () => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(2025, 8, 1)); // September 1, 2025
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  // Fetch Chatwoot metrics via edge function
  const { data: chatwootMetrics, isLoading: loadingChatwoot, error } = useQuery({
    queryKey: ["chatwoot-general", dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      if (!dateFrom || !dateTo) {
        throw new Error("Fechas requeridas");
      }

      const fechaInicio = format(dateFrom, "yyyy-MM-dd");
      const fechaFin = format(dateTo, "yyyy-MM-dd");

      console.log("Obteniendo métricas de Chatwoot para:", {
        fechaInicio,
        fechaFin,
        tipo: "range"
      });

      const { data, error } = await supabase.functions.invoke("chatwoot-metrics", {
        body: {
          type: "range",
          dateFrom: fechaInicio,
          dateTo: fechaFin
        }
      });

      if (error) {
        console.error("Error obteniendo métricas de Chatwoot:", error);
        throw new Error(`Error de API: ${error.message}`);
      }

      console.log("Métricas recibidas:", data);
      return data;
    },
    retry: 2,
    enabled: !!dateFrom && !!dateTo,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (loadingChatwoot) {
    return (
      <LoadingState
        title="Cargando datos de Chatwoot..."
        message="Obteniendo todas las conversaciones, aplicando paginación completa y filtros de fecha. Esto puede tomar unos momentos."
        skeletonCount={9}
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Métricas Generales</h2>
          <p className="text-muted-foreground mb-4">Vista general de campañas y conversaciones</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las métricas de Chatwoot: {error?.message || 'Error desconocido'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (<div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">Métricas Generales</h2>
      <p className="text-muted-foreground mb-4">
        Vista general de campañas y conversaciones desde Chatwoot
        <br />
        <span className="text-xs text-muted-foreground">
          {dateFrom && dateTo && (
            `Período: ${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")} (Zona horaria: Ecuador UTC-5)`
          )}
        </span>
      </p>

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
    </div>        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Comprobantes Enviados"
        value={chatwootMetrics?.comprobante_enviado?.toString() || "0"}
        icon={FileText}
        description="Cliente mandó el comprobante de pago"
        variant="primary"
      />
      <MetricCard
        title="Facturas Enviadas"
        value={chatwootMetrics?.factura_enviada?.toString() || "0"}
        icon={FileText}
        description="Cliente indicó que ya pagó y mandó factura de pago"
        variant="primary"
      />
      <MetricCard
        title="Consultas Saldo"
        value={chatwootMetrics?.consulto_saldo?.toString() || "0"}
        icon={Search}
        description="Cliente realizó consulta de sus créditos para saber qué valores tiene pendientes"
        variant="primary"
      />
      <MetricCard
        title="Pagado"
        value={chatwootMetrics?.pagado?.toString() || "0"}
        icon={CreditCard}
        description="Se da a conocer que cliente ya había pagado y no tiene nada pendiente por pagar"
        variant="success"
      />
      <MetricCard
        title="Soporte"
        value={chatwootMetrics?.soporte?.toString() || "0"}
        icon={Headphones}
        description="Usuario pidió contacto humano directo - que quiere hablar con alguien explícitamente"
        variant="warning"
      />
      <MetricCard
        title="Cobrador"
        value={chatwootMetrics?.cobrador?.toString() || "0"}
        icon={UserCheck}
        description="Cliente solicita que se le envíe un cobrador"
        variant="warning"
      />
      <MetricCard
        title="Devolución Producto"
        value={chatwootMetrics?.devolucion_producto?.toString() || "0"}
        icon={PackageX}
        description="Cliente solicita devolver el producto adquirido"
        variant="destructive"
      />
      <MetricCard
        title="Servicio Técnico"
        value={chatwootMetrics?.servicio_tecnico?.toString() || "0"}
        icon={Wrench}
        description="Cliente desea hablar con soporte técnico"
        variant="warning"
      />
      <MetricCard
        title="Consulta Datos Transferencia"
        value={chatwootMetrics?.consulto_datos_transferencia?.toString() || "0"}
        icon={Banknote}
        description="Cliente solicita datos de cuentas bancarias"
        variant="primary"
      />
      <MetricCard
        title="No Registrado"
        value={chatwootMetrics?.no_registrado?.toString() || "0"}
        icon={UserX}
        description="Cliente no encontrado en base de datos de POINT"
        variant="destructive"
      />
      <MetricCard
        title="Casos Resueltos"
        value={chatwootMetrics?.resuelto?.toString() || "0"}
        icon={CheckCircle}
        description="Casos resueltos de soporte, servicio técnico, devolución producto y cobrador"
        variant="success"
      />
      <MetricCard
        title="Número Equivocado"
        value={chatwootMetrics?.numero_equivocado?.toString() || "0"}
        icon={PhoneOff}
        description="Cliente indicó que fue contactado por error"
        variant="destructive"
      />
      <MetricCard
        title="Compromiso Pago"
        value={chatwootMetrics?.compromiso_pago?.toString() || "0"}
        icon={Handshake}
        description="Cliente se ha comprometido a realizar el pago"
        variant="success"
      />
    </div>
  </div>
  );
};

export default GeneralTab;
