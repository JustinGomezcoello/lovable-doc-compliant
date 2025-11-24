// Test del Sistema de Prioridades para Conversaciones
// Ejecutar con: node test-priority-system.js

console.log("🧪 INICIANDO TESTS DEL SISTEMA DE PRIORIDADES\n");
console.log("=".repeat(60));

// Función de cálculo de prioridad (copiada de la implementación)
function calculatePriority(record) {
  const saldoVencido = record.SaldoVencido || 0;
  const comprobanteEnviado = record.ComprobanteEnviado?.toUpperCase() === "SI";
  const diceQueYaPago = record.DiceQueYaPago?.toUpperCase() === "SI";
  const llamarOtraVez = record.LlamarOtraVez?.toUpperCase() === "SI";
  const tieneCompromiso = !!record.compromiso_pago_fecha;
  const tipoDePago = record.TipoDePago?.toLowerCase();
  const restanteSaldo = record.RestanteSaldoVencido || 0;
  const estadoEtiqueta = record.EstadoEtiqueta?.toLowerCase() || "";

  const etiquetasCerradas = ["servicio_tecnico", "soporte", "numero_equivocado", "no_registrado"];
  const etiquetasEvasivas = ["consulto_saldo", "consulto_datos_transferencia"];
  const etiquetasPositivas = ["compromiso_pago", "pagado", "comprobante_enviado"];

  // PRIORIDAD 1 - Sin urgencia / caso cerrado
  if (
    saldoVencido === 0 && 
    !llamarOtraVez ||
    etiquetasCerradas.some(tag => estadoEtiqueta.includes(tag))
  ) {
    return {
      prioridad: 1,
      prioridad_porque: "No existe deuda ni acción pendiente. Caso cerrado.",
      confianza: 0.95
    };
  }

  // PRIORIDAD 2 - Urgencia baja (Cliente al día)
  if (
    saldoVencido === 0 &&
    comprobanteEnviado &&
    tipoDePago === "total" &&
    !llamarOtraVez
  ) {
    return {
      prioridad: 2,
      prioridad_porque: "Cliente al día, comprobante confirmado. No requiere gestión.",
      confianza: 0.90
    };
  }

  // PRIORIDAD 5 - Máxima urgencia
  if (
    saldoVencido > 0 &&
    !comprobanteEnviado &&
    !tieneCompromiso &&
    (diceQueYaPago || etiquetasEvasivas.some(tag => estadoEtiqueta.includes(tag))) &&
    llamarOtraVez
  ) {
    return {
      prioridad: 5,
      prioridad_porque: "Cliente con deuda pendiente sin comprobante, sin compromiso y alta probabilidad de morosidad.",
      confianza: 0.95
    };
  }

  // Caso alternativo de Prioridad 5
  if (
    saldoVencido > 0 &&
    !comprobanteEnviado &&
    !tieneCompromiso &&
    llamarOtraVez
  ) {
    return {
      prioridad: 5,
      prioridad_porque: "Cliente con deuda alta sin comprobante ni compromiso. Requiere contacto urgente.",
      confianza: 0.85
    };
  }

  // PRIORIDAD 4 - Urgencia alta
  if (
    saldoVencido > 0 &&
    (tipoDePago === "parcial" || restanteSaldo > 0) &&
    (tieneCompromiso || etiquetasPositivas.some(tag => estadoEtiqueta.includes(tag)))
  ) {
    return {
      prioridad: 4,
      prioridad_porque: "Cliente con deuda activa y señales de pago parcial o compromiso, requiere seguimiento.",
      confianza: 0.80
    };
  }

  // PRIORIDAD 3 - Urgencia media
  if (
    saldoVencido > 0 &&
    (comprobanteEnviado || tieneCompromiso) &&
    llamarOtraVez
  ) {
    return {
      prioridad: 3,
      prioridad_porque: "Cliente con compromiso o comprobante pendiente de validación. Seguimiento moderado.",
      confianza: 0.60
    };
  }

  // Default: Prioridad 3 si tiene deuda
  if (saldoVencido > 0) {
    return {
      prioridad: 3,
      prioridad_porque: "Cliente con deuda pendiente. Requiere evaluación.",
      confianza: 0.50
    };
  }

  // Fallback
  return {
    prioridad: 2,
    prioridad_porque: "Situación no clasificada. Revisión manual recomendada.",
    confianza: 0.40
  };
}

