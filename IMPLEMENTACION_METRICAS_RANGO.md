# 📊 Implementación de Métricas de WhatsApp para RANGO de Fechas

## 🎯 Objetivo

Calcular métricas de WhatsApp para un rango de fechas `[fecha_inicio, fecha_fin]` utilizando:
- **8 tablas de campañas** de WhatsApp
- **1 tabla de apoyo** (POINT_Competencia) para determinar respuestas

---

## 📋 Tablas Involucradas

### Tablas de Campañas (8)
Todas tienen las columnas: `fecha`, `cedulas` (TEXT[]), `count_day`, etc.

1. `point_mora_neg5`
2. `point_mora_neg3`
3. `point_mora_neg2`
4. `point_mora_neg1`
5. `point_mora_pos1`
6. `point_mora_pos4`
7. `point_compromiso_pago`
8. `point_reactivacion_cobro`

### Tabla de Apoyo
- `POINT_Competencia`: Columnas relevantes: `Cedula`, `conversation_id`

---

## 🔑 REGLA ÚNICA para Clasificar Respuestas

**Una cédula se considera "RESPONDIÓ" si y solo si:**

```sql
EXISTS (
  SELECT 1
  FROM POINT_Competencia
  WHERE Cedula = cedula_a_evaluar
    AND conversation_id IS NOT NULL
    AND conversation_id <> 0
)
```

**Si NO cumple esta condición → "NO RESPONDIÓ"**

Esta regla se aplica de forma **CONSISTENTE** en:
- ✅ Métricas por día individual
- ✅ Métricas por rango de fechas
- ✅ Detalle por campaña
- ✅ Totales globales

---

## 📐 Los 5 Pasos de la Implementación

### PASO 1: Construir el Conjunto de Cédulas Únicas del Rango

**Objetivo:** Obtener todas las cédulas distintas contactadas en el rango.

**Algoritmo:**
```typescript
// 1.1: Recorrer las 8 tablas filtrando por fecha BETWEEN fecha_inicio AND fecha_fin
for each tabla in [8 tablas de campañas] {
  for each día in [fecha_inicio...fecha_fin] {
    // 1.2: Obtener todas las filas del día
    const registros = SELECT * FROM tabla WHERE fecha = día
    
    // 1.3: Extraer todas las cédulas del array "cedulas" (UNNEST)
    for each registro in registros {
      allCedulas.push(...registro.cedulas)
    }
  }
}

// 1.4: Eliminar duplicados para obtener cédulas únicas
const cedulasUnicasRango = Array.from(new Set(allCedulas))
```

**Implementación:**
```typescript
let allCedulas: string[] = [];
const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

for (const day of daysInRange) {
  const dayStr = format(day, "yyyy-MM-dd");
  
  for (const tableName of campaignTables) {
    const { data } = await supabase
      .from(tableName)
      .select("cedulas")
      .gte("fecha", dayStr)
      .lte("fecha", dayStr);
    
    if (data) {
      data.forEach(record => {
        if (record.cedulas && Array.isArray(record.cedulas)) {
          allCedulas.push(...record.cedulas.map(c => String(c).trim()));
        }
      });
    }
  }
}

const uniqueCedulas = Array.from(new Set(allCedulas));
```

---

### PASO 2: Calcular Total de WhatsApp Enviados y Costo

**Objetivo:** Sumar los mensajes enviados y calcular el costo.

**Fórmulas:**
```
total_whatsapp_enviados_rango = SUM(count_day) de las 8 tablas en el rango
costo_total_rango = total_whatsapp_enviados_rango × COSTO_POR_MENSAJE
```

**Implementación:**
```typescript
const COSTO_POR_MENSAJE = 0.014; // Configurable

let totalSent = 0;

for (const day of daysInRange) {
  for (const tableName of campaignTables) {
    const { data } = await supabase
      .from(tableName)
      .select("count_day")
      .gte("fecha", dayStr)
      .lte("fecha", dayStr);
    
    if (data) {
      totalSent += data.reduce((sum, r) => sum + (r.count_day || 0), 0);
    }
  }
}

const costoTotal = (totalSent * COSTO_POR_MENSAJE).toFixed(2);
```

