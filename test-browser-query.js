// Script de prueba para consultar directamente Supabase
// Ejecutar en la consola del navegador (F12)

console.log("🧪 TEST DIRECTO A SUPABASE\n");

// Copiar esto y ejecutar en la consola del navegador:
const testQuery = async () => {
  const { createClient } = window.supabase;
  
  if (!createClient) {
    console.error("❌ Supabase no está disponible");
    return;
  }
  
  // Obtener el cliente de Supabase de la ventana global
  const supabase = window.supabaseClient || createClient(
    "TU_SUPABASE_URL",
    "TU_SUPABASE_ANON_KEY"
  );
  
  console.log("📋 Probando tabla: point_mora_neg1\n");
  
  // Test 1: Traer cualquier dato sin filtro
  console.log("🔍 Test 1: Traer datos sin filtro");
  const { data: allData, error: allError } = await supabase
    .from("point_mora_neg1")
    .select("fecha, count_day, cedulas")
    .limit(5);
    
  if (allError) {
    console.error("❌ Error:", allError);
  } else {
    console.log("✅ Datos encontrados:", allData?.length);
    console.log("📅 Fechas encontradas:", allData?.map(d => d.fecha));
    console.table(allData);
  }
  
  // Test 2: Filtrar por fecha específica
  console.log("\n🔍 Test 2: Filtrar por fecha 2025-11-18");
  const { data: filteredData, error: filterError } = await supabase
    .from("point_mora_neg1")
    .select("fecha, count_day, cedulas")
    .eq("fecha", "2025-11-18");
    
  if (filterError) {
    console.error("❌ Error:", filterError);
  } else {
    console.log("✅ Datos encontrados:", filteredData?.length);
    console.table(filteredData);
  }
  
  // Test 3: Verificar todas las fechas únicas
  console.log("\n🔍 Test 3: Todas las fechas únicas");
  const { data: allDates, error: datesError } = await supabase
    .from("point_mora_neg1")
    .select("fecha");
    
  if (!datesError && allDates) {
    const uniqueDates = [...new Set(allDates.map(d => d.fecha))];
    console.log("📅 Fechas únicas:", uniqueDates.sort());
  }
};

console.log("🎯 Para ejecutar el test:");
console.log("1. Abre DevTools (F12)");
console.log("2. Ve a la pestaña Console");
console.log("3. Copia y pega esta función");
console.log("4. Ejecuta: testQuery()");
console.log("\n✅ Test preparado");
