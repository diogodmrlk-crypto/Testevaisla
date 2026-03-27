import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  sentBy: string;
  timestamp: number;
  type: 'warning' | 'info' | 'error';
}

export default function GlobalNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: fetchedNotifications } = trpc.admin.getNotifications.useQuery(undefined, {
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (fetchedNotifications) {
      setNotifications(fetchedNotifications);
    }
  }, [fetchedNotifications]);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const visibleNotifications = notifications.filter((n) => !dismissed.has(n.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {visibleNotifications.map((notification) => {
        const bgColor =
          notification.type === 'error'
            ? 'bg-red-500/10 border-red-500/30'
            : notification.type === 'warning'
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-blue-500/10 border-blue-500/30';

        const textColor =
          notification.type === 'error'
            ? 'text-red-700 dark:text-red-400'
            : notification.type === 'warning'
              ? 'text-yellow-700 dark:text-yellow-400'
              : 'text-blue-700 dark:text-blue-400';

        const Icon =
          notification.type === 'error'
            ? AlertCircle
            : notification.type === 'warning'
              ? AlertTriangle
              : Info;

        return (
          <div
            key={notification.id}
            className={`border rounded-lg p-4 ${bgColor} flex items-start gap-3 animate-in fade-in slide-in-from-top-2`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${textColor}`} />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${textColor}`}>
                Aviso de {notification.sentBy}
              </p>
              <p className={`text-sm mt-1 ${textColor} opacity-90`}>
                {notification.message}
              </p>
              <p className={`text-xs mt-2 ${textColor} opacity-60`}>
                {new Date(notification.timestamp).toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(notification.id)}
              className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
