import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, User, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
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
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: 'url("/login-bg.png")' }}
    >
      <Card className="w-full max-w-[550px] shadow-2xl bg-[#F8F9FA] border-none rounded-2xl relative z-10">
        <CardHeader className="space-y-1 text-center pt-10 pb-6">
          <CardTitle className="text-[28px] font-bold text-[#1A1F2C]">Iniciar Sesión</CardTitle>
          <CardDescription className="text-[#64748B] text-base">Ingresa a tu cuenta de SIMPLIA</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#1A1F2C] font-semibold text-sm">Usuario</Label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" strokeWidth={1.5} />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 h-12 bg-white border-gray-200 focus:border-[#6366F1] focus:ring-0 rounded-lg text-base"
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#1A1F2C] font-semibold text-sm">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" strokeWidth={1.5} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 bg-white border-gray-200 focus:border-[#6366F1] focus:ring-0 rounded-lg text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold text-white bg-gradient-to-r from-[#5B42F3] to-[#D91A5C] hover:opacity-90 transition-opacity rounded-lg mt-2"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
