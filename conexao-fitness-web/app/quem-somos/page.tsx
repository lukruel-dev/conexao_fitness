import Link from 'next/link';
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
  Lock,
  Globe2,
  Apple,
  Stethoscope,
  Activity,
  UserCheck
} from 'lucide-react';

export const metadata = {
  title: 'Quem Somos | Conexão Fitness',
  description: 'Conheça o Conexão Fitness: o hub multidisciplinar que integra academias, Profissionais, fisioterapeutas, nutricionistas e médicos do esporte em todo o Brasil.',
};

export default function QuemSomosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f1115] text-slate-100">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm font-semibold shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Hub Multidisciplinar de Saúde & Fitness</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Seu ecossistema completo de{' '}
            <span className="text-[#06b6d4]">saúde, movimento</span>{' '}
            <span className="text-emerald-400">& bem-estar</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            O <strong>Conexão Fitness</strong> conecta você às melhores academias, Profissionais, <strong>fisioterapeutas, nutricionistas e médicos do esporte</strong> do Brasil em uma só plataforma.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="bg-[#06b6d4] hover:bg-cyan-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <Dumbbell className="w-5 h-5" /> Explorar Profissionais & Serviços
            </Link>
            <Link
              href="/cadastro"
              className="border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              Cadastre-se Grátis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-12 border-y border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-extrabold text-cyan-400">+50</p>
            <p className="text-sm text-slate-400 mt-1">Academias & Studios</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-emerald-400">+200</p>
            <p className="text-sm text-slate-400 mt-1">Profissionais de Saúde Verificados</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-teal-400">+5.000</p>
            <p className="text-sm text-slate-400 mt-1">Consultas & Agendamentos</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-amber-400">4.9★</p>
            <p className="text-sm text-slate-400 mt-1">Satisfação Geral</p>
          </div>
        </div>
      </section>

      {/* Multidisciplinary Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Rede Integrada de Especialistas</h2>
          <p className="text-slate-400 text-sm">Treino, nutrição, reabilitação e cuidados preventivos sob medida.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <Dumbbell className="w-8 h-8 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Profissionais</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Treinos presenciais e consultorias esportivas com profissionais registrados no CREF.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <Apple className="w-8 h-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Nutricionistas</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Planos alimentares, nutrição esportiva e reeducação alimentar com registro no CRN.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <Stethoscope className="w-8 h-8 text-teal-400" />
            <h3 className="text-xl font-bold text-white">Fisioterapeutas</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Prevenção e reabilitação de lesões, osteopatia e fisioterapia desportiva (CREFITO).</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <Building2 className="w-8 h-8 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Academias & Studios</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Day Pass para musculação, pilates, crossfit e lutas por geolocalização.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <Activity className="w-8 h-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Médicos do Esporte</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Avaliações físicas completas, endocrinologia e medicina esportiva (CRM).</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <HeartPulse className="w-8 h-8 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Massoterapia & Recovery</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Liberação miofascial, ventosaterapia e recuperação muscular pós-treino.</p>
          </div>
        </div>
      </section>

      {/* Regional DNA Story */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-cyan-400 font-semibold text-sm uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Origem Regional & Visão Nacional</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug">
              Nascidos no Sul para transformar o mercado de saúde do Brasil.
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Iniciamos nossa jornada com o polo piloto em <strong>Uruguaiana - RS</strong>. Desenvolvemos uma plataforma em que o aluno pode agendar a consulta com o nutricionista, a sessão de fisioterapia e o treino com personal em uma única interface.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Geolocalização em tempo real</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Conselhos de classe auditados</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Curadoria & Verificação</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Profissionais cadastrados no Conexão Fitness passam por verificação rigorosa nos conselhos de classe (CREF, CRN, CREFITO e CRM), garantindo atendimento ético e altamente qualificado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 text-center px-4">
        <h2 className="text-3xl font-extrabold text-white mb-4">Faça parte do ecossistema Conexão Fitness</h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          Comece agora mesmo como aluno, paciente ou cadastre-se como profissional de saúde.
        </p>
        <Link
          href="/cadastro"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
        >
          Criar Minha Conta Grátis <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
