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
  Utensils,
} from 'lucide-react';

export interface AdminImpersonationBannerProps {
  isInsideHeader?: boolean;
}

export const AdminImpersonationBanner: React.FC<AdminImpersonationBannerProps> = ({ isInsideHeader = false }) => {
  const { isImpersonating, impersonatedRole, startImpersonation, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isImpersonating) {
      document.documentElement.classList.add('has-impersonation');
    } else {
      document.documentElement.classList.remove('has-impersonation');
    }
    return () => {
      document.documentElement.classList.remove('has-impersonation');
    };
  }, [isImpersonating]);

  if (!isImpersonating || !impersonatedRole) return null;

  const handleReturnToAdmin = () => {
    stopImpersonation();
    navigate('/admin');
  };

  const roleMeta = {
    ACADEMIA: {
      label: 'Academia Prime Demo',
      sublabel: 'Gestão, Catraca e Planos',
      icon: Building2,
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      links: [
        { label: 'Catraca Digital', to: '/gestao-academia', icon: QrCode },
        { label: 'Alunos & Planos', to: '/gestao-academia', icon: Calendar },
        { label: 'Carteira Academia', to: '/carteira', icon: Wallet },
      ],
    },
    PERSONAL: {
      label: 'Lucas Silva (Personal CREF)',
      sublabel: 'Prescrição de Treinos & Agenda',
      icon: Dumbbell,
      color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      links: [
        { label: 'Agenda & Alunos', to: '/agenda-profissional', icon: Calendar },
        { label: 'Fichas de Treino', to: '/treinos', icon: Dumbbell },
        { label: 'Meus Serviços', to: '/meus-servicos', icon: Sparkles },
        { label: 'Carteira Profissional', to: '/carteira', icon: Wallet },
      ],
    },
    NUTRICIONISTA: {
      label: 'Dra. Camila (Nutri CRN)',
      sublabel: 'Dietas, Macros e Consultas',
      icon: Utensils,
      color: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
      links: [
        { label: 'Agenda & Consultas', to: '/agenda-profissional', icon: Calendar },
        { label: 'Planos Alimentares', to: '/treinos', icon: Utensils },
        { label: 'Meus Serviços', to: '/meus-servicos', icon: Sparkles },
        { label: 'Carteira Nutri', to: '/carteira', icon: Wallet },
      ],
    },
    STUDENT: {
      label: 'Gabriel Souza (Aluno Demo)',
      sublabel: 'Passe QR, Treinos e Dieta',
      icon: User,
      color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      links: [
        { label: 'Passe QR Catraca', to: '/minhas-matriculas', icon: QrCode },
        { label: 'Treinos & Smartwatch', to: '/treinos', icon: Dumbbell },
        { label: 'Plano Alimentar', to: '/treinos', icon: Utensils },
        { label: 'Carteira Finex', to: '/carteira', icon: Wallet },
      ],
    },
  }[impersonatedRole];

  const CurrentIcon = roleMeta.icon;

  const containerClasses = isInsideHeader
    ? "w-full bg-card/95 backdrop-blur-md border-b border-primary/30 shadow-sm px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs transition-all animate-fade-in"
    : "fixed top-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-md border-b border-primary/30 shadow-lg px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs transition-all animate-fade-in";

  return (
    <div className={containerClasses}>
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Identificação do Modo de Teste */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-primary/10 border-primary/30 font-bold text-primary text-[10px] sm:text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>MODO DE TESTE</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground hidden sm:inline text-xs">Visualizando como:</span>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl border font-bold text-[11px] sm:text-xs ${roleMeta.color}`}>
              <CurrentIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 sm:h-8 rounded-xl text-[11px] sm:text-xs font-semibold gap-1 px-2 sm:px-2.5 border-border/80">
                <span>Alternar Perfil</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-2xl shadow-xl">
              <DropdownMenuItem
                onClick={() => {
                  startImpersonation('ACADEMIA');
                  navigate('/gestao-academia');
                }}
                className="rounded-xl cursor-pointer text-xs py-2 gap-2"
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="font-bold block">Academia Prime Demo</span>
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
                  <span className="font-bold block">Personal Trainer (Lucas - CREF)</span>
                  <span className="text-[10px] text-muted-foreground block">Prescrição de treinos e agenda</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  startImpersonation('NUTRICIONISTA');
                  navigate('/agenda-profissional');
                }}
                className="rounded-xl cursor-pointer text-xs py-2 gap-2"
              >
                <Utensils className="w-4 h-4 text-teal-500" />
                <div>
                  <span className="font-bold block">Nutricionista (Dra. Camila - CRN)</span>
                  <span className="text-[10px] text-muted-foreground block">Prescrição de dietas e consultas</span>
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
                  <span className="font-bold block">Aluno (Gabriel Souza)</span>
                  <span className="text-[10px] text-muted-foreground block">Passe QR, treinos, dieta e carteira</span>
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
