'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Zap, Star, Crown, Heart } from 'lucide-react';

export default function PlanosPage() {
  const [activeTab, setActiveTab] = useState<'usuario' | 'personal' | 'academia'>('usuario');

  const planosUsuario = [
    {
      name: 'Gratuito',
      description: 'Acesso básico ao ecossistema.',
      price: '0.00',
      icon: Heart,
      iconColor: 'bg-slate-500',
      features: [
        'Busca de profissionais',
        'Reserva de aulas avulsas',
        'Visualização de conteúdos públicos'
      ],
      buttonStyle: 'bg-slate-700 hover:bg-slate-600 text-white'
    },
    {
      name: 'Start',
      description: 'Ideal para começar sua rotina.',
      price: '99.90',
      icon: Zap,
      iconColor: 'bg-purple-400',
      features: [
        '~6 treinos (R$15)',
        '~3 treinos (R$30)'
      ],
      buttonStyle: 'bg-slate-700 hover:bg-slate-600 text-white'
    },
    {
      name: 'Plus',
      description: 'Para quem quer mais opções.',
      price: '179.90',
      icon: Star,
      iconColor: 'bg-purple-500',
      isPopular: true,
      features: [
        '~10 treinos (R$15)',
        '~5 treinos (R$30)'
      ],
      buttonStyle: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    {
      name: 'Premium',
      description: 'Acesso ilimitado e premium.',
      price: '299.90',
      icon: Crown,
      iconColor: 'bg-purple-600',
      features: [
        '~18 treinos (R$15)',
        '~9 treinos (R$30)'
      ],
      buttonStyle: 'bg-transparent border border-slate-700 hover:bg-slate-800 text-white'
    }
  ];

  const planosProfissional = [
    {
      name: 'Gratuito',
      description: 'Para quem está começando.',
      price: '0.00',
      icon: Heart,
      iconColor: 'bg-slate-500',
      features: [
        'Comissão de 20% a 22%',
        'Perfil listado'
      ],
      buttonStyle: 'bg-slate-700 hover:bg-slate-600 text-white'
    },
    {
      name: 'Start',
      description: 'Fluidez, constância, equilíbrio.',
      price: '49.90',
      icon: Zap,
      iconColor: 'bg-orange-500',
      features: [
        'Comissão de 15% a 18%',
        'Perfil verificado',
        'Até 10 leads/mês'
      ],
      buttonStyle: 'bg-slate-700 hover:bg-slate-600 text-white'
    },
    {
      name: 'Pro',
      description: 'Consistência, estilo próprio.',
      price: '149.90',
      icon: Star,
      iconColor: 'bg-[#14b8a6]',
      isPopular: true,
      features: [
        'Comissão de 10% a 12%',
        'Leads ilimitados',
        'Destaque nas buscas'
      ],
      buttonStyle: 'bg-[#14b8a6] hover:bg-teal-600 text-white'
    },
    {
      name: 'Elite',
      description: 'Experiência completa.',
      price: '299.90',
      icon: Crown,
      iconColor: 'bg-yellow-500',
      features: [
        'Comissão de 5% a 7%',
        'Prioridade máxima',
        'Página personalizada'
      ],
      buttonStyle: 'bg-transparent border border-slate-700 hover:bg-slate-800 text-white'
    }
  ];

  const planosAcademia = [
    {
      name: 'Gratuito',
      description: 'Para conhecer a plataforma.',
      price: '0.00',
      icon: Heart,
      iconColor: 'bg-slate-500',
      features: [
        'Acesso básico',
        'Perfil listado'
      ],
      buttonStyle: 'bg-slate-700 hover:bg-slate-600 text-white'
    },
    {
      name: 'Essencial',
      description: 'Para academias em crescimento.',
      price: '99.90',
      icon: Zap,
      iconColor: 'bg-orange-500',
      features: [
        'Perfil verificado',
        'Day pass digital'
      ],
      buttonStyle: 'bg-slate-700 hover:bg-slate-600 text-white'
    },
    {
      name: 'Destaque',
      description: 'Para atrair mais alunos.',
      price: '249.90',
      icon: Star,
      iconColor: 'bg-brand-green',
      isPopular: true,
      features: [
        'Tudo do Essencial',
        'Reservas ilimitadas',
        'Destaque regional'
      ],
      buttonStyle: 'bg-brand-green hover:bg-green-600 text-white'
    },
    {
      name: 'Elite',
      description: 'Para grandes redes.',
      price: '449.90',
      icon: Crown,
      iconColor: 'bg-yellow-500',
      features: [
        'Tudo do Destaque',
        'Prioridade máxima',
        'API de integração'
      ],
      buttonStyle: 'bg-transparent border border-slate-700 hover:bg-slate-800 text-white'
    }
  ];

  const getPlanos = () => {
    switch (activeTab) {
      case 'usuario': return planosUsuario;
      case 'personal': return planosProfissional;
      case 'academia': return planosAcademia;
      default: return planosUsuario;
    }
  };

  const planos = getPlanos();

  return (
    <div className="min-h-screen bg-[#191d29] flex flex-col">
      {/* Top Navbar Minimalista */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161a25]">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <Link href="/" className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
          <div className="w-8 h-8 relative">
            <img src="/finex_icon_hd.svg" alt="Finex Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,166,255,0.35)] group-hover:drop-shadow-[0_0_16px_rgba(0,166,255,0.65)] transition-all duration-300" />
          </div>
          <div className="h-6 w-20 relative">
            <img src="/finex_text_hd.svg" alt="Finex Fitness" className="w-full h-full object-contain group-hover:brightness-110 transition-all duration-300" />
          </div>
        </Link>
      </div>

      <div className="flex-1 max-w-[90rem] mx-auto px-4 py-16 w-full flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Planos Flexíveis</h1>
        <p className="text-slate-400 text-lg mb-10 text-center max-w-2xl">
          Escolha o plano ideal para você no nosso ecossistema
        </p>

        {/* Tabs */}
        <div className="flex p-1 bg-[#1e2330] rounded-xl border border-slate-800 mb-16 inline-flex shadow-inner">
          <button 
            onClick={() => setActiveTab('usuario')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'usuario' ? 'bg-[#14b8a6] text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Usuário
          </button>
          <button 
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'personal' ? 'bg-[#14b8a6] text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Profissional
          </button>
          <button 
            onClick={() => setActiveTab('academia')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'academia' ? 'bg-[#14b8a6] text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Academia
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {planos.map((plano, idx) => (
            <div 
              key={idx} 
              className={`bg-[#1e2330] rounded-2xl p-8 flex flex-col relative transition-all ${
                plano.isPopular ? 'border-2 border-[#14b8a6] shadow-[0_0_30px_rgba(20,184,166,0.15)] transform lg:-translate-y-4' : 'border border-slate-800'
              }`}
            >
              {plano.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#14b8a6] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  Mais Popular
                </div>
              )}
              
              <div className="flex justify-center mb-6 mt-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${plano.iconColor}`}>
                  <plano.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white text-center mb-1">{plano.name}</h3>
              <p className="text-sm text-slate-400 text-center mb-6 px-2 min-h-[40px]">{plano.description}</p>
              <div className="text-center mb-8 pb-8 border-b border-slate-700/50">
                <span className="text-4xl font-extrabold text-white">R$ {plano.price}</span>
                <span className="text-slate-500 text-sm block mt-1">/mês</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {plano.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                    <Check className="w-5 h-5 text-[#14b8a6] flex-shrink-0 -mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-3.5 rounded-lg font-bold transition-all ${plano.buttonStyle}`}>
                Assinar Agora
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
