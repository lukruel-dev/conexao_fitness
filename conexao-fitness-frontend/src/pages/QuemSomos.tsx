import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  MapPin,
  ShieldCheck,
  Award,
  Users,
  Dumbbell,
  Building2,
  Sparkles,
  Target,
  Compass,
  HeartPulse,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Lock,
  Apple,
  Stethoscope,
  Activity,
  UserCheck,
  Smile,
  Check
} from "lucide-react";
import heroGymImage from "@/assets/hero-gym.jpg";

const QuemSomos = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 pt-24 md:pt-28">
        {/* HERO SECTION */}
        <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-40 right-10 w-[400px] h-[300px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/30 bg-primary/10 text-primary font-semibold mb-6 inline-flex items-center gap-2 text-sm shadow-sm">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span>Hub Multidisciplinar de Saúde & Fitness</span>
              </Badge>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                Seu ecossistema completo de{" "}
                <span className="bg-gradient-to-r from-primary via-cyan-500 to-secondary bg-clip-text text-transparent">
                  saúde, movimento e bem-estar
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-10">
                O <strong className="text-foreground font-semibold">Conexão Fitness</strong> vai além dos treinos. Somos a plataforma integrada que conecta você às melhores <strong className="text-foreground">academias, personal trainers, fisioterapeutas, nutricionistas</strong> e especialistas da saúde em um só lugar.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button variant="hero" size="lg" className="h-13 px-8 text-base shadow-lg shadow-primary/20" asChild>
                  <Link to="/buscar">
                    <Dumbbell className="w-5 h-5 mr-2" />
                    Encontrar Profissionais & Academias
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-13 px-8 text-base border-border/80 hover:bg-muted" asChild>
                  <Link to="/cadastro">
                    <span>Criar Conta Gratuita</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* NUMBERS & MULTIDISCIPLINARY IMPACT */}
        <section className="py-12 border-y border-border/60 bg-muted/30 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                  +50
                </p>
                <p className="text-sm font-medium text-muted-foreground">Academias & Studios</p>
              </div>

              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-secondary to-emerald-400 bg-clip-text text-transparent">
                  +200
                </p>
                <p className="text-sm font-medium text-muted-foreground">Profissionais de Saúde Verificados</p>
              </div>

              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  +5.000
                </p>
                <p className="text-sm font-medium text-muted-foreground">Consultas & Agendamentos</p>
              </div>

              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-amber-500">
                  4.9★
                </p>
                <p className="text-sm font-medium text-muted-foreground">Satisfação dos Pacientes & Alunos</p>
              </div>
            </div>
          </div>
        </section>

        {/* MULTIDISCIPLINARY PROFESSIONALS HUB SHOWCASE */}
        <section className="py-20 bg-background relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="outline" className="px-3 py-1 rounded-full border-primary/30 bg-primary/10 text-primary font-semibold mb-4">
                Rede Integrada de Saúde
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Todos os profissionais que seu corpo precisa em uma só plataforma
              </h2>
              <p className="text-muted-foreground">
                Acreditamos que os melhores resultados vêm da união entre treino adequado, alimentação inteligente, prevenção e recuperação física.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* PERSONAL TRAINERS */}
              <Card className="bg-card border border-border/80 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold text-foreground">Personal Trainers</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">CREF</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Treinamento presencial e consultorias online sob medida para hipertrofia, emagrecimento, condicionamento físico ou preparação desportiva.
                  </p>
                </CardContent>
              </Card>

              {/* NUTRICIONISTAS */}
              <Card className="bg-card border border-border/80 shadow-sm hover:shadow-xl hover:border-secondary/50 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
                    <Apple className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold text-foreground">Nutricionistas</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">CRN</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Planos alimentares personalizados, nutrição esportiva, reeducação alimentar e estratégias de suplementação validadas por especialistas.
                  </p>
                </CardContent>
              </Card>

              {/* FISIOTERAPEUTAS */}
              <Card className="bg-card border border-border/80 shadow-sm hover:shadow-xl hover:border-cyan-500/50 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold text-foreground">Fisioterapeutas</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">CREFITO</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Prevenção e reabilitação de lesões, fisioterapia desportiva, osteopatia e técnicas de liberação miofascial para máxima recuperação.
                  </p>
                </CardContent>
              </Card>

              {/* ACADEMIAS & STUDIOS */}
              <Card className="bg-card border border-border/80 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold text-foreground">Academias & Studios</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">Day Pass</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Passes diários avulsos, estúdios de pilates, crossfit, artes marciais e natação com acesso descomplicado por geolocalização.
                  </p>
                </CardContent>
              </Card>

              {/* MÉDICOS DO ESPORTE */}
              <Card className="bg-card border border-border/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold text-foreground">Médicos do Esporte</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">CRM</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Check-ups esportivos, endocrinologia, avaliação física integral e orientações médicas para prática segura de alto rendimento.
                  </p>
                </CardContent>
              </Card>

              {/* MASSOTERAPIA & RECOVERY */}
              <Card className="bg-card border border-border/80 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold text-foreground">Massoterapia & Recovery</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">Wellness</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Massagem desportiva, ventosaterapia, crioimersão e sessões de alívio de estresse muscular para acelerar a sua renovação física.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ORIGIN STORY & REGIONAL DNA */}
        <section className="py-20 bg-muted/20 relative border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border">
                <img
                  src={heroGymImage}
                  alt="Conexão Fitness Origem"
                  className="w-full h-[420px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-card/85 backdrop-blur-md border border-border shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/20 text-primary">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Berço em Uruguaiana - RS</h4>
                      <p className="text-xs text-muted-foreground">Projeto piloto nascido na fronteira oeste com impacto em todo o Brasil</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm tracking-wide uppercase">
                  <Compass className="w-4 h-4" />
                  <span>Nossa Trajetória</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Unindo o treino, a nutrição e a fisioterapia em um só lugar.
                </h2>

                <p className="text-muted-foreground leading-relaxed">
                  Percebemos que quem busca saúde de verdade precisa consultar o nutricionista, fazer fisioterapia preventiva e treinar com personal de forma sinérgica. No entanto, agendar cada serviço em plataformas diferentes gerava frustração e descontinuidade.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Criamos o <strong>Conexão Fitness</strong> como o hub completo que simplifica essa jornada. Nascido estrategicamente em <strong>Uruguaiana - RS</strong>, nosso ecossistema traz geolocalização e agendamento instantâneo para moradores locais e pessoas em trânsito por todo o país.
                </p>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/60 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">Nutrição & Treino Integrados</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/60 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">Conselhos de Classe Verificados</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/60 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">Agendamento por GPS e Cidade</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/60 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">Pagamento único e transparente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION, VISION & VALUES */}
        <section className="py-20 bg-background relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Nossa Direção & Valores
              </h2>
              <p className="text-muted-foreground">
                Os princípios que guiam nosso ecossistema de saúde e bem-estar multidisciplinar.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="bg-card/80 backdrop-blur-sm border border-border/80 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">Missão</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Conectar pessoas a um ecossistema multidisciplinar completo de saúde e movimento — aproximando alunos de personal trainers, nutricionistas, fisioterapeutas e academias.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border border-border/80 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center mb-2">
                    <Globe2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">Visão</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Ser a plataforma líder nacional na integração de cuidados com o corpo e a mente, unindo tecnologia de ponta à credibilidade de profissionais certificados.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border border-border/80 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-2">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">Valores</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Saúde preventiva integral, transparência comercial, rigor na auditoria documental (CREF, CRN, CREFITO, CRM) e paixão pela vida em movimento.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECURITY & PROFESSIONAL AUDIT */}
        <section className="py-16 bg-muted/40 border-t border-border">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="bg-gradient-to-r from-card via-card to-muted/80 p-8 sm:p-12 rounded-3xl border border-border shadow-xl relative overflow-hidden">
              <div className="grid md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Auditoria Documental & Conselhos Profissionais</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    Verificação rigorosa em todos os conselhos de classe.
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    A sua segurança e a qualidade do atendimento são inegociáveis. Garantimos a auditoria de registros no <strong>CREF</strong> (Educação Física), <strong>CRN</strong> (Nutrição), <strong>CREFITO</strong> (Fisioterapia) e <strong>CRM</strong> (Medicina), garantindo tranquilidade total em cada agendamento.
                  </p>
                </div>

                <div className="flex flex-col gap-3 justify-center items-center md:items-end">
                  <div className="p-4 rounded-2xl bg-background border border-border text-center shadow-sm w-full max-w-[230px]">
                    <UserCheck className="w-6 h-6 text-primary mx-auto mb-1" />
                    <span className="text-xs font-bold block text-foreground">Registros Auditados</span>
                    <span className="text-[11px] text-muted-foreground">CREF • CRN • CREFITO • CRM</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-border text-center shadow-sm w-full max-w-[230px]">
                    <Lock className="w-6 h-6 text-secondary mx-auto mb-1" />
                    <span className="text-xs font-bold block text-foreground">Pagamentos Seguros</span>
                    <span className="text-[11px] text-muted-foreground">Split seguro via Pix & Cartão</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="py-20 bg-background relative overflow-hidden">
          <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 text-foreground">
              Sua jornada de saúde integral começa aqui
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Conecte-se aos melhores profissionais da saúde e academias no Conexão Fitness.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button variant="hero" size="lg" className="h-14 px-8 text-base sm:text-lg shadow-xl" asChild>
                <Link to="/cadastro">Cadastrar como Aluno ou Profissional</Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 text-base sm:text-lg border-emerald-500/40 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2" asChild>
                <a href="https://wa.me/5551991562823?text=Ol%C3%A1!%20Gostaria%20de%20conversar%20com%20a%20equipe%20do%20Conex%C3%A3o%20Fitness" target="_blank" rel="noreferrer">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.952 3.71 1.453 5.711 1.454h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Falar no WhatsApp</span>
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default QuemSomos;
