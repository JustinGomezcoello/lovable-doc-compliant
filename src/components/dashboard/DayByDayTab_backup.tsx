import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import MetricCard from "./MetricCard";
import { Send, DollarSign, Users, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import LoadingState from "@/components/ui/loading-state";

const DayByDayTab = () => {
  // Set default dates to today
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [campaignFilterDate, setCampaignFilterDate] = useState<Date>(new Date());

  // Campaign table names
  const campaignTables = [
    'point_compromiso_pago',
    'point_mora_1', 
    'point_mora_3',
    'point_mora_5',
    'point_reactivacion_cobro'
  ] as const;

  // Better campaign names
  const campaignNames: Record<string, string> = {
    'point_compromiso_pago': 'COMPROMISO DE PAGO',
    'point_mora_1': 'MORA 1',
    'point_mora_3': 'MORA 3', 
    'point_mora_5': 'MORA 5',
    'point_reactivacion_cobro': 'REACTIVACIÓN COBRO'
  };

  // Métricas consolidadas por rango de fechas
  const { data: dayMetrics, isLoading } = useQuery({
    queryKey: ["day-metrics-with-contactados-v6", startDate, endDate],
    queryFn: async () => {
      console.log("🔍 Obteniendo métricas consolidadas para:", {
        fechaInicio: format(startDate, "yyyy-MM-dd"),
        fechaFin: format(endDate, "yyyy-MM-dd")
      });

      // Get all days in the range
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
      console.log("📅 Días en el rango:", daysInRange.map(d => format(d, "yyyy-MM-dd")));
      
      let totalSent = 0;
      let allCedulas: string[] = [];
      
      // Query each campaign table for each day in range
      for (const day of daysInRange) {
        const dayStr = format(day, "yyyy-MM-dd");
        
        for (const tableName of campaignTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select("count_day, cedulas")
              .eq("fecha", dayStr);
            
            if (error) {
              console.error(`Error querying ${tableName} for ${dayStr}:`, error);
              continue;
            }
            
            if (data && data.length > 0) {
              // Sum up count_day for this table on this day
              const dayTotal = data.reduce((sum, record) => sum + (record.count_day || 0), 0);
              totalSent += dayTotal;
              
              // Collect all cedulas for response calculation
              data.forEach(record => {
                if (record.cedulas && Array.isArray(record.cedulas)) {
                  allCedulas.push(...record.cedulas.map(c => String(c).trim()).filter(c => c));
                }
              });
              
              console.log(`✅ ${tableName} - ${dayStr}: ${dayTotal} enviados`);
            }
          } catch (err) {
            console.error(`Error accessing table ${tableName}:`, err);
          }
        }
      }
      
      // Get unique cedulas and calculate responses
      const uniqueCedulas = Array.from(new Set(allCedulas));
      let responded = 0;
      
      if (uniqueCedulas.length > 0) {
        const cedulasAsNumbers = uniqueCedulas.map(c => {
          const n = parseInt(c.replace(/\D/g, ''));
          return isNaN(n) ? null : n;
        }).filter((n): n is number => n !== null);
        
        if (cedulasAsNumbers.length > 0) {
          try {
            const { data: responseData } = await supabase
              .from("POINT_Competencia")
              .select("Cedula, conversation_id")
              .in("Cedula", cedulasAsNumbers);
            
            if (responseData) {
              // Count cedulas where conversation_id is not null and not 0
              const respondedCedulas = responseData.filter(r => 
                r.conversation_id !== null && r.conversation_id !== 0
              );
              responded = new Set(respondedCedulas.map(r => String(r.Cedula))).size;
            }
          } catch (err) {
            console.error("Error querying responses:", err);
          }
        }
      }

      const notResponded = Math.max(0, uniqueCedulas.length - responded);
      const responseRate = uniqueCedulas.length > 0 ? ((responded / uniqueCedulas.length) * 100).toFixed(1) : "0.0";
      const totalCost = (totalSent * 0.014).toFixed(2);      console.log("📊 RESUMEN MÉTRICAS CONSOLIDADAS:", {
        totalSent,
        totalContactados: uniqueCedulas.length,
        responded,
        notResponded,
        responseRate,
        totalCost
      });

      return {
        totalSent,
        totalCost,
        totalContactados: uniqueCedulas.length, // Total de cédulas únicas contactadas
        responded,
        notResponded,
        responseRate
      };
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Detalle por campaña para día específico
  const { data: campaignDetails, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaign-details-individual-v5", campaignFilterDate],
    queryFn: async () => {
      const fechaConsulta = format(campaignFilterDate, "yyyy-MM-dd");
      
      console.log("🔍 Obteniendo detalles por campaña para:", fechaConsulta);

      const campaigns = [];
      let totalSent = 0;
      let totalCost = 0;
      let allCedulas: string[] = [];

      // Query each campaign table individually for the specific day
      for (const tableName of campaignTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("count_day, cedulas")
            .eq("fecha", fechaConsulta);
          
          if (error) {
            console.error(`Error querying ${tableName}:`, error);
            // Add campaign with 0 values if error or no data
            campaigns.push({
              name: campaignNames[tableName] || tableName.toUpperCase(),
              sent: 0,
              cost: "0.00",
              responded: 0,
              notResponded: 0
            });
            continue;
          }
          
          if (data && data.length > 0) {
            // Sum up count_day for this table
            const tableSent = data.reduce((sum, record) => sum + (record.count_day || 0), 0);
            const tableCost = (tableSent * 0.014).toFixed(2);
            
            // Collect cedulas for this table
            const tableCedulas: string[] = [];
            data.forEach(record => {
              if (record.cedulas && Array.isArray(record.cedulas)) {
                tableCedulas.push(...record.cedulas.map(c => String(c).trim()).filter(c => c));
              }
            });
            
            // Calculate responses for this table
            const uniqueTableCedulas = Array.from(new Set(tableCedulas));
            let tableResponded = 0;
            
            if (uniqueTableCedulas.length > 0) {
              const cedulasAsNumbers = uniqueTableCedulas.map(c => {
                const n = parseInt(c.replace(/\D/g, ''));
                return isNaN(n) ? null : n;
              }).filter((n): n is number => n !== null);
              
              if (cedulasAsNumbers.length > 0) {
                try {
                  const { data: responseData } = await supabase
                    .from("POINT_Competencia")
                    .select("Cedula, conversation_id")
                    .in("Cedula", cedulasAsNumbers);
                  
                  if (responseData) {
                    const respondedCedulas = responseData.filter(r => 
                      r.conversation_id !== null && r.conversation_id !== 0
                    );
                    tableResponded = new Set(respondedCedulas.map(r => String(r.Cedula))).size;
                  }
                } catch (err) {
                  console.error("Error querying responses for table:", tableName, err);
                }
              }
            }
            
            const tableNotResponded = Math.max(0, uniqueTableCedulas.length - tableResponded);
            
            campaigns.push({
              name: campaignNames[tableName] || tableName.toUpperCase(),
              sent: tableSent,
              cost: tableCost,
              responded: tableResponded,
              notResponded: tableNotResponded
            });
            
            totalSent += tableSent;
            totalCost += tableSent * 0.014;
            allCedulas.push(...tableCedulas);
            
            console.log(`✅ ${tableName} - ${fechaConsulta}: ${tableSent} enviados, ${tableResponded} respondieron`);
          } else {
            // No data for this table on this date
            campaigns.push({
              name: campaignNames[tableName] || tableName.toUpperCase(),
              sent: 0,
              cost: "0.00",
              responded: 0,
              notResponded: 0
            });
            console.log(`⚠️ ${tableName} - ${fechaConsulta}: Sin datos`);
          }
        } catch (err) {
          console.error(`Error accessing table ${tableName}:`, err);
          campaigns.push({
            name: campaignNames[tableName] || tableName.toUpperCase(),
            sent: 0,
            cost: "0.00",
            responded: 0,
            notResponded: 0
          });
        }
      }

      // Calculate overall totals for the day
      const uniqueCedulas = Array.from(new Set(allCedulas));
      let overallResponded = 0;
      
      if (uniqueCedulas.length > 0) {
        const cedulasAsNumbers = uniqueCedulas.map(c => {
          const n = parseInt(c.replace(/\D/g, ''));
          return isNaN(n) ? null : n;
        }).filter((n): n is number => n !== null);
        
        if (cedulasAsNumbers.length > 0) {
          try {
            const { data: responseData } = await supabase
              .from("POINT_Competencia")
              .select("Cedula, conversation_id")
              .in("Cedula", cedulasAsNumbers);
            
            if (responseData) {
              const respondedCedulas = responseData.filter(r => 
                r.conversation_id !== null && r.conversation_id !== 0
              );
              overallResponded = new Set(respondedCedulas.map(r => String(r.Cedula))).size;
            }
          } catch (err) {
            console.error("Error querying overall responses:", err);
          }
        }
      }

      const overallNotResponded = Math.max(0, uniqueCedulas.length - overallResponded);

      console.log("📊 RESUMEN DÍA ESPECÍFICO:", {
        totalSent,
        totalCost: totalCost.toFixed(2),
        overallResponded,
        overallNotResponded
      });

      return {
        campaigns,
        totalSent,
        totalCost: totalCost.toFixed(2),
        responded: overallResponded,
        notResponded: overallNotResponded
      };
    },
    enabled: !!campaignFilterDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Métricas por Día</h2>
          <p className="text-muted-foreground">Analiza el rendimiento por rango de fechas de las 5 campañas</p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Desde: {format(startDate, "dd/MM/yyyy")}
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
                Hasta: {format(endDate, "dd/MM/yyyy")}
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
        </div>
      </div>

      {isLoading ? (        <LoadingState 
          title="Consultando tablas de campaña..."
          message="Obteniendo datos consolidados usando count_day y calculando métricas de respuesta."
          skeletonCount={5}
        />
      ) : (        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="WhatsApp Enviados"
            value={dayMetrics?.totalSent?.toLocaleString() || "0"}
            icon={Send}
            description={`Total mensajes: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`}
          />
          <MetricCard
            title="Costo Total"
            value={`$${dayMetrics?.totalCost || "0.00"}`}
            icon={DollarSign}
            description="($0.014 por mensaje)"
          />          <MetricCard
            title="Total Contactados"
            value={dayMetrics?.totalContactados?.toLocaleString() || "0"}
            icon={Users}
            description="Cédulas únicas contactadas"
          />
          <MetricCard
            title="Respondieron"
            value={dayMetrics?.responded?.toLocaleString() || "0"}
            icon={UserCheck}
            description={`${dayMetrics?.responseRate || "0"}% del total contactados`}
          />
        </div>

        {/* Segunda fila para mostrar la relación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="col-span-1">
            <MetricCard
              title="No Respondieron"
              value={dayMetrics?.notResponded?.toLocaleString() || "0"}
              icon={UserX}
              description="No tienen conversación activa"
            />
          </div>
          <div className="col-span-2 flex items-center justify-center p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Verificación:</p>
              <p className="text-lg font-semibold">
                Respondieron ({dayMetrics?.responded || 0}) + No Respondieron ({dayMetrics?.notResponded || 0}) = Total Contactados ({dayMetrics?.totalContactados || 0})
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalle por Campaña - Día Específico</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(campaignFilterDate, "dd/MM/yyyy")}
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
        </CardHeader>
        <CardContent>
          {loadingCampaigns ? (
            <LoadingState 
              title="Cargando campañas del día..."
              message="Consultando cada tabla de campaña para obtener métricas individuales."
              showSkeletons={false}
            />
          ) : (
            <div className="space-y-6">
              {/* Summary metrics for the specific day */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Enviados</p>
                  <p className="text-2xl font-bold">{campaignDetails?.totalSent?.toLocaleString() || "0"}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Costo del Día</p>
                  <p className="text-2xl font-bold text-blue-600">${campaignDetails?.totalCost || "0.00"}</p>
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

              {/* Individual campaign breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Desglose por Tabla de Campaña</h3>
                {campaignDetails?.campaigns?.map((campaign: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">Tabla de campaña</div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Enviados: <span className="font-semibold text-foreground">{campaign.sent.toLocaleString()}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Costo: <span className="font-semibold text-foreground">${campaign.cost}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Respondieron: <span className="font-semibold text-green-600">{campaign.responded}</span>
                      </span>
                      <span className="text-muted-foreground">
                        No Respondieron: <span className="font-semibold text-orange-600">{campaign.notResponded}</span>
                      </span>
                    </div>
                  </div>
                ))}
                {campaignDetails?.campaigns && campaignDetails.campaigns.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay datos de campaña para esta fecha</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verifica que existan registros en las tablas: point_compromiso_pago, point_mora_1, point_mora_3, point_mora_5, point_reactivacion_cobro
                    </p>
                  </div>
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
