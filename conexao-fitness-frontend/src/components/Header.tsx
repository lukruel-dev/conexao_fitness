import logo from "@/assets/logo.jpeg";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsBell from "@/components/NotificationsBell";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border/50 pt-[max(24px,env(safe-area-inset-top))]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Conexão Fitness" className="h-10 md:h-12 w-auto rounded-lg" />
            <span className="font-display font-bold text-lg md:text-xl">
              <span className="text-foreground">Conexão</span>{" "}
              <span className="text-secondary">Fitness</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/buscar" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Buscar
            </Link>
            <Link to="/quem-somos" className="text-foreground font-semibold hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Quem somos
            </Link>
            {isAuthenticated && (
              <Link to="/meus-agendamentos" className="text-muted-foreground hover:text-foreground transition-colors">
                Meus agendamentos
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/carteira" className="text-muted-foreground hover:text-foreground transition-colors">
                Carteira
              </Link>
            )}
            {isAuthenticated && (user?.role === "PERSONAL" || user?.role === "ACADEMIA") && (
              <>
                <Link to="/agenda-profissional" className="text-muted-foreground hover:text-foreground transition-colors">
                  Meus alunos
                </Link>
                <Link to="/meus-servicos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Meus serviços
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link to="/perfil" className="text-muted-foreground hover:text-foreground transition-colors">
                Perfil
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link to="/admin" className="text-secondary font-semibold hover:text-secondary/80 transition-colors">
                Admin
              </Link>
            )}
            <Link to="/#planos" className="text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </Link>

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
            <nav className="flex flex-col gap-4">
              <Link to="/buscar" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Buscar
              </Link>
              <Link to="/quem-somos" onClick={() => setIsMenuOpen(false)} className="text-primary font-semibold hover:text-primary/80 transition-colors py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Quem somos
              </Link>
              {isAuthenticated && (
                <Link to="/meus-agendamentos" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Meus agendamentos
                </Link>
              )}
              {isAuthenticated && (
                <Link to="/carteira" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Carteira
                </Link>
              )}
              {isAuthenticated && (user?.role === "PERSONAL" || user?.role === "ACADEMIA") && (
                <>
                  <Link to="/agenda-profissional" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                    Meus alunos
                  </Link>
                  <Link to="/meus-servicos" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                    Meus serviços
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <Link to="/perfil" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Perfil
                </Link>
              )}
              {user?.role === "ADMIN" && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-secondary font-semibold py-2">
                  Admin
                </Link>
              )}
              <Link to="/#planos" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Planos
              </Link>

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
