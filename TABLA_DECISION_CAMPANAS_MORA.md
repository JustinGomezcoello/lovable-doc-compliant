# Tabla de Decisión - Campañas de Mora

## 📊 Descripción General

Se agregó una nueva sección al final de la pestaña **"DayByDayTab"** que muestra una **Tabla de Decisión** para las **11 campañas de mora** (incluye la nueva campaña "DIAS MORA 0"). Esta tabla ayuda a decidir qué campañas vale la pena ejecutar al mostrar cuántos registros elegibles existen en la tabla `POINT_Competencia` para cada campaña, aplicando **5 filtros por campaña** para garantizar precisión.

---

## 🎯 Propósito

Antes de enviar mensajes de WhatsApp a través de una campaña, es útil saber:
- ¿Cuántas personas son elegibles para recibir el mensaje?
- ¿Vale la pena ejecutar esta campaña o no hay suficientes registros?

Esta tabla responde estas preguntas en tiempo real consultando la base de datos principal `POINT_Competencia`.

---

## 🔍 Campañas Incluidas

La tabla muestra las siguientes **11 campañas de mora**:

### Mora Negativa (5 campañas)
1. **MORA NEGATIVA 5** → `DiasMora = -5`
2. **MORA NEGATIVA 4** → `DiasMora = -4`
3. **MORA NEGATIVA 3** → `DiasMora = -3`
4. **MORA NEGATIVA 2** → `DiasMora = -2`
5. **MORA NEGATIVA 1** → `DiasMora = -1`

### **🆕 Días Mora 0 (1 campaña)**
6. **DIAS MORA 0** → `DiasMora = 0`

### Mora Positiva (5 campañas)
7. **MORA POSITIVA 1** → `DiasMora = 1`
8. **MORA POSITIVA 2** → `DiasMora = 2`
9. **MORA POSITIVA 3** → `DiasMora = 3`
10. **MORA POSITIVA 4** → `DiasMora = 4`
11. **MORA POSITIVA 5** → `DiasMora = 5`

---

## 📋 Filtros Aplicados

Los filtros varían según el tipo de campaña. **Todas las campañas aplican 5 filtros:**

### Para Campañas de Mora Negativa (-5 a -1)
```sql
SELECT COUNT(*) FROM POINT_Competencia
WHERE DiasMora = [valor negativo]
  AND SaldoPorVencer > 5
  AND compromiso_pago_fecha IS NULL
  AND Pagado = 'NO'
  AND ComprobanteEnviado IS NULL
```

**Lógica (5 filtros):**
- `DiasMora Equals` -1, -2, -3, -4 o -5 (previo al vencimiento)
- `SaldoPorVencer Greater Than 5` (excluye deudas menores a $5)
- `compromiso_pago_fecha Is null` (no tienen compromiso de pago registrado)
- `Pagado Equals NO` (no han pagado)
- `ComprobanteEnviado Is null` (no han enviado comprobante)

### 🆕 Para Campaña Días Mora 0
```sql
SELECT COUNT(*) FROM POINT_Competencia
WHERE DiasMora = 0
  AND SaldoPorVencer > 5
  AND compromiso_pago_fecha IS NULL
  AND Pagado = 'NO'
  AND ComprobanteEnviado IS NULL
```

**Lógica (5 filtros):**
- `DiasMora Equals 0` (en punto exacto de vencimiento)
- `SaldoPorVencer Greater Than 5` (excluye deudas menores a $5)
- `compromiso_pago_fecha Is null` (no tienen compromiso de pago registrado)
- `Pagado Equals NO` (no han pagado)
- `ComprobanteEnviado Is null` (no han enviado comprobante)

### Para Campañas de Mora Positiva (1 a 5)
```sql
SELECT COUNT(*) FROM POINT_Competencia
WHERE DiasMora = [valor positivo]
  AND SaldoVencido > 5
  AND compromiso_pago_fecha IS NULL
  AND Pagado = 'NO'
  AND ComprobanteEnviado IS NULL
```

