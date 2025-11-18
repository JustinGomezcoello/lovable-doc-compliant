/**
 * Test para verificar que los mensajes del sistema se filtren correctamente
 * Especialmente mensajes como "Paolo added comprobante_enviado"
 */

// Función de test para parseMessage (copiada del componente)
const parseMessage = (messageText, role) => {
  if (!messageText || !messageText.trim()) return null;
  
  const text = messageText.trim();
  
  // Patrones más específicos para capturar TODOS los mensajes del sistema
  const estadosSistemaPatterns = [
    // Patrones en español
    /\b\w+\s+(agregó|añadió|eliminó|quitó|modificó|cambió|actualizó)/i,
    /\b\w+\s+(agregó|añadió|eliminó|quitó|modificó|cambió|actualizó)\s+/i,
    /^(agregó|añadió|eliminó|quitó|modificó|cambió|actualizó)/i,
    
    // Patrones en inglés (común en sistemas)
    /\b\w+\s+(added|removed|deleted|updated|modified|changed)/i,
    /\b\w+\s+(added|removed|deleted|updated|modified|changed)\s+/i,
    /^(added|removed|deleted|updated|modified|changed)/i,
    
    // Patrones específicos de Chatwoot/Paolo
    /^Paolo\s+(agregó|añadió|eliminó|quitó|modificó|cambió|actualizó|added|removed|deleted|updated)/i,
    /Paolo\s+(added|removed|deleted|updated|modified|changed)/i,
    
    // Patrones para campos específicos como "comprobante_enviado"
    /\w+\s+(added|removed)\s+\w+/i,
    /\w+\s+(agregó|eliminó)\s+\w+/i,
    
    // Errores del sistema
    /\[ERROR\s+EXTERNO\]/i,
    /\(#\d+\)/,
    
    // Patrones para mensajes vacíos o de sistema
    /^null$/i,
    /^undefined$/i,
    /^\s*$/,
    
    // Patrones para acciones de etiquetas/labels
    /\w+\s+(added|removed|applied|deleted)\s+(label|tag|etiqueta)/i,
    /\w+\s+(agregó|eliminó|aplicó)\s+(etiqueta|label)/i
  ];
  
  const isStateMessage = estadosSistemaPatterns.some(pattern => pattern.test(text));
  if (isStateMessage) {
    console.log("🚫 Mensaje del sistema filtrado:", text, "- Rol:", role);
    return null; // No mostrar estos mensajes
  }
  
  return text; // Mensaje válido
};

// Casos de test con mensajes problemáticos
const testMessages = [
  // Mensajes que DEBEN SER FILTRADOS (return null)
  { text: "Paolo added comprobante_enviado", role: "BOT", shouldFilter: true },
  { text: "Paolo agregó comprobante_enviado", role: "BOT", shouldFilter: true },
  { text: "Paolo removed etiqueta_pagado", role: "BOT", shouldFilter: true },
  { text: "Paolo eliminó la etiqueta", role: "BOT", shouldFilter: true },
  { text: "Usuario added label", role: "CLIENTE", shouldFilter: true },
  { text: "System updated status", role: "DESCONOCIDO", shouldFilter: true },
  { text: "added new_field", role: "BOT", shouldFilter: true },
  { text: "removed old_field", role: "BOT", shouldFilter: true },
  { text: "Paolo deleted conversation", role: "BOT", shouldFilter: true },
  { text: "Admin modificó el estado", role: "BOT", shouldFilter: true },
  { text: "[ERROR EXTERNO]", role: "BOT", shouldFilter: true },
  { text: "Error (#100)", role: "BOT", shouldFilter: true },
  
  // Mensajes que NO DEBEN SER FILTRADOS (return text)
  { text: "Hola, ¿cómo estás?", role: "CLIENTE", shouldFilter: false },
  { text: "Gracias por tu compra", role: "BOT", shouldFilter: false },
  { text: "El precio es $50", role: "BOT", shouldFilter: false },
  { text: "Paolo me ayudó mucho", role: "CLIENTE", shouldFilter: false }, // Paolo en contexto normal
  { text: "El producto fue added a mi carrito", role: "CLIENTE", shouldFilter: false }, // added en contexto normal
  { text: "Necesito soporte técnico", role: "CLIENTE", shouldFilter: false },
  { text: "Su pedido está en proceso", role: "BOT", shouldFilter: false }
];

console.log("🧪 INICIANDO PRUEBAS DE FILTRADO DE MENSAJES DEL SISTEMA\n");

let testsPassed = 0;
let testsFailed = 0;

testMessages.forEach((testCase, index) => {
  const result = parseMessage(testCase.text, testCase.role);
  const actuallyFiltered = result === null;
  const passed = actuallyFiltered === testCase.shouldFilter;
  
  console.log(`\n📝 Test ${index + 1}: "${testCase.text}"`);
  console.log(`   Rol: ${testCase.role}`);
  console.log(`   Debe filtrar: ${testCase.shouldFilter}`);
  console.log(`   Resultado: ${actuallyFiltered ? 'FILTRADO' : 'MOSTRADO'}`);
  console.log(`   Estado: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (passed) {
    testsPassed++;
  } else {
    testsFailed++;
    console.log(`   ⚠️  PROBLEMA: Se esperaba ${testCase.shouldFilter ? 'filtrar' : 'mostrar'} pero se ${actuallyFiltered ? 'filtró' : 'mostró'}`);
  }
});

console.log(`\n📊 RESULTADOS FINALES:`);
console.log(`✅ Pruebas exitosas: ${testsPassed}`);
console.log(`❌ Pruebas fallidas: ${testsFailed}`);
console.log(`📈 Tasa de éxito: ${((testsPassed / testMessages.length) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log(`\n🎉 ¡PERFECTO! Todos los mensajes del sistema serán filtrados correctamente.`);
  console.log(`   Los mensajes como "Paolo added comprobante_enviado" ya NO aparecerán.`);
} else {
  console.log(`\n⚠️  Algunos patrones necesitan ajuste para filtrar mejor.`);
}
