// Test para verificar las consultas a Supabase
console.log("🧪 Probando consultas a las tablas de campaña\n");

const tables = [
  'point_mora_neg5',
  'point_mora_neg3',
  'point_mora_neg2',
  'point_mora_neg1',
  'point_mora_pos1',
  'point_mora_pos4',
  'point_compromiso_pago',
  'point_reactivacion_cobro'
];

console.log("📋 Tablas a consultar:");
tables.forEach((table, idx) => {
  console.log(`   ${idx + 1}. ${table}`);
});

console.log("\n🔍 Pasos de verificación:");
console.log("   1. Abrir DevTools (F12) en el navegador");
console.log("   2. Ir a la pestaña 'Console'");
console.log("   3. Buscar los logs que empiezan con 📅, 🔍, ✅, ⚠️");
console.log("   4. Verificar:");
console.log("      - '📅 [tabla] - Fechas disponibles' muestra las fechas que existen");
console.log("      - '🔍 [tabla] - [fecha]: Registros encontrados' debe ser > 0");
console.log("      - '✅ [tabla] - [fecha]: X enviados' si hay datos");
console.log("      - '⚠️ [tabla] - [fecha]: Sin datos' si no hay");

console.log("\n💡 Posibles problemas:");
console.log("   ❌ Si muestra 'Sin datos' pero las fechas existen:");
console.log("      - El formato de fecha no coincide");
console.log("      - La columna 'fecha' puede ser TEXT en lugar de DATE");
console.log("      - Puede haber espacios o caracteres extra en la fecha");
console.log("");
console.log("   ❌ Si no aparece ningún log:");
console.log("      - Las tablas no existen en Supabase");
console.log("      - Hay un error de permisos (RLS)");
console.log("      - Error de conexión a Supabase");

console.log("\n📊 Para verificar en Supabase:");
console.log("   1. Ir a Table Editor en Supabase");
console.log("   2. Abrir cada tabla");
console.log("   3. Ver el contenido de la columna 'fecha'");
console.log("   4. Copiar EXACTAMENTE el valor de una fecha");
console.log("   5. Verificar que coincida con el formato: YYYY-MM-DD");

console.log("\n✅ Test script generado correctamente");
console.log("   Refresca el dashboard y revisa la consola del navegador\n");
