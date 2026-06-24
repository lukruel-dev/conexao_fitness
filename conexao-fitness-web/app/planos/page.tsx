'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Zap, Star, Crown } from 'lucide-react';

export default function PlanosPage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'academia'>('personal');

  const planosPersonal = [
    {
      name: 'Bronze',
      price: '49.90',
      icon: Zap,
      iconColor: 'bg-orange-500',
      features: [
        'Perfil destacado nas buscas',
        'Badge Premium no perfil',
        'Até 3 fotos no perfil',
        'Especialidades em destaque',
        'Suporte por email'
      ],
      buttonStyle: 'bg-slate-700 hover:bg-slate-600 text-white'
    },
    {
      name: 'Silver',
      price: '99.90',
      icon: Star,
      iconColor: 'bg-slate-400',
      isPopular: true,
      features: [
        'Tudo do plano Bronze',
        'Prioridade máxima nas buscas',
        'Até 10 fotos no perfil',
        'Vídeo de apresentação',
        'Estatísticas de visualizações',
        'Certificações em destaque',
        'Suporte prioritário'
      ],
      buttonStyle: 'bg-brand-green hover:bg-green-600 text-white'
    },
    {
      name: 'Gold',
      price: '199.90',
      icon: Crown,
      iconColor: 'bg-yellow-500',
      features: [
        'Tudo do plano Silver',
        'Fotos ilimitadas',
        'Múltiplos vídeos',
        'Sistema de agendamento integrado',
        'Planos de treino em anexo',
        'Suporte 24/7',
        'Destaque em campanhas promocionais'
      ],
      buttonStyle: 'bg-transparent border border-slate-700 hover:bg-slate-800 text-white'
    }
  ];

  const planosAcademia = [
    {
      name: 'Bronze',
      price: '99.90',
      icon: Zap,
      iconColor: 'bg-orange-500',
      features: [
        'Perfil destacado nas buscas',
        'Badge Premium no perfil',
        'Até 5 fotos da academia',
        'Horários de funcionamento',
        'Suporte por email'
      ],
      buttonStyle: 'bg-slate-700 hover:bg-slate-600 text-white'
    },
    {
      name: 'Silver',
      price: '199.90',
      icon: Star,
      iconColor: 'bg-slate-400',
      isPopular: true,
      features: [
        'Tudo do plano Bronze',
        'Prioridade máxima nas buscas',
        'Até 20 fotos da academia',
        'Tour virtual 360°',
        'Estatísticas de visualizações',
        'Destaque na homepage',
        'Suporte prioritário'
      ],
      buttonStyle: 'bg-brand-green hover:bg-green-600 text-white'
    },
    {
      name: 'Gold',
      price: '399.90',
      icon: Crown,
      iconColor: 'bg-yellow-500',
      features: [
        'Tudo do plano Silver',
        'Fotos e vídeos ilimitados',
        'Galeria de aulas coletivas',
        'Sistema de agendamento integrado',
        'Gestão de múltiplos profissionais',
        'Campanhas promocionais destacadas',
        'Suporte 24/7 com gestor dedicado'
      ],
      buttonStyle: 'bg-transparent border border-slate-700 hover:bg-slate-800 text-white'
    }
  ];

  const planos = activeTab === 'personal' ? planosPersonal : planosAcademia;

  return (
    <div className="min-h-screen bg-[#191d29] flex flex-col">
      {/* Top Navbar Minimalista */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161a25]">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 relative">
            <img src="/logo_01_tr.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-white text-sm">Conexão Fitness</span>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Planos Premium</h1>
        <p className="text-slate-400 text-lg mb-10 text-center max-w-2xl">
          Destaque seu perfil e receba mais clientes com nossos planos de assinatura
        </p>

        {/* Tabs */}
        <div className="flex p-1 bg-[#1e2330] rounded-xl border border-slate-800 mb-16 inline-flex shadow-inner">
          <button 
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'personal' ? 'bg-[#14b8a6] text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Personal Trainer
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
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
          {planos.map((plano, idx) => (
            <div 
              key={idx} 
              className={`bg-[#1e2330] rounded-2xl p-8 flex flex-col relative transition-all ${
                plano.isPopular ? 'border-2 border-[#14b8a6] shadow-[0_0_30px_rgba(20,184,166,0.15)] transform md:-translate-y-4' : 'border border-slate-800'
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
              
              <h3 className="text-2xl font-bold text-white text-center mb-2">{plano.name}</h3>
              <div className="text-center mb-8 pb-8 border-b border-slate-700/50">
                <span className="text-4xl font-extrabold text-white">R$ {plano.price}</span>
                <span className="text-slate-500 text-sm">/mês</span>
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
