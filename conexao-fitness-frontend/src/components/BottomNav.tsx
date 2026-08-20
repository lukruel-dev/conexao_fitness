import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, User, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hide BottomNav on some screens if necessary (e.g. login/cadastro itself)
  const hideOnPaths = ["/login", "/cadastro"];
  if (hideOnPaths.includes(location.pathname)) return null;

  const isHome = location.pathname === "/";

  const handleBack = () => {
    if (isHome) {
      return; // Já está na página inicial, evita sair do app
    }

    // Se houver histórico anterior registrado pelo React Router na mesma sessão
    if (window.history.state && typeof window.history.state.idx === "number" && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // Caso tenha entrado direto por URL ou chegado ao início do histórico da sessão
      navigate("/");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border flex justify-around items-center h-[calc(4rem+max(16px,env(safe-area-inset-bottom)))] pb-[max(16px,env(safe-area-inset-bottom))] md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
      <button 
        onClick={handleBack} 
        disabled={isHome}
        aria-label="Voltar"
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-opacity ${
          isHome ? "opacity-30 cursor-not-allowed text-muted-foreground" : "text-muted-foreground hover:text-foreground active:scale-95"
        }`}
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="text-[10px] font-medium">Voltar</span>
      </button>

      <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === "/" ? "text-primary" : "text-muted-foreground"}`}>
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">Início</span>
      </Link>
      
      <Link to="/buscar" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === "/buscar" ? "text-primary" : "text-muted-foreground"}`}>
        <Search className="w-6 h-6" />
        <span className="text-[10px] font-medium">Buscar</span>
      </Link>
      
      <Link to="/perfil" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === "/perfil" ? "text-primary" : "text-muted-foreground"}`}>
        <User className="w-6 h-6" />
        <span className="text-[10px] font-medium">Perfil</span>
      </Link>
    </div>
  );
};

export default BottomNav;
