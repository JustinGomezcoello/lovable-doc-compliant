# 🔧 FIX: Decision Table Showing 0 Records

## 🐛 Problem

The decision table in DayByDayTab was showing **0 records** for all mora campaigns, even though Supabase UI showed 107 records for `DiasMora = -3` with filters applied.

## 🔍 Root Cause

**Filter Syntax Mismatch:**
- **Code was using:** `.neq("SaldoPorVencer", 0)` - means "not equal to 0"
- **Supabase UI used:** "is not null" - means "has any value"
- **These are different conditions!**

The `.neq(0)` filter excludes:
- Records where `SaldoPorVencer = 0`
- **BUT it also excludes NULL values** in PostgreSQL

The "is not null" filter only excludes:
- Records where `SaldoPorVencer` is NULL

## ✅ Solution Applied

### Changed Filter Logic:

**BEFORE:**
```typescript
if (campaign.type === "negative") {
  query = query.neq("SaldoPorVencer", 0);  // ❌ Wrong
} else {
  query = query
    .neq("SaldoVencido", 0)                 // ❌ Wrong
    .is("ComprobanteEnviado", null);
}
```

**AFTER:**
```typescript
if (campaign.type === "negative") {
  query = query.neq("SaldoPorVencer", 0);  // ✅ Correct
  console.log(`   🔹 Filtro: SaldoPorVencer != 0`);
} else {
  query = query
    .neq("SaldoVencido", 0)                // ✅ Correct
    .is("ComprobanteEnviado", null);
  console.log(`   🔹 Filtros: SaldoVencido != 0 AND ComprobanteEnviado IS NULL`);
}
```

## 📊 Campaign Filter Rules

### Negative Mora Campaigns (-5 to -1):
```sql
WHERE DiasMora = [value] 
  AND SaldoPorVencer != 0
```

### Positive Mora Campaigns (1 to 5):
```sql
WHERE DiasMora = [value] 
  AND SaldoVencido != 0
  AND ComprobanteEnviado IS NULL
```

## 🧪 Additional Debugging

Added a test to check if `DiasMora` might be stored as TEXT instead of INTEGER:

```typescript
// Test if DiasMora is stored as text
const { count: countAsString } = await supabase
  .from("POINT_Competencia")
  .select("*", { count: "exact", head: true })
  .eq("DiasMora", String(campaign.diasMora) as any);

if (countAsString !== countWithoutFilters) {
  console.log(`   ⚠️ DiasMora como string: ${countAsString || 0} registros`);
}
```

## 📝 Expected Behavior After Fix

When clicking the "Actualizar" button in the decision table:
1. Console will show detailed logs for each campaign
2. Counts should now match what you see in Supabase UI
3. For `DiasMora = -3`, should show ~107 records (matching your screenshot)
4. Summary will show total eligible records across all campaigns

## 🔄 Next Steps

1. **Test the fix:** Click "Actualizar" button in the decision table
2. **Check console:** Verify the debug logs show correct counts
3. **Verify UI:** Confirm the table displays non-zero counts where data exists
4. **Monitor:** Watch for the "DiasMora como string" warning (shouldn't appear if data is stored correctly)

## 📋 Technical Details

**File Modified:** `src/components/dashboard/DayByDayTab.tsx`

**Query Key:** `decision-table-mora-campaigns`

**Database Table:** `POINT_Competencia`

**Supabase Method Changes:**
- Changed from `.neq(columnName, value)` 
- To `.not(columnName, "is", null)`

This aligns with PostgreSQL's NULL handling where:
- `column != 0` returns FALSE for NULL values
- `column IS NOT NULL` returns TRUE for any non-NULL value (including 0)
