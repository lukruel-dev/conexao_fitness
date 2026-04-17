import Image from "next/image";
import Link from 'next/link';

export default function Home() {
  return (
    <main className="cf-page">
      <div className="cf-overlay" />

      <section className="cf-hero">
        <div className="cf-hero-card">
          <img
            src="/logo-conexao-fitness.jpg"
            alt="Logo Conexão Fitness"
            className="cf-logo"
          />

          <h1 className="cf-title">Conexão Fitness</h1>

          <p className="cf-tagline">
            Marketplace que conecta <strong>academias</strong>,{' '}
            <strong>personais</strong> e <strong>alunos</strong> em qualquer
            cidade.
          </p>

          <p className="cf-sub">
            Piloto focado em <strong>Uruguaiana&nbsp;–&nbsp;RS</strong> com agenda
            inteligente, reservas online e pagamentos integrados.
          </p>

          <div className="cf-actions">
	    <Link href="/painel">
              <button className="cf-btn-primary">
                Entrar no painel da academia
              </button>
            </Link>
            <button className="cf-btn-ghost">Ver como funciona</button>
          </div>

          <div className="cf-meta">
            <span>Painel web pronto para uso em recepções de academias.</span>
            <span>Backend: NestJS + PostgreSQL + agenda com reservas EV+.</span>
          </div>
        </div>

        <div className="cf-right">
          <h2 className="cf-right-title">O que o Conexão Fitness resolve</h2>
          <ul className="cf-list">
            <li>
              <span className="cf-dot" /> Alunos encontram treinos próximos onde
              estiverem, com filtros por modalidade, preço e horário.
            </li>
            <li>
              <span className="cf-dot" /> Academias e personais abrem agenda e
              recebem reservas em tempo real, sem conflitos de horário.
            </li>
            <li>
              <span className="cf-dot" /> Foco inicial em Uruguaiana–RS, com
              expansão para outras cidades mantendo o mesmo motor de agenda.
            </li>
          </ul>

          <div className="cf-badges">
            <span className="cf-badge">MVP técnico em desenvolvimento</span>
            <span className="cf-badge cf-badge-outline">
              Pronto para piloto 2026
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}