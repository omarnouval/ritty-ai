'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'rental_expired' | 'rental_success' | 'feedback_sent' | 'ticket_sent' | 'ticket_ready' | 'ticket_building';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const id = `${notif.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newNotif: Notification = {
      ...notif,
      id,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20)); // Keep max 20
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  const clearAll = useCallback(() => {
    setDismissed(new Set(notifications.map(n => n.id)));
  }, [notifications]);

  const visibleNotifs = notifications.filter(n => !dismissed.has(n.id));

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, dismiss, clearAll }}>
      {children}
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {visibleNotifs.slice(0, 3).map((notif) => (
          <div
            key={notif.id}
            className="flex items-start gap-3 p-4 rounded-xl shadow-lg"
            style={{
              background: notif.type === 'ticket_ready' || notif.type === 'rental_success'
                ? 'rgba(64,255,175,0.15)'
                : notif.type === 'ticket_building'
                  ? 'rgba(59,130,246,0.15)'
                  : notif.type === 'rental_expired'
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(245,158,11,0.15)',
              border: `1px solid ${
                notif.type === 'ticket_ready' || notif.type === 'rental_success'
                  ? 'rgba(64,255,175,0.3)'
                  : notif.type === 'ticket_building'
                    ? 'rgba(59,130,246,0.3)'
                    : notif.type === 'rental_expired'
                      ? 'rgba(239,68,68,0.3)'
                      : 'rgba(245,158,11,0.3)'
              }`,
              backdropFilter: 'blur(12px)',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            <span className="text-lg shrink-0">
              {notif.type === 'ticket_ready' ? '✅' :
               notif.type === 'ticket_building' ? '🔨' :
               notif.type === 'rental_success' ? '🎉' :
               notif.type === 'rental_expired' ? '⏰' :
               notif.type === 'feedback_sent' ? '🙏' : '🎫'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{notif.title}</p>
              <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
            </div>
            <button
              onClick={() => dismiss(notif.id)}
              className="text-gray-500 hover:text-white transition shrink-0 text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}
