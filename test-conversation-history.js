/**
 * Script de prueba para verificar la nueva funcionalidad de Historial de Conversaciones
 * Prueba la conexión a Supabase y al webhook de n8n
 */

const SUPABASE_URL = 'https://pjlhbmfgqjrwpurcgaxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbGhibWZncWpyd3B1cmNnYXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjUxNTUsImV4cCI6MjA2NDc0MTE1NX0.9GtfKsZ2WEsRfTJWV-O1TQBXFGSe1Bk86x8uIp3Pmaw';
const N8N_WEBHOOK_URL = 'https://primary-production-f05b.up.railway.app/webhook/651db7d0-7d3e-42a8-82b0-133c08a78201';

/**
 * Test 1: Verificar registros con conversation_id en Supabase
 */
async function testSupabaseConversationRecords() {
  console.log(`\n🧪 ===== TEST 1: REGISTROS CON CONVERSATION_ID =====`);
  
  try {
    console.log(`🔍 Consultando POINT_Competencia...`);
    
    const startTime = Date.now();
    
    // Consultar registros con conversation_id válido
    const response = await fetch(`${SUPABASE_URL}/rest/v1/POINT_Competencia?select=idCompra,Cliente,Cedula,Celular,conversation_id,Segmento,Status,Articulo,ComprobanteEnviado&conversation_id=not.is.null&conversation_id=neq.0&order=Cliente.asc&limit=10`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (!response.ok) {
      console.error(`❌ Error HTTP ${response.status}: ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Consulta exitosa en ${duration}ms`);
    console.log(`📊 Registros encontrados: ${data.length}`);
    
    if (data.length > 0) {
      console.log(`\n📋 Muestra de registros:`);
      data.slice(0, 3).forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.Cliente} (Cédula: ${record.Cedula}) - Conv ID: ${record.conversation_id}`);
      });
      
      console.log(`\n🎯 Conversation IDs disponibles para pruebas:`);
      const conversationIds = [...new Set(data.map(r => r.conversation_id))].slice(0, 5);
      conversationIds.forEach((id, index) => {
        console.log(`   ${index + 1}. conversation_id: ${id}`);
      });
      
      return { success: true, sampleConversationIds: conversationIds };
    } else {
      console.log(`⚠️ No se encontraron registros con conversation_id válido`);
      return { success: true, sampleConversationIds: [] };
    }
    
  } catch (error) {
    console.error(`💥 Error en test de Supabase:`, error.message);
    return { success: false };
  }
}

/**
 * Test 2: Probar webhook de n8n con conversation_id específico
 */
async function testN8NWebhook(conversationId) {
  console.log(`\n🧪 ===== TEST 2: WEBHOOK N8N (conversation_id: ${conversationId}) =====`);
  
  try {
    console.log(`📞 Llamando webhook de n8n...`);
    console.log(`🔗 URL: ${N8N_WEBHOOK_URL}`);
    console.log(`📤 Payload: { "conversation_id": ${conversationId} }`);
    
    const startTime = Date.now();
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        conversation_id: conversationId
      })
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`📡 Respuesta recibida en ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error HTTP: ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Webhook exitoso`);
    
    // Analizar la estructura de respuesta
    if (Array.isArray(data)) {
      console.log(`📋 Respuesta es un array con ${data.length} elementos`);
      if (data.length > 0) {
        const firstItem = data[0];
        console.log(`📝 Primer elemento:`, {
          conversation_id: firstItem.conversation_id,
          total: firstItem.total,
          tiene_mensajes: Array.isArray(firstItem.mensajes),
          cantidad_mensajes: firstItem.mensajes ? firstItem.mensajes.length : 0
        });
        
        if (firstItem.mensajes && firstItem.mensajes.length > 0) {
          const firstMessage = firstItem.mensajes[0];
          console.log(`💬 Primer mensaje:`, {
            id: firstMessage.id,
            rol: firstMessage.rol,
            fecha: firstMessage.fecha_iso,
            tipo: firstMessage.tipo,
            texto_preview: firstMessage.texto ? firstMessage.texto.substring(0, 50) + '...' : '[vacío]'
          });
        }
      }
    } else {
      console.log(`📋 Respuesta es un objeto:`, {
        conversation_id: data.conversation_id,
        total: data.total,
        tiene_mensajes: Array.isArray(data.mensajes),
        cantidad_mensajes: data.mensajes ? data.mensajes.length : 0
      });
    }
    
    return true;
    
  } catch (error) {
    console.error(`💥 Error en test de webhook:`, error.message);
    return false;
  }
}

/**
 * Test 3: Verificar tipos de datos y estructura
 */
function testDataTypes() {
  console.log(`\n🧪 ===== TEST 3: VERIFICACIÓN DE TIPOS =====`);
  
  console.log(`🔍 Verificando configuración de entorno...`);
  
  const checks = [
    { name: 'SUPABASE_URL', value: SUPABASE_URL, expected: 'string' },
    { name: 'SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY, expected: 'string' },
    { name: 'N8N_WEBHOOK_URL', value: N8N_WEBHOOK_URL, expected: 'string' }
  ];
  
  let allValid = true;
  
  checks.forEach(check => {
    const isValid = typeof check.value === check.expected && check.value.length > 0;
    const status = isValid ? '✅' : '❌';
    console.log(`   ${status} ${check.name}: ${isValid ? 'OK' : 'INVALID'} (${typeof check.value})`);
    if (!isValid) allValid = false;
  });
  
  console.log(`\n📊 Configuración: ${allValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
  
  return allValid;
}

/**
 * Test completo de la funcionalidad
 */
async function testFullConversationHistoryFlow() {
  console.log(`\n🧪 ===== TEST 4: FLUJO COMPLETO =====`);
  
  try {
    // 1. Obtener registros de Supabase
    const supabaseResult = await testSupabaseConversationRecords();
    if (!supabaseResult.success) {
      console.error(`❌ Falló el test de Supabase`);
      return false;
    }
    
    // 2. Si hay conversation_ids, probar el webhook
    if (supabaseResult.sampleConversationIds && supabaseResult.sampleConversationIds.length > 0) {
      const testId = supabaseResult.sampleConversationIds[0];
      console.log(`\n🎯 Probando flujo completo con conversation_id: ${testId}`);
      
      const webhookResult = await testN8NWebhook(testId);
      if (webhookResult) {
        console.log(`✅ Flujo completo exitoso`);
        return true;
      } else {
        console.log(`⚠️ Webhook falló, pero Supabase funciona`);
        return false;
      }
    } else {
      console.log(`⚠️ No hay conversation_ids para probar webhook`);
      return true; // Supabase funciona aunque no haya datos
    }
    
  } catch (error) {
    console.error(`💥 Error en flujo completo:`, error.message);
    return false;
  }
}

/**
 * Ejecutar todos los tests
 */
async function ejecutarTestsHistorial() {
  console.log(`🧪 ===== INICIANDO TESTS DE HISTORIAL DE CONVERSACIONES =====`);
  console.log(`🕒 ${new Date().toISOString()}\n`);
  
  const resultados = {
    tipos: false,
    supabase: false,
    webhook: false,
    flujoCompleto: false
  };
  
  try {
    // Test 1: Tipos y configuración
    resultados.tipos = testDataTypes();
    
    if (!resultados.tipos) {
      console.log(`❌ Configuración inválida, saltando otros tests`);
      return;
    }
    
    // Pausa
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Supabase
    const supabaseResult = await testSupabaseConversationRecords();
    resultados.supabase = supabaseResult.success;
    
    // Test 3: Webhook (solo si hay datos de Supabase)
    if (resultados.supabase && supabaseResult.sampleConversationIds?.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      resultados.webhook = await testN8NWebhook(supabaseResult.sampleConversationIds[0]);
    }
    
    // Test 4: Flujo completo
    if (resultados.supabase) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      resultados.flujoCompleto = await testFullConversationHistoryFlow();
    }
    
    // Resumen
    console.log(`\n📊 ===== RESUMEN DE TESTS =====`);
    console.log(`${'Test'.padEnd(20)} | ${'Resultado'.padEnd(10)} | Status`);
    console.log(`${'-'.repeat(50)}`);
    
    for (const [test, resultado] of Object.entries(resultados)) {
      const status = resultado ? '✅ PASS' : '❌ FAIL';
      console.log(`${test.padEnd(20)} | ${resultado.toString().padEnd(10)} | ${status}`);
    }
    
    const testsExitosos = Object.values(resultados).filter(r => r).length;
    const totalTests = Object.keys(resultados).length;
    
    console.log(`\n🎯 Total: ${testsExitosos}/${totalTests} tests pasaron`);
    
    if (testsExitosos === totalTests) {
      console.log(`🎉 ¡Todos los tests pasaron! La funcionalidad de historial debería funcionar correctamente.`);
    } else if (resultados.supabase) {
      console.log(`⚠️ Supabase funciona, pero hay problemas con n8n webhook.`);
    } else {
      console.log(`❌ Hay problemas críticos. Revisar la configuración.`);
    }
    
  } catch (error) {
    console.error(`💥 Error durante los tests:`, error);
  }
}

// Ejecutar los tests
ejecutarTestsHistorial();
