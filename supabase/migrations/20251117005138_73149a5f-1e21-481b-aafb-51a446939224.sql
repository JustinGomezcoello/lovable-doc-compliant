-- Add RLS policies for campaign tables to allow authorized users to view data

-- point_compromiso_pago
CREATE POLICY "Authorized users can view point_compromiso_pago data"
ON public.point_compromiso_pago
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role)
);

-- point_mora_1
CREATE POLICY "Authorized users can view point_mora_1 data"
ON public.point_mora_1
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role)
);

-- point_mora_3
CREATE POLICY "Authorized users can view point_mora_3 data"
ON public.point_mora_3
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role)
);

-- point_mora_5
CREATE POLICY "Authorized users can view point_mora_5 data"
ON public.point_mora_5
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role)
);

-- point_reactivacion_cobro
CREATE POLICY "Authorized users can view point_reactivacion_cobro data"
ON public.point_reactivacion_cobro
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role)
);