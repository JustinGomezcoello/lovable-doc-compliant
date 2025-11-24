# 🔧 FIX: Tabla POINT_Competencia Sin Datos (Problema RLS)

## 🐛 Problema

El dashboard muestra el error: **"La tabla POINT_Competencia está vacía"**

Pero en Supabase UI hay datos visibles (107 registros con DiasMora = -3).

## 🔍 Causa Raíz

**Row Level Security (RLS)** está bloqueando el acceso desde la aplicación.

- Supabase UI usa credenciales de administrador (service_role) → **puede ver todo**
- La aplicación usa credenciales de cliente (anon key) → **RLS aplica restricciones**
- Si no hay políticas RLS configuradas, el acceso se **NIEGA por defecto**

## ✅ Solución

Necesitas ejecutar el archivo SQL en Supabase para configurar las políticas RLS.

### 📋 Pasos para Aplicar la Solución:

#### 1. **Ir al SQL Editor de Supabase**
   - Abre tu proyecto en Supabase Dashboard
   - Ve a la sección **SQL Editor** (icono de terminal/código)

#### 2. **Ejecutar el Script SQL**
   - Abre el archivo `fix-point-competencia-rls.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **"Run"** o presiona `Ctrl + Enter`

#### 3. **Verificar los Resultados**
   El script mostrará:
   - ✅ Estado de RLS en la tabla
   - ✅ Políticas actuales (antes y después)
   - ✅ Conteo de registros totales
   - ✅ Muestra de datos
   - ✅ Agrupación por DiasMora

#### 4. **Recargar el Dashboard**
   - Vuelve al dashboard
   - Haz clic en el botón **"Actualizar"**
   - Ahora debería mostrar los datos correctamente

## 🎯 ¿Qué Hace el Script?

### Opción Implementada (Recomendada):
```sql
-- Habilita RLS pero permite lectura pública
ALTER TABLE public."POINT_Competencia" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON public."POINT_Competencia"
FOR SELECT
TO public
USING (true);
```

Esto significa:
- ✅ RLS está activo (seguridad habilitada)
- ✅ Cualquiera puede **leer** la tabla (SELECT)
- ❌ Nadie puede modificar sin permisos adicionales (INSERT/UPDATE/DELETE)

### Alternativas Disponibles:

**Si prefieres deshabilitar RLS completamente (menos seguro):**
```sql
ALTER TABLE public."POINT_Competencia" DISABLE ROW LEVEL SECURITY;
```

**Si quieres solo usuarios autenticados:**
```sql
CREATE POLICY "Enable read access for authenticated users"
ON public."POINT_Competencia"
FOR SELECT
TO authenticated
USING (true);
```

## 🧪 Debugging Mejorado

He agregado más logs al código para diagnosticar problemas RLS:

```typescript
// Ahora muestra:
- ✅ Errores de RLS con código y mensaje
- ✅ Intento de obtener muestra de datos
- ✅ Toast específico para errores de permisos
- ✅ Distinción entre "tabla vacía" vs "acceso bloqueado"
```

## 📊 Verificación Post-Fix

Después de aplicar el script, en la consola deberías ver:

```
🔵 ========================================
🔵 TABLA DE DECISIÓN - CAMPAÑAS DE MORA
🔵 ========================================
📊 Total de registros en POINT_Competencia: [número > 0]
✅ Muestra obtenida: [{...datos...}]

🔍 Consultando: MORA NEGATIVA 5 (DiasMora=-5)
   📌 Registros con DiasMora=-5: X
   🔹 Filtro: SaldoPorVencer != 0
   ✅ Registros elegibles (con filtros): X
...
```

## ⚠️ Notas Importantes

1. **RLS es BUENO para seguridad**: No lo deshabilites a menos que sea necesario
2. **Política pública es suficiente** para datos de solo lectura
3. **Verifica permisos** si hay datos sensibles en la tabla
4. **Aplica la misma solución** a otras tablas si tienen el mismo problema

## 🔄 Si el Problema Persiste

Si después de aplicar el script aún ves errores:

1. **Verifica el nombre de la tabla**:
   - ¿Es exactamente `POINT_Competencia` con esas mayúsculas?
   - PostgreSQL es sensible a mayúsculas con comillas

2. **Revisa la conexión de Supabase**:
   - ¿La anon key es correcta en `.env`?
   - ¿El proyecto URL es correcto?

3. **Checa la consola del navegador**:
   - Busca errores HTTP (403, 401)
   - Busca mensajes de RLS específicos

4. **Verifica en Supabase UI**:
   - Ve a **Authentication → Policies**
   - Busca la tabla `POINT_Competencia`
   - Confirma que la política está activa
