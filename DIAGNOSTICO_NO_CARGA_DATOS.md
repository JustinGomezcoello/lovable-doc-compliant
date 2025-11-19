# 🔧 DIAGNÓSTICO: Dashboard No Carga Datos

## 🔍 PROBLEMA ACTUAL

El dashboard muestra **0 en todas las métricas** a pesar de que:
- ✅ Las 8 tablas existen en Supabase
- ✅ Las tablas tienen datos con fechas visibles
- ✅ La consulta se ejecuta sin errores

### Logs en Consola del Navegador

```
⚠️ point_mora_neg1 - 2025-11-18: Sin datos
⚠️ point_mora_neg1 - 2025-11-19: Sin datos
⚠️ point_mora_pos1 - 2025-11-18: Sin datos
⚠️ point_mora_pos1 - 2025-11-19: Sin datos
... (todas las tablas muestran "Sin datos")
```

---

## 🎯 POSIBLES CAUSAS

### 1. Tipo de Columna `fecha`

**Problema:** La columna `fecha` puede ser de tipo `TEXT` en lugar de `DATE`.

**Síntomas:**
- Supabase almacena: `"2025-11-18"` (como texto)
- React envía query: `fecha = "2025-11-18"`
- Si los tipos no coinciden, la comparación falla

**Solución:** Convertir explícitamente o usar `::date` en la consulta.

### 2. Formato de Fecha Diferente

**Problema:** La fecha puede tener formato diferente al esperado.

**Posibles formatos en Supabase:**
- `2025-11-18` ✅ (esperado)
- `18/11/2025` ❌
- `2025-11-18T00:00:00Z` ❌
- `2025-11-18 00:00:00` ❌

### 3. Espacios o Caracteres Extra

**Problema:** La fecha puede tener espacios al inicio/final.

**Ejemplo:**
- Supabase: `" 2025-11-18 "` (con espacios)
- React busca: `"2025-11-18"` (sin espacios)
- Resultado: No coincide

### 4. Permisos RLS (Row Level Security)

**Problema:** Supabase puede tener políticas RLS que bloquean el acceso.

**Síntoma:** La consulta devuelve array vacío sin error.

### 5. Nombre de Columna Diferente

**Problema:** La columna puede llamarse diferente.

**Posibles nombres:**
- `fecha` ✅ (esperado)
- `Fecha` ❌ (mayúscula)
- `date` ❌
- `fecha_envio` ❌

---

## 🔧 SOLUCIONES A PROBAR

### Solución 1: Verificar Datos Directamente en Supabase

1. Ir a **Supabase Dashboard**
2. Abrir **Table Editor**
3. Seleccionar tabla `point_mora_neg1`
4. Verificar:
   - ¿Existe la columna `fecha`?
   - ¿Qué valores tiene? Copiar uno exacto
   - ¿Qué tipo es? (text, date, timestamp)
   - ¿Hay datos para 2025-11-18 o 2025-11-19?

### Solución 2: Agregar Consulta Sin Filtro de Fecha

Modificar temporalmente para traer **todos** los registros:

```typescript
// En lugar de:
.eq("fecha", dayStr)

// Usar:
.limit(10) // Traer los primeros 10 sin filtro
```

Esto permite ver si el problema es la tabla o el filtro de fecha.

### Solución 3: Verificar Permisos RLS

En Supabase:
1. Ir a **Authentication > Policies**
2. Buscar las tablas de campaña
3. Verificar que hay política de SELECT habilitada
4. O temporalmente **deshabilitar RLS** para probar

### Solución 4: Usar Consulta SQL Directa

En **SQL Editor** de Supabase, ejecutar:

```sql
-- Ver estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'point_mora_neg1';

-- Ver datos con la fecha
SELECT fecha, count_day, cedulas 
FROM point_mora_neg1 
WHERE fecha = '2025-11-18';

-- Ver todas las fechas únicas
SELECT DISTINCT fecha 
FROM point_mora_neg1 
ORDER BY fecha DESC 
LIMIT 10;
```

---

## ✅ IMPLEMENTACIÓN DE DIAGNÓSTICO AVANZADO

He agregado logs detallados en el código que muestran:

1. **📅 Fechas disponibles:** Muestra las primeras 5 fechas de cada tabla
2. **🔍 Registros encontrados:** Cuántos registros coinciden con la fecha
3. **✅ Datos cargados:** Si hay datos, muestra cantidad
4. **⚠️ Sin datos:** Si no hay coincidencias

### Cómo Ver los Logs

1. Abrir el dashboard: http://localhost:8080/dashboard
2. Presionar **F12** (DevTools)
3. Ir a pestaña **Console**
4. Buscar los emojis: 📅 🔍 ✅ ⚠️
5. Verificar qué fechas muestra "Fechas disponibles"

---

## 🎯 PRÓXIMO PASO RECOMENDADO

### Paso 1: Ejecutar SQL en Supabase

Ir a **SQL Editor** y ejecutar:

```sql
-- 1. Ver datos de una tabla específica
SELECT * FROM point_mora_neg1 LIMIT 5;

-- 2. Ver el tipo de columna fecha
SELECT data_type 
FROM information_schema.columns 
WHERE table_name = 'point_mora_neg1' 
  AND column_name = 'fecha';

-- 3. Buscar registros por fecha específica
SELECT fecha, count_day, array_length(cedulas, 1) as num_cedulas
FROM point_mora_neg1 
WHERE fecha = '2025-11-18';

-- 4. Si no encuentra, probar con LIKE
SELECT fecha, count_day 
FROM point_mora_neg1 
WHERE fecha LIKE '%2025-11-18%';
```

### Paso 2: Compartir Resultados

Después de ejecutar las consultas SQL, compartir:
1. ¿Qué tipo de dato es `fecha`? (text, date, timestamp)
2. ¿Qué valores de fecha aparecen?
3. ¿Hay registros para 2025-11-18 o 2025-11-19?

Con esta información podré crear la solución exacta.

---

**Fecha:** 19/11/2025  
**Estado:** En diagnóstico - esperando verificación de tipo de columna `fecha`
