import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // CREDENCIALES FIJAS - ACTUALIZADAS 2025-11-24
    const USUARIO_VALIDO = "point";
    const PASSWORD_VALIDA = "point";

    console.log("🔐 === INICIO DE SESIÓN ===");
    console.log("Usuario ingresado:", username);
    console.log("Password ingresado:", password);
    console.log("Usuario correcto:", USUARIO_VALIDO);
    console.log("Password correcta:", PASSWORD_VALIDA);

    // Validación simple y directa
    if (username === USUARIO_VALIDO && password === PASSWORD_VALIDA) {
      console.log("✅ ¡CREDENCIALES CORRECTAS!");
      sessionStorage.setItem("authenticated", "true");
      sessionStorage.setItem("loginTime", new Date().toISOString());
      toast.success("¡Bienvenido a Cobranza POINT!");

      // Pequeño delay para que se vea el toast
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } else {
      console.log("❌ CREDENCIALES INCORRECTAS");
      toast.error("Usuario o contraseña incorrectos", {
        description: "Verifica tus credenciales e intenta nuevamente"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-2">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Cobranza POINT</CardTitle>
          <CardDescription>Dashboard de Métricas y Campañas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">            <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="point"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
                autoComplete="off"
              />
            </div>
          </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
