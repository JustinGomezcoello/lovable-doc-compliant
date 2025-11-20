/**
 * 🧪 Script de Prueba: Validación de Fórmula Correcta
 * 
 * Este script valida que la lógica implementada cumple con la REGLA ÚNICA:
 * responded(cédula) = EXISTS en POINT_Competencia con conversation_id NOT NULL AND ≠ 0
 * 
 * Ejecutar con: node test-formula-correcta.js
 */

import { createClient } from '@supabase/supabase-js';
import { format, eachDayOfInterval } from 'date-fns';

// Configuración de Supabase (usa tus propias credenciales)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const COSTO_POR_MENSAJE = 0.014;

const campaignTables = [
  'point_mora_neg5',
  'point_mora_neg3',
  'point_mora_neg2',
  'point_mora_neg1',
  'point_mora_pos1',
  'point_mora_pos4',
  'point_compromiso_pago',
  'point_reactivacion_cobro'
];

/**
 * Función que implementa la REGLA ÚNICA correcta
 */
async function getCedulasWithResponses(cedulas) {
  const responseMap = new Map();
  
  if (cedulas.length === 0) {
    return responseMap;
  }
  
  const cedulasAsNumbers = cedulas
    .map(c => parseInt(String(c).replace(/\D/g, '')))
    .filter(n => !isNaN(n));
  
  // Inicializar todas como NO respondieron
  cedulasAsNumbers.forEach(cedula => {
    responseMap.set(cedula, false);
  });
  
  // Consultar POINT_Competencia
  const { data: responseData, error } = await supabase
    .from("POINT_Competencia")
    .select("Cedula, conversation_id")
    .in("Cedula", cedulasAsNumbers);
  
  if (error) {
    console.error("❌ Error consultando POINT_Competencia:", error);
    return responseMap;
  }
  
  // Marcar como respondieron SOLO las que cumplen la REGLA ÚNICA
  if (responseData) {
    responseData.forEach(r => {
      if (r.conversation_id !== null && r.conversation_id !== 0) {
        responseMap.set(r.Cedula, true);
      }
    });
  }
  
  return responseMap;
}

/**
 * Test 1: Validar métricas para un día específico
 */
async function testDayMetrics(fecha) {
  console.log(`\n🧪 TEST 1: Métricas para día ${fecha}`);
  console.log("=".repeat(60));
  
  let totalSent = 0;
  let allCedulas = [];
  
  for (const tableName of campaignTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select("count_day, cedulas")
      .gte("fecha", fecha)
      .lte("fecha", fecha);
    
    if (!error && data && data.length > 0) {
      const dayTotal = data.reduce((sum, record) => sum + (record.count_day || 0), 0);
      totalSent += dayTotal;
      
      data.forEach(record => {
        if (record.cedulas && Array.isArray(record.cedulas)) {
          allCedulas.push(...record.cedulas.map(c => String(c).trim()).filter(c => c));
        }
      });
    }
  }
  
  // Deduplicar cédulas
  const uniqueCedulas = Array.from(new Set(allCedulas));
  const totalCedulasUnicas = uniqueCedulas.length;
  
  // Aplicar REGLA ÚNICA
  const responseMap = await getCedulasWithResponses(uniqueCedulas);
  
  let responded = 0;
  let notResponded = 0;
  
  responseMap.forEach((didRespond) => {
    if (didRespond) {
      responded++;
    } else {
      notResponded++;
    }
  });
  
  // Validaciones
  const suma = responded + notResponded;
  const validacion1 = suma === totalCedulasUnicas;
  
  console.log(`📊 WhatsApp Enviados (count_day): ${totalSent}`);
  console.log(`📊 Cédulas Únicas: ${totalCedulasUnicas}`);
  console.log(`📊 Respondieron: ${responded}`);
  console.log(`📊 No Respondieron: ${notResponded}`);
  console.log(`📊 Suma: ${suma}`);
  console.log(`📊 Costo: $${(totalSent * COSTO_POR_MENSAJE).toFixed(2)}`);
  console.log(`\n✅ Validación 1: responded + notResponded = cédulas únicas`);
  console.log(`   ${responded} + ${notResponded} = ${suma} ${validacion1 ? '✅' : '❌'}`);
  
  return {
    fecha,
    totalSent,
    totalCedulasUnicas,
    responded,
    notResponded
  };
}

