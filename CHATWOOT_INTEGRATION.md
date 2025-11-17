# Integración Chatwoot - Sistema de Métricas

## Descripción
Este sistema implementa la integración con la API de Chatwoot para obtener métricas de conversaciones basadas en etiquetas, con filtrado por rango de fechas en zona horaria de Ecuador (UTC-5).

## Configuración

### Variables de Entorno
Las siguientes variables deben estar configuradas en Supabase Edge Functions:

```env
CHATWOOT_BASE_URL=https://chatwoot-production-85da.up.railway.app
CHATWOOT_ACCOUNT_ID=2
CHATWOOT_API_TOKEN=zqT41Ca1HTuEqTLdvfZiFWmM
```

## Arquitectura

### 1. Frontend (React)
- **Archivo**: `src/components/dashboard/GeneralTab.tsx`
- **Funcionalidad**: 
  - Interfaz de usuario para seleccionar rangos de fechas
  - Muestra métricas en tarjetas visuales
  - Manejo de estados de carga y error

### 2. Backend (Supabase Edge Function)
- **Archivo**: `supabase/functions/chatwoot-metrics/index.ts`
- **Funcionalidad**:
  - Conecta con la API de Chatwoot
  - Implementa paginación automática
  - Filtra conversaciones por fecha en zona horaria Ecuador
  - Procesa múltiples etiquetas en paralelo

## Flujo de Datos

1. **Selección de Fechas**: El usuario selecciona fecha inicio y fin en el dashboard
2. **Llamada API**: Se invoca la edge function con los parámetros de fecha
3. **Obtención de Datos**: 
   - Para cada etiqueta, se obtienen TODAS las conversaciones con paginación
   - Se construye la URL: `{BASE_URL}/api/v1/accounts/{ACCOUNT_ID}/conversations?labels[]={etiqueta}&status=all&page={N}`
4. **Filtrado por Fecha**:
   - Se convierten las fechas de Ecuador (UTC-5) a timestamps Unix UTC
   - Se filtran conversaciones usando el campo `created_at`
5. **Respuesta**: Se devuelve el conteo de conversaciones por etiqueta

## Etiquetas Procesadas

El sistema analiza las siguientes etiquetas de Chatwoot:

- `comprobante_enviado` - Comprobantes Enviados
- `factura_enviada` - Facturas Enviadas  
- `consulto_saldo` - Consultas Saldo
- `soporte` - Soporte
- `cobrador` - Cobrador
- `devolucion_producto` - Devolución Producto
- `servicio_tecnico` - Servicio Técnico
- `resuelto` - Casos Resueltos

## Manejo de Fechas

### Conversión de Zona Horaria
```typescript
function convertirFechaEcuadorATimestamp(fecha: string, esFinDeDia: boolean = false): number {
  // Ecuador está en UTC-5
  const offset = -5 * 60 * 60 * 1000; // -5 horas en milisegundos
  
  const fechaLocal = new Date(fecha + (esFinDeDia ? 'T23:59:59' : 'T00:00:00'));
  const timestampUTC = fechaLocal.getTime() - offset;
  
  return Math.floor(timestampUTC / 1000);
}
```

### Filtrado
- **Fecha Inicio**: Se convierte a 00:00:00 hora Ecuador
- **Fecha Fin**: Se convierte a 23:59:59 hora Ecuador
- **Comparación**: Se usa el campo `created_at` de cada conversación (timestamp Unix UTC)

## Paginación

La implementación maneja automáticamente la paginación:

1. Inicia en página 1
2. Continúa mientras `data.payload` contenga elementos
3. Acumula todas las conversaciones en memoria
4. Límite de seguridad: máximo 100 páginas por etiqueta

## Estructura de Respuesta de Chatwoot

```json
{
  "data": {
    "meta": {
      "mine_count": 10,
      "assigned_count": 5,
      "unassigned_count": 2,
      "all_count": 17
    },
    "payload": [
      {
        "id": 123,
        "created_at": 1763310123,
        "last_activity_at": 1763312400,
        "meta": { ... },
        "messages": [ ... ]
      }
    ]
  }
}
```

## Respuesta del Sistema

```json
{
  "comprobante_enviado": 25,
  "factura_enviada": 12,
  "consulto_saldo": 8,
  "soporte": 15,
  "cobrador": 3,
  "devolucion_producto": 1,
  "servicio_tecnico": 2,
  "resuelto": 10
}
```

## Manejo de Errores

- **Errores de Red**: Se muestran en la interfaz con mensaje específico
- **Configuración Faltante**: Se valida la presencia de variables de entorno
- **Páginas Faltantes**: Se continúa con las siguientes etiquetas
- **Timeouts**: Límite automático de páginas para evitar bucles infinitos

## Optimizaciones

1. **Cache**: QueryKey basado en fechas para cache automático
2. **Retry**: Máximo 2 reintentos en caso de error
3. **Stale Time**: 5 minutos de cache para evitar llamadas innecesarias
4. **Loading States**: Esqueletos de carga durante las consultas

## Uso

1. Abrir el dashboard
2. Ir a la pestaña "General"
3. Seleccionar fecha de inicio y fin
4. Las métricas se actualizan automáticamente
5. Los datos se muestran en tiempo real con indicadores de carga

## Desarrollo Local

Para desarrollo local, las variables de entorno están en `.env.local`:

```env
CHATWOOT_BASE_URL=https://chatwoot-production-85da.up.railway.app
CHATWOOT_ACCOUNT_ID=2
CHATWOOT_API_TOKEN=zqT41Ca1HTuEqTLdvfZiFWmM
```

## Logs y Debugging

La función edge incluye logging detallado:
- Número de páginas procesadas
- Total de conversaciones por etiqueta
- Conversaciones filtradas por fecha
- Errores de red o API

Para habilitar logs de debug adicionales, descomenta las líneas de debug en el código.
