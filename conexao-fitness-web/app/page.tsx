import Link from 'next/link';
import { Search, MapPin, Calendar, CreditCard, Star, MessageCircle, Check, ShieldCheck, Activity, Users, Map, Video } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f1115]">
      {/* Hero Section (Print A01) */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-start justify-center min-h-[85vh]">
        {/* Fundo ilustrativo / gradiente */}
        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-brand-green/10 to-transparent pointer-events-none opacity-50" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm text-sm text-slate-300">
            <MapPin className="w-4 h-4 text-brand-blue" />
            <span>Disponível em Uruguaiana-RS e região</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Encontre seu <span className="text-[#06b6d4]">treino</span> <span className="text-brand-green">ideal</span> onde você estiver
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            O marketplace que conecta você às melhores academias e personal trainers. Busque por localização, compare preços e agende direto pelo app.
          </p>

          <div className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 p-2 bg-[#1a1d24] border border-slate-700/50 rounded-2xl md:rounded-full max-w-2xl shadow-xl">
              <div className="flex-1 flex items-center px-4 py-2 gap-3 text-slate-400">
                <MapPin className="w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Digite sua cidade ou CEP" 
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 focus:ring-0"
                />
              </div>
              <Link href="/search" className="bg-[#06b6d4] hover:bg-cyan-500 text-white px-8 py-3.5 rounded-xl md:rounded-full font-bold transition-all flex items-center justify-center gap-2">
                <Search className="w-5 h-5" /> Buscar
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 pt-10 border-t border-slate-800/60 mt-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#06b6d4] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                50+
              </div>
              <span className="text-slate-400 font-medium">Academias parceiras</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-green flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                100+
              </div>
              <span className="text-slate-400 font-medium">Personal trainers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-yellow-400">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <span className="text-slate-400 font-medium">4.9 avaliação média</span>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section (Print A02) */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-[#06b6d4] font-bold tracking-widest text-sm uppercase">COMO FUNCIONA</h3>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">Simples e <span className="text-brand-green">rápido</span></h2>
            <p className="text-slate-400 text-lg">Em poucos passos, você encontra o treino perfeito para suas necessidades.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              { num: '1', title: 'Busque por localização', desc: 'Use seu GPS ou digite o CEP para encontrar academias e personal trainers próximos.', icon: MapPin, color: 'bg-[#06b6d4]' },
              { num: '2', title: 'Escolha e agende', desc: 'Compare preços, avaliações e disponibilidade. Reserve o horário que melhor funciona.', icon: Calendar, color: 'bg-brand-green' },
              { num: '3', title: 'Pague com segurança', desc: 'Pix ou cartão de crédito. Transação segura com recibo automático.', icon: CreditCard, color: 'bg-[#06b6d4]' },
              { num: '4', title: 'Treine e avalie', desc: 'Após o treino, deixe sua avaliação e ajude outros a encontrar os melhores profissionais.', icon: Star, color: 'bg-brand-green' }
            ].map((step, idx) => (
              <div key={idx} className="bg-[#12151c] border border-slate-800 rounded-2xl p-6 relative flex flex-col hover:border-slate-600 transition-colors">
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold border border-slate-700">
                  {step.num}
                </div>
                <div className={`${step.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para Alunos Section (Print A03) */}
      <section id="para-alunos" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0f1115] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-brand-green font-bold tracking-widest text-sm uppercase">PARA ALUNOS</h3>
              <h2 className="text-4xl sm:text-5xl font-bold text-white">Seu treino, <span className="text-brand-green">sua escolha</span></h2>
              <p className="text-slate-400 text-lg max-w-lg">
                Viajando a trabalho ou lazer? Quer experimentar uma nova academia? Encontre as melhores opções perto de você com poucos cliques.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-6">
              {[
                { title: 'Busca Inteligente', desc: 'Filtros por modalidade, preço, avaliação, distância e disponibilidade.', icon: Search },
                { title: 'Geolocalização', desc: 'Encontre opções próximas onde você estiver, ideal para viagens.', icon: Map },
                { title: 'Agendamento Fácil', desc: 'Veja horários disponíveis e reserve em segundos.', icon: Calendar },
                { title: 'Avaliações Reais', desc: 'Leia opiniões de outros alunos antes de escolher.', icon: Star },
                { title: 'Chat Direto', desc: 'Converse com academias e personals antes de reservar.', icon: MessageCircle },
                { title: 'Pagamento Seguro', desc: 'Pix e cartão com proteção total dos seus dados.', icon: ShieldCheck }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
                    <feature.icon className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1 text-sm">{feature.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/search" className="bg-brand-green hover:bg-green-600 text-white px-8 py-3.5 rounded-lg font-bold transition-all mt-4 inline-block">
              Buscar Academias e Personals
            </Link>
          </div>

          <div className="relative">
            {/* Mockup visual similar ao print A03 */}
            <div className="bg-[#1a1d24] rounded-2xl border border-slate-700/50 p-6 shadow-2xl relative z-10">
              <div className="flex items-center gap-3 bg-[#232730] rounded-xl p-4 mb-6 border border-slate-700">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span className="text-white font-medium">Uruguaiana, RS</span>
              </div>

              <div className="space-y-4">
                <div className="bg-[#232730] rounded-xl p-5 border border-[#06b6d4]/30 hover:border-[#06b6d4] transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-bold text-lg">Academia Power Fit</h4>
                      <p className="text-slate-400 text-sm">Academia</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Star className="w-4 h-4 fill-current" /> 4.9
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-brand-green font-bold">Day Pass R$ 25</span>
                    <span className="text-slate-500 text-xs">0.5km</span>
                  </div>
                </div>

                <div className="bg-[#232730] rounded-xl p-5 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-bold text-lg">Personal João Silva</h4>
                      <p className="text-slate-400 text-sm">Personal Trainer</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Star className="w-4 h-4 fill-current" /> 5.0
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-brand-green font-bold">Sessão R$ 80</span>
                    <span className="text-slate-500 text-xs">1.2km</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-brand-green/10 rounded-full blur-[80px] -z-10" />
              <div className="absolute -top-8 -left-8 w-64 h-64 bg-[#06b6d4]/10 rounded-full blur-[80px] -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Para Profissionais Section (Print A04) */}
      <section id="para-profissionais" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-[#06b6d4] font-bold tracking-widest text-sm uppercase">PARA PROFISSIONAIS</h3>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">Cresça com a <span className="text-brand-green">Conexão Fitness</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Seja personal trainer ou dono de academia, conecte-se com novos alunos e expanda seus negócios.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card Personal */}
            <div className="bg-[#12151c] rounded-2xl border border-slate-800 p-8 flex flex-col hover:border-[#06b6d4]/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-[#06b6d4] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-xl bg-[#06b6d4] flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Personal Trainers</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Crie seu perfil verificado, defina seus serviços e preços, e seja encontrado por alunos na sua região.
              </p>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Perfil verificado com CREF',
                  'Agenda integrada',
                  'Receba direto na conta',
                  'Métricas e insights'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-[#06b6d4]/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#06b6d4]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="w-full bg-[#06b6d4] hover:bg-cyan-500 text-white font-bold py-3.5 rounded-lg transition-colors">
                Cadastrar como Personal
              </button>
            </div>

            {/* Card Academia */}
            <div className="bg-[#12151c] rounded-2xl border border-slate-800 p-8 flex flex-col hover:border-brand-green/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-brand-green opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-xl bg-brand-green flex items-center justify-center mb-6">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Academias</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Cadastre sua academia, ofereça day passes e planos flexíveis, e alcance novos públicos na sua região.
              </p>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Atraia novos alunos',
                  'Aumente seu faturamento',
                  'Day pass e planos flexíveis',
                  'Dashboard completo'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-brand-green/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-brand-green" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="w-full bg-brand-green hover:bg-green-600 text-white font-bold py-3.5 rounded-lg transition-colors">
                Cadastrar Academia
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Planos Section (Print A05 / A06) */}
      <section id="planos" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0f1115]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-[#06b6d4] font-bold tracking-widest text-sm uppercase">PLANOS E PREÇOS</h3>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">Escolha seu <span className="text-brand-green">plano</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Planos flexíveis para profissionais e academias de todos os tamanhos.
            </p>
          </div>

          <div className="space-y-24">
            {/* Planos Personal */}
            <div>
              <h3 className="text-2xl font-bold text-white text-center mb-10">Para Personal Trainers</h3>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="bg-[#12151c] rounded-2xl border border-slate-800 p-8 flex flex-col">
                  <h4 className="text-xl font-bold text-white text-center">Basic</h4>
                  <p className="text-slate-500 text-center text-sm mb-6">Para começar</p>
                  <div className="text-center mb-8">
                    <span className="text-4xl font-extrabold text-white">Grátis</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {['Perfil verificado', 'Até 10 leads/mês', 'Chat com alunos', 'Avaliações públicas'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-[#06b6d4]" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-transparent border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors">
                    Começar Grátis
                  </button>
                </div>

                <div className="bg-[#12151c] rounded-2xl border-2 border-[#06b6d4] p-8 flex flex-col relative shadow-[0_0_30px_rgba(6,182,212,0.15)] transform md:-translate-y-4">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#06b6d4] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    Mais Popular
                  </div>
                  <h4 className="text-xl font-bold text-white text-center mt-2">Pro</h4>
                  <p className="text-slate-500 text-center text-sm mb-6">Mais visibilidade</p>
                  <div className="text-center mb-8">
                    <span className="text-4xl font-extrabold text-white">R$ 79</span>
                    <span className="text-slate-500">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {['Tudo do Basic', 'Leads ilimitados', 'Destaque nas buscas', 'Analytics avançado', 'Cupons promocionais'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-[#06b6d4]" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-[#06b6d4] hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-cyan-500/20">
                    Assinar Pro
                  </button>
                </div>

                <div className="bg-[#12151c] rounded-2xl border border-slate-800 p-8 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-[#06b6d4]" />
                  <h4 className="text-xl font-bold text-white text-center">Elite</h4>
                  <p className="text-slate-500 text-center text-sm mb-6">Máxima performance</p>
                  <div className="text-center mb-8">
                    <span className="text-4xl font-extrabold text-white">R$ 149</span>
                    <span className="text-slate-500">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {['Tudo do Pro', 'Prioridade no ranking', 'Comissão reduzida', 'Página personalizada', 'Suporte prioritário'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-[#06b6d4]" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-transparent border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors">
                    Assinar Elite
                  </button>
                </div>
              </div>
            </div>

            {/* Planos Academia */}
            <div>
              <h3 className="text-2xl font-bold text-white text-center mb-10">Para Academias</h3>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Bronze */}
                <div className="bg-[#12151c] rounded-2xl border border-slate-800 p-8 flex flex-col">
                  <h4 className="text-xl font-bold text-white text-center">Bronze</h4>
                  <p className="text-slate-500 text-center text-sm mb-6">1 unidade</p>
                  <div className="text-center mb-8">
                    <span className="text-4xl font-extrabold text-white">R$ 149</span>
                    <span className="text-slate-500">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {['Perfil verificado', 'Day pass digital', 'Até 50 reservas/mês', 'Dashboard básico'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-brand-green" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-transparent border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors">
                    Começar Bronze
                  </button>
                </div>

                {/* Prata */}
                <div className="bg-[#12151c] rounded-2xl border-2 border-brand-green p-8 flex flex-col relative shadow-[0_0_30px_rgba(34,197,94,0.15)] transform md:-translate-y-4">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-green text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    Recomendado
                  </div>
                  <h4 className="text-xl font-bold text-white text-center mt-2">Prata</h4>
                  <p className="text-slate-500 text-center text-sm mb-6">Até 3 unidades</p>
                  <div className="text-center mb-8">
                    <span className="text-4xl font-extrabold text-white">R$ 299</span>
                    <span className="text-slate-500">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {['Tudo do Bronze', 'Reservas ilimitadas', 'Destaque regional', 'Analytics completo', 'Equipe de profissionais'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-brand-green" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-brand-green hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-brand-green/20">
                    Assinar Prata
                  </button>
                </div>

                {/* Ouro */}
                <div className="bg-[#12151c] rounded-2xl border border-slate-800 p-8 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-[#06b6d4]" />
                  <h4 className="text-xl font-bold text-white text-center">Ouro</h4>
                  <p className="text-slate-500 text-center text-sm mb-6">Unidades ilimitadas</p>
                  <div className="text-center mb-8">
                    <span className="text-4xl font-extrabold text-white">R$ 499</span>
                    <span className="text-slate-500">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {['Tudo do Prata', 'Prioridade máxima', 'Campanhas segmentadas', 'API de integração', 'Gerente de conta'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-brand-green" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-transparent border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors">
                    Assinar Ouro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA e Footer (Print A07) */}
      <section className="pt-24 bg-[#12151c] relative overflow-hidden border-t border-slate-800">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-green/5 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 pb-24 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
            Pronto para <span className="text-brand-green">transformar</span> sua rotina de treinos?
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Junte-se a milhares de pessoas que já encontram academias e personal trainers de forma rápida e prática com a Conexão Fitness.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/cadastro" className="bg-[#06b6d4] hover:bg-cyan-500 text-white px-8 py-3.5 rounded-lg font-bold transition-all shadow-lg shadow-cyan-500/20">
              Começar Agora &rarr;
            </Link>
            <button className="bg-transparent hover:bg-slate-800 border border-[#06b6d4] text-white px-8 py-3.5 rounded-lg font-bold transition-all">
              Falar com Especialista
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-slate-500">
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Cadastro gratuito</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Sem compromisso</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Cancele quando quiser</span>
          </div>
        </div>

        {/* Footer Area */}
        <footer className="border-t border-slate-800 bg-[#12151c] py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 relative">
                   <img src="/logo_01_tr.png" alt="Logo" className="object-contain" />
                </div>
                <span className="font-bold text-lg text-white">Conexão <span className="text-brand-green">Fitness</span></span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm">
                Conectando você às melhores academias e personal trainers do Brasil.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Navegação</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><Link href="/#como-funciona" className="hover:text-white transition-colors">Como Funciona</Link></li>
                <li><Link href="/#para-alunos" className="hover:text-white transition-colors">Para Alunos</Link></li>
                <li><Link href="/#para-profissionais" className="hover:text-white transition-colors">Para Profissionais</Link></li>
                <li><Link href="/planos" className="hover:text-white transition-colors">Planos</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}