-- Enable RLS policy for n8n_chat_histories to allow authorized users to read conversation history
CREATE POLICY "Authorized users can view n8n_chat_histories"
ON n8n_chat_histories
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role)
);