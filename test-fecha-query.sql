-- 🧪 TEST SQL PARA DIAGNÓSTICO
-- Ejecutar en SQL Editor de Supabase

-- 1. Verificar el tipo de dato de la columna fecha
SELECT 
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'point_mora_neg1' 
  AND column_name = 'fecha';

-- 2. Ver los datos tal como están almacenados
SELECT 
    id,
    fecha,
    fecha::text as fecha_como_texto,
    count_day,
    array_length(cedulas, 1) as num_cedulas
FROM point_mora_neg1 
ORDER BY fecha DESC
LIMIT 5;

-- 3. Probar diferentes formas de filtrar
-- 3a. Filtro directo con DATE
SELECT 
    'Filtro DATE directo' as metodo,
    COUNT(*) as registros_encontrados
FROM point_mora_neg1 
WHERE fecha = '2025-11-18'::date;

-- 3b. Filtro con TEXT
SELECT 
    'Filtro TEXT' as metodo,
    COUNT(*) as registros_encontrados
FROM point_mora_neg1 
WHERE fecha::text = '2025-11-18';

-- 3c. Filtro sin cast
SELECT 
    'Filtro sin cast' as metodo,
    COUNT(*) as registros_encontrados
FROM point_mora_neg1 
WHERE fecha = '2025-11-18';

-- 4. Ver registros específicos para 2025-11-18
SELECT 
    id,
    fecha,
    count_day,
    array_length(cedulas, 1) as num_cedulas,
    cedulas[1:3] as primeras_3_cedulas
FROM point_mora_neg1 
WHERE fecha = '2025-11-18';

-- 5. Ver todas las fechas únicas disponibles
SELECT 
    DISTINCT fecha,
    COUNT(*) as num_registros
FROM point_mora_neg1 
GROUP BY fecha
ORDER BY fecha DESC;
