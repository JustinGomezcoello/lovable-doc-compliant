# ═════════════════════════════════════════════════════════════════
# 🧪 SCRIPT DE VALIDACIÓN - LÓGICA DE DEUDA POR TIPO DE CAMPAÑA
# ═════════════════════════════════════════════════════════════════

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 VALIDACIÓN: Lógica de Deuda por Tipo de Campaña         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═════════════════════════════════════════════════════════════════
# CASOS DE PRUEBA
# ═════════════════════════════════════════════════════════════════

$testCases = @(
    @{
        Name = "Campaña Positiva 3 - Pago Total"
        Campaign = "MORA POSITIVA 3"
        DiasMora = 3
        SaldoVencido = 500
        SaldoPorVencer = 200
        ComprobanteEnviado = "Si"
        TipoDePago = "Total"
        RestanteSaldoVencido = 0
        ExpectedDebt = 0
        ExpectedBadge = "✓ Total"
        ExpectedColor = "Verde"
    },
    @{
        Name = "Campaña Negativa 5 - Pago Parcial"
        Campaign = "MORA NEGATIVA 5"
        DiasMora = -5
        SaldoVencido = 0
        SaldoPorVencer = 800
        ComprobanteEnviado = "Si"
        TipoDePago = "Parcial"
        RestanteSaldoVencido = 300
        ExpectedDebt = 300
        ExpectedBadge = "⚠️ Parcial"
        ExpectedColor = "Amarillo"
    },
    @{
        Name = "Reactivación Cobro - Sin Pago"
        Campaign = "REACTIVACIÓN COBRO"
        DiasMora = $null
        SaldoVencido = 1200
        SaldoPorVencer = 400
        ComprobanteEnviado = $null
        TipoDePago = $null
        RestanteSaldoVencido = $null
        ExpectedDebt = 1200
        ExpectedBadge = "Pendiente"
        ExpectedColor = "Rojo"
        ExpectedNote = "Usa SaldoVencido, NO SaldoPorVencer"
    },
    @{
        Name = "Compromiso de Pago - Deuda Mixta"
        Campaign = "COMPROMISO DE PAGO"
        DiasMora = $null
        SaldoVencido = 600
        SaldoPorVencer = 400
        ComprobanteEnviado = $null
        TipoDePago = $null
        RestanteSaldoVencido = $null
        ExpectedDebt = 1000
        ExpectedBadge = "Pendiente"
        ExpectedColor = "Rojo"
        ExpectedNote = "Suma SaldoVencido + SaldoPorVencer"
    },
    @{
        Name = "Campaña Positiva 2 - Comprobante sin TipoDePago"
        Campaign = "MORA POSITIVA 2"
        DiasMora = 2
        SaldoVencido = 350
        SaldoPorVencer = 100
        ComprobanteEnviado = "Si"
        TipoDePago = $null
        RestanteSaldoVencido = $null
        ExpectedDebt = 0
        ExpectedBadge = "✓ Pagó"
        ExpectedColor = "Verde"
        ExpectedNote = "ComprobanteEnviado cuenta como pagado"
    },
    @{
        Name = "Campaña Negativa 1 - Sin Deuda"
        Campaign = "MORA NEGATIVA 1"
        DiasMora = -1
        SaldoVencido = 50
        SaldoPorVencer = 0
        ComprobanteEnviado = $null
        TipoDePago = $null
        RestanteSaldoVencido = $null
        ExpectedDebt = 0
        ExpectedBadge = "Sin Deuda"
        ExpectedColor = "Turquesa"
        ExpectedNote = "SaldoPorVencer = 0 para negativas"
    },
    @{
        Name = "Campaña Positiva 5 - Crédito Actualizado"
        Campaign = "MORA POSITIVA 5"
        DiasMora = 5
        SaldoVencido = 0
        SaldoPorVencer = 150
        ComprobanteEnviado = $null
        TipoDePago = $null
        RestanteSaldoVencido = $null
        ExpectedDebt = 0
        ExpectedBadge = "Sin Deuda"
        ExpectedColor = "Turquesa"
        ExpectedNote = "SaldoVencido = 0 para positivas"
    }
)

# ═════════════════════════════════════════════════════════════════
# FUNCIÓN PARA SIMULAR LA LÓGICA
# ═════════════════════════════════════════════════════════════════

function Test-DebtLogic {
    param (
        [string]$Campaign,
        [int]$DiasMora,
        [decimal]$SaldoVencido,
        [decimal]$SaldoPorVencer,
        [string]$ComprobanteEnviado,
        [string]$TipoDePago,
        [decimal]$RestanteSaldoVencido
    )

    # Identificar tipo de campaña
    $isNegative = $DiasMora -lt 0
    $isPositive = $DiasMora -gt 0
    $isCompromiso = $Campaign -match "COMPROMISO"
    $isReactivacion = $Campaign -match "REACTIVACI[ÓO]N"

    # Calcular deuda pendiente
    $debt = 0
    $badge = ""
    $color = ""

    if ($TipoDePago -eq "Total" -or $ComprobanteEnviado -eq "Si") {
        $debt = 0
        if ($TipoDePago -eq "Total") {
            $badge = "✓ Total"
            $color = "Verde"
        } elseif ($TipoDePago -eq "Parcial") {
            $debt = $RestanteSaldoVencido
            $badge = "⚠️ Parcial"
            $color = "Amarillo"
        } else {
            $badge = "✓ Pagó"
            $color = "Verde"
        }
    } elseif ($TipoDePago -eq "Parcial") {
        $debt = $RestanteSaldoVencido
        $badge = "⚠️ Parcial"
        $color = "Amarillo"
    } else {
        # Sin pago - calcular según tipo
        if ($isPositive -or $isReactivacion) {
            $debt = $SaldoVencido
            if ($debt -eq 0) {
                $badge = "Sin Deuda"
                $color = "Turquesa"
            } else {
                $badge = "Pendiente"
                $color = "Rojo"
            }
        } elseif ($isNegative) {
            $debt = $SaldoPorVencer
            if ($debt -eq 0) {
                $badge = "Sin Deuda"
                $color = "Turquesa"
            } else {
                $badge = "Pendiente"
                $color = "Rojo"
            }
        } elseif ($isCompromiso) {
            $debt = $SaldoVencido + $SaldoPorVencer
            if ($debt -eq 0) {
                $badge = "Sin Deuda"
                $color = "Turquesa"
            } else {
                $badge = "Pendiente"
                $color = "Rojo"
            }
        }
    }

    return @{
        Debt = $debt
        Badge = $badge
        Color = $color
    }
}