**Lógica (5 filtros):**
- `DiasMora Equals` 1, 2, 3, 4 o 5 (después del vencimiento)
- `SaldoVencido Greater Than 5` (excluye deudas menores a $5)
- `compromiso_pago_fecha Is null` (no tienen compromiso de pago registrado)
- `Pagado Equals NO` (no han pagado)
- `ComprobanteEnviado Is null` (no han enviado comprobante)

---

## 🎨 Interfaz de Usuario

### Componentes de la Tabla

1. **Header con botón de actualización**
   - Título: "📊 Tabla de Decisión - Campañas de Mora"
   - Botón "Actualizar" con ícono de RefreshCw
   - Descripción del propósito

2. **Explicación de filtros**
   - Cuadro azul con los filtros aplicados
   - Ayuda a entender qué registros se están contando

3. **Tabla de resultados**
   - **Columna 1:** Nombre de la campaña con indicador de color
     - 🔴 Rojo para mora negativa
     - 🟢 Verde para mora positiva
   - **Columna 2:** Cantidad de registros elegibles
     - Badge verde si hay registros (> 0)
     - Badge gris si no hay registros (= 0)
   - **Columna 3:** Estado
     - ✓ "Listo para enviar" si hay registros
     - "Sin registros" si no hay datos
     - "Error" si hubo un problema en la consulta

4. **Resumen inferior**
   - Total de registros elegibles (suma de todas las campañas)
   - Campañas con datos (count > 0)
   - Campañas sin datos (count = 0)

---

## 🔧 Implementación Técnica

### Query de React Query
```typescript
const { data: decisionTableData, isLoading: isLoadingDecisionTable, refetch: refetchDecisionTable } = useQuery({
  queryKey: ["decision-table-mora-campaigns"],
  queryFn: async () => {
    // Para cada una de las 10 campañas de mora
    // Consultar POINT_Competencia con filtros específicos
    // Retornar array con { name, count, error }
  },
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

### Consulta a Supabase
```typescript
// Para mora negativa
let query = supabase
  .from("POINT_Competencia")
  .select("idCompra", { count: "exact", head: true })
  .eq("DiasMora", campaign.diasMora)
  .neq("SaldoPorVencer", 0);

// Para mora positiva
let query = supabase
  .from("POINT_Competencia")
  .select("idCompra", { count: "exact", head: true })
  .eq("DiasMora", campaign.diasMora)
  .neq("SaldoVencido", 0)
  .is("ComprobanteEnviado", null);
