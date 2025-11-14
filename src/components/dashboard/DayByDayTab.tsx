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
import { Send, DollarSign, MessageSquare } from "lucide-react";

const DayByDayTab = () => {
  const [date, setDate] = useState<Date>(new Date());

  const { data: dayMetrics, isLoading } = useQuery({
    queryKey: ["day-metrics", date],
    queryFn: async () => {
      const dateStr = format(date, "yyyy-MM-dd");
      
      // Get WhatsApp metrics from Supabase
      const tableNames = [
        "point_mora_1",
        "point_mora_3", 
        "point_mora_5",
        "point_compromiso_pago",
        "point_reactivacion_cobro"
      ] as const;
      
      let totalSent = 0;
      let campaignDetails: any[] = [];

      for (const table of tableNames) {
        const { data, error } = await supabase
          .from(table)
          .select("count_day, fecha")
          .eq("fecha", dateStr);
        
        if (!error && data) {
          const sent = data.reduce((sum: number, row: any) => sum + (row.count_day || 0), 0);
          totalSent += sent;
          campaignDetails.push({
            name: table.replace("point_", "").replace(/_/g, " "),
            sent,
            cost: (sent * 0.014).toFixed(2)
          });
        }
      }

      // Get Chatwoot metrics for the day
      const { data: chatwootData, error: chatwootError } = await supabase.functions.invoke("chatwoot-metrics", {
        body: { 
          type: "day",
          date: dateStr
        }
      });

      return {
        totalSent,
        totalCost: (totalSent * 0.014).toFixed(2),
        campaigns: campaignDetails,
        chatwoot: chatwootError ? {} : chatwootData
      };
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Métricas por Día</h2>
          <p className="text-muted-foreground">Analiza el rendimiento diario</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="WhatsApp Enviados"
          value={dayMetrics?.totalSent?.toLocaleString() || "0"}
          icon={Send}
          description={`${format(date, "dd/MM/yyyy")}`}
        />
        <MetricCard
          title="Costo del Día"
          value={`$${dayMetrics?.totalCost || "0"}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Conversaciones"
          value={dayMetrics?.chatwoot?.total_conversations || "0"}
          icon={MessageSquare}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por Campaña</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dayMetrics?.campaigns?.map((campaign: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DayByDayTab;
