import FinexLogo from "@/components/FinexLogo";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const { theme } = useTheme();
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4 shrink-0">
              <FinexLogo size="lg" />
            </Link>
            <p className="text-muted-foreground text-sm mb-6">
              Sua plataforma inteligente para treinar, conectar e evoluir.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Navegação</h4>
            <ul className="space-y-3">
              <li><Link to="/quem-somos" className="text-primary font-medium hover:underline transition-colors text-sm">Quem Somos</Link></li>
              <li><a href="/#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Como Funciona</a></li>
              <li><a href="/#para-alunos" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Para Alunos</a></li>
              <li><a href="/#para-profissionais" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Para Profissionais</a></li>
              <li><a href="/#planos" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Planos</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Termos de Uso</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Política de Privacidade</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">LGPD</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Política de Cancelamento</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary" />
                contato@conexaofitness.com.br
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary" />
                (55) 99999-9999
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                Uruguaiana, RS - Brasil
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2025 Conexão Fitness. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground text-sm">
            Feito com 💚 em Uruguaiana, RS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
