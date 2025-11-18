// Test script to check campaign tables data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://emnfbwfqbngrknqlfopq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbmZid2ZxYm5ncmtucWxmb3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3OTIwNDksImV4cCI6MjA0NzM2ODA0OX0.vSh4JIEHCpGGNLZp_K8kX16_Bmo8cNhGGNn6ZA9dfIk';

async function testTables() {
  console.log('🔍 Iniciando verificación de tablas...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const tables = [
    'point_compromiso_pago',
    'point_mora_1',
    'point_mora_3',
    'point_mora_5', 
    'point_reactivacion_cobro'
  ];
  
  const today = '2025-11-18';
  
  for (const table of tables) {
    try {
      console.log(`\n📋 Verificando tabla: ${table}`);
      
      // First get structure
      const { data: sampleData, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.log(`   ❌ Error: ${sampleError.message}`);
        continue;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log(`   ✅ Tabla existe. Campos:`, Object.keys(sampleData[0]));
        
        // Check for today's data
        const { data: todayData, error: todayError } = await supabase
          .from(table)
          .select('*')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);
          
        if (todayError) {
          console.log(`   ❌ Error consultando fecha: ${todayError.message}`);
        } else {
          console.log(`   📊 Registros para ${today}: ${todayData?.length || 0}`);
          if (todayData && todayData.length > 0) {
            console.log(`   📄 Muestra:`, todayData[0]);
          }
        }
      } else {
        console.log(`   ⚠️ Tabla vacía o sin datos`);
      }
      
    } catch (err) {
      console.log(`   💥 Error: ${err.message}`);
    }
  }
  
  console.log('\n✅ Verificación completada');
}

testTables();
