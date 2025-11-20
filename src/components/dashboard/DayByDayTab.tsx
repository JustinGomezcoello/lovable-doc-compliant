import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Send,
  DollarSign,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import MetricCard from "./MetricCard";
import { cn } from "@/lib/utils";
import LoadingState from "@/components/ui/loading-state";

const DayByDayTab = () => {
  // Fechas para la parte de “Métricas por Día” (rango)
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Fecha para la parte de “Detalle por Campaña - Día Específico”
  const [campaignFilterDate, setCampaignFilterDate] = useState<Date>(new Date());

  // 8 tablas de campañas en Supabase
  const campaignTables = [
    "point_mora_neg5",
    "point_mora_neg3",
    "point_mora_neg2",
    "point_mora_neg1",
    "point_mora_pos1",
    "point_mora_pos4",
    "point_compromiso_pago",
    "point_reactivacion_cobro",
  ] as const;

  const campaignNames: Record<string, string> = {
    point_mora_neg5: "MORA NEGATIVA 5",
    point_mora_neg3: "MORA NEGATIVA 3",
    point_mora_neg2: "MORA NEGATIVA 2",
    point_mora_neg1: "MORA NEGATIVA 1",
    point_mora_pos1: "MORA POSITIVA 1",
    point_mora_pos4: "MORA POSITIVA 4",
    point_compromiso_pago: "COMPROMISO DE PAGO",
    point_reactivacion_cobro: "REACTIVACIÓN COBRO",
  };

  const COSTO_POR_MENSAJE = 0.014;

  /**
   * Construye un mapa:
   *   número de cédula (sin formato) → [todas las variantes string que llegaron]
   */
  const construirMapaCedulas = (cedulas: string[]) => {
    const numericToKeys = new Map<number, string[]>();

    cedulas.forEach((raw) => {
      const cleaned = raw.replace(/\D/g, "");
      if (!cleaned) return;

      const num = parseInt(cleaned, 10);
      if (isNaN(num)) return;

      if (!numericToKeys.has(num)) {
        numericToKeys.set(num, []);
      }
      numericToKeys.get(num)!.push(raw);
    });

    return numericToKeys;
  };

  /**
   * Clasifica una lista de cédulas únicas en:
   *  - true  → Respondió (conversation_id ≠ 0 y ≠ NULL)
   *  - false → No Respondió (conversation_id = 0 o NULL, o sin registro)
   *
   * Hace la consulta a POINT_Competencia en chunks para no romper el .in()
   * cuando hay muchas cédulas.
   */
  const clasificarCedulasPorRespuesta = async (
    cedulas: string[]
  ): Promise<Map<string, boolean>> => {
    const responseMap = new Map<string, boolean>();

    if (!cedulas.length) return responseMap;

    // 1) Inicialmente, todas las cédulas se marcan como NO RESPONDIÓ
    cedulas.forEach((cedula) => {
      responseMap.set(cedula, false);
    });

    // 2) Construir mapa numérico → strings
    const numericToKeys = construirMapaCedulas(cedulas);
    const uniqueNumericCedulas = Array.from(numericToKeys.keys());

    if (!uniqueNumericCedulas.length) return responseMap;

    // 3) Hacer la consulta a Supabase en chunks
    const CHUNK_SIZE = 500;

    for (let i = 0; i < uniqueNumericCedulas.length; i += CHUNK_SIZE) {
      const chunk = uniqueNumericCedulas.slice(i, i + CHUNK_SIZE);

      try {
        const { data: responseData, error } = await supabase
          .from("POINT_Competencia")
          .select("Cedula, conversation_id")
          .in("Cedula", chunk);

        if (error) {
          console.error("❌ Error consultando POINT_Competencia (chunk):", error);
          continue;
        }

        if (responseData && responseData.length) {
          responseData.forEach((row: any) => {
            const convId = row.conversation_id;
            const cedulaNumber = Number(row.Cedula);

            // Regla: conversation_id NOT NULL AND <> 0 → Respondió
            if (convId !== null && convId !== 0) {
              const keys = numericToKeys.get(cedulaNumber);
              if (keys && keys.length) {
                keys.forEach((key) => {
                  responseMap.set(key, true);
                });
              }
            }
            // Si convId es 0 o NULL, no hacemos nada porque ya están en false.
          });
        }
      } catch (err) {
        console.error("❌ Excepción al consultar respuestas (chunk):", err);
      }
    }

    return responseMap;
  };

  // ===================================================
  //  MÉTRICAS POR DÍA (RANGO DE FECHAS - 8 TABLAS)
  // ===================================================
  const { data: dayMetrics, isLoading } = useQuery({
    queryKey: ["day-metrics-final-v4", startDate, endDate],
    queryFn: async () => {
      const fechaInicio = format(startDate, "yyyy-MM-dd");
      const fechaFin = format(endDate, "yyyy-MM-dd");

      let totalSent = 0; // total de mensajes enviados en el rango
      let allCedulas: string[] = []; // cédulas de todas las tablas en el rango

      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

      for (const day of daysInRange) {
        const dayStr = format(day, "yyyy-MM-dd");

        for (const tableName of campaignTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select("count_day, cedulas, fecha")
              .gte("fecha", dayStr)
              .lte("fecha", dayStr);

            if (error) {
              console.error(`❌ Error en ${tableName} [${dayStr}]:`, error);
              continue;
            }

            if (data && data.length > 0) {
              // Mensajes enviados en esa fecha / tabla
              const dayTotal = data.reduce(
                (sum, record) => sum + (record.count_day || 0),
                0
              );
              totalSent += dayTotal;

              // Cédulas de esa fecha / tabla
              data.forEach((record) => {
                if (record.cedulas && Array.isArray(record.cedulas)) {
                  allCedulas.push(
                    ...record.cedulas
                      .map((c: any) => String(c).trim())
                      .filter((c: string) => c)
                  );
                }
              });
            }
          } catch (err) {
            console.error(`❌ Excepción en ${tableName}:`, err);
          }
        }
      }

      // CÉDULAS ÚNICAS GLOBALES del rango (8 tablas)
      const uniqueCedulas = Array.from(new Set(allCedulas));
      const costoTotal = (totalSent * COSTO_POR_MENSAJE).toFixed(2);

      // Clasificar RESPONDIERON / NO RESPONDIERON con REGLA ÚNICA
      const responseMap = await clasificarCedulasPorRespuesta(uniqueCedulas);

      let respondieron = 0;
      let noRespondieron = 0;

      uniqueCedulas.forEach((ced) => {
        const didRespond = responseMap.get(ced);
        if (didRespond) respondieron++;
        else noRespondieron++;
      });

      const responseRate =
        uniqueCedulas.length > 0
          ? ((respondieron / uniqueCedulas.length) * 100).toFixed(1)
          : "0.0";

      return {
        totalSent,
        totalCost: costoTotal,
        responded: respondieron,
        notResponded: noRespondieron,
        responseRate,
        totalCedulasUnicas: uniqueCedulas.length,
      };
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });

  // ============================================================
  //  DETALLE POR CAMPAÑA - DÍA ESPECÍFICO (8 TABLAS + GLOBAL DÍA)
  // ============================================================
  const { data: campaignDetails, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaign-details-final-v4", campaignFilterDate],
    queryFn: async () => {
      const fechaConsulta = format(campaignFilterDate, "yyyy-MM-dd");

      const campaigns: any[] = [];
      let totalSent = 0;
      let allCedulasDia: string[] = []; // cédulas únicas por campaña, pero todas juntas

      for (const tableName of campaignTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("count_day, cedulas, fecha")
            .gte("fecha", fechaConsulta)
            .lte("fecha", fechaConsulta);

          if (error) {
            console.error(`Error querying ${tableName}:`, error);
            campaigns.push({
              name: campaignNames[tableName] || tableName.toUpperCase(),
              sent: 0,
              cost: "0.00",
              cedulas: [],
              responded: 0,
              notResponded: 0,
              cedulasUnicas: 0,
            });
            continue;
          }

          if (data && data.length > 0) {
            const tableSent = data.reduce(
              (sum, record) => sum + (record.count_day || 0),
              0
            );

            const tableCedulas: string[] = [];
            data.forEach((record) => {
              if (record.cedulas && Array.isArray(record.cedulas)) {
                tableCedulas.push(
                  ...record.cedulas
                    .map((c: any) => String(c).trim())
                    .filter((c: string) => c)
                );
              }
            });

            // cédulas únicas dentro de esa campaña para ese día
            const cedulasUnicasCampana = Array.from(new Set(tableCedulas));

            campaigns.push({
              name: campaignNames[tableName] || tableName.toUpperCase(),
              sent: tableSent,
              cost: (tableSent * COSTO_POR_MENSAJE).toFixed(2),
              cedulas: cedulasUnicasCampana, // solo para cálculo interno
              responded: 0,
              notResponded: 0,
              cedulasUnicas: cedulasUnicasCampana.length,
            });

            totalSent += tableSent;
            allCedulasDia.push(...cedulasUnicasCampana);
          } else {
            campaigns.push({
              name: campaignNames[tableName] || tableName.toUpperCase(),
              sent: 0,
              cost: "0.00",
              cedulas: [],
              responded: 0,
              notResponded: 0,
              cedulasUnicas: 0,
            });
          }
        } catch (err) {
          console.error(`Error accessing table ${tableName}:`, err);
          campaigns.push({
            name: campaignNames[tableName] || tableName.toUpperCase(),
            sent: 0,
            cost: "0.00",
            cedulas: [],
            responded: 0,
            notResponded: 0,
            cedulasUnicas: 0,
          });
        }
      }

      // 🔹 CÉDULAS ÚNICAS DEL DÍA (UNIÓN DE LAS 8 CAMPAÑAS)
      const uniqueCedulasDia = Array.from(new Set(allCedulasDia));

      // Aplicamos REGLA ÚNICA para el día completo
      const responseMap = await clasificarCedulasPorRespuesta(uniqueCedulasDia);

      // 1) Resumen global del día (por cédula única, SIN duplicar por campaña)
      let overallRespondedDia = 0;
      let overallNotRespondedDia = 0;

      uniqueCedulasDia.forEach((cedula) => {
        const didRespond = responseMap.get(cedula);
        if (didRespond) overallRespondedDia++;
        else overallNotRespondedDia++;
      });

      // 2) Detalle por campaña usando la misma regla, pero solo con las cédulas de cada campaña
      campaigns.forEach((campaign: any) => {
        let campaignResponded = 0;
        let campaignNotResponded = 0;

        campaign.cedulas.forEach((cedula: string) => {
          const didRespond = responseMap.get(cedula);
          if (didRespond) campaignResponded++;
          else campaignNotResponded++;
        });

        campaign.responded = campaignResponded;
        campaign.notResponded = campaignNotResponded;

        // ya no necesitamos el array de cédulas en el resultado final
        delete campaign.cedulas;
      });

      const totalCostDia = (totalSent * COSTO_POR_MENSAJE).toFixed(2);

      return {
        campaigns,
        totalSent,
        totalCost: totalCostDia,
        responded: overallRespondedDia,
        notResponded: overallNotRespondedDia,
        totalCedulasUnicasDia: uniqueCedulasDia.length,
      };
    },
    enabled: !!campaignFilterDate,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* 🔵 EXPLICACIÓN GENERAL DEL DASHBOARD */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">
            🧠 ¿Qué significan los datos del dashboard?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-xs text-gray-700">
            Este panel resume cómo están funcionando las{" "}
            <strong>campañas automáticas de WhatsApp de cobranzas</strong>. Cada vez
            que se envía un mensaje o un cliente responde, se guarda un registro y
            con eso se construyen todas las métricas que ves aquí.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded p-3">
              <h4 className="font-semibold text-blue-700 mb-2">📨 WhatsApp enviados</h4>
              <p className="text-xs">
                Es la cantidad total de mensajes de WhatsApp que se enviaron desde las
                campañas en el periodo seleccionado.
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <h4 className="font-semibold text-blue-700 mb-2">
                💵 Costo del día / rango
              </h4>
              <p className="text-xs">
                Es el valor estimado que se ha invertido en los envíos de WhatsApp.
                Se calcula multiplicando el número de mensajes enviados por una tarifa
                promedio de <strong>$0.014</strong> por mensaje.
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <h4 className="font-semibold text-blue-700 mb-2">
                🧍‍♂️ Personas contactadas por campaña
              </h4>
              <p className="text-xs">
                Muestra cuántas personas diferentes fueron contactadas{" "}
                <strong>dentro de cada campaña</strong> en un día específico. Si a la
                misma persona se le envían varios mensajes dentro de esa campaña, aquí
                se la cuenta una sola vez.
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <h4 className="font-semibold text-blue-700 mb-2">
                🌎 Personas contactadas totales (cédulas únicas)
              </h4>
              <p className="text-xs">
                Indica cuántas personas distintas fueron contactadas sumando todas las
                campañas del rango de fechas. Si una persona aparece en varias
                campañas, <strong>solo se la cuenta una vez</strong> a nivel global.
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <h4 className="font-semibold text-blue-700 mb-2">✅ Respondieron</h4>
              <p className="text-xs">
                Son las personas que enviaron al menos un mensaje de respuesta o
                continuaron la conversación después de recibir el WhatsApp de
                cobranza. Aquí cada persona cuenta una sola vez, aunque haya tenido
                muchas interacciones.
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <h4 className="font-semibold text-blue-700 mb-2">❌ No respondieron</h4>
              <p className="text-xs">
                Son las personas a las que se les envió un WhatsApp, pero{" "}
                <strong>no han contestado</strong> en el periodo analizado, o todavía
                no tenemos ninguna conversación registrada con ellas.
              </p>
            </div>
          </div>

          <div className="bg-orange-100 border border-orange-300 rounded p-3">
            <h4 className="font-semibold text-orange-800 mb-2">
              🔍 ¿Qué diferencia hay entre los datos por campaña y los datos globales?
            </h4>
            <ul className="list-disc ml-4 text-xs space-y-1">
              <li>
                <strong>Por campaña:</strong> ves el comportamiento separado de cada
                campaña (Mora 5, Mora 3, Compromiso de pago, etc.).
              </li>
              <li>
                <strong>Global:</strong> ves el comportamiento de{" "}
                <strong>personas únicas</strong> sumando todas las campañas.
              </li>
              <li>
                Por eso, la suma de las personas que responden en cada campaña puede
                ser mayor que el total global: una misma persona puede aparecer en
                varias campañas, pero globalmente se cuenta una sola vez.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ========================================= */}
      {/*     MÉTRICAS POR DÍA (RANGO DE FECHAS)   */}
      {/* ========================================= */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Métricas por Día</h2>
          <p className="text-muted-foreground">
            Analiza el rendimiento por rango de fechas de las 8 campañas
          </p>
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

      {isLoading ? (
        <LoadingState
          title="Consultando campañas..."
          message="Obteniendo la información de mensajes enviados, personas contactadas y respuestas en el rango seleccionado."
          skeletonCount={5}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="WhatsApp Enviados"
              value={dayMetrics?.totalSent?.toLocaleString() || "0"}
              icon={Send}
              description={`Mensajes enviados entre ${format(
                startDate,
                "dd/MM/yyyy"
              )} y ${format(endDate, "dd/MM/yyyy")}`}
            />
            <MetricCard
              title="Costo Total"
              value={`$${dayMetrics?.totalCost || "0.00"}`}
              icon={DollarSign}
              description="Estimado: mensajes enviados × $0.014"
            />
            <MetricCard
              title="Respondieron"
              value={dayMetrics?.responded?.toLocaleString() || "0"}
              icon={UserCheck}
              description={`${dayMetrics?.responseRate || "0"}% de las personas contactadas en el rango`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="No Respondieron"
              value={dayMetrics?.notResponded?.toLocaleString() || "0"}
              icon={UserX}
              description="Personas contactadas que no han respondido en el rango"
            />
            <MetricCard
              title="Cédulas Únicas (Rango)"
              value={dayMetrics?.totalCedulasUnicas?.toLocaleString() || "0"}
              icon={Users}
              description="Total de personas distintas contactadas en todas las campañas"
            />
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/*   DETALLE POR CAMPAÑA - DÍA ESPECÍFICO (8 TABLAS)  */}
      {/* ================================================== */}
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
              message="Consultando cada campaña para mostrar mensajes enviados, personas y respuestas de la fecha seleccionada."
              showSkeletons={false}
            />
          ) : (
            <div className="space-y-6">
              {/* Resumen global del día por CÉDULA ÚNICA */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    WhatsApp Enviados
                  </p>
                  <p className="text-2xl font-bold">
                    {campaignDetails?.totalSent?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Cédulas Únicas del Día
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {campaignDetails?.totalCedulasUnicasDia?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Costo del Día</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${campaignDetails?.totalCost || "0.00"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Respondieron</p>
                  <p className="text-2xl font-bold text-green-600">
                    {campaignDetails?.responded?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">No Respondieron</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {campaignDetails?.notResponded?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>

              {/* Desglose por tabla de campaña */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Desglose por Tabla de Campaña</h3>

                {campaignDetails?.campaigns?.map((campaign: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Tabla de campaña
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-muted-foreground text-xs">
                          WhatsApp Enviados
                        </p>
                        <p className="font-semibold text-foreground">
                          {campaign.sent.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <p className="text-muted-foreground text-xs">
                          Cédulas Únicas
                        </p>
                        <p className="font-semibold text-purple-700">
                          {campaign.cedulasUnicas?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground text-xs">Costo</p>
                        <p className="font-semibold text-foreground">
                          ${campaign.cost}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-muted-foreground text-xs">Respondieron</p>
                        <p className="font-semibold text-green-600">
                          {campaign.responded}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <p className="text-muted-foreground text-xs">
                          No Respondieron
                        </p>
                        <p className="font-semibold text-orange-600">
                          {campaign.notResponded}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {campaignDetails?.campaigns &&
                  campaignDetails.campaigns.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No hay datos de campaña para esta fecha.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verifica que existan registros en las tablas: point_mora_neg5,
                        point_mora_neg3, point_mora_neg2, point_mora_neg1,
                        point_mora_pos1, point_mora_pos4, point_compromiso_pago y
                        point_reactivacion_cobro.
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
