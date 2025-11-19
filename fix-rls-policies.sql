-- 🔧 VERIFICACIÓN RLS (Row Level Security)
-- Ejecutar en SQL Editor de Supabase

-- 1. Ver qué políticas RLS están activas en las tablas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN (
    'point_mora_neg1',
    'point_mora_neg2',
    'point_mora_neg3',
    'point_mora_neg5',
    'point_mora_pos1',
    'point_mora_pos4',
    'point_compromiso_pago',
    'point_reactivacion_cobro'
)
ORDER BY tablename;

-- 2. Ver si RLS está habilitado en las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN (
    'point_mora_neg1',
    'point_mora_neg2',
    'point_mora_neg3',
    'point_mora_neg5',
    'point_mora_pos1',
    'point_mora_pos4',
    'point_compromiso_pago',
    'point_reactivacion_cobro'
);

-- 3. SOLUCIÓN TEMPORAL: Deshabilitar RLS en todas las tablas
-- ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN

-- Deshabilitar RLS
ALTER TABLE point_mora_neg1 DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_neg2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_neg3 DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_neg5 DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_pos1 DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_pos4 DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_compromiso_pago DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_reactivacion_cobro DISABLE ROW LEVEL SECURITY;

-- 4. Verificar que ahora podemos leer datos
SELECT 
    'point_mora_neg1' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT fecha) as fechas_unicas
FROM point_mora_neg1
UNION ALL
SELECT 
    'point_mora_neg2' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT fecha) as fechas_unicas
FROM point_mora_neg2
UNION ALL
SELECT 
    'point_mora_neg3' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT fecha) as fechas_unicas
FROM point_mora_neg3
UNION ALL
SELECT 
    'point_mora_neg5' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT fecha) as fechas_unicas
FROM point_mora_neg5
UNION ALL
SELECT 
    'point_mora_pos1' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT fecha) as fechas_unicas
FROM point_mora_pos1
UNION ALL
SELECT 
    'point_mora_pos4' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT fecha) as fechas_unicas
FROM point_mora_pos4
UNION ALL
SELECT 
    'point_compromiso_pago' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT fecha) as fechas_unicas
FROM point_compromiso_pago
UNION ALL
SELECT 
    'point_reactivacion_cobro' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT fecha) as fechas_unicas
FROM point_reactivacion_cobro;

-- 5. SI QUIERES VOLVER A HABILITAR RLS DESPUÉS (con políticas permisivas)
/*
-- Habilitar RLS
ALTER TABLE point_mora_neg1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_neg2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_neg3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_neg5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_pos1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_pos4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_compromiso_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_reactivacion_cobro ENABLE ROW LEVEL SECURITY;

-- Crear política permisiva para SELECT (permite leer todo)
CREATE POLICY "Allow all SELECT" ON point_mora_neg1 FOR SELECT USING (true);
CREATE POLICY "Allow all SELECT" ON point_mora_neg2 FOR SELECT USING (true);
CREATE POLICY "Allow all SELECT" ON point_mora_neg3 FOR SELECT USING (true);
CREATE POLICY "Allow all SELECT" ON point_mora_neg5 FOR SELECT USING (true);
CREATE POLICY "Allow all SELECT" ON point_mora_pos1 FOR SELECT USING (true);
CREATE POLICY "Allow all SELECT" ON point_mora_pos4 FOR SELECT USING (true);
CREATE POLICY "Allow all SELECT" ON point_compromiso_pago FOR SELECT USING (true);
CREATE POLICY "Allow all SELECT" ON point_reactivacion_cobro FOR SELECT USING (true);
*/