```

### Estructura de Datos Retornados
```typescript
[
  {
    name: "MORA NEGATIVA 5",
    count: 1234, // Cantidad de registros elegibles
    error: false // true si hubo error en la consulta
  },
  // ... 9 campañas más
]
```

---

## 📊 Casos de Uso

### Caso 1: Decidir qué campañas enviar
**Escenario:** Es lunes por la mañana y necesitas decidir qué campañas de mora ejecutar.

**Acción:**
1. Ir a la pestaña "DayByDayTab"
2. Desplazarse hasta la "Tabla de Decisión"
3. Revisar qué campañas tienen registros elegibles
4. Enviar solo las campañas con datos suficientes (ej: > 100 registros)

### Caso 2: Actualizar datos en tiempo real
**Escenario:** Acabas de actualizar la tabla `POINT_Competencia` y quieres ver los cambios.

**Acción:**
1. Hacer clic en el botón "Actualizar"
2. Esperar a que se consulten los datos actualizados
3. Revisar los nuevos conteos

### Caso 3: Identificar campañas sin datos
**Escenario:** Algunas campañas nunca tienen registros y quieres identificarlas.

**Acción:**
1. Revisar la tabla y buscar campañas con badge gris
2. Ver el resumen inferior: "Campañas sin Datos"
3. Decidir si es necesario ajustar los filtros o si esas campañas no son relevantes

---

## ⚙️ Configuración y Mantenimiento

### Agregar o Modificar Filtros

Si necesitas cambiar los filtros para alguna campaña, modifica el query en `DayByDayTab.tsx`:

```typescript
// Ubicación: dentro del queryFn de decisionTableData
// Buscar la sección donde se construye el query para cada campaña
```

### Agregar Nuevas Campañas

Para agregar una nueva campaña de mora (ej: MORA POSITIVA 6):

1. Agregar al array `moraCampaigns`:
```typescript
{ name: "MORA POSITIVA 6", diasMora: 6, type: "positive" },
```

2. La tabla se actualizará automáticamente

### Cambiar el Tiempo de Caché

Por defecto, los datos se cachean por 5 minutos. Para cambiar:

```typescript
staleTime: 10 * 60 * 1000, // 10 minutos
```

---

## 🐛 Troubleshooting

### Problema: Todas las campañas muestran 0 registros

**Posibles causas:**
1. La tabla `POINT_Competencia` está vacía
2. Los filtros son muy restrictivos
3. Hay un problema de permisos RLS en Supabase

**Solución:**
1. Verificar que `POINT_Competencia` tiene datos
2. Revisar la consola del navegador para errores
3. Verificar políticas RLS en Supabase

### Problema: El botón "Actualizar" no hace nada

**Causa probable:** El query está en estado `isLoading`

**Solución:** Esperar a que termine la consulta actual antes de actualizar nuevamente

### Problema: Aparece "Error" en la columna Estado

**Causa:** Hubo un error al consultar Supabase para esa campaña específica

**Solución:**
1. Revisar la consola del navegador para el mensaje de error
2. Verificar permisos de la tabla `POINT_Competencia`
3. Verificar que las columnas `DiasMora`, `SaldoPorVencer`, `SaldoVencido`, `ComprobanteEnviado` existen

---

## 📈 Métricas y Logging

El query incluye logging en consola:

```
🔵 Iniciando cálculo de tabla de decisión para campañas de mora...
✅ MORA NEGATIVA 5: 1234 registros elegibles
✅ MORA NEGATIVA 4: 567 registros elegibles
...
❌ Error consultando MORA POSITIVA 3: [error details]
...
✅ Tabla de decisión calculada exitosamente
```

---

## 🎯 Próximas Mejoras

Posibles mejoras futuras:
1. **Exportar a CSV:** Botón para exportar la tabla completa
2. **Historial:** Ver cómo cambian los números a lo largo del tiempo
3. **Alertas:** Notificar cuando una campaña supera cierto umbral de registros
4. **Filtros personalizados:** Permitir al usuario ajustar los filtros desde la UI
5. **Gráficos:** Visualizar los datos con un gráfico de barras

---

## ✅ Checklist de Implementación

- [x] Query de React Query creado
- [x] Consultas a Supabase con filtros correctos
- [x] UI de tabla implementada
- [x] Botón de actualizar funcional
- [x] Loading states manejados
- [x] Error handling implementado
- [x] Resumen con totales
- [x] Indicadores visuales (colores, badges)
- [x] Documentación completa
- [ ] Tests unitarios (futuro)
- [ ] Tests de integración (futuro)

---

## 📝 Notas Importantes

1. **Performance:** La consulta hace 10 peticiones a Supabase (una por campaña). Si esto se vuelve lento, considerar hacer una sola consulta agregada.

2. **Caché:** Los datos se cachean por 5 minutos. Si necesitas datos más frescos, usa el botón "Actualizar".

3. **Permisos:** Asegúrate de que el usuario autenticado tiene permisos de lectura en `POINT_Competencia`.

4. **Filtros consistentes:** Los filtros deben coincidir con los usados en las campañas reales para que los números sean precisos.

---

## 🔗 Archivos Relacionados

- **Componente principal:** `src/components/dashboard/DayByDayTab.tsx`
- **Tipos de Supabase:** `src/integrations/supabase/types.ts`
- **Documentación relacionada:**
  - `FORMULA_CORRECTA_IMPLEMENTADA.md`
  - `DASHBOARD_8_CAMPAIGNS_UPDATE.md`

---

**Fecha de implementación:** 2025-11-21  
**Versión:** 1.0  
**Estado:** ✅ Completado