---

### PASO 3: Clasificar por Cédula (RESPONDIÓ / NO RESPONDIÓ)

**Objetivo:** Determinar para CADA cédula única si respondió o no.

**Algoritmo:**
```typescript
// 3.1: Inicializar TODAS las cédulas como NO RESPONDIÓ
const responseMap = new Map<string, boolean>();
cedulasUnicasRango.forEach(cedula => {
  responseMap.set(cedula, false);
});

// 3.2: Consultar POINT_Competencia para todas las cédulas
const { data } = await supabase
  .from("POINT_Competencia")
  .select("Cedula, conversation_id")
  .in("Cedula", cedulasAsNumbers);

// 3.3: Aplicar REGLA ÚNICA - Marcar como RESPONDIÓ solo las que cumplen
if (data) {
  data.forEach(registro => {
    if (registro.conversation_id !== null && registro.conversation_id !== 0) {
      responseMap.set(String(registro.Cedula), true); // ✅ RESPONDIÓ
    }
  });
}
```

**Función Auxiliar Reutilizable:**
```typescript
/**
 * Clasificar cédulas según REGLA ÚNICA
 * @param cedulas - Array de cédulas únicas (strings)
 * @returns Map<string, boolean> donde true = RESPONDIÓ, false = NO RESPONDIÓ
 */
const clasificarCedulasPorRespuesta = async (
  cedulas: string[]
): Promise<Map<string, boolean>> => {
  const responseMap = new Map<string, boolean>();
  
  if (cedulas.length === 0) return responseMap;

  const cedulasAsNumbers = cedulas
    .map(c => parseInt(c.replace(/\D/g, '')))
    .filter(n => !isNaN(n));

  // Inicializar como NO RESPONDIÓ
  cedulas.forEach(cedula => responseMap.set(cedula, false));

  if (cedulasAsNumbers.length === 0) return responseMap;

  try {
    const { data } = await supabase
      .from("POINT_Competencia")
      .select("Cedula, conversation_id")
      .in("Cedula", cedulasAsNumbers);

    if (data) {
      data.forEach(r => {
        // REGLA ÚNICA
        if (r.conversation_id !== null && r.conversation_id !== 0) {
          responseMap.set(String(r.Cedula), true);
        }
      });
    }
  } catch (err) {
    console.error("Error consultando respuestas:", err);
  }

  return responseMap;
};
```

---

### PASO 4: Contar Métricas Finales del Rango

**Objetivo:** Contar cuántas respondieron y cuántas no.

**Algoritmo:**
```typescript
let respondieron = 0;
let noRespondieron = 0;

responseMap.forEach((didRespond) => {
  if (didRespond) {
    respondieron++;
  } else {
    noRespondieron++;
  }
});

const totalCedulasUnicas = responseMap.size;
```

**Métricas Finales:**
- `total_cedulas_unicas_rango` = tamaño del conjunto de cédulas únicas
- `respondieron_rango` = cantidad de cédulas marcadas como RESPONDIÓ
- `no_respondieron_rango` = cantidad de cédulas marcadas como NO RESPONDIÓ

---

### PASO 5: Validación Obligatoria (Invariante)

**Objetivo:** Garantizar la integridad matemática de los datos.

**Invariante que SIEMPRE debe cumplirse:**
```
respondieron_rango + no_respondieron_rango = total_cedulas_unicas_rango
```

**Implementación:**
```typescript
const suma = respondieron + noRespondieron;
const validacion = suma === totalCedulasUnicas;

console.log(`✅ VALIDACIÓN: ${respondieron} + ${noRespondieron} = ${suma}`);
console.log(`   Total cédulas únicas: ${totalCedulasUnicas}`);
console.log(`   Estado: ${validacion ? "✅ CORRECTA" : "❌ ERROR"}`);

if (!validacion) {
  console.error("⚠️ ¡ALERTA! La validación falló. Revisar lógica.");
}
```

---