/**
 * Test 2: Validar métricas para un rango de fechas
 */
async function testRangeMetrics(fechaInicio, fechaFin) {
  console.log(`\n🧪 TEST 2: Métricas para rango ${fechaInicio} - ${fechaFin}`);
  console.log("=".repeat(60));
  
  const startDate = new Date(fechaInicio);
  const endDate = new Date(fechaFin);
  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
  
  let totalSent = 0;
  let allCedulas = [];
  
  for (const day of daysInRange) {
    const dayStr = format(day, "yyyy-MM-dd");
    
    for (const tableName of campaignTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select("count_day, cedulas")
        .gte("fecha", dayStr)
        .lte("fecha", dayStr);
      
      if (!error && data && data.length > 0) {
        const dayTotal = data.reduce((sum, record) => sum + (record.count_day || 0), 0);
        totalSent += dayTotal;
        
        data.forEach(record => {
          if (record.cedulas && Array.isArray(record.cedulas)) {
            allCedulas.push(...record.cedulas.map(c => String(c).trim()).filter(c => c));
          }
        });
      }
    }
  }
  
  // Deduplicar cédulas
  const uniqueCedulas = Array.from(new Set(allCedulas));
  const totalCedulasUnicas = uniqueCedulas.length;
  
  // Aplicar REGLA ÚNICA
  const responseMap = await getCedulasWithResponses(uniqueCedulas);
  
  let responded = 0;
  let notResponded = 0;
  
  responseMap.forEach((didRespond) => {
    if (didRespond) {
      responded++;
    } else {
      notResponded++;
    }
  });
  
  // Validaciones
  const suma = responded + notResponded;
  const validacion1 = suma === totalCedulasUnicas;
  
  console.log(`📊 WhatsApp Enviados (count_day): ${totalSent}`);
  console.log(`📊 Cédulas Únicas: ${totalCedulasUnicas}`);
  console.log(`📊 Respondieron: ${responded}`);
  console.log(`📊 No Respondieron: ${notResponded}`);
  console.log(`📊 Suma: ${suma}`);
  console.log(`📊 Costo: $${(totalSent * COSTO_POR_MENSAJE).toFixed(2)}`);
  console.log(`\n✅ Validación 1: responded + notResponded = cédulas únicas`);
  console.log(`   ${responded} + ${notResponded} = ${suma} ${validacion1 ? '✅' : '❌'}`);
  
  return {
    fechaInicio,
    fechaFin,
    totalSent,
    totalCedulasUnicas,
    responded,
    notResponded
  };
}

/**
 * Test 3: Propiedad de monotonía (no_respondieron_rango ≤ max(no_respondieron_dias))
 */
async function testMonotonia(fechas) {
  console.log(`\n🧪 TEST 3: Validar Propiedad de Monotonía`);
  console.log("=".repeat(60));
  
  // Obtener métricas de cada día individual
  const resultadosDias = [];
  for (const fecha of fechas) {
    const resultado = await testDayMetrics(fecha);
    resultadosDias.push(resultado);
  }
  
  // Obtener métricas del rango completo
  const fechaInicio = fechas[0];
  const fechaFin = fechas[fechas.length - 1];
  const resultadoRango = await testRangeMetrics(fechaInicio, fechaFin);
  
  // Validar monotonía
  const maxNoRespondieronDias = Math.max(...resultadosDias.map(r => r.notResponded));
  const noRespondieronRango = resultadoRango.notResponded;
  const validacionMonotonia = noRespondieronRango <= maxNoRespondieronDias;
  
  console.log(`\n📊 Resumen de Monotonía:`);
  console.log(`   Días individuales:`);
  resultadosDias.forEach(r => {
    console.log(`     ${r.fecha}: ${r.notResponded} no respondieron`);
  });
  console.log(`   Máximo no_respondieron en días: ${maxNoRespondieronDias}`);
  console.log(`   Rango ${fechaInicio} - ${fechaFin}: ${noRespondieronRango} no respondieron`);
  console.log(`\n✅ Validación: no_respondieron_rango ≤ max(no_respondieron_dias)`);
  console.log(`   ${noRespondieronRango} ≤ ${maxNoRespondieronDias} ${validacionMonotonia ? '✅' : '❌'}`);
  
  return validacionMonotonia;
}

