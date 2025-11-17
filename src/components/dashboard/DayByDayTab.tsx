import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import MetricCard from "./MetricCard";
import { Send, DollarSign, Users, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import LoadingState from "@/components/ui/loading-state";

const DayByDayTab = () => {
  // Set default dates to today
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [campaignFilterDate, setCampaignFilterDate] = useState<Date>(new Date());

  const { data: dayMetrics, isLoading } = useQuery({
    queryKey: ["day-metrics", startDate, endDate],
    queryFn: async () => {
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");
      
      // Get WhatsApp metrics from Supabase
      const tableNames = [
        "point_mora_1",
        "point_mora_3", 
        "point_mora_5",
        "point_compromiso_pago",
        "point_reactivacion_cobro"
      ] as const;
      
      let totalSent = 0;
      let allCedulas: string[] = [];

      for (const table of tableNames) {
        const { data, error } = await supabase
          .from(table)
          .select("count_day, cedulas, fecha")
          .gte("fecha", startStr)
          .lte("fecha", endStr);
        
        if (!error && data) {
          const sent = data.reduce((sum: number, row: any) => sum + (row.count_day || 0), 0);
          totalSent += sent;
          
          // Collect all cedulas from this date range
          data.forEach((row: any) => {
            if (row.cedulas && Array.isArray(row.cedulas)) {
              allCedulas = [...allCedulas, ...row.cedulas];
            }
          });
        }
      }

      // Get response data from POINT_Competencia
      let responded = 0;
      if (allCedulas.length > 0) {
        // Convert cedulas to numbers for the query
        const cedulasAsNumbers = allCedulas.map(c => parseInt(c)).filter(n => !isNaN(n));
        
        if (cedulasAsNumbers.length > 0) {
          const { data: responseData } = await supabase
            .from("POINT_Competencia")
            .select("Cedula, conversation_id")
            .in("Cedula", cedulasAsNumbers);
          
          if (responseData) {
            responded = responseData.filter(r => r.conversation_id && r.conversation_id > 0).length;
          }
        }
      }

      const notResponded = totalSent - responded;
      const responseRate = totalSent > 0 ? ((responded / totalSent) * 100).toFixed(1) : "0";

      return {
        totalSent,
        totalCost: (totalSent * 0.014).toFixed(2),
        responded,
        notResponded,
        responseRate
      };
    }
  });

  const { data: campaignDetails, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaign-details", campaignFilterDate],
    queryFn: async () => {
      const dateStr = format(campaignFilterDate, "yyyy-MM-dd");
      
      const tableNames = [
        "point_mora_1",
        "point_mora_3", 
        "point_mora_5",
        "point_compromiso_pago",
        "point_reactivacion_cobro"
      ] as const;
      
      let campaignDetails: any[] = [];
      let totalSent = 0;
      let allCedulas: string[] = [];

      for (const table of tableNames) {
        const { data, error } = await supabase
          .from(table)
          .select("count_day, cedulas, fecha")
          .eq("fecha", dateStr);
        
        if (error) {
          console.error(`Error fetching ${table}:`, error);
        }
        
        if (data && data.length > 0) {
          const sent = data.reduce((sum: number, row: any) => sum + (row.count_day || 0), 0);
          totalSent += sent;
          
          data.forEach((row: any) => {
            if (row.cedulas && Array.isArray(row.cedulas)) {
              allCedulas = [...allCedulas, ...row.cedulas];
            }
          });
          
          campaignDetails.push({
            name: table.replace("point_", "").replace(/_/g, " "),
            sent,
            cost: (sent * 0.014).toFixed(2)
          });
        } else {
          // Add campaign with 0 values if no data
          campaignDetails.push({
            name: table.replace("point_", "").replace(/_/g, " "),
            sent: 0,
            cost: "0.00"
          });
        }
      }

      // Calculate responses for all campaigns combined
      let responded = 0;
      if (allCedulas.length > 0) {
        const cedulasAsNumbers = allCedulas.map(c => parseInt(c)).filter(n => !isNaN(n));
        
        if (cedulasAsNumbers.length > 0) {
          const { data: responseData } = await supabase
            .from("POINT_Competencia")
            .select("Cedula, conversation_id")
            .in("Cedula", cedulasAsNumbers);
          
          if (responseData) {
            responded = responseData.filter(r => r.conversation_id && r.conversation_id > 0).length;
          }
        }
      }

      const notResponded = totalSent - responded;

      return {
        campaigns: campaignDetails,
        totalSent,
        responded,
        notResponded
      };
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Métricas por Día</h2>
          <p className="text-muted-foreground">Analiza el rendimiento por rango de fechas</p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(endDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>      </div>

      {isLoading ? (
        <LoadingState 
          title="Cargando métricas del día..."
          message="Obteniendo datos de WhatsApp y calculando estadísticas de respuesta."
          skeletonCount={5}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="WhatsApp Enviados"
            value={dayMetrics?.totalSent?.toLocaleString() || "0"}
            icon={Send}
            description={`${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`}
          />
          <MetricCard
            title="Costo del Día"
            value={`$${dayMetrics?.totalCost || "0"}`}
            icon={DollarSign}
          />
          <MetricCard
            title="Respondieron"
            value={dayMetrics?.responded?.toLocaleString() || "0"}
            icon={UserCheck}
            description={`${dayMetrics?.responseRate || "0"}% del total`}
          />
          <MetricCard
            title="No Respondieron"
            value={dayMetrics?.notResponded?.toLocaleString() || "0"}
            icon={UserX}
          />
          <MetricCard
            title="Total Contactados"
            value={dayMetrics?.totalSent?.toLocaleString() || "0"}
            icon={Users}
          />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalle por Campaña</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(campaignFilterDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={campaignFilterDate}
                onSelect={(date) => date && setCampaignFilterDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </CardHeader>        <CardContent>
          {loadingCampaigns ? (
            <LoadingState 
              title="Cargando campañas..."
              message="Obteniendo datos de campañas de WhatsApp desde las bases de datos."
              showSkeletons={false}
            />
          ) : (
            <div className="space-y-6">
              {/* Summary metrics for all campaigns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Enviados</p>
                  <p className="text-2xl font-bold">{campaignDetails?.totalSent?.toLocaleString() || "0"}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Respondieron</p>
                  <p className="text-2xl font-bold text-green-600">{campaignDetails?.responded?.toLocaleString() || "0"}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">No Respondieron</p>
                  <p className="text-2xl font-bold text-orange-600">{campaignDetails?.notResponded?.toLocaleString() || "0"}</p>
                </div>
              </div>

              {/* Campaign breakdown */}
              <div className="space-y-4">
                {campaignDetails?.campaigns?.map((campaign: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="font-medium capitalize">{campaign.name}</div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-muted-foreground">
                        Enviados: <span className="font-semibold text-foreground">{campaign.sent}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Costo: <span className="font-semibold text-foreground">${campaign.cost}</span>
                      </span>
                    </div>
                  </div>
                ))}
                {campaignDetails?.campaigns && campaignDetails.campaigns.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No hay datos para esta fecha
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DayByDayTab;
