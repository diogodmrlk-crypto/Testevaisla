import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Trash2, Send, Users, Ban, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'info' | 'warning' | 'error'>('info');

  const { data: activeUsers, refetch: refetchUsers, isLoading: loadingUsers } = trpc.admin.getActiveUsers.useQuery();
  const { data: bannedIPs, refetch: refetchBans, isLoading: loadingBans } = trpc.admin.getBannedIPs.useQuery();

  const kickMutation = trpc.admin.kickUserByIP.useMutation({
    onSuccess: () => {
      toast.success('Usuário kickado e IP banido');
      refetchUsers();
      refetchBans();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const removeBanMutation = trpc.admin.removeBan.useMutation({
    onSuccess: () => {
      toast.success('Ban removido');
      refetchBans();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const sendNotificationMutation = trpc.admin.sendNotification.useMutation({
    onSuccess: () => {
      toast.success('Aviso enviado');
      setNotificationMessage('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchUsers();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchUsers]);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-bold">Acesso Negado</h1>
          </div>
          <p className="text-foreground/70">Você não tem permissão para acessar o painel administrativo.</p>
        </Card>
      </div>
    );
  }

  const handleKickUser = (ip: string) => {
    if (confirm(`Tem certeza que deseja kickar todos os usuários com IP ${ip}?`)) {
      kickMutation.mutate({ ip, reason: 'Kickado pelo DEV' });
    }
  };

  const handleRemoveBan = (ip: string) => {
    if (confirm(`Tem certeza que deseja remover o ban do IP ${ip}?`)) {
      removeBanMutation.mutate({ ip });
    }
  };

  const handleSendNotification = () => {
    if (!notificationMessage.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }
    sendNotificationMutation.mutate({
      message: notificationMessage,
      type: notificationType,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo DEV</h1>
          <p className="text-foreground/70">Gerenciamento de usuários, bans e avisos globais</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuários Ativos</span>
              <span className="sm:hidden">Ativos</span>
            </TabsTrigger>
            <TabsTrigger value="bans" className="flex items-center gap-2">
              <Ban className="w-4 h-4" />
              <span className="hidden sm:inline">Banidos</span>
              <span className="sm:hidden">Bans</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Avisos</span>
              <span className="sm:hidden">Avisos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Usuários Conectados
                </h2>
                <span className="text-sm text-foreground/70">
                  {loadingUsers ? 'Carregando...' : `${activeUsers?.length || 0} usuário(s)`}
                </span>
              </div>

              {loadingUsers ? (
                <div className="text-center py-8 text-foreground/50">Carregando usuários...</div>
              ) : activeUsers && activeUsers.length > 0 ? (
                <div className="space-y-3">
                  {activeUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Key: {user.key}</p>
                        <p className="text-xs text-foreground/60">IP: {user.ip}</p>
                        <p className="text-xs text-foreground/60">HWID: {user.hwid}</p>
                        <p className="text-xs text-foreground/60">Level: {user.keyLevel}</p>
                        <p className="text-xs text-foreground/50">
                          Conectado há: {new Date(user.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleKickUser(user.ip)}
                        disabled={kickMutation.isPending}
                      >
                        Kick
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-foreground/50">Nenhum usuário conectado</div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="bans" className="space-y-4">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  IPs Banidos
                </h2>
                <span className="text-sm text-foreground/70">
                  {loadingBans ? 'Carregando...' : `${bannedIPs?.length || 0} IP(s) banido(s)`}
                </span>
              </div>

              {loadingBans ? (
                <div className="text-center py-8 text-foreground/50">Carregando bans...</div>
              ) : bannedIPs && bannedIPs.length > 0 ? (
                <div className="space-y-3">
                  {bannedIPs.map((ban) => (
                    <div key={ban.ip} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">IP: {ban.ip}</p>
                        <p className="text-xs text-foreground/60">Motivo: {ban.reason || 'Sem motivo'}</p>
                        <p className="text-xs text-foreground/50">
                          Banido em: {new Date(ban.bannedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveBan(ban.ip)}
                        disabled={removeBanMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-foreground/50">Nenhum IP banido</div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5" />
                Enviar Aviso Global
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Aviso</label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="info">ℹ️ Informação</option>
                    <option value="warning">⚠️ Aviso</option>
                    <option value="error">❌ Erro</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Mensagem</label>
                  <Textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Digite a mensagem do aviso..."
                    className="min-h-24"
                  />
                </div>

                <Button
                  onClick={handleSendNotification}
                  disabled={sendNotificationMutation.isPending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Aviso
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
