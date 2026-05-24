import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = unreadData?.count || 0;

  function handleNotificationClick(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[18px] min-h-[18px]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    !n.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                      {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
