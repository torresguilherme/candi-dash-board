import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import logoBlue from "@/assets/logo-blue.png";
import { getUserFriendlyError } from "@/lib/error-utils";
import { useAuth } from "@/contexts/AuthContext";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, canAccess, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (!authLoading && user && canAccess) {
      navigate("/admin", { replace: true });
    }
  }, [authLoading, user, canAccess, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          toast({
            title: "Erro ao fazer login",
            description: getUserFriendlyError(signInError, "Não foi possível fazer login. Verifique suas credenciais."),
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema",
        });
        // Redirecionamento é tratado pelo AuthContext (evita tela branca / race conditions)
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) {
        toast({
          title: "Erro ao criar conta",
          description: getUserFriendlyError(signUpError, "Não foi possível criar a conta. Tente novamente."),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login",
      });
      setIsLogin(true);
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logoBlue} alt="Person Corp" className="h-20 w-auto" />
            </div>
            <div className="text-center">
              <CardDescription>Carregando...</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (user && !canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <div className="flex justify-center">
              <img src={logoBlue} alt="Person Corp" className="h-20 w-auto" />
            </div>
            <CardTitle className="text-center">Acesso restrito</CardTitle>
            <CardDescription className="text-center">
              Você está logado, mas não tem permissão para acessar o painel administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={signOut}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={logoBlue} alt="Person Corp" className="h-20 w-auto" />
          </div>
          <div className="text-center">
            <CardDescription>
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
