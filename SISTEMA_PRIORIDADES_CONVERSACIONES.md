# 🎯 Sistema de Prioridades para Conversaciones - Documentación Completa

## 📋 Resumen Ejecutivo

Se ha implementado un **Sistema Inteligente de Priorización** para el módulo de Conversaciones de WhatsApp que clasifica automáticamente cada cliente según su urgencia de gestión de cobranza, utilizando múltiples factores de análisis.

---

## 🔥 Escala de Prioridades (1-5)

### **Prioridad 5 - 🔥 URGENTE** (Máxima Urgencia)
- **Color**: Rojo
- **Confianza**: 85-95%
- **Criterios**:
  - Tiene saldo vencido alto (> 0)
  - NO ha enviado comprobante de pago
  - NO existe compromiso de pago formal
  - Dice que pagó sin evidencia o muestra actitudes evasivas
  - Etiquetas relacionadas: `consulto_saldo`, `consulto_datos_transferencia`
  - Campo `LlamarOtraVez = SI`

**📝 Mensaje**: "Cliente con deuda pendiente sin comprobante, sin compromiso y alta probabilidad de morosidad."

**🎯 Acción Recomendada**: Contacto inmediato y prioritario. Requiere seguimiento urgente del equipo de cobranzas.

---

### **Prioridad 4 - ⚠️ ALTA** (Urgencia Alta)
- **Color**: Naranja
- **Confianza**: 70-89%
- **Criterios**:
  - Tiene saldo vencido (> 0)
  - Pago parcial registrado (`TipoDePago = Parcial`)
  - Saldo restante pendiente (`RestanteSaldoVencido > 0`)
  - Existe compromiso de pago o señales positivas
  - Etiquetas: `compromiso_pago`, `imagen_enviada`, `comprobante_enviado`

**📝 Mensaje**: "Cliente con deuda activa y señales de pago parcial o compromiso, requiere seguimiento."

**🎯 Acción Recomendada**: Seguimiento activo para asegurar cumplimiento del compromiso o completar el pago.

---

### **Prioridad 3 - ⏰ MEDIA** (Urgencia Media)
- **Color**: Amarillo
- **Confianza**: 50-69%
- **Criterios**:
  - Tiene saldo vencido (> 0)
  - Ya envió comprobante total pero falta confirmación
  - Tiene compromiso de pago para fecha futura
  - Campo `LlamarOtraVez = SI`

**📝 Mensaje**: "Cliente con compromiso o comprobante pendiente de validación. Seguimiento moderado."

**🎯 Acción Recomendada**: Monitoreo regular y validación de comprobantes. Recordatorio de fechas de compromiso.

---

### **Prioridad 2 - ✅ BAJA** (Urgencia Baja)
- **Color**: Verde
- **Confianza**: 70-100%
- **Criterios**:
  - Saldo vencido = 0
  - Comprobante enviado = SI
  - Tipo de pago = Total
  - Campo `LlamarOtraVez = NO`
  - Conversación reciente positiva: `pagado`, `comprobante_enviado`

**📝 Mensaje**: "Cliente al día, comprobante confirmado. No requiere gestión."

**🎯 Acción Recomendada**: No requiere acción inmediata. Mantener en archivo activo por referencia.

---

### **Prioridad 1 - 📁 CERRADO** (Sin Urgencia / Caso Cerrado)
- **Color**: Gris
- **Confianza**: 90-95%
- **Criterios**:
  - No debe nada (saldo = 0)
  - No se debe llamar (`LlamarOtraVez = NO`)
  - Etiquetas de casos no relacionados a cobranza:
    - `servicio_tecnico`
    - `soporte`
    - `numero_equivocado`
    - `no_registrado`

**📝 Mensaje**: "No existe deuda ni acción pendiente. Caso cerrado."

**🎯 Acción Recomendada**: Caso archivado. No requiere seguimiento.

---

## 📊 Campos de Base de Datos Utilizados

### Campos Principales de Análisis

