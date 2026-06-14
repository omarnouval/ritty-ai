'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'ticket_sent' | 'ticket_ready' | 'ticket_building';
  ticketId: number;
  message: string;
  timestamp: number;
  read: boolean;
}

interface Props {
  address: string | undefined;
}

export function NotificationBanner({ address }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [lastChecked, setLastChecked] = useState<Record<number, string>>({});

  // Poll for ticket updates
  useEffect(() => {
    if (!address) return;

    const checkTickets = async () => {
      try {
        const res = await fetch(`/api/tickets?address=${address}`);
        const data = await res.json();
        const tickets = data.tickets || [];

        const newNotifs: Notification[] = [];

        for (const ticket of tickets) {
          const notifId = `${ticket.id}-${ticket.status}`;
          const lastStatus = lastChecked[ticket.id];

          // Status changed since last check
          if (lastStatus && lastStatus !== ticket.status && !dismissed.has(notifId)) {
            if (ticket.status === 'completed') {
              newNotifs.push({
                id: notifId,
                type: 'ticket_ready',
                ticketId: ticket.id,
                message: `Your agent request #${ticket.id} is ready! Check Agent Rent.`,
                timestamp: Date.now(),
                read: false,
              });
            } else if (ticket.status === 'in_progress') {
              newNotifs.push({
                id: notifId,
                type: 'ticket_building',
                ticketId: ticket.id,
                message: `Agent request #${ticket.id} is being built!`,
                timestamp: Date.now(),
                read: false,
              });
            }
          }

          // Track current status
          newNotifs.forEach(n => {
            if (n.ticketId === ticket.id) {
              // Don't add duplicate
            }
          });

          setLastChecked(prev => ({ ...prev, [ticket.id]: ticket.status }));
        }

        if (newNotifs.length > 0) {
          setNotifications(prev => [...newNotifs, ...prev]);
        }
      } catch {
        // skip
      }
    };

    // Initial check
    checkTickets();
    // Poll every 10 seconds
    const interval = setInterval(checkTickets, 10000);
    return () => clearInterval(interval);
  }, [address]);

  const visibleNotifs = notifications.filter(n => !dismissed.has(n.id));

  if (visibleNotifs.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifs.slice(0, 3).map((notif) => (
        <div
          key={notif.id}
          className="flex items-start gap-3 p-4 rounded-xl shadow-lg animate-slide-in"
          style={{
            background: notif.type === 'ticket_ready' ? 'rgba(64,255,175,0.15)' : notif.type === 'ticket_building' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
            border: `1px solid ${notif.type === 'ticket_ready' ? 'rgba(64,255,175,0.3)' : notif.type === 'ticket_building' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <span className="text-lg shrink-0">
            {notif.type === 'ticket_ready' ? '✅' : notif.type === 'ticket_building' ? '🔨' : '🎫'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{notif.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(notif.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => dismiss(notif.id)}
            className="text-gray-500 hover:text-white transition shrink-0"
          >
            ×
          </button>
        </div>
      ))}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
