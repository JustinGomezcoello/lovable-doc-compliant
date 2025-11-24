-- ============================================================================
-- FIX: Políticas RLS para POINT_Competencia
-- ============================================================================
-- Este archivo configura las políticas de seguridad para permitir acceso
-- de lectura a la tabla POINT_Competencia desde el dashboard
-- ============================================================================

-- Primero, verificar si RLS está habilitado en la tabla
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'POINT_Competencia';

-- Ver las políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'POINT_Competencia';

-- ============================================================================
-- OPCIÓN 1: Deshabilitar RLS (más simple, menos seguro)
-- ============================================================================
-- Usar esto si la tabla no necesita restricciones de seguridad
-- DESCOMENTAR LA SIGUIENTE LÍNEA SI QUIERES ESTA OPCIÓN:
-- ALTER TABLE public."POINT_Competencia" DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPCIÓN 2: Crear política permisiva para lectura (recomendado)
-- ============================================================================
-- Permite que cualquier usuario autenticado pueda leer la tabla

-- Primero, asegurar que RLS esté habilitado
ALTER TABLE public."POINT_Competencia" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay (para evitar conflictos)
DROP POLICY IF EXISTS "Allow public read access" ON public."POINT_Competencia";
DROP POLICY IF EXISTS "Enable read access for all users" ON public."POINT_Competencia";
DROP POLICY IF EXISTS "point_competencia_select_policy" ON public."POINT_Competencia";

-- Crear política permisiva para SELECT (lectura)
-- Esta política permite a CUALQUIERA leer la tabla (incluso usuarios anónimos)
CREATE POLICY "Enable read access for all users"
ON public."POINT_Competencia"
FOR SELECT
TO public
USING (true);

-- ============================================================================
-- OPCIÓN 3: Política solo para usuarios autenticados (más seguro)
-- ============================================================================
-- Si prefieres que solo usuarios autenticados puedan leer:
-- DESCOMENTAR LAS SIGUIENTES LÍNEAS:

-- DROP POLICY IF EXISTS "Enable read access for all users" ON public."POINT_Competencia";
-- 
-- CREATE POLICY "Enable read access for authenticated users"
-- ON public."POINT_Competencia"
-- FOR SELECT
-- TO authenticated
-- USING (true);

-- ============================================================================
-- Verificar que la política se creó correctamente
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'POINT_Competencia'
ORDER BY policyname;

-- Test: Contar registros en la tabla
SELECT COUNT(*) as total_registros FROM public."POINT_Competencia";

-- Test: Ver algunos registros de ejemplo
SELECT 
  "idCompra",
  "DiasMora",
  "SaldoPorVencer",
  "SaldoVencido",
  "ComprobanteEnviado"
FROM public."POINT_Competencia"
LIMIT 5;

-- Test: Contar registros por DiasMora
SELECT 
  "DiasMora",
  COUNT(*) as cantidad
FROM public."POINT_Competencia"
GROUP BY "DiasMora"
ORDER BY "DiasMora";
