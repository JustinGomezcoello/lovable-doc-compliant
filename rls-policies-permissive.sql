-- 🔐 SOLUCIÓN PROFESIONAL: Habilitar RLS con Políticas Permisivas
-- Ejecutar en SQL Editor de Supabase

-- Paso 1: Habilitar RLS en todas las tablas (si lo deshabilitaste)
ALTER TABLE point_mora_neg1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_neg2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_neg3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_neg5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_pos1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_mora_pos4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_compromiso_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_reactivacion_cobro ENABLE ROW LEVEL SECURITY;

-- Paso 2: Crear políticas que permitan leer TODO
-- (Para dashboard interno sin restricciones por usuario)

CREATE POLICY "Allow public SELECT" 
ON point_mora_neg1 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public SELECT" 
ON point_mora_neg2 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public SELECT" 
ON point_mora_neg3 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public SELECT" 
ON point_mora_neg5 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public SELECT" 
ON point_mora_pos1 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public SELECT" 
ON point_mora_pos4 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public SELECT" 
ON point_compromiso_pago 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public SELECT" 
ON point_reactivacion_cobro 
FOR SELECT 
USING (true);

-- Verificar que las políticas fueron creadas
SELECT 
    tablename,
    policyname,
    cmd as operacion,
    qual as condicion
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
