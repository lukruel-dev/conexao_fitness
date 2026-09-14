import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Dumbbell,
  User,
  ShieldCheck,
  ChevronDown,
  LogOut,
  QrCode,
  Calendar,
  Wallet,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const AdminImpersonationBanner: React.FC = () => {
  const { isImpersonating, impersonatedRole, startImpersonation, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!isImpersonating || !impersonatedRole) return null;

  const handleReturnToAdmin = () => {
    stopImpersonation();
    navigate('/admin');
  };

  const roleMeta = {
    ACADEMIA: {
      label: 'Academia Demo',
      sublabel: 'Gestão, Catraca e Planos',
      icon: Building2,
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      links: [
        { label: 'Catraca Digital', to: '/gestao-academia', icon: QrCode },
        { label: 'Planos & Alunos', to: '/gestao-academia', icon: Calendar },
        { label: 'Carteira Academia', to: '/carteira', icon: Wallet },
      ],
    },
    PERSONAL: {
      label: 'Profissional Demo',
      sublabel: 'Agenda, Serviços e Alunos',
      icon: Dumbbell,
      color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      links: [
        { label: 'Agenda & Alunos', to: '/agenda-profissional', icon: Calendar },
        { label: 'Meus Serviços', to: '/meus-servicos', icon: Sparkles },
        { label: 'Carteira Profissional', to: '/carteira', icon: Wallet },
      ],
    },
    STUDENT: {
      label: 'Aluno Demo',
      sublabel: 'Passe QR Code e Carteira',
      icon: User,
      color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      links: [
        { label: 'Passe QR Catraca', to: '/minhas-matriculas', icon: QrCode },
        { label: 'Carteira Finex', to: '/carteira', icon: Wallet },
        { label: 'Meus Treinos', to: '/treinos', icon: Dumbbell },
      ],
    },
  }[impersonatedRole];

  const CurrentIcon = roleMeta.icon;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-md border-b border-primary/30 shadow-lg px-3 sm:px-4 py-2 text-xs transition-all animate-fade-in">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Identificação do Modo de Teste */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-primary/10 border-primary/30 font-bold text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>MODO DE TESTE</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden sm:inline">Visualizando como:</span>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-bold ${roleMeta.color}`}>
              <CurrentIcon className="w-3.5 h-3.5" />
              <span>{roleMeta.label}</span>
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos da Persona Atual */}
        <div className="hidden lg:flex items-center gap-1.5">
          {roleMeta.links.map((link) => {
            const LinkIcon = link.icon;
            return (
              <Link
                key={link.label}
                to={link.to}
                className="px-2.5 py-1 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors flex items-center gap-1 text-[11px]"
              >
                <LinkIcon className="w-3 h-3 text-primary/70" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Controles: Trocar Perfil de Teste & Voltar ao Admin */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-semibold gap-1 px-2.5 border-border/80">
                <span>Alternar Perfil</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl">
              <DropdownMenuItem
                onClick={() => {
                  startImpersonation('ACADEMIA');
                  navigate('/gestao-academia');
                }}
                className="rounded-xl cursor-pointer text-xs py-2 gap-2"
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="font-bold block">Academia Demo</span>
                  <span className="text-[10px] text-muted-foreground block">Catraca, planos e balcão</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  startImpersonation('PERSONAL');
                  navigate('/agenda-profissional');
                }}
                className="rounded-xl cursor-pointer text-xs py-2 gap-2"
              >
                <Dumbbell className="w-4 h-4 text-purple-500" />
                <div>
                  <span className="font-bold block">Profissional Demo</span>
                  <span className="text-[10px] text-muted-foreground block">Agenda, serviços e alunos</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  startImpersonation('STUDENT');
                  navigate('/minhas-matriculas');
                }}
                className="rounded-xl cursor-pointer text-xs py-2 gap-2"
              >
                <User className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="font-bold block">Aluno Demo</span>
                  <span className="text-[10px] text-muted-foreground block">QR Code e carteira Finex</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            onClick={handleReturnToAdmin}
            className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm px-3"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voltar ao Painel Admin</span>
            <span className="sm:hidden">Sair</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
