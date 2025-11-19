/**
 * Test Dashboard Implementation
 * Verifica las tablas de campaña y estructura de datos disponibles
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const SUPABASE_URL = 'https://azfplgvgvlqgpglvqrph.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6ZnBsZ3ZndmxxZ3BnbHZxcnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4MDE3NDIsImV4cCI6MjA0NzM3Nzc0Mn0.FVnCsLm5gLk9L9_S4KnQQ7oBtOBK4O4SgTkdoTNLw7w'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Test 1: Verificar tablas de campaña disponibles
 */
async function testCampaignTables() {
  console.log(`\n🧪 ===== TEST 1: VERIFICAR TABLAS DE CAMPAÑA =====`)
  
  const campaignTables = [
    'point_compromiso_pago',
    'point_mora_1', 
    'point_mora_3',
    'point_mora_5',
    'point_reactivacion_cobro',
    // Tablas requeridas pero que podrían no existir
    'point_mora_neg5',
    'point_mora_neg3',
    'point_mora_neg2',
    'point_mora_neg1',
    'point_mora_pos1',
    'point_mora_pos4'
  ]
  
  console.log(`🔍 Verificando ${campaignTables.length} tablas...`)
  
  for (const tableName of campaignTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${tableName}: NO EXISTE - ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: EXISTE - ${data.length} registros encontrados`)
        
        // Mostrar estructura si hay datos
        if (data.length > 0) {
          const columns = Object.keys(data[0])
          console.log(`   📋 Columnas: ${columns.join(', ')}`)
        }
      }
    } catch (err) {
      console.log(`💥 ${tableName}: ERROR - ${err.message}`)
    }
  }
}

/**
 * Test 2: Verificar datos de ejemplo para fecha específica
 */
async function testSampleData() {
  console.log(`\n🧪 ===== TEST 2: DATOS DE EJEMPLO =====`)
  
  const fecha_prueba = '2025-11-19'  // Fecha de hoy
  const tablas_existentes = [
    'point_compromiso_pago',
    'point_mora_1', 
    'point_mora_3',
    'point_mora_5',
    'point_reactivacion_cobro'
  ]
  
  console.log(`📅 Consultando datos para fecha: ${fecha_prueba}`)
  
  for (const tableName of tablas_existentes) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('fecha, count_day, cedulas')
        .eq('fecha', fecha_prueba)
      
      if (error) {
        console.log(`❌ ${tableName}: Error - ${error.message}`)
      } else {
        console.log(`📊 ${tableName}: ${data.length} registros`)
        
        if (data.length > 0) {
          const total_count_day = data.reduce((sum, record) => sum + (record.count_day || 0), 0)
          const total_cedulas = data.reduce((acc, record) => {
            if (record.cedulas && Array.isArray(record.cedulas)) {
              acc.push(...record.cedulas)
            }
            return acc
          }, [])
          const cedulas_unicas = Array.from(new Set(total_cedulas))
          
          console.log(`   📤 WhatsApp Enviados: ${total_count_day}`)
          console.log(`   👥 Cédulas Totales: ${total_cedulas.length}`)
          console.log(`   👤 Cédulas Únicas: ${cedulas_unicas.length}`)
        }
      }
    } catch (err) {
      console.log(`💥 ${tableName}: Error - ${err.message}`)
    }
  }
}

/**
 * Test 3: Verificar estructura de POINT_Competencia
 */
async function testPointCompetencia() {
  console.log(`\n🧪 ===== TEST 3: POINT_COMPETENCIA =====`)
  
  try {
    const { data, error } = await supabase
      .from('POINT_Competencia')
      .select('Cedula, conversation_id')
      .limit(5)
    
    if (error) {
      console.log(`❌ POINT_Competencia: Error - ${error.message}`)
    } else {
      console.log(`✅ POINT_Competencia: ${data.length} registros de muestra`)
      
      if (data.length > 0) {
        console.log(`📋 Estructura:`, data[0])
        
        // Contar tipos de conversation_id
        const con_conversacion = data.filter(r => r.conversation_id !== null && r.conversation_id !== 0).length
        const sin_conversacion = data.filter(r => r.conversation_id === null || r.conversation_id === 0).length
        
        console.log(`🟢 Con conversación (≠ 0 y ≠ NULL): ${con_conversacion}`)
        console.log(`🔴 Sin conversación (= 0 o = NULL): ${sin_conversacion}`)
      }
    }
  } catch (err) {
    console.log(`💥 POINT_Competencia: Error - ${err.message}`)
  }
}

/**
 * Test 4: Simular cálculo completo según especificaciones
 */
async function testCompleteCalculation() {
  console.log(`\n🧪 ===== TEST 4: CÁLCULO COMPLETO =====`)
  
  const fecha_prueba = '2025-11-19'
  const COSTO_POR_MENSAJE = 0.014
  const tablas_existentes = [
    'point_compromiso_pago',
    'point_mora_1', 
    'point_mora_3',
    'point_mora_5',
    'point_reactivacion_cobro'
  ]
  
  console.log(`🔧 Simulando lógica implementada para fecha: ${fecha_prueba}`)
  
  // Variables globales
  let whatsapp_enviados_global = 0
  let todas_cedulas_del_dia = []
  const metricas_por_tabla = []
  
  // Procesar cada tabla
  for (const tableName of tablas_existentes) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count_day, cedulas')
        .eq('fecha', fecha_prueba)
      
      if (!error && data && data.length > 0) {
        // 1. WhatsApp enviados por tabla
        const whatsapp_enviados_tabla = data.reduce((sum, record) => sum + (record.count_day || 0), 0)
        
        // 2. Costo por tabla
        const costo_tabla = (whatsapp_enviados_tabla * COSTO_POR_MENSAJE).toFixed(2)
        
        // 3. Cédulas únicas por tabla
        const cedulas_tabla = []
        data.forEach(record => {
          if (record.cedulas && Array.isArray(record.cedulas)) {
            cedulas_tabla.push(...record.cedulas.map(c => String(c).trim()).filter(c => c))
          }
        })
        const cedulas_unicas_tabla = Array.from(new Set(cedulas_tabla))
        
        metricas_por_tabla.push({
          tabla: tableName,
          whatsapp_enviados: whatsapp_enviados_tabla,
          costo: costo_tabla,
          cedulas_unicas: cedulas_unicas_tabla.length
        })
        
        // Acumular para métricas globales
        whatsapp_enviados_global += whatsapp_enviados_tabla
        todas_cedulas_del_dia.push(...cedulas_tabla)
        
        console.log(`📊 ${tableName}: ${whatsapp_enviados_tabla} enviados, $${costo_tabla}, ${cedulas_unicas_tabla.length} únicas`)
      } else {
        console.log(`⚪ ${tableName}: Sin datos`)
      }
    } catch (err) {
      console.log(`💥 ${tableName}: Error - ${err.message}`)
    }
  }
  
  // Métricas globales
  const costo_global = (whatsapp_enviados_global * COSTO_POR_MENSAJE).toFixed(2)
  const cedulas_unicas_globales = Array.from(new Set(todas_cedulas_del_dia))
  
  console.log(`\n🌍 MÉTRICAS GLOBALES:`)
  console.log(`📤 WhatsApp Enviados Global: ${whatsapp_enviados_global}`)
  console.log(`💰 Costo Global: $${costo_global}`)
  console.log(`👤 Cédulas Únicas Globales: ${cedulas_unicas_globales.length}`)
  
  // Verificar diferencia entre suma de tablas vs global
  const suma_cedulas_por_tabla = metricas_por_tabla.reduce((sum, tabla) => sum + tabla.cedulas_unicas, 0)
  console.log(`\n🔍 VERIFICACIÓN:`)
  console.log(`📝 Suma cédulas únicas por tabla: ${suma_cedulas_por_tabla}`)
  console.log(`🌐 Cédulas únicas globales: ${cedulas_unicas_globales.length}`)
  console.log(`📊 Diferencia: ${suma_cedulas_por_tabla - cedulas_unicas_globales.length} (normal si >0, indica personas en múltiples campañas)`)
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  try {
    console.log('🚀 INICIANDO TESTS DEL DASHBOARD DE CAMPAÑAS WHATSAPP')
    console.log('=' .repeat(60))
    
    await testCampaignTables()
    await testSampleData()
    await testPointCompetencia()
    await testCompleteCalculation()
    
    console.log(`\n✅ TESTS COMPLETADOS`)
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('💥 Error ejecutando tests:', error)
  }
}

// Ejecutar tests
runAllTests()
