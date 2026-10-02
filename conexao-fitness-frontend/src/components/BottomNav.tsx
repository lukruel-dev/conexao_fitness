import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Search, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hide BottomNav on fullscreen / auth screens
  const hideOnPaths = ["/login", "/cadastro", "/totem-catraca"];
  if (hideOnPaths.includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex justify-around items-center h-[calc(4rem+max(16px,env(safe-area-inset-bottom)))] pb-[max(16px,env(safe-area-inset-bottom))] md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
      <Link
        to="/"
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
          location.pathname === "/" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium">Início</span>
      </Link>

      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
        className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer"
        aria-label="Voltar"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-[10px] font-medium">Voltar</span>
      </button>

      <Link
        to="/buscar"
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
          location.pathname === "/buscar" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-medium">Buscar</span>
      </Link>

      <Link
        to="/perfil"
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
          location.pathname === "/perfil" || location.pathname.startsWith("/admin")
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium">Perfil</span>
      </Link>
    </div>
  );
};

export default BottomNav;