| Campo | Tipo | Descripción | Uso en Prioridad |
|-------|------|-------------|------------------|
| `SaldoVencido` | number | Deuda pendiente del cliente | Mayor valor = Mayor prioridad |
| `ComprobanteEnviado` | string | "SI" / "NO" | SI = Reduce prioridad |
| `DiceQueYaPago` | string | "SI" / "NO" | SI sin comprobante = Aumenta prioridad |
| `LlamarOtraVez` | string | "SI" / "NO" | SI = Aumenta prioridad |
| `compromiso_pago_fecha` | date | Fecha de compromiso de pago | Existencia reduce prioridad |
| `TipoDePago` | string | "Total" / "Parcial" | Parcial = Prioridad 4 |
| `RestanteSaldoVencido` | number | Saldo que aún resta pagar | > 0 = Mantiene prioridad alta |
| `EstadoEtiqueta` | string | Última etiqueta asignada | Determina contexto de caso |

---

## 🎨 Interfaz de Usuario

### Vista de Lista de Clientes

Cada cliente ahora muestra:

1. **Badge de Prioridad**: Color y emoji según nivel
   - Ejemplo: `🔥 P5 - URGENTE`

2. **Información Financiera**:
   - Saldo Vencido (si > 0)
   - Alertas visuales en rojo

3. **Razón de Prioridad**:
   - Caja azul explicativa con el motivo
   - Nivel de confianza del cálculo (%)

4. **Badges Adicionales**:
   - ✅ Comprobante Enviado
   - 📞 Llamar Otra Vez
   - 📅 Compromiso de Pago (con fecha)

### Filtros Disponibles

1. **Por Texto**: Buscar por nombre, cédula, celular, ID
2. **Por Comprobante**: Todos / Enviado / Sin enviar
3. **Por Prioridad**: Todos / P5 / P4 / P3 / P2 / P1

### Estadísticas en Encabezado

- 📊 **Por Prioridad**: Conteo de clientes en cada nivel
- Ejemplo: `🔥 P5: 45` `⚠️ P4: 123` `⏰ P3: 67`

### Ordenamiento Automático

La lista se ordena automáticamente de **mayor a menor prioridad**:
```
P5 (Urgente) → P4 (Alta) → P3 (Media) → P2 (Baja) → P1 (Cerrado)
```

---

## 🧠 Lógica de Cálculo (Pseudocódigo)

```typescript
function calculatePriority(record: ConversationRecord): PriorityResult {
  
  // PRIORIDAD 1: Caso cerrado
  if (saldoVencido === 0 && !llamarOtraVez) OR etiquetaCerrada
    return { prioridad: 1, confianza: 0.95 }
  
  // PRIORIDAD 2: Cliente al día
  if (saldoVencido === 0 && comprobanteEnviado && tipoPagoTotal)
    return { prioridad: 2, confianza: 0.90 }
  
  // PRIORIDAD 5: Máxima urgencia
  if (saldoVencido > 0 && !comprobante && !compromiso && evasivo)
    return { prioridad: 5, confianza: 0.95 }
  
  // PRIORIDAD 4: Urgencia alta
  if (saldoVencido > 0 && pagoParcial && compromiso)
    return { prioridad: 4, confianza: 0.80 }
  
  // PRIORIDAD 3: Urgencia media
  if (saldoVencido > 0 && (comprobante OR compromiso))
    return { prioridad: 3, confianza: 0.60 }
  
  // Default
  return { prioridad: 3, confianza: 0.50 }
}
```

---

## 📈 Métricas y Análisis

### Nivel de Confianza

El sistema calcula un **porcentaje de confianza** (0-100%) que indica:

- **90-100%**: Clasificación muy confiable
- **70-89%**: Confiable con datos suficientes
- **50-69%**: Confianza moderada, puede requerir revisión manual
- **< 50%**: Datos insuficientes, revisión manual recomendada

### Ejemplo de Análisis