// Casos de prueba
const testCases = [
  {
    nombre: "Caso 1: Cliente Moroso Evasivo (Prioridad 5)",
    record: {
      Cliente: "Juan Pérez",
      SaldoVencido: 250,
      ComprobanteEnviado: "NO",
      DiceQueYaPago: "SI",
      LlamarOtraVez: "SI",
      compromiso_pago_fecha: null,
      EstadoEtiqueta: "consulto_saldo"
    },
    expectedPriority: 5
  },
  {
    nombre: "Caso 2: Cliente con Deuda sin Comprobante (Prioridad 5)",
    record: {
      Cliente: "María González",
      SaldoVencido: 150,
      ComprobanteEnviado: "NO",
      LlamarOtraVez: "SI",
      compromiso_pago_fecha: null,
      EstadoEtiqueta: ""
    },
    expectedPriority: 5
  },
  {
    nombre: "Caso 3: Cliente con Pago Parcial (Prioridad 4)",
    record: {
      Cliente: "Pedro López",
      SaldoVencido: 100,
      ComprobanteEnviado: "SI",
      TipoDePago: "Parcial",
      RestanteSaldoVencido: 50,
      LlamarOtraVez: "SI",
      compromiso_pago_fecha: "2025-12-01",
      EstadoEtiqueta: "compromiso_pago"
    },
    expectedPriority: 4
  },
  {
    nombre: "Caso 4: Cliente con Compromiso (Prioridad 3)",
    record: {
      Cliente: "Ana Martínez",
      SaldoVencido: 80,
      ComprobanteEnviado: "NO",
      LlamarOtraVez: "SI",
      compromiso_pago_fecha: "2025-11-30",
      EstadoEtiqueta: "compromiso_pago"
    },
    expectedPriority: 3
  },
  {
    nombre: "Caso 5: Cliente Al Día (Prioridad 2)",
    record: {
      Cliente: "Carlos Ramírez",
      SaldoVencido: 0,
      ComprobanteEnviado: "SI",
      TipoDePago: "Total",
      LlamarOtraVez: "NO",
      EstadoEtiqueta: "pagado"
    },
    expectedPriority: 2
  },
  {
    nombre: "Caso 6: Caso Cerrado - Servicio Técnico (Prioridad 1)",
    record: {
      Cliente: "Laura Fernández",
      SaldoVencido: 0,
      ComprobanteEnviado: "NO",
      LlamarOtraVez: "NO",
      EstadoEtiqueta: "servicio_tecnico"
    },
    expectedPriority: 1
  },
  {
    nombre: "Caso 7: Número Equivocado (Prioridad 1)",
    record: {
      Cliente: "Roberto Silva",
      SaldoVencido: 0,
      EstadoEtiqueta: "numero_equivocado"
    },
    expectedPriority: 1
  },
  {
    nombre: "Caso 8: Cliente con Deuda pero Comprobante Enviado (Prioridad 3)",
    record: {
      Cliente: "Sofia Torres",
      SaldoVencido: 120,
      ComprobanteEnviado: "SI",
      LlamarOtraVez: "SI",
      TipoDePago: "Total",
      EstadoEtiqueta: "comprobante_enviado"
    },
    expectedPriority: 3
  }
];

// Ejecutar tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📝 Test ${index + 1}: ${testCase.nombre}`);
  console.log("-".repeat(60));
  
  const result = calculatePriority(testCase.record);
  
  console.log(`Cliente: ${testCase.record.Cliente}`);
  console.log(`Saldo Vencido: $${testCase.record.SaldoVencido || 0}`);
  console.log(`Comprobante: ${testCase.record.ComprobanteEnviado || "NO"}`);
  console.log(`Llamar Otra Vez: ${testCase.record.LlamarOtraVez || "NO"}`);
  console.log(`Etiqueta: ${testCase.record.EstadoEtiqueta || "N/A"}`);
  console.log("");
  console.log(`🎯 Prioridad Calculada: ${result.prioridad}`);
  console.log(`📋 Razón: ${result.prioridad_porque}`);
  console.log(`💯 Confianza: ${(result.confianza * 100).toFixed(0)}%`);
  
  if (result.prioridad === testCase.expectedPriority) {
    console.log(`✅ TEST PASADO - Prioridad esperada: ${testCase.expectedPriority}`);
    passed++;
  } else {
    console.log(`❌ TEST FALLADO - Esperado: ${testCase.expectedPriority}, Obtenido: ${result.prioridad}`);
    failed++;
  }
});

// Resumen
console.log("\n" + "=".repeat(60));
console.log("📊 RESUMEN DE TESTS");
console.log("=".repeat(60));
console.log(`Total de tests: ${testCases.length}`);
console.log(`✅ Pasados: ${passed}`);
console.log(`❌ Fallados: ${failed}`);
console.log(`📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log("\n🎉 ¡TODOS LOS TESTS PASARON CORRECTAMENTE!");
} else {
  console.log("\n⚠️  Algunos tests fallaron. Revisar la lógica.");
}

console.log("\n" + "=".repeat(60));
