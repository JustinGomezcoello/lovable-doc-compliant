import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval } from "date-fns";

// 🧪 VERSION DE PRUEBA: Trae todos los datos y filtra en JavaScript
const DayByDayTabDebug = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const campaignTables = [
    'point_mora_neg1',
    'point_mora_neg2',
    'point_mora_neg3',
    'point_mora_neg5',
    'point_mora_pos1',
    'point_mora_pos4',
    'point_compromiso_pago',
    'point_reactivacion_cobro'
  ] as const;

  const { data: debugMetrics, isLoading } = useQuery({
    queryKey: ["debug-metrics", startDate, endDate],
    queryFn: async () => {
      console.log("🧪 DEBUG MODE: Trayendo TODOS los datos sin filtro de fecha");
      
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
      const targetDates = daysInRange.map(d => format(d, "yyyy-MM-dd"));
      
      console.log("📅 Fechas buscadas:", targetDates);
      
      let totalSent = 0;
      let allCedulas: string[] = [];
      
      for (const tableName of campaignTables) {
        try {
          // 🔥 TRAER TODOS LOS DATOS SIN FILTRO
          const { data: allData, error } = await supabase
            .from(tableName)
            .select("fecha, count_day, cedulas")
            .order("fecha", { ascending: false })
            .limit(100); // Limitar a 100 registros más recientes
          
          if (error) {
            console.error(`❌ ${tableName}:`, error);
            continue;
          }
          
          console.log(`\n📊 ${tableName}:`);
          console.log(`   Total registros: ${allData?.length || 0}`);
          
          if (allData && allData.length > 0) {
            // Mostrar todas las fechas disponibles
            const availableDates = [...new Set(allData.map(d => d.fecha))].sort();
            console.log(`   Fechas disponibles:`, availableDates);
            
            // Filtrar EN JAVASCRIPT los datos que coinciden con nuestras fechas
            const matchingData = allData.filter(record => 
              targetDates.includes(record.fecha)
            );
            
            console.log(`   Coincidencias con fechas buscadas: ${matchingData.length}`);
            
            if (matchingData.length > 0) {
              const tableSent = matchingData.reduce((sum, record) => 
                sum + (record.count_day || 0), 0
              );
              totalSent += tableSent;
              
              matchingData.forEach(record => {
                if (record.cedulas && Array.isArray(record.cedulas)) {
                  allCedulas.push(...record.cedulas.map(c => String(c).trim()).filter(c => c));
                }
              });
              
              console.log(`   ✅ ${tableSent} mensajes enviados`);
            } else {
              console.log(`   ⚠️ No hay datos para las fechas buscadas`);
            }
          } else {
            console.log(`   ❌ Tabla vacía`);
          }
          
        } catch (err) {
          console.error(`❌ Error en ${tableName}:`, err);
        }
      }
      
      const uniqueCedulas = Array.from(new Set(allCedulas));
      
      console.log("\n📊 RESUMEN DEBUG:");
      console.log(`   WhatsApp Enviados: ${totalSent}`);
      console.log(`   Cédulas Únicas: ${uniqueCedulas.length}`);
      
      return {
        totalSent,
        uniqueCedulas: uniqueCedulas.length,
        totalCost: (totalSent * 0.014).toFixed(2)
      };
    },
    enabled: !!startDate && !!endDate
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Modo Debug - Dashboard</h1>
      
      <div className="bg-yellow-100 border-2 border-yellow-400 rounded p-4 mb-4">
        <p className="font-semibold text-yellow-800">⚠️ MODO DEBUG ACTIVO</p>
        <p className="text-sm text-yellow-700">
          Esta versión trae TODOS los datos y filtra en JavaScript.
          Revisa la consola (F12) para ver los logs detallados.
        </p>
      </div>
      
      {isLoading ? (
        <p>Cargando datos...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600">WhatsApp Enviados</p>
            <p className="text-3xl font-bold">{debugMetrics?.totalSent || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600">Cédulas Únicas</p>
            <p className="text-3xl font-bold">{debugMetrics?.uniqueCedulas || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600">Costo Total</p>
            <p className="text-3xl font-bold">${debugMetrics?.totalCost || "0.00"}</p>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 border border-blue-300 rounded p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Instrucciones:</h3>
        <ol className="list-decimal ml-6 text-sm space-y-1">
          <li>Abre la consola del navegador (F12)</li>
          <li>Busca los logs que empiezan con 📊</li>
          <li>Verifica qué fechas muestra "Fechas disponibles"</li>
          <li>Compara con las fechas que estás buscando</li>
          <li>Si las fechas no coinciden, hay un problema de formato</li>
        </ol>
      </div>
    </div>
  );
};

export default DayByDayTabDebug;
