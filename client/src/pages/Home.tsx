import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Shield, LogOut, Lock } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Central Auth</h1>
          <p className="text-foreground/70 text-center mb-6">
            Painel administrativo centralizado para gerenciamento de usuários e autenticação
          </p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
            Fazer Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo, {user?.name || user?.email}</h1>
          <p className="text-foreground/70">Painel de controle centralizado</p>
        </div>

        {/* User Info Card */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Email</p>
              <p className="font-semibold">{user?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Tipo de Conta</p>
              <p className="font-semibold capitalize">{user?.role || "user"}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Último Acesso</p>
              <p className="font-semibold">
                {user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString("pt-BR") : "N/A"}
              </p>
            </div>
          </div>
        </Card>

        {/* Admin Panel Access */}
        {user?.role === "admin" && (
          <Card className="p-6 mb-6 border-primary/50 bg-primary/5">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Acesso Administrativo</h2>
                <p className="text-foreground/70 mb-4">
                  Você tem permissão para acessar o painel administrativo e gerenciar usuários, bans e avisos globais.
                </p>
                <Button onClick={() => navigate("/admin")} className="w-full md:w-auto">
                  <Shield className="w-4 h-4 mr-2" />
                  Ir para Painel Admin
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Informações da Sessão</h3>
            <p className="text-sm text-foreground/70 mb-4">
              Sua sessão está ativa e segura. Você pode acessar todos os recursos disponíveis para sua conta.
            </p>
            <div className="text-xs text-foreground/50 space-y-1">
              <p>ID: {user?.id}</p>
              <p>OpenID: {user?.openId}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Segurança</h3>
            <p className="text-sm text-foreground/70 mb-4">
              Sua conta está protegida com autenticação segura. Faça logout quando terminar sua sessão.
            </p>
            <Button
              onClick={logout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Fazer Logout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