/**
 * Test 4: Validar detalle por campaña
 */
async function testCampaignDetails(fecha) {
  console.log(`\n🧪 TEST 4: Detalle por Campaña para ${fecha}`);
  console.log("=".repeat(60));
  
  const campaigns = [];
  let totalSent = 0;
  let allCedulas = [];
  
  const campaignNames = {
    'point_mora_neg5': 'MORA NEGATIVA 5',
    'point_mora_neg3': 'MORA NEGATIVA 3',
    'point_mora_neg2': 'MORA NEGATIVA 2',
    'point_mora_neg1': 'MORA NEGATIVA 1',
    'point_mora_pos1': 'MORA POSITIVA 1',
    'point_mora_pos4': 'MORA POSITIVA 4',
    'point_compromiso_pago': 'COMPROMISO DE PAGO',
    'point_reactivacion_cobro': 'REACTIVACIÓN COBRO'
  };
  
  for (const tableName of campaignTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select("count_day, cedulas")
      .gte("fecha", fecha)
      .lte("fecha", fecha);
    
    if (!error && data && data.length > 0) {
      const tableSent = data.reduce((sum, record) => sum + (record.count_day || 0), 0);
      
      const tableCedulas = [];
      data.forEach(record => {
        if (record.cedulas && Array.isArray(record.cedulas)) {
          tableCedulas.push(...record.cedulas.map(c => String(c).trim()).filter(c => c));
        }
      });
      
      campaigns.push({
        name: campaignNames[tableName],
        sent: tableSent,
        cedulas: Array.from(new Set(tableCedulas))
      });
      
      totalSent += tableSent;
      allCedulas.push(...tableCedulas);
    }
  }
  
  // Obtener respuestas globales
  const uniqueCedulas = Array.from(new Set(allCedulas));
  const responseMap = await getCedulasWithResponses(uniqueCedulas);
  
  // Calcular responded/notResponded por campaña
  campaigns.forEach(campaign => {
    let campaignResponded = 0;
    let campaignNotResponded = 0;
    
    campaign.cedulas.forEach(cedula => {
      const cedulaNum = parseInt(cedula.replace(/\D/g, ''));
      if (!isNaN(cedulaNum)) {
        const didRespond = responseMap.get(cedulaNum);
        if (didRespond === true) {
          campaignResponded++;
        } else {
          campaignNotResponded++;
        }
      }
    });
    
    campaign.responded = campaignResponded;
    campaign.notResponded = campaignNotResponded;
    campaign.cedulasUnicas = campaign.cedulas.length;
    
    // Validación
    const suma = campaignResponded + campaignNotResponded;
    const valido = suma === campaign.cedulasUnicas;
    
    console.log(`\n📊 ${campaign.name}`);
    console.log(`   Enviados (count_day): ${campaign.sent}`);
    console.log(`   Cédulas Únicas: ${campaign.cedulasUnicas}`);
    console.log(`   Respondieron: ${campaign.responded}`);
    console.log(`   No Respondieron: ${campaign.notResponded}`);
    console.log(`   ✅ Validación: ${campaign.responded} + ${campaign.notResponded} = ${suma} ${valido ? '✅' : '❌'}`);
  });
  
  return campaigns;
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  console.log("🧪 INICIANDO TESTS DE VALIDACIÓN DE FÓRMULA CORRECTA");
  console.log("=".repeat(60));
  
  // Fechas de prueba (ajustar según tus datos)
  const fecha1 = "2025-01-17";
  const fecha2 = "2025-01-18";
  const fechas = [fecha1, fecha2];
  
  try {
    // Test 1: Métricas por día
    await testDayMetrics(fecha1);
    await testDayMetrics(fecha2);
    
    // Test 2: Métricas por rango
    await testRangeMetrics(fecha1, fecha2);
    
    // Test 3: Monotonía
    const monotonoValido = await testMonotonia(fechas);
    
    // Test 4: Detalle por campaña
    await testCampaignDetails(fecha1);
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ TODOS LOS TESTS COMPLETADOS");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ ERROR EN LOS TESTS:", error);
  }
}

// Ejecutar
runAllTests();
