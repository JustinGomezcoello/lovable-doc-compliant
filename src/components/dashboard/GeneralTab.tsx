import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "./MetricCard";
import { 
  MessageSquare, 
  FileText, 
  Headphones, 
  UserCheck, 
  PackageX, 
  Wrench,
  Search,
  CheckCircle,
  DollarSign,
  Send
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const GeneralTab = () => {
  // Fetch WhatsApp campaign totals from Supabase
  const { data: whatsappMetrics, isLoading: loadingWhatsapp } = useQuery({
    queryKey: ["whatsapp-general"],
    queryFn: async () => {
      const tableNames = [
        "point_mora_1",
        "point_mora_3",
        "point_mora_5",
        "point_compromiso_pago",
        "point_reactivacion_cobro"
      ] as const;
      
      let totalSent = 0;
      let totalCost = 0;

      for (const table of tableNames) {
        const { data, error } = await supabase
          .from(table)
          .select("count_day");
        
        if (!error && data) {
          const sent = data.reduce((sum: number, row: any) => sum + (row.count_day || 0), 0);
          totalSent += sent;
          totalCost += sent * 0.014;
        }
      }

      return {
        totalSent,
        totalCost: totalCost.toFixed(2)
      };
    }
  });

  // Fetch Chatwoot metrics via edge function
  const { data: chatwootMetrics, isLoading: loadingChatwoot } = useQuery({
    queryKey: ["chatwoot-general"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("chatwoot-metrics", {
        body: { type: "general" }
      });
      
      if (error) throw error;
      return data;
    }
  });

  if (loadingWhatsapp || loadingChatwoot) {
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
        <p className="text-muted-foreground">Vista general de campañas y conversaciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="WhatsApp Enviados"
          value={whatsappMetrics?.totalSent?.toLocaleString() || "0"}
          icon={Send}
          description="Total histórico"
        />
        <MetricCard
          title="Costo Total WhatsApp"
          value={`$${whatsappMetrics?.totalCost || "0"}`}
          icon={DollarSign}
          description="Costo acumulado"
        />
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
