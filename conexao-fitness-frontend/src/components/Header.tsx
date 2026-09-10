import FinexLogo from "@/components/FinexLogo";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsBell from "@/components/NotificationsBell";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  const isProvider = isAuthenticated && (user?.role === "PERSONAL" || user?.role === "ACADEMIA");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border/50 pt-[env(safe-area-inset-top,0px)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <FinexLogo size="md" />
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

            {user?.role === "ADMIN" ? (
              <Link
                to="/admin"
                className="text-secondary font-semibold hover:text-secondary/80 transition-colors font-medium flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20"
              >
                Painel Administrativo
              </Link>
            ) : isProvider ? (
              <>
                {user?.role === "ACADEMIA" && (
                  <Link
                    to="/gestao-academia"
                    className={`transition-colors font-bold text-sm flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 ${
                      location.pathname === "/gestao-academia"
                        ? "text-primary font-bold bg-primary/20"
                        : "text-primary hover:text-primary/80"
                    }`}
                  >
                    Gestão & Catraca
                  </Link>
                )}
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
                  to="/carteira"
                  className={`transition-colors font-medium text-sm ${
                    location.pathname === "/carteira"
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Carteira
                </Link>
                <Link
                  to="/agenda-profissional"
                  className={`transition-colors font-medium text-sm ${
                    location.pathname === "/agenda-profissional"
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Meus alunos
                </Link>
                <Link
                  to="/meus-servicos"
                  className={`transition-colors font-medium text-sm ${
                    location.pathname === "/meus-servicos"
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Meus serviços
                </Link>
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
              </>
            ) : (
              <>
                <Link
                  to="/buscar"
                  className={`transition-colors font-medium text-sm ${
                    location.pathname === "/buscar"
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buscar
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
                {isAuthenticated && (
                  <Link
                    to="/minhas-matriculas"
                    className={`transition-colors font-medium text-sm ${
                      location.pathname === "/minhas-matriculas"
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Minhas Matrículas
                  </Link>
                )}
                {isAuthenticated && (
                  <Link
                    to="/treinos"
                    className={`transition-colors font-medium text-sm ${
                      location.pathname === "/treinos"
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Treinos
                  </Link>
                )}
                {isAuthenticated && (
                  <Link
                    to="/meus-agendamentos"
                    className={`transition-colors font-medium text-sm ${
                      location.pathname === "/meus-agendamentos"
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Meus agendamentos
                  </Link>
                )}
                {isAuthenticated && (
                  <Link
                    to="/carteira"
                    className={`transition-colors font-medium text-sm ${
                      location.pathname === "/carteira"
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Carteira
                  </Link>
                )}
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
              </>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <NotificationsBell />
                <span className="text-sm text-muted-foreground">Olá, {user?.name?.split(" ")[0] ?? ""}</span>
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

          <div className="md:hidden flex items-center gap-1">
            {isAuthenticated && (
              <span className="text-sm text-muted-foreground mr-1 font-medium truncate max-w-[80px]">
                Olá, {user?.name?.split(" ")[0] ?? ""}
              </span>
            )}
            <ThemeToggle />
            {isAuthenticated && <NotificationsBell />}
            <button
            className="p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
                  location.pathname === "/" ? "text-primary" : "text-foreground"
                }`}
              >
                Início
              </Link>

              {user?.role === "ADMIN" ? (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-secondary font-semibold py-2 text-sm"
                >
                  Painel Administrativo
                </Link>
              ) : isProvider ? (
                <>
                  {user?.role === "ACADEMIA" && (
                    <Link
                      to="/gestao-academia"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-primary font-bold hover:text-primary/80 transition-colors py-2 text-sm flex items-center gap-1.5"
                    >
                      Gestão da Academia & Catraca QR
                    </Link>
                  )}
                  <Link
                    to="/planos"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                  >
                    Planos
                  </Link>
                  <Link
                    to="/carteira"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                  >
                    Carteira
                  </Link>
                  <Link
                    to="/agenda-profissional"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                  >
                    Meus alunos
                  </Link>
                  <Link
                    to="/meus-servicos"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                  >
                    Meus serviços
                  </Link>
                  <Link
                    to="/perfil"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                  >
                    Perfil
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/buscar"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                  >
                    Buscar
                  </Link>
                  <Link
                    to="/planos"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                  >
                    Planos
                  </Link>
                  {isAuthenticated && (
                    <Link
                      to="/minhas-matriculas"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-primary font-bold hover:text-primary/80 transition-colors py-2 text-sm"
                    >
                      Minhas Matrículas & Passes QR
                    </Link>
                  )}
                  {isAuthenticated && (
                    <Link
                      to="/treinos"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm font-medium"
                    >
                      🏋️ Meus Treinos
                    </Link>
                  )}
                  {isAuthenticated && (
                    <Link
                      to="/meus-agendamentos"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                    >
                      Meus agendamentos
                    </Link>
                  )}
                  {isAuthenticated && (
                    <Link
                      to="/carteira"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                    >
                      Carteira
                    </Link>
                  )}
                  {isAuthenticated && (
                    <Link
                      to="/perfil"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors py-2 text-sm"
                    >
                      Perfil
                    </Link>
                  )}
                </>
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
