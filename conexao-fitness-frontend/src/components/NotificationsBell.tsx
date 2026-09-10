import { Bell, Volume2, VolumeX, Sparkles, CheckCheck, QrCode, Award, Dumbbell, MessageCircle, Calendar } from "lucide-react";
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
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { sounds } from "@/lib/soundEffects";

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

function getNotificationIcon(type?: string) {
  switch (type) {
    case "ACCESS_GRANTED":
    case "DAY_PASS":
      return <QrCode className="w-4 h-4 text-emerald-500" />;
    case "ACHIEVEMENT":
    case "GAMIFICATION":
      return <Award className="w-4 h-4 text-amber-500" />;
    case "WORKOUT":
    case "ROUTINE":
      return <Dumbbell className="w-4 h-4 text-primary" />;
    case "CHAT":
      return <MessageCircle className="w-4 h-4 text-secondary" />;
    default:
      return <Calendar className="w-4 h-4 text-primary" />;
  }
}

const NotificationsBell = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.getSoundEnabled());
  const prevUnreadRef = useRef<number>(0);

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 15_000,
  });

  const unread = unreadQuery.data?.unread ?? 0;

  useEffect(() => {
    if (unread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
      sounds.playNotification();
    }
    prevUnreadRef.current = unread;
  }, [unread]);

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

  const handleToggleSound = () => {
    const nextState = sounds.toggleSound();
    setSoundEnabled(nextState);
  };

  if (!isAuthenticated) return null;

  const notifications: Notification[] = listQuery.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ""}`}
          className="relative rounded-xl hover:bg-muted/80"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-bounce shadow-md">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 bg-card border-border/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header com toggle de som e marcar lidas */}
        <div className="px-4 py-3.5 border-b border-border/70 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground font-display">Notificações</span>
            {unread > 0 && (
              <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                {unread} novas
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSound}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={soundEnabled ? "Sons ativados (Clique para silenciar)" : "Sons silenciados (Clique para ativar)"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {unread > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Lista de Notificações */}
        <ScrollArea className="h-80">
          {listQuery.isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Carregando…</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold text-foreground">Tudo em dia!</p>
              <p className="text-[11px] text-muted-foreground">
                Você não possui nenhuma notificação pendente.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-3.5 cursor-pointer hover:bg-muted/40 transition-colors flex items-start gap-3 ${
                    !n.isRead ? "bg-primary/5" : ""
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
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border/50">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      {n.title && (
                        <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                      )}
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-foreground/85 leading-relaxed break-words">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(n.createdAt)}
                    </p>
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
