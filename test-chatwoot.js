// Test script para verificar la conexión con Chatwoot
// Ejecutar con: node test-chatwoot.js

const CHATWOOT_BASE_URL = 'https://chatwoot-production-85da.up.railway.app';
const CHATWOOT_ACCOUNT_ID = '2';
const CHATWOOT_API_TOKEN = 'zqT41Ca1HTuEqTLdvfZiFWmM';

async function testChatwootConnection() {
  try {
    console.log('🔗 Probando conexión con Chatwoot...');
    console.log(`URL: ${CHATWOOT_BASE_URL}`);
    console.log(`Account ID: ${CHATWOOT_ACCOUNT_ID}`);
    console.log(`Token: ${CHATWOOT_API_TOKEN.substring(0, 10)}...`);

    // Test 1: Obtener info de la cuenta
    console.log('\n📊 Test 1: Información de la cuenta');
    const accountUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}`;
    
    const accountResponse = await fetch(accountUrl, {
      headers: {
        'api_access_token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      console.log('✅ Cuenta conectada exitosamente');
      console.log(`   Nombre: ${accountData.name || 'N/A'}`);
      console.log(`   ID: ${accountData.id || 'N/A'}`);
    } else {
      console.log('❌ Error conectando con la cuenta:', accountResponse.status);
      const errorText = await accountResponse.text();
      console.log('   Error:', errorText);
    }

    // Test 2: Obtener conversaciones de prueba
    console.log('\n💬 Test 2: Conversaciones (primera página)');
    const conversationsUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?status=all&page=1`;
    
    const conversationsResponse = await fetch(conversationsUrl, {
      headers: {
        'api_access_token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (conversationsResponse.ok) {
      const conversationsData = await conversationsResponse.json();
      const conversations = conversationsData.data?.payload || [];
      console.log('✅ Conversaciones obtenidas exitosamente');
      console.log(`   Total en esta página: ${conversations.length}`);
      console.log(`   Meta counts: ${JSON.stringify(conversationsData.data?.meta || {})}`);
      
      if (conversations.length > 0) {
        const firstConv = conversations[0];
        console.log(`   Primera conversación ID: ${firstConv.id}`);
        console.log(`   Created at: ${firstConv.created_at} (${new Date(firstConv.created_at * 1000).toISOString()})`);
      }
    } else {
      console.log('❌ Error obteniendo conversaciones:', conversationsResponse.status);
      const errorText = await conversationsResponse.text();
      console.log('   Error:', errorText);
    }

    // Test 3: Probar etiquetas específicas
    console.log('\n🏷️  Test 3: Conversaciones con etiqueta específica');
    const labels = ['comprobante_enviado', 'factura_enviada', 'soporte'];
    
    for (const label of labels) {
      const labelUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?labels[]=${encodeURIComponent(label)}&status=all&page=1`;
      
      const labelResponse = await fetch(labelUrl, {
        headers: {
          'api_access_token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (labelResponse.ok) {
        const labelData = await labelResponse.json();
        const conversations = labelData.data?.payload || [];
        console.log(`   ${label}: ${conversations.length} conversaciones`);
      } else {
        console.log(`   ${label}: Error ${labelResponse.status}`);
      }
    }

    console.log('\n🎉 Pruebas de conexión completadas');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar las pruebas
testChatwootConnection();
