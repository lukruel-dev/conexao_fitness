import { Link, useLocation } from "react-router-dom";
import { Home, Search, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Hide BottomNav on some screens if necessary (e.g. login/cadastro itself)
  const hideOnPaths = ["/login", "/cadastro"];
  if (hideOnPaths.includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border flex justify-around items-center h-[calc(4rem+max(16px,env(safe-area-inset-bottom)))] pb-[max(16px,env(safe-area-inset-bottom))] md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
      <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === "/" ? "text-primary" : "text-muted-foreground"}`}>
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">Início</span>
      </Link>
      
      <Link to="/buscar" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === "/buscar" ? "text-primary" : "text-muted-foreground"}`}>
        <Search className="w-6 h-6" />
        <span className="text-[10px] font-medium">Buscar</span>
      </Link>
      
      <Link to={user ? "/perfil" : "/login"} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${["/perfil", "/login"].includes(location.pathname) ? "text-primary" : "text-muted-foreground"}`}>
        <User className="w-6 h-6" />
        <span className="text-[10px] font-medium">{user ? "Perfil" : "Entrar"}</span>
      </Link>
    </div>
  );
};

export default BottomNav;
