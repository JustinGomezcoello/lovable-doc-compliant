/**
 * Script de prueba para verificar la lógica de paginación completa
 * Este script prueba que se obtengan TODAS las conversaciones de cada etiqueta
 */

const CHATWOOT_BASE_URL = 'https://chatwoot-production-85da.up.railway.app';
const CHATWOOT_API_TOKEN = 'zqT41Ca1HTuEqTLdvfZiFWmM';
const CHATWOOT_ACCOUNT_ID = '2';

const SUPABASE_URL = 'https://pjlhbmfgqjrwpurcgaxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbGhibWZncWpyd3B1cmNnYXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjUxNTUsImV4cCI6MjA2NDc0MTE1NX0.9GtfKsZ2WEsRfTJWV-O1TQBXFGSe1Bk86x8uIp3Pmaw';

// Labels a probar
const labelsAPprobar = [
  'comprobante_enviado',
  'factura_enviada', 
  'pagado'
];

/**
 * Prueba directa de la API de Chatwoot para una etiqueta específica
 */
async function probarDirectamenteChatwoot(label) {
  console.log(`\n🔍 ===== PRUEBA DIRECTA CHATWOOT: ${label} =====`);
  
  let totalConversaciones = 0;
  let pagina = 1;
  let tieneMasPaginas = true;
  const maxPaginas = 10; // Límite para la prueba
  
  while (tieneMasPaginas && pagina <= maxPaginas) {
    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?labels[]=${encodeURIComponent(label)}&status=all&page=${pagina}`;
    
    console.log(`📄 Página ${pagina}: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'api_access_token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`❌ Error HTTP ${response.status}: ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const conversaciones = data.data?.payload || [];
      const meta = data.data?.meta || {};
      
      console.log(`📊 Página ${pagina}: ${conversaciones.length} conversaciones`);
      console.log(`📈 Meta:`, meta);
      
      if (conversaciones.length === 0) {
        console.log(`📭 Página ${pagina} vacía, terminando`);
        tieneMasPaginas = false;
      } else {
        totalConversaciones += conversaciones.length;
        pagina++;
        
        // Mostrar algunas conversaciones de muestra
        if (conversaciones.length > 0) {
          const primeraConv = conversaciones[0];
          const fechaCreacion = new Date(primeraConv.created_at * 1000).toISOString();
          console.log(`   📝 Primera conversación ID: ${primeraConv.id}, Fecha: ${fechaCreacion}`);
        }
      }
      
    } catch (error) {
      console.error(`💥 Error en página ${pagina}:`, error.message);
      break;
    }
    
    // Pausa para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`🎯 TOTAL ${label}: ${totalConversaciones} conversaciones en ${pagina - 1} páginas`);
  return totalConversaciones;
}

/**
 * Prueba de la función edge de Supabase
 */
async function probarFuncionSupabase() {
  console.log(`\n🚀 ===== PRUEBA FUNCIÓN EDGE SUPABASE =====`);
  
  const fechaInicio = '2025-01-01';
  const fechaFin = '2025-12-31';
  
  const url = `${SUPABASE_URL}/functions/v1/chatwoot-metrics`;
  const body = {
    type: 'range',
    dateFrom: fechaInicio,
    dateTo: fechaFin
  };
  
  console.log(`📤 Llamando función edge con:`, body);
  console.log(`🔗 URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error HTTP ${response.status}: ${response.statusText}`);
      console.error(`📄 Respuesta:`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Respuesta exitosa:`, data);
    
    // Mostrar resultados
    console.log(`\n📊 RESULTADOS POR ETIQUETA:`);
    for (const [label, count] of Object.entries(data)) {
      console.log(`   ${label}: ${count} conversaciones`);
    }
    
    return data;
    
  } catch (error) {
    console.error(`💥 Error llamando función edge:`, error.message);
    return null;
  }
}

/**
 * Comparar resultados entre API directa y función edge
 */
async function compararResultados() {
  console.log(`\n🔬 ===== COMPARACIÓN DE RESULTADOS =====`);
  
  // Obtener datos de ambas fuentes
  const resultadosDirectos = {};
  
  for (const label of labelsAPprobar) {
    resultadosDirectos[label] = await probarDirectamenteChatwoot(label);
  }
  
  const resultadosSupabase = await probarFuncionSupabase();
  
  if (!resultadosSupabase) {
    console.error(`❌ No se pudieron obtener resultados de Supabase`);
    return;
  }
  
  // Comparar
  console.log(`\n📋 COMPARACIÓN:`);
  console.log(`${'Label'.padEnd(20)} | ${'Directo'.padEnd(10)} | ${'Supabase'.padEnd(10)} | Status`);
  console.log(`${'-'.repeat(60)}`);
  
  for (const label of labelsAPprobar) {
    const directo = resultadosDirectos[label] || 0;
    const supabase = resultadosSupabase[label] || 0;
    const coincide = directo === supabase;
    const status = coincide ? '✅ OK' : '❌ DIFF';
    
    console.log(`${label.padEnd(20)} | ${directo.toString().padEnd(10)} | ${supabase.toString().padEnd(10)} | ${status}`);
  }
}

// Ejecutar las pruebas
async function ejecutarPruebas() {
  console.log(`🧪 INICIANDO PRUEBAS DE PAGINACIÓN COMPLETA`);
  console.log(`🕒 ${new Date().toISOString()}\n`);
  
  try {
    await compararResultados();
    console.log(`\n✅ Pruebas completadas`);
  } catch (error) {
    console.error(`💥 Error durante las pruebas:`, error);
  }
}

// Ejecutar
ejecutarPruebas();
