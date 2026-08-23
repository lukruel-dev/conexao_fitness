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
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/5551991562823?text=Ol%C3%A1!%20Vim%20pelo%20app%20Conex%C3%A3o%20Fitness"
                target="_blank"
                rel="noreferrer"
                title="Falar no WhatsApp"
                className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.952 3.71 1.453 5.711 1.454h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z"/>
                </svg>
              </a>
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
            <h4 className="font-display font-bold text-foreground mb-4">Contato & Suporte</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://wa.me/5551991562823?text=Ol%C3%A1!%20Vim%20pelo%20app%20Conex%C3%A3o%20Fitness" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-white font-semibold text-sm transition-all group shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.952 3.71 1.453 5.711 1.454h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider block opacity-90 font-medium">Chamar no WhatsApp</span>
                    <span className="text-sm font-bold block">(51) 99156-2823</span>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contato@conexaofitness.com.br" 
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>contato@conexaofitness.com.br</span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>Uruguaiana, RS - Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-muted-foreground text-sm">
            © 2025 Conexão Fitness. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