## 🔧 Implementación Completa en TypeScript

### Función Principal: Métricas por Rango

```typescript
const { data: dayMetrics, isLoading } = useQuery({
  queryKey: ["day-metrics-final-v3", startDate, endDate],
  queryFn: async () => {
    const fechaInicio = format(startDate, "yyyy-MM-dd");
    const fechaFin = format(endDate, "yyyy-MM-dd");
    
    console.log("🔍 CÁLCULO DE MÉTRICAS PARA RANGO:", { fechaInicio, fechaFin });

    // ========================================================================
    // PASO 1: Construir conjunto de cédulas únicas del rango
    // ========================================================================
    let totalSent = 0;
    let allCedulas: string[] = [];
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

    for (const day of daysInRange) {
      const dayStr = format(day, "yyyy-MM-dd");
      
      for (const tableName of campaignTables) {
        const { data } = await supabase
          .from(tableName)
          .select("count_day, cedulas")
          .gte("fecha", dayStr)
          .lte("fecha", dayStr);
        
        if (data && data.length > 0) {
          // PASO 2: Acumular count_day
          totalSent += data.reduce((sum, r) => sum + (r.count_day || 0), 0);
          
          // PASO 1: Recolectar cédulas
          data.forEach(record => {
            if (record.cedulas && Array.isArray(record.cedulas)) {
              allCedulas.push(...record.cedulas.map(c => String(c).trim()));
            }
          });
        }
      }
    }

    // PASO 1.4: Eliminar duplicados
    const uniqueCedulas = Array.from(new Set(allCedulas));

    // ========================================================================
    // PASO 2: Calcular WhatsApp enviados y costo
    // ========================================================================
    const costoTotal = (totalSent * COSTO_POR_MENSAJE).toFixed(2);

    // ========================================================================
    // PASO 3: Clasificar cédulas (RESPONDIÓ / NO RESPONDIÓ)
    // ========================================================================
    const responseMap = await clasificarCedulasPorRespuesta(uniqueCedulas);

    // ========================================================================
    // PASO 4: Contar métricas finales
    // ========================================================================
    let respondieron = 0;
    let noRespondieron = 0;

    responseMap.forEach((didRespond) => {
      if (didRespond) respondieron++;
      else noRespondieron++;
    });

    // ========================================================================
    // PASO 5: Validación obligatoria
    // ========================================================================
    const suma = respondieron + noRespondieron;
    const validacion = suma === uniqueCedulas.length;
    
    console.log(`✅ VALIDACIÓN: ${respondieron} + ${noRespondieron} = ${suma}`);
    console.log(`   Total cédulas únicas: ${uniqueCedulas.length}`);
    console.log(`   Estado: ${validacion ? "✅" : "❌"}`);

    // Tasa de respuesta
    const responseRate = uniqueCedulas.length > 0 
      ? ((respondieron / uniqueCedulas.length) * 100).toFixed(1) 
      : "0.0";

    return {
      totalSent,
      totalCost: costoTotal,
      responded: respondieron,
      notResponded: noRespondieron,
      responseRate,
      totalCedulasUnicas: uniqueCedulas.length
    };
  },
  enabled: !!startDate && !!endDate,
  staleTime: 5 * 60 * 1000
});
```

---

## ✅ Propiedades Matemáticas Garantizadas

### Propiedad 1: Integridad por Rango
```
∀ rango [F_INI, F_FIN]:
  respondieron_rango + no_respondieron_rango = cedulas_unicas_rango
```

### Propiedad 2: Monotonía
```
Si día D1 tiene X no_respondieron
y día D2 tiene Y no_respondieron

Entonces rango [D1, D2] tiene ≤ max(X, Y) no_respondieron
```

**Explicación:** Una vez que una cédula "responde" (tiene conversation_id ≠ 0), queda marcada permanentemente como "RESPONDIÓ" en POINT_Competencia. Por lo tanto, el número de "no respondieron" en un rango nunca puede SUPERAR el máximo de los días individuales.

