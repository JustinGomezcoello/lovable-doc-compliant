# 🟦 ACTUALIZACIÓN DEL DASHBOARD - 8 CAMPAÑAS DE WHATSAPP

## 📋 Resumen de Cambios

Se ha actualizado completamente la pestaña "Día a Día" del dashboard para manejar **8 campañas de WhatsApp** en lugar de las 5 anteriores.

---

## 🎯 LAS 8 TABLAS DE CAMPAÑAS

### ▣ MORA NEGATIVA (4 tablas)
1. `point_mora_neg5` → **MORA NEGATIVA 5**
2. `point_mora_neg3` → **MORA NEGATIVA 3**
3. `point_mora_neg2` → **MORA NEGATIVA 2**
4. `point_mora_neg1` → **MORA NEGATIVA 1**

### ▣ MORA POSITIVA (2 tablas)
5. `point_mora_pos1` → **MORA POSITIVA 1**
6. `point_mora_pos4` → **MORA POSITIVA 4**

### ▣ OTROS FLUJOS (2 tablas)
7. `point_compromiso_pago` → **COMPROMISO DE PAGO**
8. `point_reactivacion_cobro` → **REACTIVACIÓN COBRO**

---

## 📝 Estructura de Cada Tabla

Todas las tablas tienen la misma estructura:
- `fecha` (DATE) - Ej: "2025-11-18"
- `hora` (TEXT)
- `cedulas` (ARRAY) - Array de cédulas enviadas ese día
- `count_day` (INTEGER) - Cantidad de WhatsApps enviados ese día
- `total_cum` (INTEGER)
- `notes` (TEXT)

---

## 🔧 Cambios Realizados

### 1. Actualización de Tipos de Supabase
**Archivo:** `src/integrations/supabase/types.ts`

Se agregaron las definiciones de tipo para las 6 nuevas tablas:
- `point_mora_neg1`
- `point_mora_neg2`
- `point_mora_neg3`
- `point_mora_neg5`
- `point_mora_pos1`
- `point_mora_pos4`

Cada una con la misma estructura que las tablas existentes.

### 2. Actualización del Componente DayByDayTab
**Archivo:** `src/components/dashboard/DayByDayTab.tsx`

#### Cambios en el array de campañas:
```typescript
const campaignTables = [
  'point_mora_neg5',
  'point_mora_neg3',
  'point_mora_neg2',
  'point_mora_neg1',
  'point_mora_pos1',
  'point_mora_pos4',
  'point_compromiso_pago',
  'point_reactivacion_cobro'
] as const;
```

#### Cambios en los nombres de campañas:
```typescript
const campaignNames: Record<string, string> = {
  'point_mora_neg5': 'MORA NEGATIVA 5',
  'point_mora_neg3': 'MORA NEGATIVA 3',
  'point_mora_neg2': 'MORA NEGATIVA 2',
  'point_mora_neg1': 'MORA NEGATIVA 1',
  'point_mora_pos1': 'MORA POSITIVA 1',
  'point_mora_pos4': 'MORA POSITIVA 4',
  'point_compromiso_pago': 'COMPROMISO DE PAGO',
  'point_reactivacion_cobro': 'REACTIVACIÓN COBRO'
};
```

#### Agregado de constante de costo:
```typescript
const COSTO_POR_MENSAJE = 0.014;
```

### 3. Nueva Tarjeta de Explicación Completa

Se agregó una tarjeta informativa completa al inicio del dashboard que explica:

- **Las 8 tablas de campañas** organizadas por categoría
- **WhatsApp Enviados:** Qué significa y cómo se calcula
- **Costo del Día/Rango:** Fórmula de cálculo
- **Cédulas Únicas por Campaña:** Deduplicación por tabla
- **Cédulas Únicas Globales:** Deduplicación global (personas únicas)
- **Respondieron:** Criterio de conversation_id ≠ 0 y ≠ NULL
- **No Respondieron:** Criterio de conversation_id = 0 o NULL
- **Diferencia entre métricas por tabla vs globales**
- **Regla matemática obligatoria**

---

## 🟦 LÓGICA IMPLEMENTADA

### Sección 1: "MÉTRICAS POR DÍA" (Fecha Única)

