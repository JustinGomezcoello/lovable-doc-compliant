-- Asignar rol admin al usuario point@point.com si existe
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar el ID del usuario point@point.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'point@point.com'
  LIMIT 1;

  -- Si el usuario existe y no tiene rol, asignarle rol admin
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Crear función para asignar rol automáticamente a nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Asignar rol 'admin' al primer usuario, 'viewer' a los demás
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para asignar roles automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();