# Configuración de Chatwoot - Guía Completa

## 📋 Resumen

Este documento explica cómo está configurada la integración con Chatwoot para obtener métricas de conversaciones en el dashboard.

## 🔧 Configuración de Variables de Entorno

### Variables Locales (`.env`)
Para desarrollo local, las variables están en el archivo `.env`:

```env
# Supabase
VITE_SUPABASE_PROJECT_ID="pjlhbmfgqjrwpurcgaxa"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://pjlhbmfgqjrwpurcgaxa.supabase.co"

# Chatwoot (para desarrollo local)
CHATWOOT_BASE_URL="https://chatwoot-production-85da.up.railway.app"
CHATWOOT_ACCOUNT_ID="2"
CHATWOOT_API_TOKEN="zqT41Ca1HTuEqTLdvfZiFWmM"
```

### Variables de Producción (Supabase)
Las variables de Chatwoot también están configuradas en Supabase para producción:

- `CHATWOOT_BASE_URL`: https://chatwoot-production-85da.up.railway.app
- `CHATWOOT_ACCOUNT_ID`: 2
- `CHATWOOT_API_TOKEN`: zqT41Ca1HTuEqTLdvfZiFWmM

## 🏗️ Arquitectura de la Solución

### 1. Frontend (GeneralTab.tsx)
- **Ubicación**: `src/components/dashboard/GeneralTab.tsx`
- **Función**: Interfaz para seleccionar fechas y mostrar métricas
- **Características**:
  - Selector de fechas con calendario
  - Manejo de estados de carga y error
  - Conversión automática de fechas a formato YYYY-MM-DD
  - Zona horaria: Ecuador (UTC-5)

### 2. Edge Function (chatwoot-metrics)
- **Ubicación**: `supabase/functions/chatwoot-metrics/index.ts`
- **Función**: API intermedia para obtener datos de Chatwoot
- **Características**:
  - Paginación automática de la API de Chatwoot
  - Filtrado por fechas en zona horaria Ecuador
  - Manejo de múltiples etiquetas simultáneamente
  - Logging detallado para debugging

## 📊 Métricas Disponibles

El sistema obtiene las siguientes métricas por etiqueta:

| Métrica | Etiqueta en Chatwoot | Descripción |
|---------|---------------------|-------------|
| Comprobantes Enviados | `comprobante_enviado` | Conversaciones sobre comprobantes |
| Facturas Enviadas | `factura_enviada` | Conversaciones sobre facturas |
| Consultas Saldo | `consulto_saldo` | Consultas sobre saldos |
| Pagado | `pagado` | Conversaciones sobre pagos realizados |
| Soporte | `soporte` | Tickets de soporte |
| Cobrador | `cobrador` | Gestiones de cobranza |
| Devolución Producto | `devolucion_producto` | Devoluciones |
| Servicio Técnico | `servicio_tecnico` | Soporte técnico |
| Casos Resueltos | `resuelto` | Casos marcados como resueltos |

## 🔄 Flujo de Funcionamiento

### 1. Selección de Fechas
```
Usuario selecciona fechas → Frontend convierte a YYYY-MM-DD → Envía a Edge Function
```

### 2. Procesamiento en Edge Function
```
Para cada etiqueta:
1. Obtener todas las conversaciones (paginación)
2. Filtrar por rango de fechas
3. Contar conversaciones filtradas
4. Retornar métricas
```

### 3. Conversión de Fechas
```
Ecuador Timezone (UTC-5):
- Fecha inicio: YYYY-MM-DD 00:00:00 → Timestamp UTC
- Fecha fin: YYYY-MM-DD 23:59:59 → Timestamp UTC
```

## 🌐 API de Chatwoot

### Endpoint Utilizado
```
GET {CHATWOOT_BASE_URL}/api/v1/accounts/{ACCOUNT_ID}/conversations
```

### Parámetros
- `labels[]`: Etiqueta a filtrar (ej: comprobante_enviado)
- `status=all`: Todas las conversaciones
- `page`: Número de página (paginación)

### Headers
- `api_access_token`: Token de autenticación

