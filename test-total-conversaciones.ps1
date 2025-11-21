# 🧪 Script de Prueba: Validar Total de Conversaciones
# Fecha: 2025-11-20
# Objetivo: Verificar que la aplicación muestre 1,681 conversaciones (igual que Supabase)

Write-Host "🧪 VALIDACIÓN: Total de Conversaciones" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Variables de configuración
$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:VITE_SUPABASE_ANON_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ ERROR: Variables de entorno no configuradas" -ForegroundColor Red
    Write-Host "   Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔍 Consultando Supabase..." -ForegroundColor Yellow
Write-Host "   URL: $supabaseUrl" -ForegroundColor Gray

# Headers para Supabase
$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

try {
    # Consulta 1: Total de conversaciones con conversation_id válido
    Write-Host ""
    Write-Host "📊 TEST 1: Total de conversaciones válidas" -ForegroundColor Green
    Write-Host "-" * 60 -ForegroundColor Gray
    
    $url = "$supabaseUrl/rest/v1/POINT_Competencia?select=count&conversation_id=not.is.null&conversation_id=neq.0"
    
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    
    $totalConversaciones = $response.count
    
    if (-not $totalConversaciones) {
        Write-Host "⚠️ No se pudo obtener el count. Consultando con paginación..." -ForegroundColor Yellow
        
        # Método alternativo: contar con paginación
        $pageSize = 1000
        $offset = 0
        $totalCount = 0
        $hasMore = $true
        
        while ($hasMore) {
            $urlPaginated = "$supabaseUrl/rest/v1/POINT_Competencia?select=idCompra&conversation_id=not.is.null&conversation_id=neq.0&limit=$pageSize&offset=$offset"
            
            $pageResponse = Invoke-RestMethod -Uri $urlPaginated -Method Get -Headers $headers
            $pageCount = ($pageResponse | Measure-Object).Count
            $totalCount += $pageCount
            
            Write-Host "   Página $([math]::Floor($offset / $pageSize) + 1): $pageCount registros" -ForegroundColor Gray
            
            if ($pageCount -lt $pageSize) {
                $hasMore = $false
            } else {
                $offset += $pageSize
            }
        }
        
        $totalConversaciones = $totalCount
    }
    
    Write-Host ""
    Write-Host "✅ Total de conversaciones en Supabase: $totalConversaciones" -ForegroundColor Green
    
    # Validación
    $expectedTotal = 1681
    
    if ($totalConversaciones -eq $expectedTotal) {
        Write-Host "✅ CORRECTO: Total coincide con lo esperado ($expectedTotal)" -ForegroundColor Green
    } elseif ($totalConversaciones -gt $expectedTotal) {
        Write-Host "ℹ️  NOTA: Total mayor a lo esperado ($totalConversaciones vs $expectedTotal)" -ForegroundColor Yellow
        Write-Host "   Esto es normal si se agregaron más conversaciones desde la última verificación" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ ADVERTENCIA: Total menor a lo esperado ($totalConversaciones vs $expectedTotal)" -ForegroundColor Yellow
    }
    
    # Consulta 2: Personas únicas (cédulas distintas)
    Write-Host ""
    Write-Host "📊 TEST 2: Personas únicas con conversaciones" -ForegroundColor Green
    Write-Host "-" * 60 -ForegroundColor Gray
    
    # Obtener todas las cédulas y contar únicas
    $urlCedulas = "$supabaseUrl/rest/v1/POINT_Competencia?select=Cedula&conversation_id=not.is.null&conversation_id=neq.0"
    
    $responseCedulas = Invoke-RestMethod -Uri $urlCedulas -Method Get -Headers $headers
    $cedulasUnicas = ($responseCedulas | Select-Object -Property Cedula -Unique | Measure-Object).Count
    
    Write-Host ""
    Write-Host "✅ Personas únicas (cédulas distintas): $cedulasUnicas" -ForegroundColor Green
    
    # Consulta 3: Diferencia (personas con múltiples conversaciones)
    Write-Host ""
    Write-Host "📊 TEST 3: Análisis de conversaciones múltiples" -ForegroundColor Green
    Write-Host "-" * 60 -ForegroundColor Gray
    
    $conversacionesMultiples = $totalConversaciones - $cedulasUnicas
    
    Write-Host ""
    Write-Host "📞 Total conversaciones: $totalConversaciones" -ForegroundColor Cyan
    Write-Host "👥 Personas únicas: $cedulasUnicas" -ForegroundColor Cyan
    Write-Host "🔄 Conversaciones adicionales (misma persona): $conversacionesMultiples" -ForegroundColor Cyan
    
    if ($conversacionesMultiples -gt 0) {
        $porcentaje = [math]::Round(($conversacionesMultiples / $totalConversaciones) * 100, 2)
        Write-Host ""
        Write-Host "✅ El $porcentaje% de las conversaciones pertenecen a personas con múltiples conversaciones" -ForegroundColor Green
        Write-Host "   Esto explica por qué el total de conversaciones ($totalConversaciones) es mayor que las personas únicas ($cedulasUnicas)" -ForegroundColor Gray
    }
    
    # Consulta 4: Estado de comprobantes
    Write-Host ""
    Write-Host "📊 TEST 4: Estado de comprobantes enviados" -ForegroundColor Green
    Write-Host "-" * 60 -ForegroundColor Gray
    
    $urlConComprobante = "$supabaseUrl/rest/v1/POINT_Competencia?select=count&conversation_id=not.is.null&conversation_id=neq.0&ComprobanteEnviado=eq.SI"
    $urlSinComprobante = "$supabaseUrl/rest/v1/POINT_Competencia?select=count&conversation_id=not.is.null&conversation_id=neq.0&ComprobanteEnviado=neq.SI"
    
    $conComprobante = (Invoke-RestMethod -Uri $urlConComprobante -Method Get -Headers $headers).count
    $sinComprobante = (Invoke-RestMethod -Uri $urlSinComprobante -Method Get -Headers $headers).count
    
    if (-not $conComprobante) { $conComprobante = 0 }
    if (-not $sinComprobante) { $sinComprobante = $totalConversaciones - $conComprobante }
    
    Write-Host ""
    Write-Host "✅ Con comprobante enviado: $conComprobante" -ForegroundColor Green
    Write-Host "⏳ Sin comprobante enviado: $sinComprobante" -ForegroundColor Yellow
    
    $porcentajeConComprobante = [math]::Round(($conComprobante / $totalConversaciones) * 100, 2)
    Write-Host ""
    Write-Host "📈 $porcentajeConComprobante% de las conversaciones tienen comprobante enviado" -ForegroundColor Cyan
    
    # Resumen final
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "📋 RESUMEN DE VALIDACIÓN" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Total conversaciones: $totalConversaciones" -ForegroundColor Green
    Write-Host "✅ Personas únicas: $cedulasUnicas" -ForegroundColor Green
    Write-Host "✅ Conversaciones adicionales: $conversacionesMultiples" -ForegroundColor Green
    Write-Host "✅ Con comprobante: $conComprobante" -ForegroundColor Green
    Write-Host "✅ Sin comprobante: $sinComprobante" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🎯 VALIDACIÓN COMPLETA" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 INSTRUCCIONES PARA VERIFICAR EN LA APLICACIÓN:" -ForegroundColor Yellow
    Write-Host "   1. Abrir la pestaña 'Ver Conversaciones'" -ForegroundColor Gray
    Write-Host "   2. Verificar el badge: '📞 Total conversaciones: $totalConversaciones'" -ForegroundColor Gray
    Write-Host "   3. Verificar el badge: '👥 Personas únicas: $cedulasUnicas'" -ForegroundColor Gray
    Write-Host "   4. Si una persona aparece varias veces, es CORRECTO (tiene múltiples conversaciones)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR al consultar Supabase:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Verifica:" -ForegroundColor Yellow
    Write-Host "   - Las variables de entorno están configuradas correctamente" -ForegroundColor Gray
    Write-Host "   - La URL de Supabase es válida" -ForegroundColor Gray
    Write-Host "   - La API key tiene permisos de lectura" -ForegroundColor Gray
    exit 1
}
