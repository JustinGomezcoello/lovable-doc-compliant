import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mapeo de usuario "point" a email real para compatibilidad
      const emailToUse = username.toLowerCase() === "point"
        ? "point@point.com"
        : username;

      // Mapeo de contraseña "point" a "point123" para cumplir longitud mínima de Supabase (6 chars)
      const passwordToUse = password === "point"
        ? "point123"
        : password;

      console.log("🔐 === INTENTO DE INICIO DE SESIÓN ===");
      console.log("Usuario/Email:", emailToUse);

      // 1. Intentar iniciar sesión con credenciales mapeadas
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: passwordToUse,
      });

      if (error) {
        console.error("❌ Error de autenticación:", error.message);

        // 2. Si falla y es el usuario "point", intentar registrarlo automáticamente con la contraseña mapeada
        if (error.message.includes("Invalid login credentials") && username.toLowerCase() === "point") {
          console.log("⚠️ Usuario no encontrado o contraseña incorrecta. Intentando registro automático para 'point'...");

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: emailToUse,
            password: passwordToUse,
          });

          if (signUpError) {
            console.error("❌ Error al registrar:", signUpError.message);
            toast.error("No se pudo iniciar sesión ni registrar", {
              description: signUpError.message
            });
            return;
          }

          if (signUpData.session) {
            console.log("✅ ¡USUARIO REGISTRADO Y SESIÓN INICIADA!");
            toast.success("¡Cuenta creada y sesión iniciada!");
            navigate("/dashboard");
            return;
          } else if (signUpData.user) {
            toast.info("Cuenta creada. Verifica tu correo.", {
              description: "Se ha enviado un enlace de confirmación a " + emailToUse
            });
            return;
          }
        }

        toast.error("Error de inicio de sesión", {
          description: error.message === "Invalid login credentials"
            ? "Credenciales incorrectas."
            : error.message
        });
        return;
      }

      if (data.session) {
        console.log("✅ ¡SESIÓN INICIADA CORRECTAMENTE!");
        toast.success("¡Bienvenido a Cobranza POINT!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("❌ Error inesperado:", err);
      toast.error("Ocurrió un error inesperado", {
        description: "Por favor intenta nuevamente más tarde."
      });
    } finally {
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
                  autoComplete="username"
                  placeholder="point"
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
                  autoComplete="current-password"
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
