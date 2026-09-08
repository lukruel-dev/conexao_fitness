import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Award,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedSidebarProps {
  activeTag?: string;
  onSelectTag?: (tag: string) => void;
}

const TRENDING_TAGS = [
  { tag: "#Treino", count: "128 posts" },
  { tag: "#Hipertrofia", count: "94 posts" },
  { tag: "#Dieta", count: "81 posts" },
  { tag: "#Evolucao", count: "67 posts" },
  { tag: "#CrossFit", count: "53 posts" },
  { tag: "#DicaDoPersonal", count: "45 posts" },
];

export const FeedSidebar: React.FC<FeedSidebarProps> = ({
  activeTag,
  onSelectTag,
}) => {
  return (
    <aside className="space-y-6">
      {/* CARD 1: TÓPICOS EM ALTA */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <h3>Tópicos em Alta</h3>
        </div>

        <div className="space-y-2">
          {TRENDING_TAGS.map((item) => {
            const isSelected = activeTag?.toLowerCase() === item.tag.toLowerCase();
            return (
              <button
                key={item.tag}
                type="button"
                onClick={() => onSelectTag && onSelectTag(isSelected ? "" : item.tag)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="font-semibold">{item.tag}</span>
                <span className={`text-[11px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CARD 2: COMUNIDADE CONEXÃO FITNESS */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3>Comunidade Conexão</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Compartilhe suas evoluções, tire dúvidas com profissionais credenciados (Personais, Nutricionistas, Fisioterapeutas) e conecte-se com parceiros em Uruguaiana e todo o Brasil!
        </p>

        <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-foreground font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Profissionais 100% verificados
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground font-medium">
            <Users className="h-4 w-4 text-primary" /> +1.200 atletas ativos
          </div>
        </div>
      </div>

      {/* CARD 3: CTA PARA PROFISSIONAIS E ACADEMIAS */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <Award className="h-4 w-4 text-amber-500" />
          <h3>É Profissional ou Academia?</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Divulgue seus serviços, gerencie sua agenda e conquiste novos alunos e clientes na plataforma.
        </p>
        <Button
          size="sm"
          className="w-full text-xs font-bold gap-1.5 shadow-sm"
          asChild
        >
          <Link to="/cadastro">
            Criar Perfil Profissional <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </aside>
  );
};
