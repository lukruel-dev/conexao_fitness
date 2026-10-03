import FinexLogo from "@/components/FinexLogo";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Building2, Dumbbell, User, Eye, ChevronDown, ShieldCheck, Utensils, Flame } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsBell from "@/components/NotificationsBell";
import ThemeToggle from "@/components/ThemeToggle";
import UserPinBadge from "@/components/UserPinBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminImpersonationBanner } from "@/components/AdminImpersonationBanner";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, startImpersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeight = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) {
        document.documentElement.style.setProperty('--app-header-height', `${Math.round(rect.height)}px`);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(el);
    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [user, isMenuOpen, location.pathname]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border/50 pt-[env(safe-area-inset-top,0px)]">
      <AdminImpersonationBanner isInsideHeader />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-18 md:h-22">
          <Link to="/" className="flex items-center gap-2 shrink-0 py-1 focus:outline-none">
            <FinexLogo size="sm" className="sm:hidden" />
            <FinexLogo size="md" className="hidden sm:inline-flex" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              to="/"
              className={`transition-colors font-medium text-sm ${
                location.pathname === "/"
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Início
            </Link>

            <Link
              to="/quem-somos"
              className={`transition-colors font-medium text-sm ${
                location.pathname === "/quem-somos"
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Quem somos
            </Link>

            <Link
              to="/planos"
              className={`transition-colors font-medium text-sm ${
                location.pathname === "/planos"
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Planos
            </Link>

            <Link
              to="/social"
              className={`transition-colors font-medium text-sm flex items-center gap-1.5 ${
                location.pathname.startsWith("/social") || location.pathname === "/comunidade"
                  ? "text-amber-500 font-bold"
                  : "text-muted-foreground hover:text-amber-500"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Social FINEX</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/perfil"
                className={`transition-colors font-medium text-sm ${
                  location.pathname === "/perfil"
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Perfil
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/admin"
                  className="text-secondary font-semibold hover:text-secondary/80 transition-colors font-medium flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Painel Admin
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 cursor-pointer">
                      <Eye className="w-3 h-3" />
                      <span>Simular</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-2xl shadow-xl">
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
              </div>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <NotificationsBell />
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>Olá, {user?.name?.split(" ")[0] ?? ""}</span>
                  <UserPinBadge />
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button variant="hero" size="default" asChild>
                  <Link to="/cadastro">Cadastre-se</Link>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1 sm:gap-2">
            {isAuthenticated && (
              <div className="flex items-center gap-1 pl-2.5 sm:pl-3 border-l border-border/50 ml-2 sm:ml-4">
                <span className="text-xs sm:text-sm font-semibold text-foreground max-w-[85px] sm:max-w-[120px] truncate">
                  {user?.name?.split(" ")[0] ?? ""}
                </span>
                <UserPinBadge size="xs" />
              </div>
            )}
            <ThemeToggle />
            {isAuthenticated && <NotificationsBell />}
            <button
              className="p-1.5 sm:p-2 text-foreground hover:bg-muted/60 rounded-xl transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-3">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 text-sm font-semibold transition-colors ${
                  location.pathname === "/" ? "text-primary font-bold" : "text-foreground"
                }`}
              >
                Início
              </Link>

              <Link
                to="/quem-somos"
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 text-sm font-semibold transition-colors ${
                  location.pathname === "/quem-somos" ? "text-primary font-bold" : "text-foreground"
                }`}
              >
                Quem somos
              </Link>

              <Link
                to="/planos"
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 text-sm font-semibold transition-colors ${
                  location.pathname === "/planos" ? "text-primary font-bold" : "text-foreground"
                }`}
              >
                Planos
              </Link>

              <Link
                to="/social"
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname.startsWith("/social") || location.pathname === "/comunidade"
                    ? "text-amber-500 font-bold"
                    : "text-foreground hover:text-amber-500"
                }`}
              >
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Social FINEX</span>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/perfil"
                  onClick={() => setIsMenuOpen(false)}
                  className={`py-2 text-sm font-semibold transition-colors ${
                    location.pathname === "/perfil" ? "text-primary font-bold" : "text-foreground"
                  }`}
                >
                  Perfil
                </Link>
              )}

              {user?.role === "ADMIN" && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-secondary font-semibold py-2 text-sm flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Painel Administrativo
                </Link>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                {isAuthenticated ? (
                  <Button variant="ghost" className="w-full justify-center" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" /> Sair
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full justify-center" asChild>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>Entrar</Link>
                    </Button>
                    <Button variant="hero" className="w-full justify-center" asChild>
                      <Link to="/cadastro" onClick={() => setIsMenuOpen(false)}>Cadastre-se</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
