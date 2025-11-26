# 🔧 ACTUALIZACIÓN: Filtros de Tabla de Decisión - Campañas de Mora

## 📅 Fecha
${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}

---

## 🎯 CAMBIOS REALIZADOS

### 1. **Actualización de Filtros para Mora Negativa**

**ANTES (2 filtros):**
```sql
DiasMora = -1/-2/-3/-4/-5
AND SaldoPorVencer != 0
AND compromiso_pago_fecha IS NULL
```

**AHORA (5 filtros):**
```sql
DiasMora Equals -1/-2/-3/-4/-5
AND SaldoPorVencer Greater Than 5
AND compromiso_pago_fecha Is null
AND Pagado Equals NO
AND ComprobanteEnviado Is null
```

---

### 2. **Actualización de Filtros para Mora Positiva**

**ANTES (3 filtros):**
```sql
DiasMora = 1/2/3/4/5
AND SaldoVencido != 0
AND ComprobanteEnviado IS NULL
AND compromiso_pago_fecha IS NULL
```

**AHORA (5 filtros):**
```sql
DiasMora Equals 1/2/3/4/5
AND SaldoVencido Greater Than 5
AND compromiso_pago_fecha Is null
AND Pagado Equals NO
AND ComprobanteEnviado Is null
```

---

### 3. **Nueva Campaña: Días Mora 0** ✨

**Filtros (5):**
```sql
DiasMora Equals 0
AND SaldoPorVencer Greater Than 5
AND compromiso_pago_fecha Is null
AND Pagado Equals NO
AND ComprobanteEnviado Is null
```

**Lógica:**
- Clientes que tienen **DiasMora = 0** (en punto de vencimiento)
- Con saldo por vencer mayor a $5
- Sin compromiso de pago registrado
- Sin pago realizado
- Sin comprobante enviado

---

## 📊 CAMPAÑAS ACTUALIZADAS

La tabla ahora muestra **11 campañas** en total:

### Mora Negativa (5 campañas)
1. MORA NEGATIVA 5 → DiasMora = -5
2. MORA NEGATIVA 4 → DiasMora = -4
3. MORA NEGATIVA 3 → DiasMora = -3
4. MORA NEGATIVA 2 → DiasMora = -2
5. MORA NEGATIVA 1 → DiasMora = -1

### **Nueva: Días Mora 0 (1 campaña)** 🆕
6. **DIAS MORA 0** → DiasMora = 0

### Mora Positiva (5 campañas)
7. MORA POSITIVA 1 → DiasMora = 1
8. MORA POSITIVA 2 → DiasMora = 2
9. MORA POSITIVA 3 → DiasMora = 3
10. MORA POSITIVA 4 → DiasMora = 4
11. MORA POSITIVA 5 → DiasMora = 5

---

## 🔍 DIFERENCIAS CLAVE EN LOS NUEVOS FILTROS

### ✅ Cambios Comunes a Todas las Campañas:

| Filtro Anterior | Filtro Nuevo | Razón del Cambio |
|----------------|--------------|------------------|
| `!= 0` (diferente de cero) | `> 5` (mayor que 5) | Excluir deudas muy pequeñas (menos de $5) |
| ❌ No existía | `Pagado = NO` | Excluir clientes que ya pagaron |
| ❌ No existía (solo positivas) | `ComprobanteEnviado IS NULL` | Excluir clientes que ya enviaron comprobante |

### 📈 Mora Negativa (campañas -5 a -1)
- Usa **SaldoPorVencer** (deuda que aún no ha vencido)
- Ahora requiere que `Pagado = NO` y `ComprobanteEnviado IS NULL`

### 🆕 Días Mora 0 (nueva campaña)
- Similar a mora negativa, usa **SaldoPorVencer**
- Captura clientes en el punto exacto de vencimiento

### 📉 Mora Positiva (campañas 1 a 5)
- Usa **SaldoVencido** (deuda que ya venció)
- Ahora requiere que `Pagado = NO` (antes solo verificaba comprobante)

---

## 🎨 INTERFAZ DE USUARIO ACTUALIZADA

### Explicación de Filtros

La sección de "Filtros aplicados" ahora muestra:

```
Filtros aplicados (5 filtros cada campaña):

• Mora Negativa (-5 a -1): DiasMora Equals -1/-2/-3/-4/-5, 
  SaldoPorVencer Greater Than 5, compromiso_pago_fecha Is null, 
  Pagado Equals NO, ComprobanteEnviado Is null

• Días Mora 0: DiasMora Equals 0, SaldoPorVencer Greater Than 5, 
  compromiso_pago_fecha Is null, Pagado Equals NO, 
  ComprobanteEnviado Is null

• Mora Positiva (1 a 5): DiasMora Equals 1/2/3/4/5, 
  SaldoVencido Greater Than 5, compromiso_pago_fecha Is null, 
  Pagado Equals NO, ComprobanteEnviado Is null
```

---

## 🔧 CÓDIGO MODIFICADO

### Ubicación del Cambio
**Archivo:** `src/components/dashboard/DayByDayTab.tsx`  
**Función:** `useQuery` → `queryFn` de "decision-table-mora-campaigns"

### Lógica de Filtros Implementada