# ═════════════════════════════════════════════════════════════════
# EJECUTAR PRUEBAS
# ═════════════════════════════════════════════════════════════════

$passed = 0
$failed = 0

foreach ($test in $testCases) {
    Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "🧪 $($test.Name)" -ForegroundColor White
    Write-Host ""

    # Mostrar input
    Write-Host "  📥 Input:" -ForegroundColor Cyan
    Write-Host "     Campaña: $($test.Campaign)" -ForegroundColor Gray
    if ($test.DiasMora) {
        Write-Host "     DiasMora: $($test.DiasMora)" -ForegroundColor Gray
    }
    Write-Host "     SaldoVencido: `$$($test.SaldoVencido)" -ForegroundColor Gray
    Write-Host "     SaldoPorVencer: `$$($test.SaldoPorVencer)" -ForegroundColor Gray
    if ($test.ComprobanteEnviado) {
        Write-Host "     ComprobanteEnviado: $($test.ComprobanteEnviado)" -ForegroundColor Gray
    }
    if ($test.TipoDePago) {
        Write-Host "     TipoDePago: $($test.TipoDePago)" -ForegroundColor Gray
    }
    if ($test.RestanteSaldoVencido) {
        Write-Host "     RestanteSaldoVencido: `$$($test.RestanteSaldoVencido)" -ForegroundColor Gray
    }
    Write-Host ""

    # Ejecutar lógica
    $result = Test-DebtLogic `
        -Campaign $test.Campaign `
        -DiasMora $test.DiasMora `
        -SaldoVencido $test.SaldoVencido `
        -SaldoPorVencer $test.SaldoPorVencer `
        -ComprobanteEnviado $test.ComprobanteEnviado `
        -TipoDePago $test.TipoDePago `
        -RestanteSaldoVencido $test.RestanteSaldoVencido

    # Validar resultado
    $debtMatch = $result.Debt -eq $test.ExpectedDebt
    $badgeMatch = $result.Badge -eq $test.ExpectedBadge
    $colorMatch = $result.Color -eq $test.ExpectedColor

    $testPassed = $debtMatch -and $badgeMatch -and $colorMatch

    # Mostrar resultado
    Write-Host "  📤 Output:" -ForegroundColor Cyan
    Write-Host "     Deuda Pendiente: `$$($result.Debt)" -ForegroundColor $(if ($debtMatch) { "Green" } else { "Red" })
    Write-Host "     Badge: $($result.Badge)" -ForegroundColor $(if ($badgeMatch) { "Green" } else { "Red" })
    Write-Host "     Color: $($result.Color)" -ForegroundColor $(if ($colorMatch) { "Green" } else { "Red" })
    
    if ($test.ExpectedNote) {
        Write-Host "     💡 $($test.ExpectedNote)" -ForegroundColor Yellow
    }
    Write-Host ""

    # Resultado del test
    if ($testPassed) {
        Write-Host "  ✅ TEST PASADO" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ TEST FALLIDO" -ForegroundColor Red
        Write-Host "     Esperado - Deuda: `$$($test.ExpectedDebt), Badge: $($test.ExpectedBadge), Color: $($test.ExpectedColor)" -ForegroundColor Red
        $failed++
    }
    Write-Host ""
}

# ═════════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═════════════════════════════════════════════════════════════════

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 RESUMEN DE VALIDACIÓN                                    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total de pruebas: $($testCases.Count)" -ForegroundColor White
Write-Host "  ✅ Pasadas: $passed" -ForegroundColor Green
Write-Host "  ❌ Fallidas: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "  🎉 ¡TODAS LAS PRUEBAS PASARON!" -ForegroundColor Green
    Write-Host "  La lógica de deuda por tipo de campaña está correcta." -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Algunas pruebas fallaron. Revisa la lógica." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# ═════════════════════════════════════════════════════════════════
# TABLA DE REGLAS
# ═════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📋 REGLAS POR TIPO DE CAMPAÑA                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$rules = @(
    @{ Type = "Positivas (1-5)"; Field = "SaldoVencido"; NoDebt = "SaldoVencido = 0" },
    @{ Type = "Negativas (-5 a -1)"; Field = "SaldoPorVencer"; NoDebt = "SaldoPorVencer = 0" },
    @{ Type = "Compromiso de Pago"; Field = "Suma ambos"; NoDebt = "Ambos = 0" },
    @{ Type = "Reactivación Cobro"; Field = "SaldoVencido"; NoDebt = "SaldoVencido = 0" }
)

foreach ($rule in $rules) {
    Write-Host "  📌 $($rule.Type):" -ForegroundColor Yellow
    Write-Host "     Campo: $($rule.Field)" -ForegroundColor Gray
    Write-Host "     Sin deuda si: $($rule.NoDebt)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "  💡 ComprobanteEnviado = Si cuenta como pagado en TODAS las campañas" -ForegroundColor Cyan
Write-Host ""
