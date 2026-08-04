import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Buscar from "./pages/Buscar";
import ServicoDetalhe from "./pages/ServicoDetalhe";
import MeusAgendamentos from "./pages/MeusAgendamentos";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import MinhaAgenda from "./pages/MinhaAgenda";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBookings from "./pages/admin/AdminBookings";
import MeusServicos from "./pages/MeusServicos";
import AdminCatalog from "./pages/admin/AdminCatalog";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import Carteira from "./pages/Carteira";
import AgendaProfissional from "./pages/AgendaProfissional";
import QuemSomos from "./pages/QuemSomos";
import BottomNav from "@/components/BottomNav";

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/index.html" element={<Index />} />
              <Route path="/quem-somos" element={<QuemSomos />} />
              <Route path="/buscar" element={<Buscar />} />
              <Route path="/servico/:id" element={<ServicoDetalhe />} />
              <Route path="/meus-agendamentos" element={<MeusAgendamentos />} />
              <Route path="/meus-servicos" element={<MeusServicos />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/minha-agenda" element={<MinhaAgenda />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/usuarios" element={<AdminUsers />} />
              <Route path="/admin/agendamentos" element={<AdminBookings />} />
              <Route path="/admin/catalogo" element={<AdminCatalog />} />
              <Route path="/admin/assinaturas" element={<AdminSubscriptions />} />
              <Route path="/carteira" element={<Carteira />} />
              <Route path="/agenda-profissional" element={<AgendaProfissional />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
