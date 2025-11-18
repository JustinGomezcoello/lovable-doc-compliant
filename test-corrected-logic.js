// Test the corrected logic for campaign tables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://emnfbwfqbngrknqlfopq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbmZid2ZxYm5ncmtucWxmb3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3OTIwNDksImV4cCI6MjA0NzM2ODA0OX0.vSh4JIEHCpGGNLZp_K8kX16_Bmo8cNhGGNn6ZA9dfIk';

async function testCorrectedLogic() {
  console.log('🔍 Testing corrected campaign logic...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const campaignTables = [
    'point_compromiso_pago',
    'point_mora_1', 
    'point_mora_3',
    'point_mora_5',
    'point_reactivacion_cobro'
  ];
  
  const testDate = '2025-11-18';
  let totalSent = 0;
  let allCedulas = [];
  
  console.log(`\n📊 Testing for date: ${testDate}`);
  
  for (const tableName of campaignTables) {
    try {
      console.log(`\n🔍 Querying ${tableName}...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select("Cedula")
        .eq("fecha", testDate);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        continue;
      }
      
      if (data && data.length > 0) {
        const sent = data.length;
        const cost = (sent * 0.014).toFixed(2);
        
        console.log(`   ✅ Found ${sent} records, cost: $${cost}`);
        console.log(`   📋 Sample cedulas:`, data.slice(0, 3).map(r => r.Cedula));
        
        totalSent += sent;
        const tableCedulas = data
          .map(record => String(record.Cedula || '').trim())
          .filter(cedula => cedula && cedula !== '');
        allCedulas.push(...tableCedulas);
      } else {
        console.log(`   ⚠️ No records found`);
      }
      
    } catch (err) {
      console.log(`   💥 Error: ${err.message}`);
    }
  }
  
  const uniqueCedulas = Array.from(new Set(allCedulas));
  const totalCost = (totalSent * 0.014).toFixed(2);
  
  console.log(`\n📊 SUMMARY FOR ${testDate}:`);
  console.log(`   📤 Total Sent: ${totalSent}`);
  console.log(`   💰 Total Cost: $${totalCost}`);
  console.log(`   👥 Unique Contacts: ${uniqueCedulas.length}`);
  console.log(`   📋 Total Cedulas (with duplicates): ${allCedulas.length}`);
  
  if (uniqueCedulas.length > 0) {
    console.log(`   🔢 Sample unique cedulas:`, uniqueCedulas.slice(0, 5));
  }
}

testCorrectedLogic();
