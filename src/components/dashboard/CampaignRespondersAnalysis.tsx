import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import LoadingState from "@/components/ui/loading-state";

// Interfaz para datos de responder
interface ResponderData {
  Cedula: number;
  Cliente: string;
  Celular: number;
  SaldoVencido: number;
  SaldoPorVencer: number;
  RestanteSaldoVencido: number;
  DiasMora: number;
  ComprobanteEnviado: string | null;
  DiceQueYaPago: string | null;
  LlamarOtraVez: string | null;
  TipoDePago: string | null;
  compromiso_pago_fecha: string | null;
  EstadoEtiqueta: string | null;
}

// Interfaz para análisis y recomendación
interface CampaignAnalysis {
  totalResponders: number;
  responders: ResponderData[];
  efectiveResponseRate: number; // % que respondieron vs total contactado
  alreadyPaidRate: number; // % que ya pagaron completamente + que no deben nada
  partialPaymentRate: number; // % con pago parcial (queda saldo restante)
  noDebtAnymoreRate: number; // % que ya no tienen deuda (saldo = 0)
  sentReceiptRate: number; // % que enviaron comprobante (3 condiciones)
  agendoCompromisoRate: number; // % que agendaron compromiso de pago
  totalPendingDebt: number; // Suma de saldo pendiente real
  averageDiasMora: number; // Promedio de días de mora
  recommendation: "YES" | "NO";
  recommendationReason: string;
}

interface CampaignRespondersAnalysisProps {
  campaignName: string;
  campaignCedulas: string[];
  totalSent: number;
  responded: number;
}