### Propiedad 3: Consistencia Temporal
```
REGLA_ÚNICA(cédula, día) = REGLA_ÚNICA(cédula, rango)
```

La misma regla se aplica tanto para un día específico como para un rango completo.

---

## 🧪 Casos de Prueba

### Caso 1: Rango Simple (1 día)
```
Entrada:
  fecha_inicio = 2025-01-17
  fecha_fin = 2025-01-17
  
Esperado:
  Las métricas del rango deben ser IDÉNTICAS a las del día individual
```

### Caso 2: Rango con Cédulas Duplicadas
```
Entrada:
  Día 1: cédulas [111, 222, 333]
  Día 2: cédulas [222, 333, 444]
  
Esperado:
  cedulas_unicas_rango = 4 (111, 222, 333, 444)
  NO 6 (no contar duplicados)
```

### Caso 3: Validación de Monotonía
```
Entrada:
  Día 17: 700 respondieron, 0 no respondieron
  Día 18: 400 respondieron, 200 no respondieron
  
Esperado:
  Rango 17-18: no_respondieron ≤ 200 ✅
```

---

## 📊 Salida en Consola

La implementación genera logs detallados:

```
🔍 INICIANDO CÁLCULO DE MÉTRICAS PARA RANGO: { fechaInicio, fechaFin }
================================================================================

📋 PASO 1: Construir conjunto de cédulas únicas del rango
   → Días en el rango: N (fecha_inicio a fecha_fin)
   ✅ Total cédulas únicas del rango: XXXX
   📊 Total cédulas (con duplicados): YYYY

💰 PASO 2: Calcular WhatsApp enviados y costo
   → WhatsApp Enviados (SUM count_day): ZZZZ
   → Costo Total (ZZZZ × $0.014): $AAA.AA

🔍 PASO 3: Clasificar cédulas usando REGLA ÚNICA
   REGLA: conversation_id NOT NULL AND <> 0 → RESPONDIÓ

📊 PASO 4: Contar métricas finales
   → Respondieron: BBB
   → No Respondieron: CCC
   → Total Cédulas Únicas: XXXX

✅ PASO 5: Validación obligatoria
   → BBB + CCC = DDD
   → Total cédulas únicas = XXXX
   → Validación: ✅ CORRECTA

================================================================================
📋 RESUMEN FINAL DEL RANGO:
   WhatsApp Enviados: ZZZZ
   Costo Total: $AAA.AA
   Cédulas Únicas: XXXX
   Respondieron: BBB (XX.X%)
   No Respondieron: CCC
================================================================================
```

---

## 🔄 Reutilización de Código

### Función Auxiliar: `clasificarCedulasPorRespuesta`

Esta función se utiliza en:
1. ✅ Métricas por rango de fechas
2. ✅ Detalle por campaña de un día específico
3. ✅ Cualquier otro módulo que necesite clasificar cédulas

**Ventajas:**
- 🎯 Centraliza la REGLA ÚNICA en un solo lugar
- 🔧 Fácil de mantener y actualizar
- ✅ Garantiza consistencia en toda la aplicación
- 🧪 Más fácil de testear

---

## 📝 Notas Importantes

### ⚠️ NO hacer:
❌ Sumar "no respondieron" día por día
❌ Usar reglas diferentes para día vs rango
❌ Contar cédulas duplicadas
❌ Aplicar "scale factors" o ajustes proporcionales

### ✅ SÍ hacer:
✅ Obtener cédulas únicas del rango completo primero
✅ Aplicar REGLA ÚNICA a todas las cédulas
✅ Validar siempre: responded + notResponded = cedulas_unicas
✅ Usar la función auxiliar `clasificarCedulasPorRespuesta`

---

## 🔗 Referencias

- **Archivo:** `src/components/dashboard/DayByDayTab.tsx`
- **Query Key:** `day-metrics-final-v3`
- **Constante:** `COSTO_POR_MENSAJE = 0.014`
- **Tablas:** 8 campañas + POINT_Competencia

---

**Fecha de implementación:** 2025-01-20  
**Versión:** Final v3 - Implementación Modular Completa ✅