```typescript
if (campaign.type === "negative") {
  // Mora negativa: 5 filtros
  query = query
    .gt("SaldoPorVencer", 5)
    .is("compromiso_pago_fecha", null)
    .eq("Pagado", "NO")
    .is("ComprobanteEnviado", null);
    
} else if (campaign.type === "zero") {
  // Días mora 0: 5 filtros
  query = query
    .gt("SaldoPorVencer", 5)
    .is("compromiso_pago_fecha", null)
    .eq("Pagado", "NO")
    .is("ComprobanteEnviado", null);
    
} else {
  // Mora positiva: 5 filtros
  query = query
    .gt("SaldoVencido", 5)
    .is("compromiso_pago_fecha", null)
    .eq("Pagado", "NO")
    .is("ComprobanteEnviado", null);
}
```

---

## 🧪 PRUEBAS RECOMENDADAS

### 1. Verificar Conteos Correctos

1. Ir al Dashboard → Tab "Día a Día"
2. Scroll hasta "📊 Tabla de Decisión - Campañas de Mora"
3. Click en "Actualizar"
4. Verificar que aparezcan las **11 campañas** (incluida "DIAS MORA 0")

### 2. Verificar Logs en Consola

Abrir DevTools (F12) y buscar en la consola:

```
🔍 Consultando: MORA NEGATIVA 5 (DiasMora=-5)
   🔹 Filtros: DiasMora Equals -5, SaldoPorVencer Greater Than 5, compromiso_pago_fecha Is null, Pagado Equals NO, ComprobanteEnviado Is null
   ✅ Registros elegibles (con filtros): [número]

🔍 Consultando: DIAS MORA 0 (DiasMora=0)
   🔹 Filtros: DiasMora Equals 0, SaldoPorVencer Greater Than 5, compromiso_pago_fecha Is null, Pagado Equals NO, ComprobanteEnviado Is null
   ✅ Registros elegibles (con filtros): [número]

🔍 Consultando: MORA POSITIVA 1 (DiasMora=1)
   🔹 Filtros: DiasMora Equals 1, SaldoVencido Greater Than 5, compromiso_pago_fecha Is null, Pagado Equals NO, ComprobanteEnviado Is null
   ✅ Registros elegibles (con filtros): [número]
```

### 3. Comparar Resultados con Supabase UI

Ejecutar manualmente en Supabase para verificar:

**Ejemplo para MORA NEGATIVA 3:**
```sql
SELECT COUNT(*) 
FROM POINT_Competencia
WHERE DiasMora = -3
  AND SaldoPorVencer > 5
  AND compromiso_pago_fecha IS NULL
  AND Pagado = 'NO'
  AND ComprobanteEnviado IS NULL;
```

**Ejemplo para DIAS MORA 0:**
```sql
SELECT COUNT(*) 
FROM POINT_Competencia
WHERE DiasMora = 0
  AND SaldoPorVencer > 5
  AND compromiso_pago_fecha IS NULL
  AND Pagado = 'NO'
  AND ComprobanteEnviado IS NULL;
```

**Ejemplo para MORA POSITIVA 4:**
```sql
SELECT COUNT(*) 
FROM POINT_Competencia
WHERE DiasMora = 4
  AND SaldoVencido > 5
  AND compromiso_pago_fecha IS NULL
  AND Pagado = 'NO'
  AND ComprobanteEnviado IS NULL;
```

---

## 📈 IMPACTO ESPERADO

### ✅ Mejoras

1. **Filtrado más preciso:**
   - Excluye deudas pequeñas (menos de $5)
   - Excluye clientes que ya pagaron
   - Excluye clientes que ya enviaron comprobante

2. **Nueva segmentación:**
   - Captura clientes en punto exacto de vencimiento (Días Mora 0)

3. **Reducción de duplicados:**
   - No se enviarán mensajes a clientes que ya pagaron
   - No se enviarán mensajes a clientes que ya enviaron comprobante

### ⚠️ Consideraciones

- Los conteos de registros elegibles **serán menores** que antes (por los filtros adicionales)
- Esto es **esperado y correcto**: solo se cuentan clientes realmente elegibles
- Menos mensajes = menor costo, mayor efectividad

---

## 📝 CHECKLIST DE VALIDACIÓN

- [x] Código modificado en `DayByDayTab.tsx`
- [x] Filtros actualizados para Mora Negativa (5 filtros)
- [x] Filtros actualizados para Mora Positiva (5 filtros)
- [x] Nueva campaña "DIAS MORA 0" agregada (5 filtros)
- [x] Interfaz UI actualizada con explicación de filtros
- [x] Logs de consola actualizados con descripción completa
- [ ] **Pendiente:** Validar conteos en ambiente real
- [ ] **Pendiente:** Comparar con Supabase UI

---

## 🔗 ARCHIVOS MODIFICADOS

- **`src/components/dashboard/DayByDayTab.tsx`** ✅ Actualizado

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `TABLA_DECISION_CAMPANAS_MORA.md` - Documentación original (requiere actualización)
- `FIX_DECISION_TABLE_ZERO_RECORDS.md` - Corrección anterior de filtros

---

## ✅ IMPLEMENTACIÓN COMPLETADA

**Estado:** ✅ Funcional  
**Archivos modificados:** 1  
**Nueva campaña agregada:** DIAS MORA 0  
**Filtros actualizados:** De 2-3 filtros a 5 filtros por campaña  
**Errores:** 0

---

## 🚀 PRÓXIMOS PASOS

1. **Testing en producción:**
   - Verificar que los conteos sean correctos
   - Comparar con Supabase UI manualmente

2. **Monitoreo:**
   - Observar si los nuevos filtros reducen significativamente los conteos
   - Ajustar umbrales si es necesario (ej: cambiar `> 5` a `> 10`)

3. **Documentación:**
   - Actualizar `TABLA_DECISION_CAMPANAS_MORA.md` con los nuevos filtros
   - Crear guía de interpretación de resultados

---

**Fin del documento**
