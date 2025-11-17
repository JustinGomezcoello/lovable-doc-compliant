import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (username.trim() === "point" && password === "point") {
        // 1) Intentar iniciar sesión con Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: "point@point.com",
          password: "point",
        });

        // 2) Si falla, crear la cuenta automáticamente y pedir confirmar (o desactivar confirmación)
        if (error || !data.session) {
          const redirectUrl = `${window.location.origin}/dashboard`;
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: "point@point.com",
            password: "point",
            options: { emailRedirectTo: redirectUrl },
          });

          if (signUpError) {
            toast({
              variant: "destructive",
              title: "No se pudo crear/iniciar sesión",
              description: signUpError.message || "Revisa configuración de confirmación de correo en Supabase.",
            });
            return;
          }

          if (!signUpData.session) {
            toast({
              title: "Usuario creado",
              description: "Confirma el correo o desactiva 'Confirm email' en Supabase para iniciar sesión al instante.",
            });
            return;
          }
        }

        toast({ title: "¡Bienvenido!", description: "Inicio de sesión exitoso" });
        navigate("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Credenciales inválidas",
          description: "Usuario o contraseña incorrectos",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Cobranza POINT
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder al dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="point"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
