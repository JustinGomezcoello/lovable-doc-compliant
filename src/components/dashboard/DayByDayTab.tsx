import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarIcon,
  Send,
  DollarSign,
  UserCheck,
  UserX,
  Users,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import MetricCard from "./MetricCard";
import { cn } from "@/lib/utils";
import LoadingState from "@/components/ui/loading-state";
import { CampaignRespondersAnalysis } from "./CampaignRespondersAnalysis";

const DayByDayTab = () => {
  const { toast } = useToast();

  // Fechas para la parte de “Métricas por Día” (rango)
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Fecha para la parte de “Detalle por Campaña - Día Específico”
  const [campaignFilterDate, setCampaignFilterDate] = useState<Date>(new Date());
  // Estado para controlar qué campañas están expandidas
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  // Estado para almacenar datos de respondedores por campaña
  const [campaignResponders, setCampaignResponders] = useState<Map<string, any[]>>(new Map());

  // Estado de carga por campaña
  const [loadingResponders, setLoadingResponders] = useState<Set<string>>(new Set());

  // 12 tablas de campañas en Supabase
  const campaignTables = [
    "point_mora_neg5",
    "point_mora_neg4",
    "point_mora_neg3",
    "point_mora_neg2",
    "point_mora_neg1",
    "point_mora_pos1",
    "point_mora_pos2",
    "point_mora_pos3",
    "point_mora_pos4",
    "point_mora_pos5",
    "point_compromiso_pago",
    "point_reactivacion_cobro",
    "point_compromiso_pago_llamadas",
    "point_mora_cero",
    "point_no_se_acepta_compromiso_pago",
    "point_31_60_guayaquil_plazas_costa",
    "point_mora_pos6",
  ] as const;

  const campaignNames: Record<string, string> = {
    point_mora_neg5: "MORA NEGATIVA 5",
    point_mora_neg4: "MORA NEGATIVA 4",
    point_mora_neg3: "MORA NEGATIVA 3",
    point_mora_neg2: "MORA NEGATIVA 2",
    point_mora_neg1: "MORA NEGATIVA 1",
    point_mora_pos1: "MORA POSITIVA 1",
    point_mora_pos2: "MORA POSITIVA 2",
    point_mora_pos3: "MORA POSITIVA 3",
    point_mora_pos4: "MORA POSITIVA 4",
    point_mora_pos5: "MORA POSITIVA 5",
    point_compromiso_pago: "COMPROMISO DE PAGO CHAT",
    point_reactivacion_cobro: "REACTIVACIÓN COBRO",
    point_compromiso_pago_llamadas: "COMPROMISO PAGO LLAMADAS",
    point_mora_cero: "MORA CERO",
    point_no_se_acepta_compromiso_pago: "NO SE ACEPTA COMPROMISO PAGO",
    point_31_60_guayaquil_plazas_costa: "31-60 GUAYAQUIL PLAZAS COSTA",
    point_mora_pos6: "MORA POSITIVA 6",
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
   * ═══════════════════════════════════════════════════════════════════════
   * REGLA ÚNICA PARA CLASIFICAR RESPUESTA (PASO 3 DE LA FÓRMULA)
   * ═══════════════════════════════════════════════════════════════════════
   * 
   * Una cédula se considera "RESPONDIÓ" si y solo si:
   *   EXISTS en POINT_Competencia WHERE:
   *     - conversation_id IS NOT NULL
   *     - AND conversation_id <> 0
   * 
   * Si NO cumple estas condiciones, se considera "NO RESPONDIÓ".
   * 
   * Esta regla se aplica SIEMPRE de la misma forma para:
   *   - Cálculo por día
   *   - Cálculo por rango
   *   - Cualquier análisis global
   * 
   * IMPORTANTE: Esta función consulta POINT_Competencia en chunks de 500
   * para evitar límites de consulta cuando hay muchas cédulas.
   * ═══════════════════════════════════════════════════════════════════════
   */
  const clasificarCedulasPorRespuesta = async (
    cedulas: string[]
  ): Promise<Map<string, boolean>> => {
    const responseMap = new Map<string, boolean>();

    if (!cedulas.length) return responseMap;

    // Inicialmente, todas las cédulas se marcan como NO RESPONDIÓ (false)
    cedulas.forEach((cedula) => {
      responseMap.set(cedula, false);
    });

    // Construir mapa numérico → strings (para manejar variaciones de formato)
    const numericToKeys = construirMapaCedulas(cedulas);
    const uniqueNumericCedulas = Array.from(numericToKeys.keys());

    if (!uniqueNumericCedulas.length) return responseMap;

    // Consultar POINT_Competencia en chunks de 500 cédulas
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

            // ✅ APLICAR REGLA ÚNICA: conversation_id NOT NULL AND <> 0
            if (convId !== null && convId !== 0) {
              const keys = numericToKeys.get(cedulaNumber);
              if (keys && keys.length) {
                keys.forEach((key) => {
                  responseMap.set(key, true); // Marcar como RESPONDIÓ
                });
              }
            }
            // Si convId es 0 o NULL, se mantiene en false (NO RESPONDIÓ)
          });
        }
      } catch (err) {
        console.error("❌ Excepción al consultar respuestas (chunk):", err);
      }
    }

    return responseMap;
  };
  // ═══════════════════════════════════════════════════════════════════════════════
  //  📊 MÉTRICAS POR RANGO DE FECHAS (12 TABLAS DE CAMPAÑAS)
  //  Implementación de la fórmula correcta con los 5 pasos obligatorios
  // ═══════════════════════════════════════════════════════════════════════════════
  const { data: dayMetrics, isLoading } = useQuery({
    queryKey: ["day-metrics-final-v5", startDate, endDate],
    queryFn: async () => {
      const fechaInicio = format(startDate, "yyyy-MM-dd");
      const fechaFin = format(endDate, "yyyy-MM-dd");

      console.log("🔵 Iniciando cálculo de métricas para rango:", { fechaInicio, fechaFin });

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 1: CONSTRUIR CONJUNTO DE CÉDULAS ÚNICAS DEL RANGO
      // ═══════════════════════════════════════════════════════════════════════
      // Leer las 12 tablas filtrando por fecha BETWEEN fecha_inicio AND fecha_fin
      // Extraer todas las cédulas de la columna "cedulas" (expandir arrays)
      // Unir todas las cédulas de las 12 tablas
      // Eliminar duplicados → resultado: cedulas_unicas_rango
      // ═══════════════════════════════════════════════════════════════════════

      let totalSent = 0;
      let allCedulas: string[] = [];

      console.log("🔹 PASO 1: Extrayendo cédulas de las 12 tablas de campañas...");

      for (const tableName of campaignTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("count_day, cedulas, fecha")
            .gte("fecha", fechaInicio)
            .lte("fecha", fechaFin);

          if (error) {
            console.error(`❌ Error en ${tableName} [${fechaInicio} - ${fechaFin}]:`, error);
            continue;
          }

          if (data && data.length > 0) {
            // Acumular count_day para calcular total de mensajes enviados
            const tableTotal = data.reduce(
              (sum, record) => sum + (record.count_day || 0),
              0
            );
            totalSent += tableTotal;

            // Extraer y acumular todas las cédulas de esta tabla en el rango
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

      // Eliminar duplicados para obtener cédulas únicas del rango
      const uniqueCedulas = Array.from(new Set(allCedulas));

      console.log("✅ PASO 1 completado:", {
        totalCedulasExtraidas: allCedulas.length,
        cedulasUnicasRango: uniqueCedulas.length,
        mensajesEnviadosRango: totalSent
      });

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 2: CALCULAR TOTAL DE WHATSAPP ENVIADOS Y COSTO
      // ═══════════════════════════════════════════════════════════════════════
      // total_whatsapp_enviados_rango = SUM(count_day) de las 12 tablas
      // costo_total_rango = total_whatsapp_enviados_rango * COSTO_POR_MENSAJE
      // ═══════════════════════════════════════════════════════════════════════

      console.log("🔹 PASO 2: Calculando costos...");
      const costoTotal = (totalSent * COSTO_POR_MENSAJE).toFixed(2);

      console.log("✅ PASO 2 completado:", {
        totalWhatsAppEnviados: totalSent,
        costoTotal: `$${costoTotal}`,
        costoPorMensaje: COSTO_POR_MENSAJE
      });

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 3: CLASIFICAR POR CÉDULA (RESPONDIÓ / NO RESPONDIÓ)
      // ═══════════════════════════════════════════════════════════════════════
      // Para cada cédula en cedulas_unicas_rango:
      //   - Buscar en POINT_Competencia
      //   - Si existe AL MENOS UN registro con conversation_id != 0 y != NULL
      //     → marcar como RESPONDIÓ
      //   - Si NO existe ninguno → marcar como NO RESPONDIÓ
      // ═══════════════════════════════════════════════════════════════════════

      console.log("🔹 PASO 3: Clasificando cédulas con REGLA ÚNICA...");
      const responseMap = await clasificarCedulasPorRespuesta(uniqueCedulas);

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 4: CONTAR MÉTRICAS FINALES DEL RANGO
      // ═══════════════════════════════════════════════════════════════════════
      // total_cedulas_unicas_rango = cantidad de elementos en cedulas_unicas_rango
      // respondieron_rango = número de cédulas marcadas como RESPONDIÓ
      // no_respondieron_rango = número de cédulas marcadas como NO RESPONDIÓ
      // ═══════════════════════════════════════════════════════════════════════

      console.log("🔹 PASO 4: Contando métricas finales...");

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

      console.log("✅ PASO 4 completado:", {
        totalCedulasUnicas: uniqueCedulas.length,
        respondieron,
        noRespondieron,
        tasaRespuesta: `${responseRate}%`
      });

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 5: VALIDACIÓN OBLIGATORIA (INVARIANTE)
      // ═══════════════════════════════════════════════════════════════════════
      // Siempre debe cumplirse:
      // respondieron_rango + no_respondieron_rango = total_cedulas_unicas_rango
      // ═══════════════════════════════════════════════════════════════════════

      console.log("🔹 PASO 5: Validando invariante...");

      const suma = respondieron + noRespondieron;
      const esValido = suma === uniqueCedulas.length;

      if (!esValido) {
        console.error("❌❌❌ INVARIANTE VIOLADA ❌❌❌");
        console.error("respondieron + no_respondieron ≠ total_cedulas_unicas");
        console.error({
          respondieron,
          noRespondieron,
          suma,
          totalCedulasUnicas: uniqueCedulas.length,
          diferencia: suma - uniqueCedulas.length
        });
      } else {
        console.log("✅ PASO 5: Invariante cumplida correctamente");
        console.log(`✅ ${respondieron} + ${noRespondieron} = ${uniqueCedulas.length}`);
      }

      console.log("🎯 Cálculo de rango completado exitosamente");

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
  // ═══════════════════════════════════════════════════════════════════════════════
  //  📊 DETALLE POR CAMPAÑA - DÍA ESPECÍFICO (12 TABLAS + GLOBAL DÍA)
  //  Aplicando la misma fórmula correcta con REGLA ÚNICA
  // ═══════════════════════════════════════════════════════════════════════════════
  const { data: campaignDetails, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaign-details-final-v5", campaignFilterDate],
    queryFn: async () => {
      const fechaConsulta = format(campaignFilterDate, "yyyy-MM-dd");

      console.log("🔵 Iniciando cálculo de métricas para día específico:", fechaConsulta);

      const campaigns: any[] = [];
      let totalSent = 0;
      let allCedulasDia: string[] = []; console.log("🔹 PASO 1 (DÍA): Extrayendo cédulas de las 12 tablas para el día...");

      for (const tableName of campaignTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("count_day, cedulas, fecha")
            .gte("fecha", fechaConsulta)
            .lte("fecha", fechaConsulta);

          if (error) {
            console.error(`❌ Error querying ${tableName}:`, error);
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

            console.log(`✅ ${tableName}: ${tableSent} mensajes, ${cedulasUnicasCampana.length} cédulas únicas`);

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
            console.log(`⚪ ${tableName}: Sin datos para esta fecha`);
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
          console.error(`❌ Error accessing table ${tableName}:`, err);
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

      console.log(`📊 Total de campañas procesadas: ${campaigns.length}/12`);
      console.log(`📊 Campañas con datos: ${campaigns.filter(c => c.sent > 0).length}`);
      console.log(`📊 Campañas sin datos: ${campaigns.filter(c => c.sent === 0).length}`);

      // ═══════════════════════════════════════════════════════════════════════
      // CÉDULAS ÚNICAS DEL DÍA (UNIÓN DE LAS 12 CAMPAÑAS)
      // ═══════════════════════════════════════════════════════════════════════
      const uniqueCedulasDia = Array.from(new Set(allCedulasDia));

      console.log("✅ PASO 1 (DÍA) completado:", {
        totalCedulasExtraidas: allCedulasDia.length,
        cedulasUnicasDia: uniqueCedulasDia.length,
        mensajesEnviadosDia: totalSent
      });

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 2 (DÍA): COSTO TOTAL DEL DÍA
      // ═══════════════════════════════════════════════════════════════════════
      const totalCostDia = (totalSent * COSTO_POR_MENSAJE).toFixed(2);

      console.log("✅ PASO 2 (DÍA) completado:", {
        totalWhatsAppEnviadosDia: totalSent,
        costoTotalDia: `$${totalCostDia}`
      });

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 3 (DÍA): APLICAR REGLA ÚNICA PARA CLASIFICAR RESPUESTAS
      // ═══════════════════════════════════════════════════════════════════════
      console.log("🔹 PASO 3 (DÍA): Clasificando cédulas con REGLA ÚNICA...");
      const responseMap = await clasificarCedulasPorRespuesta(uniqueCedulasDia);

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 4 (DÍA): CONTAR MÉTRICAS - GLOBAL DEL DÍA
      // ═══════════════════════════════════════════════════════════════════════
      // Resumen global del día (por cédula única, SIN duplicar por campaña)
      console.log("🔹 PASO 4 (DÍA): Contando métricas globales del día...");

      let overallRespondedDia = 0;
      let overallNotRespondedDia = 0;

      uniqueCedulasDia.forEach((cedula) => {
        const didRespond = responseMap.get(cedula);
        if (didRespond) overallRespondedDia++;
        else overallNotRespondedDia++;
      });

      console.log("✅ Métricas globales del día:", {
        totalCedulasUnicasDia: uniqueCedulasDia.length,
        respondieronDia: overallRespondedDia,
        noRespondieronDia: overallNotRespondedDia
      });

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 4 (DÍA): CONTAR MÉTRICAS - POR CAMPAÑA
      // ═══════════════════════════════════════════════════════════════════════
      // Detalle por campaña usando la MISMA REGLA ÚNICA
      console.log("🔹 Calculando métricas por campaña...");

      campaigns.forEach((campaign: any) => {
        let campaignResponded = 0;
        let campaignNotResponded = 0;

        campaign.cedulas.forEach((cedula: string) => {
          const didRespond = responseMap.get(cedula);
          if (didRespond) campaignResponded++;
          else campaignNotResponded++;
        }); campaign.responded = campaignResponded;
        campaign.notResponded = campaignNotResponded;

        // MANTENER las cédulas para el análisis detallado de respondedores
        // NO eliminar campaign.cedulas - se usarán en CampaignRespondersAnalysis
      });

      // ═══════════════════════════════════════════════════════════════════════
      // PASO 5 (DÍA): VALIDACIÓN DE INVARIANTE
      // ═══════════════════════════════════════════════════════════════════════
      console.log("🔹 PASO 5 (DÍA): Validando invariante...");

      const sumaDia = overallRespondedDia + overallNotRespondedDia;
      const esValidoDia = sumaDia === uniqueCedulasDia.length;

      if (!esValidoDia) {
        console.error("❌❌❌ INVARIANTE VIOLADA EN DÍA ❌❌❌");
        console.error("respondieron + no_respondieron ≠ total_cedulas_unicas_dia");
        console.error({
          respondieronDia: overallRespondedDia,
          noRespondieronDia: overallNotRespondedDia,
          suma: sumaDia,
          totalCedulasUnicasDia: uniqueCedulasDia.length,
          diferencia: sumaDia - uniqueCedulasDia.length
        });
      } else {
        console.log("✅ PASO 5 (DÍA): Invariante cumplida correctamente");
        console.log(`✅ ${overallRespondedDia} + ${overallNotRespondedDia} = ${uniqueCedulasDia.length}`);
      }

      console.log("🎯 Cálculo de día específico completado exitosamente");

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

  // Definición de campañas de mora para la Tabla de Decisión
  const moraCampaigns = [
    { name: "MORA NEGATIVA 6", diasMora: -6, type: "negative" },
    { name: "MORA NEGATIVA 5", diasMora: -5, type: "negative" },
    { name: "MORA NEGATIVA 4", diasMora: -4, type: "negative" },
    { name: "MORA NEGATIVA 3", diasMora: -3, type: "negative" },
    { name: "MORA NEGATIVA 2", diasMora: -2, type: "negative" },
    { name: "MORA NEGATIVA 1", diasMora: -1, type: "negative" },
    { name: "DIAS MORA 0", diasMora: 0, type: "zero" },
    { name: "MORA POSITIVA 1", diasMora: 1, type: "positive" },
    { name: "MORA POSITIVA 2", diasMora: 2, type: "positive" },
    { name: "MORA POSITIVA 3", diasMora: 3, type: "positive" },
    { name: "MORA POSITIVA 4", diasMora: 4, type: "positive" },
    { name: "MORA POSITIVA 5", diasMora: 5, type: "positive" },
    { name: "MORA POSITIVA 6", diasMora: 6, type: "positive" },
  ];

  const { data: decisionTableData, isLoading: isLoadingDecisionTable, refetch: refetchDecisionTable } = useQuery({
    queryKey: ["decision-table-mora-campaigns"],
    queryFn: async () => {
      console.log("🔵 ========================================");
      console.log("🔵 TABLA DE DECISIÓN - CAMPAÑAS DE MORA");
      console.log("🔵 ========================================");

      const results: any[] = [];

      // Primero, verificar que la tabla tenga datos
      const { count: totalCount, error: countError } = await supabase
        .from("POINT_Competencia")
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error("❌ ERROR al contar registros:", countError);
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con la base de datos.",
          variant: "destructive",
        });
      }

      // Si no hay datos en absoluto, devolver ceros
      if (!totalCount) {
        console.warn("⚠️ La tabla POINT_Competencia está vacía.");
        return moraCampaigns.map(c => ({
          name: c.name,
          count: 0,
          error: false,
          countWithoutFilters: 0
        }));
      }

      // Iterar sobre cada campaña
      for (const campaign of moraCampaigns) {
        try {
          // Construir query base
          let query = supabase
            .from("POINT_Competencia")
            .select("*", { count: "exact", head: true })
            .eq("DiasMora", campaign.diasMora);

          // Filtros específicos por tipo
          if (campaign.type === "negative" || campaign.type === "zero") {
            query = query.gt("SaldoPorVencer", 5);
          } else {
            query = query.gt("SaldoVencido", 5);
          }

          // Filtros comunes
          query = query
            .neq("Pagado", "SI")
            .neq("Compromiso", "SI")
            .neq("Equivocado", "SI")
            .is("GestionHumana", null)
            .is("ComprobanteEnviado", null)
            .neq("DiceQueYaPago", "SI")
            .is("compromiso_pago_fecha", null);

          const { count, error } = await query;

          if (error) {
            console.error(`❌ Error en campaña ${campaign.name}:`, error);
            results.push({
              name: campaign.name,
              count: 0,
              error: true,
              errorMessage: error.message,
            });
          } else {
            console.log(`   ✅ ${campaign.name}: ${count} registros`);
            results.push({
              name: campaign.name,
              count: count || 0,
              error: false,
            });
          }
        } catch (err: any) {
          console.error(`❌ Excepción en campaña ${campaign.name}:`, err);
          results.push({
            name: campaign.name,
            count: 0,
            error: true,
            errorMessage: err.message,
          });
        }
      }

      const totalElegibles = results.reduce((sum, r) => sum + r.count, 0);
      console.log(`\n📊 RESUMEN FINAL:`);
      console.log(`   Total de registros elegibles: ${totalElegibles}`);
      console.log("🔵 ========================================\n");

      return results;
    },
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
      </Card >

      {/* ========================================= */}
      {/*     MÉTRICAS POR DÍA (RANGO DE FECHAS)   */}
      {/* ========================================= */}
      <div className="flex items-center justify-between">        <div>
        <h2 className="text-2xl font-bold mb-2">Métricas por Día</h2>
        <p className="text-muted-foreground">
          Analiza el rendimiento por rango de fechas de las 12 campañas
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

      {
        isLoading ? (
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
                variant="primary"
              />
              <MetricCard
                title="Costo Total"
                value={`$${dayMetrics?.totalCost || "0.00"}`}
                icon={DollarSign}
                description="Estimado: mensajes enviados × $0.014"
                variant="primary"
              />
              <MetricCard
                title="Respondieron"
                value={dayMetrics?.responded?.toLocaleString() || "0"}
                icon={UserCheck}
                description={`${dayMetrics?.responseRate || "0"}% de las personas contactadas en el rango`}
                variant="success"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title="No Respondieron"
                value={dayMetrics?.notResponded?.toLocaleString() || "0"}
                icon={UserX}
                description="Personas contactadas que no han respondido en el rango"
                variant="destructive"
              />
              <MetricCard
                title="Cédulas Únicas (Rango)"
                value={dayMetrics?.totalCedulasUnicas?.toLocaleString() || "0"}
                icon={Users}
                description="Total de personas distintas contactadas en todas las campañas"
                variant="primary"
              />
            </div>
          </div>
        )
      }

      {/* ================================================== */}
      {/*   DETALLE POR CAMPAÑA - DÍA ESPECÍFICO (8 TABLAS)  */}
      {/* ================================================== */}
      <Card className="border-2 border-blue-200">
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
              </div>              {/* Desglose por tabla de campaña */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Desglose por Tabla de Campaña</h3>

                {campaignDetails?.campaigns
                  ?.filter((campaign: any) => campaign.sent > 0) // Solo mostrar campañas con mensajes enviados
                  .map((campaign: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 border-2 border-blue-200 rounded-lg hover:from-blue-50 hover:to-blue-100 transition-colors space-y-2 bg-gradient-to-br from-white to-blue-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Tabla de campaña
                          </div>
                        </div>
                      </div>                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
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

                      {/* Análisis detallado de respondedores */}
                      {campaign.cedulas && campaign.cedulas.length > 0 && (
                        <CampaignRespondersAnalysis
                          campaignName={campaign.name}
                          campaignCedulas={campaign.cedulas}
                          totalSent={campaign.sent}
                          responded={campaign.responded}
                        />
                      )}
                    </div>
                  ))}

                {campaignDetails?.campaigns &&
                  campaignDetails.campaigns.filter((c: any) => c.sent > 0).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No hay datos de campaña para esta fecha.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verifica que existan registros en las tablas: point_mora_neg5,
                        point_mora_neg4, point_mora_neg3, point_mora_neg2, point_mora_neg1,
                        point_mora_pos1, point_mora_pos2, point_mora_pos3, point_mora_pos4,
                        point_mora_pos5, point_compromiso_pago y point_reactivacion_cobro.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 📊 TABLA DE DECISIÓN - REGISTROS ELEGIBLES PARA CAMPAÑAS DE MORA */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">📊 Tabla de Decisión - Campañas de Mora</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Muestra cuántos registros elegibles hay en <strong>POINT_Competencia</strong> para enviar cada campaña.
                Usa esta tabla para decidir qué campañas ejecutar.
              </p>
            </div>            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                console.log("🔄 Actualizando tabla de decisión...");
                toast({
                  title: "🔄 Actualizando datos",
                  description: "Consultando registros elegibles en POINT_Competencia...",
                });
                const result = await refetchDecisionTable();
                if (result.isSuccess) {
                  toast({
                    title: "✅ Datos actualizados",
                    description: "La tabla de decisión se ha actualizado correctamente",
                  });
                }
              }}
              disabled={isLoadingDecisionTable}
              className={cn(
                "transition-all",
                isLoadingDecisionTable && "opacity-70 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingDecisionTable && "animate-spin")} />
              {isLoadingDecisionTable ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDecisionTable ? (
            <div className="flex justify-center py-8">
              <LoadingState message="Consultando registros elegibles..." />
            </div>
          ) : (
            <div className="space-y-4">              {/* Explicación de filtros */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
                <p className="font-semibold text-blue-900">Filtros aplicados (5 filtros cada campaña):</p>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li>
                    <strong>Mora Negativa (-5 a 0):</strong> DiasMora Equals 0/-1/-2/-3/-4/-5, SaldoPorVencer Greater Than 5, compromiso_pago_fecha Is null, Pagado Equals NO, ComprobanteEnviado Is null
                  </li>
                  <li>
                    <strong>Mora Positiva (1 a 5):</strong> DiasMora Equals 1/2/3/4/5, SaldoVencido Greater Than 5, compromiso_pago_fecha Is null, Pagado Equals NO, ComprobanteEnviado Is null
                  </li>
                </ul>
              </div>

              {/* Tabla de resultados */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left p-3 font-semibold">Campaña</th>
                      <th className="text-center p-3 font-semibold">Registros Elegibles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisionTableData?.map((row: any, idx: number) => {
                      const isNegative = row.name.includes("NEGATIVA");
                      const hasRecords = row.count > 0;

                      return (
                        <tr
                          key={idx}
                          className={cn(
                            "border-b hover:bg-gray-50 transition-colors",
                            hasRecords ? "bg-white" : "bg-gray-50/50"
                          )}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  isNegative ? "bg-red-500" : "bg-green-500"
                                )}
                              />
                              <span className="font-medium">{row.name}</span>
                            </div>
                          </td>                          <td className="p-3 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold",
                                hasRecords
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {row.count.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Resumen */}
              <div className="flex gap-4 justify-center pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total de Registros</p>
                  <p className="text-2xl font-bold text-foreground">
                    {decisionTableData?.reduce((sum: number, row: any) => sum + row.count, 0).toLocaleString() || "0"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Campañas con Datos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {decisionTableData?.filter((row: any) => row.count > 0).length || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Campañas sin Datos</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {decisionTableData?.filter((row: any) => row.count === 0).length || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
};

export default DayByDayTab;