export const CampaignRespondersAnalysis = ({
  campaignName,
  campaignCedulas,
  totalSent,
  responded
}: CampaignRespondersAnalysisProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Extrae el valor de DiasMora del nombre de la campaña
   * Ejemplos:
   * - "MORA NEGATIVA 5" → -5
   * - "MORA POSITIVA 3" → 3
   * - "COMPROMISO DE PAGO" → null
   */
  const getCampaignDiasMora = (name: string): number | null => {
    const moraMatch = name.match(/MORA (NEGATIVA|POSITIVA) (\d+)/);
    if (moraMatch) {
      const value = parseInt(moraMatch[2], 10);
      return moraMatch[1] === "NEGATIVA" ? -value : value;
    }
    return null;
  };

  /**
   * Función para obtener datos detallados de respondedores
   */
  const fetchRespondersDetails = async () => {
    if (isLoading || analysis) return; // Evitar múltiples llamadas

    setIsLoading(true);
    console.log(`🔍 Obteniendo detalles de respondedores para: ${campaignName}`);

    // Extraer DiasMora de la campaña
    const campaignDiasMora = getCampaignDiasMora(campaignName);
    console.log(`   📍 DiasMora de la campaña: ${campaignDiasMora}`);

    try {
      // Consultar POINT_Competencia para las cédulas de la campaña
      const CHUNK_SIZE = 500;
      const allResponders: ResponderData[] = [];

      // Convertir cédulas a números para consulta
      const numericCedulas = campaignCedulas.map(c => {
        const cleaned = c.replace(/\D/g, "");
        return cleaned ? parseInt(cleaned, 10) : null;
      }).filter(n => n !== null && !isNaN(n));

      console.log(`   📊 Total de cédulas a consultar: ${numericCedulas.length}`);

      for (let i = 0; i < numericCedulas.length; i += CHUNK_SIZE) {
        const chunk = numericCedulas.slice(i, i + CHUNK_SIZE);

        // Construir query base
        let query = supabase
          .from("POINT_Competencia")
          .select(`
            Cedula,
            Cliente,
            Celular,
            SaldoVencido,
            SaldoPorVencer,
            RestanteSaldoVencido,
            DiasMora,
            ComprobanteEnviado,
            DiceQueYaPago,
            LlamarOtraVez,
            TipoDePago,
            compromiso_pago_fecha,
            conversation_id,
            EstadoEtiqueta
          `)
          .in("Cedula", chunk)
          .not("conversation_id", "is", null)
          .neq("conversation_id", 0);

        // ⚠️ REMOVIDO: No filtrar por DiasMora aquí para evitar discrepancias
        // si el usuario cambió de mora pero sigue siendo el mismo respondedor
        // if (campaignDiasMora !== null) {
        //   query = query.eq("DiasMora", campaignDiasMora);
        // }

        const { data, error } = await query;

        if (error) {
          console.error(`   ❌ Error consultando chunk: ${error.message}`);
          continue;
        }

        if (data && data.length > 0) {
          allResponders.push(...data);
          console.log(`   ✅ Chunk ${i / CHUNK_SIZE + 1}: ${data.length} respondedores`);
        }
      }

      console.log(`   🎯 Total respondedores encontrados: ${allResponders.length}`);

      // Identificar tipo de campaña (MOVIDO ARRIBA para usar en deduplicación)
      const isNegativeCampaign = campaignDiasMora !== null && campaignDiasMora < 0;
      const isPositiveCampaign = campaignDiasMora !== null && campaignDiasMora > 0;
      const isCompromisoPago = campaignName.includes("COMPROMISO PAGO");
      const isReactivacion = campaignName.includes("REACTIVACIÓN") || campaignName.includes("REACTIVACION");
      const isMoraCero = campaignName.includes("MORA CERO");

      // ✅ ELIMINAR DUPLICADOS POR CÉDULA (mantener solo uno por persona)
      // Lógica: Agrupar por Cédula y priorizar el registro que coincide con el DiasMora de la campaña
      const respondersByCedula = new Map<number, ResponderData[]>();
      allResponders.forEach(r => {
        if (!respondersByCedula.has(r.Cedula)) {
          respondersByCedula.set(r.Cedula, []);
        }
        respondersByCedula.get(r.Cedula)!.push(r);
      });

      const uniqueResponders: ResponderData[] = [];
      respondersByCedula.forEach((records) => {
        // 1. Buscar coincidencia exacta con DiasMora de la campaña
        let selected = records.find(r => r.DiasMora === campaignDiasMora);

        // 2. Si no hay coincidencia exacta, intentar buscar el que tenga saldo > 0 (si es campaña de cobro)
        if (!selected && (isPositiveCampaign || isNegativeCampaign)) {
          // Preferir el que tenga saldo pendiente si no hay match exacto de días
          selected = records.find(r => r.SaldoVencido > 0 || r.SaldoPorVencer > 0);
        }

        // 3. Fallback: usar el primero
        if (!selected) {
          selected = records[0];
        }
        uniqueResponders.push(selected);
      });

      if (uniqueResponders.length < allResponders.length) {
        console.log(`   🔹 Duplicados eliminados: ${allResponders.length - uniqueResponders.length}`);
        console.log(`   🎯 Respondedores únicos: ${uniqueResponders.length}`);
      }

      // ═══════════════════════════════════════════════════════════════════
      // CALCULAR MÉTRICAS RELEVANTES SEGÚN TIPO DE CAMPAÑA
      // ═══════════════════════════════════════════════════════════════════
      const totalResponders = uniqueResponders.length;

      console.log(`   📍 Tipo de campaña identificado:`, {
        isNegativeCampaign,
        isPositiveCampaign,
        isCompromisoPago,
        isReactivacion,
        isMoraCero
      });

      // 1. PERSONAS QUE YA PAGARON COMPLETAMENTE
      // Criterio: TipoDePago = Total
      const alreadyPaidFull = uniqueResponders.filter(r =>
        r.TipoDePago === 'Total'
      ).length;

      // 2. PERSONAS CON PAGO PARCIAL (aún deben el saldo restante)
      // Criterio: TipoDePago = Parcial (queda saldo en RestanteSaldoVencido)
      const partialPayment = uniqueResponders.filter(r =>
        r.TipoDePago === 'Parcial'
      ).length;

      // 3. PERSONAS QUE ENVIARON COMPROBANTE (validación de 2 condiciones principales)
      // ComprobanteEnviado = Si/SI AND DiceQueYaPago = Si/SI
      // Nota: LlamarOtraVez puede ser NO si no se pudo contactar después del pago
      // Nota: Comparación case-insensitive porque en la BD puede ser "SI" o "Si"
      let validReceiptCount = 0;
      let examplesShown = 0;

      const sentReceipt = uniqueResponders.filter(r => {
        const hasReceipt = r.ComprobanteEnviado?.trim().toLowerCase() === 'si' &&
          r.DiceQueYaPago?.trim().toLowerCase() === 'si';

        // Log para debugging (mostrar primeros 5 casos válidos)
        if (hasReceipt && examplesShown < 5) {
          console.log(`   ✅ Ejemplo #${examplesShown + 1} - Comprobante válido:`, {
            Cedula: r.Cedula,
            Cliente: r.Cliente,
            ComprobanteEnviado: `"${r.ComprobanteEnviado}"`,
            DiceQueYaPago: `"${r.DiceQueYaPago}"`,
            LlamarOtraVez: `"${r.LlamarOtraVez}"`,
            nota: 'LlamarOtraVez NO afecta la validación'
          });
          examplesShown++;
        }

        // También mostrar primeros 3 casos inválidos para comparación
        if (!hasReceipt && validReceiptCount < 3) {
          console.log(`   ❌ Ejemplo inválido:`, {
            Cedula: r.Cedula,
            Cliente: r.Cliente,
            ComprobanteEnviado: `"${r.ComprobanteEnviado}"`,
            DiceQueYaPago: `"${r.DiceQueYaPago}"`,
            razon: r.ComprobanteEnviado?.trim() !== 'Si' ?
              'ComprobanteEnviado no es "Si"' :
              'DiceQueYaPago no es "Si"'
          });
          validReceiptCount++;
        }

        return hasReceipt;
      }).length;

      console.log(`   📋 Total con comprobante válido: ${sentReceipt} de ${uniqueResponders.length} (${((sentReceipt / uniqueResponders.length) * 100).toFixed(1)}%)`);

      // 4. PERSONAS QUE YA NO DEBEN NADA (saldo = 0 en el sistema)
      // Lógica por tipo de campaña:
      // - Campañas positivas (1-5) + REACTIVACIÓN: SaldoVencido = 0
      // - Campañas negativas (-5 a -1) + MORA CERO: SaldoPorVencer = 0
      // - COMPROMISO DE PAGO: SaldoVencido = 0 AND SaldoPorVencer = 0
      const noDebtAnymore = uniqueResponders.filter(r => {
        if (isPositiveCampaign || isReactivacion) {
          return r.SaldoVencido === 0;
        } else if (isNegativeCampaign || isMoraCero) {
          return r.SaldoPorVencer === 0;
        } else if (isCompromisoPago) {
          return r.SaldoVencido === 0 && r.SaldoPorVencer === 0;
        }
        return false;
      }).length;

      // 5. CALCULAR DEUDA REAL PENDIENTE
      // Lógica diferenciada por tipo de campaña y estado de pago
      let totalPendingDebt = 0;

      uniqueResponders.forEach(r => {
        // 1. Si envió comprobante (ComprobanteEnviado = SI) → deuda = 0 (En revisión)
        if (r.ComprobanteEnviado?.trim().toLowerCase() === 'si') {
          totalPendingDebt += 0;
        }
        // 2. Si pagó TODO (TipoDePago = Total) → deuda = 0
        else if (r.TipoDePago === 'Total') {
          totalPendingDebt += 0;
        }
        // 3. Si pagó PARCIAL (TipoDePago = Parcial) → deuda = saldo restante
        else if (r.TipoDePago === 'Parcial') {
          totalPendingDebt += (r.RestanteSaldoVencido || 0);
        }
        // 4. Si NO ha pagado → calcular según Tipo de Campaña (Prioridad)
        else {
          // CAMPAÑAS POSITIVAS (1-5) + REACTIVACIÓN COBRO → Usar SaldoVencido
          if (isPositiveCampaign || isReactivacion) {
            totalPendingDebt += (r.SaldoVencido || 0);
          }
          // CAMPAÑAS NEGATIVAS (-5 a -1) + MORA CERO → Usar SaldoPorVencer
          else if (isNegativeCampaign || isMoraCero) {
            totalPendingDebt += (r.SaldoPorVencer || 0);
          }
          // COMPROMISO DE PAGO → Lógica condicional según Días Mora
          else if (isCompromisoPago) {
            if (r.DiasMora !== null && r.DiasMora <= 0) {
              totalPendingDebt += (r.SaldoPorVencer || 0);
            } else {
              totalPendingDebt += (r.SaldoVencido || 0);
            }
          }
          // Fallback: Lógica basada en Días Mora si no coincide campaña
          else if (r.DiasMora !== null && r.DiasMora !== undefined) {
            if (r.DiasMora <= 0) {
              totalPendingDebt += (r.SaldoPorVencer || 0);
            } else {
              totalPendingDebt += (r.SaldoVencido || 0);
            }
          }
        }
      });

      // 6. PROMEDIO DE DÍAS DE MORA
      const avgMora = uniqueResponders.length > 0
        ? uniqueResponders.reduce((sum, r) => sum + (r.DiasMora || 0), 0) / uniqueResponders.length
        : 0;

      // 7. TASA DE RESPUESTA EFECTIVA
      const efectiveResponseRate = campaignCedulas.length > 0
        ? (totalResponders / campaignCedulas.length) * 100
        : 0;

      // 8. TASAS PORCENTUALES
      const alreadyPaidRate = totalResponders > 0
        ? ((alreadyPaidFull + noDebtAnymore) / totalResponders) * 100
        : 0;

      const partialPaymentRate = totalResponders > 0
        ? (partialPayment / totalResponders) * 100
        : 0;

      const noDebtAnymoreRate = totalResponders > 0
        ? (noDebtAnymore / totalResponders) * 100
        : 0;

      const sentReceiptRate = totalResponders > 0
        ? (sentReceipt / totalResponders) * 100
        : 0;

      const agendoCompromisoCount = uniqueResponders.filter(r => r.compromiso_pago_fecha).length;
      const agendoCompromisoRate = totalResponders > 0
        ? (agendoCompromisoCount / totalResponders) * 100
        : 0;

      // ═══════════════════════════════════════════════════════════════════
      // LÓGICA DE RECOMENDACIÓN BASADA EN ESCENARIOS REALES
      // ═══════════════════════════════════════════════════════════════════
      let recommendation: "YES" | "NO" = "NO";
      let recommendationReason = "";

      console.log(`   📊 Análisis de campaña:`, {
        totalResponders,
        alreadyPaidFull,
        partialPayment,
        noDebtAnymore,
        totalPendingDebt,
        efectiveResponseRate: `${efectiveResponseRate.toFixed(1)}%`,
        alreadyPaidRate: `${alreadyPaidRate.toFixed(1)}%`,
        partialPaymentRate: `${partialPaymentRate.toFixed(1)}%`,
        noDebtAnymoreRate: `${noDebtAnymoreRate.toFixed(1)}%`,
        agendoCompromisoRate: `${agendoCompromisoRate.toFixed(1)}%`
      });

      // CRITERIO 1: Si la mayoría ya pagó o ya no debe, NO re-enviar
      if (alreadyPaidRate > 60) {
        recommendation = "NO";
        recommendationReason = `${alreadyPaidRate.toFixed(1)}% ya pagaron o no deben nada. La campaña ya fue efectiva.`;
      }
      // CRITERIO 2: Si la tasa de respuesta es muy baja, NO vale la pena
      else if (efectiveResponseRate < 15) {
        recommendation = "NO";
        recommendationReason = `Tasa de respuesta muy baja (${efectiveResponseRate.toFixed(1)}%). No es efectiva esta campaña.`;
      }
      // CRITERIO 3: Si la deuda pendiente es muy baja, NO justifica el costo
      else if (totalPendingDebt < 500) {
        recommendation = "NO";
        recommendationReason = `Deuda pendiente muy baja ($${totalPendingDebt.toFixed(2)}). No justifica el costo del re-envío.`;
      }
      // CRITERIO 4: Si hay muchos pagos parciales, SÍ vale la pena hacer seguimiento
      else if (partialPaymentRate > 30 && totalPendingDebt > 1000) {
        recommendation = "YES";
        recommendationReason = `${partialPaymentRate.toFixed(1)}% tienen pagos parciales con deuda restante de $${totalPendingDebt.toFixed(2)}. Vale la pena hacer seguimiento.`;
      }
      // CRITERIO 5: Tasa de respuesta alta + deuda significativa = potencial de recuperación
      else if (efectiveResponseRate > 30 && totalPendingDebt > 2000 && alreadyPaidRate < 40) {
        recommendation = "YES";
        recommendationReason = `Alta respuesta (${efectiveResponseRate.toFixed(1)}%) y deuda significativa ($${totalPendingDebt.toFixed(2)}). Solo ${alreadyPaidRate.toFixed(1)}% han pagado. Potencial de recuperación.`;
      }
      // CRITERIO 6: Respuesta moderada + deuda moderada = analizar balance
      else if (efectiveResponseRate >= 20 && totalPendingDebt >= 1000) {
        const stillPendingRate = 100 - alreadyPaidRate;
        if (stillPendingRate > 50) {
          recommendation = "YES";
          recommendationReason = `Respuesta ${efectiveResponseRate.toFixed(1)}%, ${stillPendingRate.toFixed(1)}% aún no han pagado con deuda de $${totalPendingDebt.toFixed(2)}. Vale la pena insistir.`;
        } else {
          recommendation = "NO";
          recommendationReason = `Solo ${stillPendingRate.toFixed(1)}% no han pagado. La mayoría ya gestionó su deuda.`;
        }
      }
      // CRITERIO 7: Caso por defecto
      else {
        recommendation = "NO";
        recommendationReason = `Métricas no justifican re-envío. Mejor enfocar recursos en otras campañas con mayor potencial.`;
      }

      const analysisResult: CampaignAnalysis = {
        totalResponders,
        responders: uniqueResponders, // ✅ Usar respondedores únicos
        efectiveResponseRate,
        alreadyPaidRate,
        partialPaymentRate,
        noDebtAnymoreRate,
        sentReceiptRate,
        agendoCompromisoRate,
        totalPendingDebt,
        averageDiasMora: avgMora,
        recommendation,
        recommendationReason,
      };

      setAnalysis(analysisResult);
      console.log(`   ✅ Análisis completado:`, analysisResult);

    } catch (err: any) {
      console.error(`   ❌ Error obteniendo datos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = async () => {
    if (!isExpanded && !analysis) {
      // Primera vez que se expande: obtener datos
      await fetchRespondersDetails();
    }
    setIsExpanded(!isExpanded);
  };

  // Determinar si mostrar la tarjeta "Sin Deuda"
  // Solo mostrar para mora positiva (1-6)
  const showSinDeuda = analysis && getCampaignDiasMora(campaignName) !== null && getCampaignDiasMora(campaignName)! > 0;

  return (
    <div>
      {/* Botón para expandir/colapsar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleExpand}
        className="w-full justify-between text-left hover:bg-accent/70"
      >
        <span className="font-medium text-sm">Ver análisis detallado de respondedores</span>
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Contenido expandido */}
      {isExpanded && (
        <div className="mt-4 space-y-4 pl-4 border-l-2 border-blue-200">
          {isLoading ? (
            <LoadingState message="Cargando datos de respondedores..." />
          ) : analysis ? (
            <>
              {/* Recomendación principal */}
              <div className={cn(
                "p-4 rounded-lg border-2",
                analysis.recommendation === "YES"
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              )}>
                <div className="flex items-center gap-3 mb-2">
                  {analysis.recommendation === "YES" ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-bold text-lg">
                      Recomendación: {analysis.recommendation === "YES" ? "✅ SÍ RE-ENVIAR" : "❌ NO RE-ENVIAR"}
                    </p>
                    <p className="text-sm text-muted-foreground">{analysis.recommendationReason}</p>
                  </div>
                </div>
              </div>

              {/* Métricas clave */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Tasa Respuesta</p>
                  <p className="text-xl font-bold text-blue-700">
                    {analysis.efectiveResponseRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {analysis.totalResponders} / {campaignCedulas.length}
                  </p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Ya Pagaron</p>
                  <p className="text-xl font-bold text-green-700">
                    {analysis.alreadyPaidRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">TipoDePago=Total</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Pagos Parciales</p>
                  <p className="text-xl font-bold text-purple-700">
                    {analysis.partialPaymentRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">TipoDePago=Parcial</p>
                </div>

                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Comprobante Enviado</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {analysis.sentReceiptRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">ComprobanteEnviado=Si + DiceQueYaPago=Si</p>
                </div>

                <div className="bg-cyan-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Agendó Compromiso</p>
                  <p className="text-xl font-bold text-cyan-700">
                    {analysis.agendoCompromisoRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Tiene fecha compromiso</p>
                </div>

                {showSinDeuda && (
                  <div className="bg-teal-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Sin Deuda</p>
                    <p className="text-xl font-bold text-teal-700">
                      {analysis.noDebtAnymoreRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Saldo = 0</p>
                  </div>
                )}

                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Deuda Pendiente</p>
                  <p className="text-xl font-bold text-orange-700">
                    ${analysis.totalPendingDebt.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total real</p>
                </div>
              </div>

              {/* Tabla de respondedores */}
              {analysis.responders.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Respondedores ({analysis.totalResponders})</h4>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 bg-gray-100">
                        <tr className="border-b-2">
                          <th className="text-left p-2 font-semibold">Cédula</th>
                          <th className="text-left p-2 font-semibold">Cliente</th>
                          <th className="text-left p-2 font-semibold">Celular</th>
                          <th className="text-right p-2 font-semibold">Saldo Vencido</th>
                          <th className="text-right p-2 font-semibold">Saldo Por Vencer</th>
                          <th className="text-center p-2 font-semibold">Días Mora</th>
                          <th className="text-center p-2 font-semibold">Comprobante Enviado</th>
                          <th className="text-center p-2 font-semibold">Estado Etiqueta</th>
                          <th className="text-center p-2 font-semibold">Agendó Compromiso en Chat</th>
                          <th className="text-center p-2 font-semibold">Tipo Pago</th>
                          <th className="text-right p-2 font-semibold">Saldo Restante</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.responders.map((responder, idx) => {
                          // Identificar tipo de campaña
                          const campaignDiasMora = getCampaignDiasMora(campaignName);
                          const isNegativeCampaign = campaignDiasMora !== null && campaignDiasMora < 0;
                          const isPositiveCampaign = campaignDiasMora !== null && campaignDiasMora > 0;
                          const isCompromisoPago = campaignName.includes("COMPROMISO PAGO");
                          const isReactivacion = campaignName.includes("REACTIVACIÓN") || campaignName.includes("REACTIVACION");
                          const isMoraCero = campaignName.includes("MORA CERO");

                          // Determinar deuda relevante según tipo de campaña
                          let relevantDebt = 0;

                          // 1. Si envió comprobante (ComprobanteEnviado = SI) → deuda = 0 (En revisión)
                          if (responder.ComprobanteEnviado?.trim().toLowerCase() === 'si') {
                            relevantDebt = 0;
                          }
                          // 2. Si no ha enviado comprobante, calcular según Tipo de Campaña (Prioridad)
                          else {
                            // CAMPAÑAS POSITIVAS (1-5) + REACTIVACIÓN COBRO → Usar SaldoVencido
                            if (isPositiveCampaign || isReactivacion) {
                              relevantDebt = responder.SaldoVencido || 0;
                            }
                            // CAMPAÑAS NEGATIVAS (-5 a -1) + MORA CERO → Usar SaldoPorVencer
                            else if (isNegativeCampaign || isMoraCero) {
                              relevantDebt = responder.SaldoPorVencer || 0;
                            }
                            // COMPROMISO DE PAGO → Lógica condicional según Días Mora
                            else if (isCompromisoPago) {
                              if (responder.DiasMora !== null && responder.DiasMora <= 0) {
                                relevantDebt = responder.SaldoPorVencer || 0;
                              } else {
                                relevantDebt = responder.SaldoVencido || 0;
                              }
                            }
                            // Fallback: Lógica basada en Días Mora si no coincide campaña
                            else if (responder.DiasMora !== null && responder.DiasMora !== undefined) {
                              if (responder.DiasMora <= 0) {
                                relevantDebt = responder.SaldoPorVencer || 0;
                              } else {
                                relevantDebt = responder.SaldoVencido || 0;
                              }
                            }
                          }

                          // Verificar comprobante enviado (2 condiciones principales)
                          // ComprobanteEnviado = Si/SI AND DiceQueYaPago = Si/SI
                          // LlamarOtraVez puede ser NO si no se pudo contactar después
                          // Nota: Comparación case-insensitive porque en la BD puede ser "SI" o "Si"
                          const hasValidReceipt =
                            responder.ComprobanteEnviado?.trim().toLowerCase() === 'si' &&
                            responder.DiceQueYaPago?.trim().toLowerCase() === 'si';

                          // Log detallado para cada registro (solo primeros 5)
                          if (idx < 5) {
                            console.log(`📋 Registro #${idx + 1} - ${responder.Cliente}:`, {
                              Cedula: responder.Cedula,
                              ComprobanteEnviado: `"${responder.ComprobanteEnviado}"`,
                              DiceQueYaPago: `"${responder.DiceQueYaPago}"`,
                              LlamarOtraVez: `"${responder.LlamarOtraVez}"`,
                              hasValidReceipt: hasValidReceipt ? '✅ SI' : '❌ NO',
                              razon: !hasValidReceipt ?
                                (responder.ComprobanteEnviado?.trim() !== 'Si' ?
                                  'ComprobanteEnviado no es "Si"' :
                                  'DiceQueYaPago no es "Si"') :
                                'Cumple las 2 condiciones'
                            });
                          }

                          return (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-2">{responder.Cedula}</td>
                              <td className="p-2">{responder.Cliente || "-"}</td>
                              <td className="p-2">{responder.Celular || "-"}</td>
                              <td className="p-2 text-right font-semibold text-orange-600">
                                ${responder.SaldoVencido?.toFixed(2) || "0.00"}
                              </td>
                              <td className="p-2 text-right font-semibold text-blue-600">
                                ${responder.SaldoPorVencer?.toFixed(2) || "0.00"}
                              </td>
                              <td className="p-2 text-center">
                                <span className={cn(
                                  "px-2 py-1 rounded text-xs font-semibold",
                                  responder.DiasMora && responder.DiasMora > 5
                                    ? "bg-red-100 text-red-800"
                                    : responder.DiasMora && responder.DiasMora > 0
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-blue-100 text-blue-800"
                                )}>
                                  {responder.DiasMora || 0}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                {hasValidReceipt ? (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800" title="ComprobanteEnviado=Si, DiceQueYaPago=Si">
                                    SI
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                                    NO
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {responder.EstadoEtiqueta ? (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                                    {responder.EstadoEtiqueta}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-50 text-gray-500 italic">
                                    chat conversacional
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {responder.compromiso_pago_fecha ? (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                                    SI
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                                    NO
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {responder.TipoDePago === 'Total' ? (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                                    Total
                                  </span>
                                ) : responder.TipoDePago === 'Parcial' ? (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    Parcial
                                  </span>
                                ) : relevantDebt === 0 ? (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-teal-100 text-teal-800">
                                    Sin Deuda
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                                    Pendiente
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-right font-semibold">
                                {responder.TipoDePago === 'Total' ? (
                                  <span className="text-green-600 font-bold">$0.00</span>
                                ) : responder.TipoDePago === 'Parcial' ? (
                                  <span className="text-yellow-600 font-bold">
                                    ${responder.RestanteSaldoVencido?.toFixed(2) || "0.00"}
                                  </span>
                                ) : relevantDebt === 0 ? (
                                  <span className="text-teal-600">$0.00</span>
                                ) : (
                                  <span className="text-red-600 font-bold">
                                    ${relevantDebt.toFixed(2)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No se pudieron cargar los datos.</p>
          )}
        </div>
      )}
    </div>
  );
};
