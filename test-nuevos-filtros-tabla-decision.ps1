# 🧪 PRUEBAS: Tabla de Decisión con Nuevos Filtros
# Script de PowerShell para validar la implementación de los 5 filtros

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 VALIDACIÓN: Tabla de Decisión - Nuevos Filtros (5 por campaña)" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════
# CASOS DE PRUEBA
# ═══════════════════════════════════════════════════════════════════

$testCases = @(
    @{
        Name = "MORA NEGATIVA 6"
        DiasMora = -6
        Type = "negative"
        ExpectedFilters = @(
            "DiasMora Equals -6",
            "SaldoPorVencer Greater Than 5",
            "Pagado Not Equals SI",
            "Compromiso Not Equals SI",
            "Equivocado Not Equals SI",
            "GestionHumana Is null",
            "ComprobanteEnviado Is null",
            "DiceQueYaPago Not Equals SI",
            "compromiso_pago_fecha Is null"
        )
        SQLQuery = @"
SELECT COUNT(*) 
FROM POINT_Competencia
WHERE DiasMora = -6
  AND SaldoPorVencer > 5
  AND Pagado != 'SI'
  AND Compromiso != 'SI'
  AND Equivocado != 'SI'
  AND GestionHumana IS NULL
  AND ComprobanteEnviado IS NULL
  AND DiceQueYaPago != 'SI'
  AND compromiso_pago_fecha IS NULL;
"@
    },
    @{
        Name = "MORA NEGATIVA 5"
        DiasMora = -5
        Type = "negative"
        ExpectedFilters = @(
            "DiasMora Equals -5",
            "SaldoPorVencer Greater Than 5",
            "Pagado Not Equals SI",
            "Compromiso Not Equals SI",
            "Equivocado Not Equals SI",
            "GestionHumana Is null",
            "ComprobanteEnviado Is null",
            "DiceQueYaPago Not Equals SI",
            "compromiso_pago_fecha Is null"
        )
        SQLQuery = @"
SELECT COUNT(*) 
FROM POINT_Competencia
WHERE DiasMora = -5
  AND SaldoPorVencer > 5
  AND Pagado != 'SI'
  AND Compromiso != 'SI'
  AND Equivocado != 'SI'
  AND GestionHumana IS NULL
  AND ComprobanteEnviado IS NULL
  AND DiceQueYaPago != 'SI'
  AND compromiso_pago_fecha IS NULL;
"@
    },
    @{
        Name = "DIAS MORA 0"
        DiasMora = 0
        Type = "zero"
        ExpectedFilters = @(
            "DiasMora Equals 0",
            "SaldoPorVencer Greater Than 5",
            "Pagado Not Equals SI",
            "Compromiso Not Equals SI",
            "Equivocado Not Equals SI",
            "GestionHumana Is null",
            "ComprobanteEnviado Is null",
            "DiceQueYaPago Not Equals SI",
            "compromiso_pago_fecha Is null"
        )
        SQLQuery = @"
SELECT COUNT(*) 
FROM POINT_Competencia
WHERE DiasMora = 0
  AND SaldoPorVencer > 5
  AND Pagado != 'SI'
  AND Compromiso != 'SI'
  AND Equivocado != 'SI'
  AND GestionHumana IS NULL
  AND ComprobanteEnviado IS NULL
  AND DiceQueYaPago != 'SI'
  AND compromiso_pago_fecha IS NULL;
"@
    },
    @{
        Name = "MORA POSITIVA 1"
        DiasMora = 1
        Type = "positive"
        ExpectedFilters = @(
            "DiasMora Equals 1",
            "SaldoVencido Greater Than 5",
            "Pagado Not Equals SI",
            "Compromiso Not Equals SI",
            "Equivocado Not Equals SI",
            "GestionHumana Is null",
            "ComprobanteEnviado Is null",
            "DiceQueYaPago Not Equals SI",
            "compromiso_pago_fecha Is null"
        )
        SQLQuery = @"
SELECT COUNT(*) 
FROM POINT_Competencia
WHERE DiasMora = 1
  AND SaldoVencido > 5
  AND Pagado != 'SI'
  AND Compromiso != 'SI'
  AND Equivocado != 'SI'
  AND GestionHumana IS NULL
  AND ComprobanteEnviado IS NULL
  AND DiceQueYaPago != 'SI'
  AND compromiso_pago_fecha IS NULL;
"@
    },
    @{
        Name = "MORA POSITIVA 6"
        DiasMora = 6
        Type = "positive"
        ExpectedFilters = @(
            "DiasMora Equals 6",
            "SaldoVencido Greater Than 5",
            "Pagado Not Equals SI",
            "Compromiso Not Equals SI",
            "Equivocado Not Equals SI",
            "GestionHumana Is null",
            "ComprobanteEnviado Is null",
            "DiceQueYaPago Not Equals SI",
            "compromiso_pago_fecha Is null"
        )
        SQLQuery = @"
SELECT COUNT(*) 
FROM POINT_Competencia
WHERE DiasMora = 6
  AND SaldoVencido > 5
  AND Pagado != 'SI'
  AND Compromiso != 'SI'
  AND Equivocado != 'SI'
  AND GestionHumana IS NULL
  AND ComprobanteEnviado IS NULL
  AND DiceQueYaPago != 'SI'
  AND compromiso_pago_fecha IS NULL;
"@
    }
)