### Estructura de Respuesta
```json
{
  "data": {
    "meta": {
      "mine_count": 0,
      "assigned_count": 0,
      "unassigned_count": 0,
      "all_count": 150
    },
    "payload": [
      {
        "id": 12345,
        "created_at": 1763310123,
        "last_activity_at": 1763312400,
        "meta": {...},
        "messages": [...]
      }
    ]
  }
}
```

## 🔍 Filtrado por Fechas

### Conversión de Zona Horaria
La función `convertirFechaEcuadorATimestamp()` maneja la conversión:

```typescript
// Ejemplo:
// Fecha: "2025-11-17"
// Ecuador 00:00:00 → UTC timestamp
// Ecuador 23:59:59 → UTC timestamp

function convertirFechaEcuadorATimestamp(fecha: string, esFinDeDia: boolean = false): number {
  const offset = -5 * 60 * 60 * 1000; // UTC-5 en ms
  const fechaLocal = new Date(fecha + (esFinDeDia ? 'T23:59:59' : 'T00:00:00'));
  const timestampUTC = fechaLocal.getTime() - offset;
  return Math.floor(timestampUTC / 1000);
}
```

### Filtrado de Conversaciones
```typescript
const filtradas = conversaciones.filter((conv) => {
  const createdAt = conv.created_at || 0;
  return createdAt >= timestampInicio && createdAt <= timestampFin;
});
```

## 🚀 Comandos Útiles

### Configurar Variables en Supabase
```bash
npx supabase secrets set CHATWOOT_BASE_URL="..." --project-ref pjlhbmfgqjrwpurcgaxa
npx supabase secrets set CHATWOOT_ACCOUNT_ID="2" --project-ref pjlhbmfgqjrwpurcgaxa
npx supabase secrets set CHATWOOT_API_TOKEN="..." --project-ref pjlhbmfgqjrwpurcgaxa
```

### Listar Variables Configuradas
```bash
npx supabase secrets list --project-ref pjlhbmfgqjrwpurcgaxa
```

### Desplegar Función
```bash
npx supabase functions deploy chatwoot-metrics --project-ref pjlhbmfgqjrwpurcgaxa
```

### Ejecutar Aplicación
```bash
npm run dev
```

## 🐛 Debugging

### Logs de Edge Function
Los logs se pueden ver en:
- Dashboard de Supabase → Functions → chatwoot-metrics → Logs
- O usando: `npx supabase functions logs chatwoot-metrics`

### Logs Típicos
```
Parámetros de solicitud: { type: "range", dateFrom: "2025-11-01", dateTo: "2025-11-17" }
Configuración Chatwoot: { baseUrl: "https://...", accountId: "2", hasToken: true }
Iniciando obtención de conversaciones para etiqueta: comprobante_enviado
Página 1 para comprobante_enviado: 25 conversaciones
Total de conversaciones obtenidas para comprobante_enviado: 150
Filtro de fecha para comprobante_enviado: 45 de 150 conversaciones
Métrica comprobante_enviado: 45 conversaciones
```

## ✅ Verificación

Para verificar que todo funciona:

1. **Frontend**: Abrir http://localhost:8081
2. **Seleccionar fechas** en la pestaña General
3. **Ver métricas** actualizarse automáticamente
4. **Revisar logs** en consola del navegador
5. **Verificar Edge Function** en dashboard de Supabase

## 🔒 Seguridad

- ✅ API Token seguro en variables de entorno
- ✅ No hay credenciales hardcodeadas
- ✅ Edge Function aislada del frontend
- ✅ Validación de parámetros de entrada
- ✅ Manejo de errores robusto

## 🚨 Troubleshooting

### Error: "Configuración de Chatwoot faltante"
- Verificar variables de entorno en Supabase
- Asegurarse de que las variables estén desplegadas

### Error: "Error HTTP 401/403"
- Verificar API Token de Chatwoot
- Verificar permisos del token

### Error: "Fechas requeridas"
- Verificar formato de fecha (YYYY-MM-DD)
- Asegurarse de enviar dateFrom y dateTo

### Sin datos en métricas
- Verificar que existen conversaciones con las etiquetas
- Verificar rango de fechas
- Revisar logs de Edge Function
