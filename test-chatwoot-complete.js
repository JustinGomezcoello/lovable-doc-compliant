#!/usr/bin/env node

/**
 * Script de prueba para verificar la integración con Chatwoot
 * Ejecutar: node test-chatwoot-complete.js
 */

const https = require('https');
const { URL } = require('url');

// Configuración de Chatwoot
const config = {
  baseUrl: 'https://chatwoot-production-85da.up.railway.app',
  accountId: '2',
  apiToken: 'zqT41Ca1HTuEqTLdvfZiFWmM',  labels: [
    'comprobante_enviado',
    'factura_enviada',
    'soporte',
    'cobrador',
    'devolucion_producto',
    'servicio_tecnico',
    'consulto_saldo',
    'resuelto',
    'pagado'
  ]
};

console.log('🔍 Iniciando pruebas de integración con Chatwoot');
console.log('📊 Configuración:', {
  baseUrl: config.baseUrl,
  accountId: config.accountId,
  hasToken: !!config.apiToken,
  labels: config.labels.length
});

/**
 * Realiza una petición HTTP GET
 */
function makeRequest(url, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Prueba básica de conectividad
 */
async function testConnectivity() {
  console.log('\n🌐 Probando conectividad básica...');
  
  try {
    const url = `${config.baseUrl}/api/v1/accounts/${config.accountId}/conversations?status=all&page=1`;
    const response = await makeRequest(url, {
      'api_access_token': config.apiToken,
      'Content-Type': 'application/json'
    });

    console.log(`✅ Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const data = response.data;
      console.log(`✅ Respuesta válida recibida`);
      console.log(`📊 Meta información:`, data.data?.meta || 'No disponible');
      console.log(`📋 Conversaciones en página 1: ${data.data?.payload?.length || 0}`);
      return true;
    } else {
      console.log('❌ Error en conectividad:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

/**
 * Prueba una etiqueta específica
 */
async function testLabel(label) {
  try {
    const url = `${config.baseUrl}/api/v1/accounts/${config.accountId}/conversations?labels[]=${encodeURIComponent(label)}&status=all&page=1`;
    const response = await makeRequest(url, {
      'api_access_token': config.apiToken,
      'Content-Type': 'application/json'
    });

    if (response.statusCode === 200) {
      const data = response.data;
      const conversaciones = data.data?.payload || [];
      console.log(`  ✅ ${label}: ${conversaciones.length} conversaciones`);
      return {
        label,
        count: conversaciones.length,
        success: true
      };
    } else {
      console.log(`  ❌ ${label}: Error ${response.statusCode}`);
      return {
        label,
        count: 0,
        success: false,
        error: response.data
      };
    }
  } catch (error) {
    console.log(`  ❌ ${label}: ${error.message}`);
    return {
      label,
      count: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Prueba todas las etiquetas
 */
async function testAllLabels() {
  console.log('\n🏷️ Probando todas las etiquetas...');
  
  const results = [];
  
  for (const label of config.labels) {
    const result = await testLabel(label);
    results.push(result);
    
    // Pequeña pausa entre peticiones
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Prueba de filtrado por fechas (simulado)
 */
async function testDateFiltering() {
  console.log('\n📅 Probando lógica de fechas...');
  
  // Función de conversión de fechas (Ecuador UTC-5)
  function convertirFechaEcuadorATimestamp(fecha, esFinDeDia = false) {
    const offset = -5 * 60 * 60 * 1000; // UTC-5 en milisegundos
    const fechaLocal = new Date(fecha + (esFinDeDia ? 'T23:59:59' : 'T00:00:00'));
    const timestampUTC = fechaLocal.getTime() - offset;
    return Math.floor(timestampUTC / 1000);
  }
  
  const fechaInicio = '2025-11-01';
  const fechaFin = '2025-11-17';
  
  const timestampInicio = convertirFechaEcuadorATimestamp(fechaInicio, false);
  const timestampFin = convertirFechaEcuadorATimestamp(fechaFin, true);
  
  console.log(`📅 Fecha inicio: ${fechaInicio} 00:00:00 Ecuador → ${timestampInicio} UTC`);
  console.log(`📅 Fecha fin: ${fechaFin} 23:59:59 Ecuador → ${timestampFin} UTC`);
  console.log(`📅 Rango válido: ${timestampFin - timestampInicio} segundos`);
  
  // Verificar que la fecha actual esté en el rango
  const ahora = Math.floor(Date.now() / 1000);
  const enRango = ahora >= timestampInicio && ahora <= timestampFin;
  console.log(`📅 Timestamp actual (${ahora}) en rango: ${enRango ? '✅' : '❌'}`);
}

/**
 * Generar reporte final
 */
function generateReport(connectivityOk, labelResults) {
  console.log('\n📊 REPORTE FINAL');
  console.log('='.repeat(50));
  
  console.log(`🌐 Conectividad: ${connectivityOk ? '✅ OK' : '❌ FALLO'}`);
  
  const totalLabels = labelResults.length;
  const successfulLabels = labelResults.filter(r => r.success).length;
  const totalConversations = labelResults.reduce((sum, r) => sum + r.count, 0);
  
  console.log(`🏷️ Etiquetas: ${successfulLabels}/${totalLabels} funcionando`);
  console.log(`📊 Total conversaciones encontradas: ${totalConversations}`);
  
  console.log('\n📋 Detalle por etiqueta:');
  labelResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.label}: ${result.count} conversaciones`);
  });
  
  const allWorking = connectivityOk && successfulLabels === totalLabels;
  console.log(`\n🎯 Estado general: ${allWorking ? '✅ TODO FUNCIONANDO' : '❌ HAY PROBLEMAS'}`);
  
  if (!allWorking) {
    console.log('\n🔧 RECOMENDACIONES:');
    if (!connectivityOk) {
      console.log('  - Verificar URL base y token de API');
      console.log('  - Verificar conectividad de red');
    }
    labelResults.filter(r => !r.success).forEach(result => {
      console.log(`  - Revisar etiqueta "${result.label}" en Chatwoot`);
    });
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando pruebas completas...\n');
  
  // 1. Prueba de conectividad
  const connectivityOk = await testConnectivity();
  
  if (!connectivityOk) {
    console.log('\n❌ No se pudo establecer conectividad. Abortando pruebas.');
    process.exit(1);
  }
  
  // 2. Prueba de etiquetas
  const labelResults = await testAllLabels();
  
  // 3. Prueba de fechas
  await testDateFiltering();
  
  // 4. Reporte final
  generateReport(connectivityOk, labelResults);
  
  console.log('\n✅ Pruebas completadas');
}

// Ejecutar pruebas
main().catch(error => {
  console.error('\n💥 Error fatal:', error);
  process.exit(1);
});