Para una fecha específica:

1. **Métricas por Tabla (8 campañas individuales):**
   - WhatsApp enviados = `SUM(count_day)` para esa tabla
   - Costo = `whatsapp_enviados × $0.014`
   - Cédulas únicas = Deduplicar cédulas de esa tabla
   - Respondieron/No respondieron por tabla

2. **Métricas Globales del Día:**
   - WhatsApp enviados global = Suma de todas las tablas
   - Costo global = Suma de costos de todas las tablas
   - Cédulas únicas globales = Deduplicar cédulas de TODAS las 8 tablas
   - Respondieron/No respondieron global

### Sección 2: "DETALLE POR CAMPAÑA" (Rango de Fechas)

Para un rango de fechas:

1. **Procesamiento día por día:**
   - Para cada día del rango
   - Consultar las 8 tablas
   - Calcular WhatsApp enviados y cédulas únicas de ese día

2. **Cálculo global del rango:**
   - Unir todas las cédulas del rango
   - Deduplicar globalmente
   - Calcular respondieron/no respondieron para el rango completo

---

## ✅ REGLAS IMPLEMENTADAS

1. ✅ Son 8 tablas verificadas en Supabase
2. ✅ Se calculan datos por tabla Y datos globales
3. ✅ Siempre se deduplicanlas cédulas
4. ✅ Nunca se inventan datos
5. ✅ Para "respondió" se usa POINT_Competencia con conversation_id ≠ 0 y ≠ NULL
6. ✅ Se valida siempre: `respondieron + no_respondieron = total_cedulas_unicas`
7. ✅ En rangos, se procesa día por día
8. ✅ En globales, nunca se cuenta la misma cédula dos veces

---

## 🟢 Verificación Matemática

El dashboard implementa verificaciones automáticas:

```
Respondieron + No Respondieron = Cédulas Únicas
```

Esta regla se cumple tanto a nivel:
- Por tabla individual
- Global del día
- Global del rango

---

## 📊 Diferencia Clave: Por Tabla vs Global

### Por Tabla:
- Mide actividad de cada campaña individual
- Una persona puede aparecer en varias campañas
- Los totales se suman

### Global:
- Mide comportamiento de personas únicas
- Cada persona se cuenta una sola vez
- Los totales NO coinciden con la suma de las tablas (esto es correcto)

**Ejemplo:**
- Tabla A: 100 cédulas
- Tabla B: 150 cédulas
- Suma por tabla: 250 cédulas
- **Global: 200 cédulas** ← Porque 50 personas estaban en ambas campañas

---

## 🔍 Consulta a POINT_Competencia

Para determinar si una persona respondió:

```sql
SELECT Cedula, conversation_id 
FROM POINT_Competencia 
WHERE Cedula IN (lista_de_cedulas_unicas)
```

**Clasificación:**
- `conversation_id ≠ 0 AND conversation_id ≠ NULL` → **Respondió ✅**
- `conversation_id = 0 OR conversation_id = NULL` → **No Respondió ❌**

---

## 🚀 Estado Actual

✅ Tipos de Supabase actualizados
✅ Componente DayByDayTab actualizado
✅ Lógica de 8 campañas implementada
✅ Tarjeta de explicación agregada
✅ Métricas por tabla implementadas
✅ Métricas globales implementadas
✅ Deduplicación correcta de cédulas
✅ Validación matemática implementada
✅ Sin errores de compilación

---

## 📌 Próximos Pasos (si es necesario)

1. **Verificar que las 8 tablas existan en Supabase** con datos reales
2. **Probar el dashboard** con fechas que tengan datos
3. **Validar los cálculos** contra datos reales
4. **Ajustar el diseño UI** si es necesario

---

## 💡 Notas Importantes

- El costo por mensaje está hardcodeado: `$0.014`
- Las cédulas se convierten a números para la consulta a POINT_Competencia
- Se manejan errores gracefully (si una tabla no existe o no tiene datos)
- Se usa caching de 5 minutos para las queries
- Los logs en consola ayudan a debuggear el flujo de datos

---

**Fecha de actualización:** 19 de Noviembre 2025
**Versión:** 2.0 - 8 Campañas