# ═══════════════════════════════════════════════════════════════════
# MOSTRAR CASOS DE PRUEBA
# ═══════════════════════════════════════════════════════════════════

foreach ($test in $testCases) {
    Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "📋 Campaña: $($test.Name)" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "  📊 Parámetros:" -ForegroundColor Yellow
    Write-Host "     DiasMora: $($test.DiasMora)" -ForegroundColor White
    Write-Host "     Tipo: $($test.Type)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  ✅ Filtros Esperados (5):" -ForegroundColor Green
    $test.ExpectedFilters | ForEach-Object {
        Write-Host "     • $_" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "  📝 Query SQL Esperado:" -ForegroundColor Magenta
    $test.SQLQuery -split "`n" | ForEach-Object {
        Write-Host "     $_" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════
# PASOS DE VALIDACIÓN MANUAL
# ═══════════════════════════════════════════════════════════════════

Write-Host "📋 CHECKLIST DE VALIDACIÓN MANUAL" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

Write-Host "1. 🌐 Abrir la aplicación en el navegador" -ForegroundColor Cyan
Write-Host "   [ ] Navegar a http://localhost:8080/dashboard" -ForegroundColor White
Write-Host "   [ ] Login exitoso" -ForegroundColor White
Write-Host ""

Write-Host "2. 📊 Ir a la Tabla de Decisión" -ForegroundColor Cyan
Write-Host "   [ ] Click en la pestaña 'Día a Día'" -ForegroundColor White
Write-Host "   [ ] Scroll hasta la sección '📊 Tabla de Decisión - Campañas de Mora'" -ForegroundColor White
Write-Host ""

Write-Host "3. 🔍 Verificar Interfaz" -ForegroundColor Cyan
Write-Host "   [ ] El título dice 'Tabla de Decisión - Campañas de Mora'" -ForegroundColor White
Write-Host "   [ ] Hay un botón 'Actualizar' con ícono de RefreshCw" -ForegroundColor White
Write-Host "   [ ] La explicación dice 'Filtros aplicados (5 filtros cada campaña):'" -ForegroundColor White
Write-Host ""

Write-Host "4. 📋 Verificar Filtros Explicados" -ForegroundColor Cyan
Write-Host "   [ ] Mora Negativa: menciona los 5 filtros correctamente" -ForegroundColor White
Write-Host "   [ ] Días Mora 0: aparece como nuevo elemento 🆕" -ForegroundColor White
Write-Host "   [ ] Mora Positiva: menciona los 5 filtros correctamente" -ForegroundColor White
Write-Host ""

Write-Host "5. 📊 Verificar Tabla de Campañas" -ForegroundColor Cyan
Write-Host "   [ ] Se muestran 11 campañas en total (antes eran 10)" -ForegroundColor White
Write-Host "   [ ] Aparece 'DIAS MORA 0' entre las negativas y positivas" -ForegroundColor White
Write-Host "   [ ] Cada campaña muestra un número de registros elegibles" -ForegroundColor White
Write-Host ""

Write-Host "6. 🔄 Probar el botón 'Actualizar'" -ForegroundColor Cyan
Write-Host "   [ ] Click en el botón" -ForegroundColor White
Write-Host "   [ ] Aparece mensaje 'Actualizando datos...'" -ForegroundColor White
Write-Host "   [ ] Botón muestra animación de spin" -ForegroundColor White
Write-Host "   [ ] Después de unos segundos: mensaje 'Datos actualizados'" -ForegroundColor White
Write-Host ""

Write-Host "7. 🐛 Verificar Console Logs (F12)" -ForegroundColor Cyan
Write-Host "   [ ] Abrir DevTools (F12) → Consola" -ForegroundColor White
Write-Host "   [ ] Buscar logs como:" -ForegroundColor White
Write-Host "       🔍 Consultando: MORA NEGATIVA 5 (DiasMora=-5)" -ForegroundColor Gray
Write-Host "       🔹 Filtros: DiasMora Equals -5, SaldoPorVencer Greater Than 5, ..." -ForegroundColor Gray
Write-Host "       🔍 Consultando: DIAS MORA 0 (DiasMora=0)" -ForegroundColor Gray
Write-Host "       🔹 Filtros: DiasMora Equals 0, SaldoPorVencer Greater Than 5, ..." -ForegroundColor Gray
Write-Host "       🔍 Consultando: MORA POSITIVA 1 (DiasMora=1)" -ForegroundColor Gray
Write-Host "       🔹 Filtros: DiasMora Equals 1, SaldoVencido Greater Than 5, ..." -ForegroundColor Gray
Write-Host ""

Write-Host "8. 🗄️ Validar en Supabase UI" -ForegroundColor Cyan
Write-Host "   [ ] Ir a Supabase → SQL Editor" -ForegroundColor White
Write-Host "   [ ] Ejecutar los queries de prueba (ver arriba)" -ForegroundColor White
Write-Host "   [ ] Comparar resultados con la tabla del dashboard" -ForegroundColor White
Write-Host ""

Write-Host "9. 📊 Verificar Conteos" -ForegroundColor Cyan
Write-Host "   [ ] Los conteos son MENORES que antes (esperado, más filtros)" -ForegroundColor White
Write-Host "   [ ] No hay campañas con números negativos o 'NaN'" -ForegroundColor White
Write-Host "   [ ] Campañas sin datos muestran badge gris con '0'" -ForegroundColor White
Write-Host ""

Write-Host "10. ✅ Validación de Lógica" -ForegroundColor Cyan
Write-Host "   [ ] Mora Negativa usa SaldoPorVencer (no SaldoVencido)" -ForegroundColor White
Write-Host "   [ ] Días Mora 0 usa SaldoPorVencer (no SaldoVencido)" -ForegroundColor White
Write-Host "   [ ] Mora Positiva usa SaldoVencido (no SaldoPorVencer)" -ForegroundColor White
Write-Host ""

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════
# QUERIES DE COMPARACIÓN PARA SUPABASE
# ═══════════════════════════════════════════════════════════════════

Write-Host "📝 QUERIES PARA EJECUTAR EN SUPABASE SQL EDITOR" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

Write-Host "-- MORA NEGATIVA 5 (debe usar SaldoPorVencer)" -ForegroundColor Green
Write-Host @"
SELECT COUNT(*) as total
FROM POINT_Competencia
WHERE DiasMora = -5
  AND SaldoPorVencer > 5
  AND compromiso_pago_fecha IS NULL
  AND Pagado = 'NO'
  AND ComprobanteEnviado IS NULL;
"@ -ForegroundColor White
Write-Host ""

Write-Host "-- DIAS MORA 0 (nuevo, debe usar SaldoPorVencer)" -ForegroundColor Green
Write-Host @"
SELECT COUNT(*) as total
FROM POINT_Competencia
WHERE DiasMora = 0
  AND SaldoPorVencer > 5
  AND compromiso_pago_fecha IS NULL
  AND Pagado = 'NO'
  AND ComprobanteEnviado IS NULL;
"@ -ForegroundColor White
Write-Host ""

Write-Host "-- MORA POSITIVA 5 (debe usar SaldoVencido)" -ForegroundColor Green
Write-Host @"
SELECT COUNT(*) as total
FROM POINT_Competencia
WHERE DiasMora = 5
  AND SaldoVencido > 5
  AND compromiso_pago_fecha IS NULL
  AND Pagado = 'NO'
  AND ComprobanteEnviado IS NULL;
"@ -ForegroundColor White
Write-Host ""

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════
# RESUMEN DE CAMBIOS
# ═══════════════════════════════════════════════════════════════════

Write-Host "📊 RESUMEN DE CAMBIOS IMPLEMENTADOS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ ANTES vs AHORA" -ForegroundColor Cyan
Write-Host ""

Write-Host "📈 MORA NEGATIVA (-5 a -1):" -ForegroundColor Magenta
Write-Host "   ANTES (2 filtros):" -ForegroundColor Red
Write-Host "     • DiasMora = valor" -ForegroundColor White
Write-Host "     • SaldoPorVencer != 0" -ForegroundColor White
Write-Host ""
Write-Host "   AHORA (5 filtros):" -ForegroundColor Green
Write-Host "     • DiasMora Equals valor" -ForegroundColor White
Write-Host "     • SaldoPorVencer Greater Than 5" -ForegroundColor White
Write-Host "     • compromiso_pago_fecha Is null" -ForegroundColor White
Write-Host "     • Pagado Equals NO" -ForegroundColor White
Write-Host "     • ComprobanteEnviado Is null" -ForegroundColor White
Write-Host ""

Write-Host "🆕 DIAS MORA 0 (nueva campaña):" -ForegroundColor Magenta
Write-Host "   ANTES: No existía" -ForegroundColor Red
Write-Host ""
Write-Host "   AHORA (5 filtros):" -ForegroundColor Green
Write-Host "     • DiasMora Equals 0" -ForegroundColor White
Write-Host "     • SaldoPorVencer Greater Than 5" -ForegroundColor White
Write-Host "     • compromiso_pago_fecha Is null" -ForegroundColor White
Write-Host "     • Pagado Equals NO" -ForegroundColor White
Write-Host "     • ComprobanteEnviado Is null" -ForegroundColor White
Write-Host ""

Write-Host "📉 MORA POSITIVA (1 a 5):" -ForegroundColor Magenta
Write-Host "   ANTES (3 filtros):" -ForegroundColor Red
Write-Host "     • DiasMora = valor" -ForegroundColor White
Write-Host "     • SaldoVencido != 0" -ForegroundColor White
Write-Host "     • ComprobanteEnviado IS NULL" -ForegroundColor White
Write-Host ""
Write-Host "   AHORA (5 filtros):" -ForegroundColor Green
Write-Host "     • DiasMora Equals valor" -ForegroundColor White
Write-Host "     • SaldoVencido Greater Than 5" -ForegroundColor White
Write-Host "     • compromiso_pago_fecha Is null" -ForegroundColor White
Write-Host "     • Pagado Equals NO" -ForegroundColor White
Write-Host "     • ComprobanteEnviado Is null" -ForegroundColor White
Write-Host ""

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Archivo de prueba generado correctamente" -ForegroundColor Green
Write-Host "💡 Ejecuta las validaciones manuales en el navegador" -ForegroundColor Yellow
Write-Host "🗄️ Compara los resultados con los queries de Supabase" -ForegroundColor Yellow
Write-Host ""