Para un cliente:
```json
{
  "SaldoVencido": 150.00,
  "ComprobanteEnviado": "NO",
  "compromiso_pago_fecha": null,
  "LlamarOtraVez": "SI",
  "EstadoEtiqueta": "consulto_saldo"
}
```

**Resultado**:
- Prioridad: **5** 🔥
- Razón: "Cliente con deuda pendiente sin comprobante, sin compromiso y alta probabilidad de morosidad."
- Confianza: **95%**

---

## 🎯 Casos de Uso

### Caso 1: Cliente Moroso Evasivo
**Entrada**:
- SaldoVencido: $250
- ComprobanteEnviado: NO
- DiceQueYaPago: SI
- compromiso_pago_fecha: null

**Salida**: Prioridad 5 - URGENTE

---

### Caso 2: Cliente con Pago Parcial
**Entrada**:
- SaldoVencido: $100
- TipoDePago: "Parcial"
- RestanteSaldoVencido: $50
- compromiso_pago_fecha: "2025-12-01"

**Salida**: Prioridad 4 - ALTA

---

### Caso 3: Cliente Al Día
**Entrada**:
- SaldoVencido: $0
- ComprobanteEnviado: SI
- TipoDePago: "Total"
- LlamarOtraVez: NO

**Salida**: Prioridad 2 - BAJA

---

## 🔧 Implementación Técnica

### Archivos Modificados

1. **`ConversationHistoryTab.tsx`**
   - Interface `ConversationRecord` extendida
   - Función `calculatePriority()`
   - Función `getPriorityBadge()`
   - Filtros y ordenamiento por prioridad
   - UI actualizada con badges y estadísticas

### Query de Supabase

```typescript
.select(`
  idCompra,
  Cliente,
  Cedula,
  Celular,
  conversation_id,
  Segmento,
  Status,
  Articulo,
  ComprobanteEnviado,
  SaldoVencido,
  DiceQueYaPago,
  LlamarOtraVez,
  compromiso_pago_fecha,
  TipoDePago,
  RestanteSaldoVencido,
  EstadoEtiqueta
`)
```

---

## ✅ Beneficios del Sistema

1. **Automatización**: Clasificación automática sin intervención manual
2. **Visibilidad**: Identificación inmediata de casos urgentes
3. **Eficiencia**: Priorización del tiempo del equipo de cobranzas
4. **Transparencia**: Explicación clara de cada prioridad
5. **Métricas**: Estadísticas en tiempo real por nivel de prioridad
6. **Filtrado**: Capacidad de enfocarse en prioridades específicas

---

## 🚀 Uso del Sistema

### Para el Equipo de Cobranzas

1. **Al abrir el módulo**: Verás los clientes ordenados por prioridad
2. **Filtrar por urgencia**: Usa el filtro "Por Prioridad" para ver solo P5 o P4
3. **Revisar razón**: Lee la explicación en cada tarjeta
4. **Actuar según prioridad**: Contacta primero los casos urgentes

### Flujo Recomendado

```
1. Filtrar por Prioridad 5 → Contactar todos
2. Filtrar por Prioridad 4 → Hacer seguimiento
3. Filtrar por Prioridad 3 → Monitorear compromisos
4. Revisar Prioridad 2 → Validar comprobantes
5. Archivar Prioridad 1 → Casos cerrados
```

---

## 📝 Notas Finales

- El sistema se actualiza en **tiempo real** con cada cambio en la base de datos
- Las prioridades se recalculan automáticamente al cargar la vista
- El nivel de confianza ayuda a identificar casos que requieren revisión manual
- Los filtros son acumulativos (puedes combinar texto + prioridad + comprobante)

---

## 🔮 Futuras Mejoras

- [ ] Historial de cambios de prioridad
- [ ] Alertas automáticas para prioridades 5 y 4
- [ ] Dashboard de gestión por prioridades
- [ ] Exportación de reportes por nivel de urgencia
- [ ] Integración con sistema de recordatorios automáticos

---

**Fecha de Implementación**: Noviembre 24, 2025  
**Versión**: 1.0  
**Estado**: ✅ Implementado y Funcional
