import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  getUnreadCount,
  listNotifications,
  markNotificationRead,
  markAllAsRead,
  type Notification,
} from "@/services/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const NotificationsBell = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const listQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: listNotifications,
    enabled: isAuthenticated && open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });

  if (!isAuthenticated) return null;

  const unread = unreadQuery.data?.unread ?? 0;
  const notifications: Notification[] = listQuery.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ""}`}
          className="relative"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="font-semibold">Notificações</p>
          {unread > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs text-primary hover:underline"
            >
              Marcar lidas
            </button>
          )}
        </div>
        <ScrollArea className="h-72">
          {listQuery.isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
          ) : notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Você ainda não tem notificações.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !n.isRead ? "bg-muted/30" : ""
                  }`}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id);
                    setOpen(false);
                    const suffix = n.type === "CHAT" && n.referenceId ? `?chat=${n.referenceId}` : "";
                    if (user?.role === "STUDENT") {
                      navigate(`/meus-agendamentos${suffix}`);
                    } else {
                      navigate(`/agenda-profissional${suffix}`);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      {n.title && (
                        <p className="text-sm font-medium truncate">{n.title}</p>
                      )}
                      <p className="text-sm text-foreground/90 break-words">
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
