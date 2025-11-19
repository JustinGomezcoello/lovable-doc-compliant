-- 🔐 SOLUCIÓN CON AUTENTICACIÓN: Solo usuarios autenticados pueden ver datos
-- Ejecutar en SQL Editor de Supabase

-- Opción A: Solo usuarios autenticados
CREATE POLICY "Allow authenticated SELECT" 
ON point_mora_neg1 
FOR SELECT 
TO authenticated  -- Solo usuarios logueados
USING (true);

CREATE POLICY "Allow authenticated SELECT" 
ON point_mora_neg2 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated SELECT" 
ON point_mora_neg3 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated SELECT" 
ON point_mora_neg5 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated SELECT" 
ON point_mora_pos1 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated SELECT" 
ON point_mora_pos4 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated SELECT" 
ON point_compromiso_pago 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated SELECT" 
ON point_reactivacion_cobro 
FOR SELECT 
TO authenticated
USING (true);

-- Opción B: Solo ciertos roles (ejemplo: admin, analyst)
/*
CREATE POLICY "Allow specific roles" 
ON point_mora_neg1 
FOR SELECT 
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'analyst')
);
*/

-- Opción C: Filtrar por user_id si las tablas tuvieran esa columna
/*
CREATE POLICY "Allow user own data" 
ON point_mora_neg1 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id  -- Solo si la tabla tiene columna user_id
);
*/
