'use client';

import { useEffect, useState } from 'react';

type Service = {
  id: string;
  name: string;
  modality: string;
  type: string;
  price: string;
  currency: string;
};

export default function PainelPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('http://localhost:3001/services');
        if (!res.ok) {
          throw new Error('Erro ao carregar serviços');
        }
        const data = await res.json();
        setServices(data);
      } catch (err: any) {
        setError(err.message ?? 'Erro inesperado');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="cf-page cf-page-light">
      <section className="cf-panel">
        <header className="cf-panel-header">
          <div>
            <h1 className="cf-panel-title">Painel da academia</h1>
            <p className="cf-panel-sub">
              Lista de serviços cadastrados no backend (NestJS + PostgreSQL).
            </p>
          </div>
        </header>

        {loading && <p>Carregando serviços...</p>}

        {error && !loading && (
          <p className="cf-error">
            Não foi possível carregar os serviços: {error}
          </p>
        )}

        {!loading && !error && (
          <div className="cf-table-wrapper">
            {services.length === 0 ? (
              <p>Nenhum serviço cadastrado ainda.</p>
            ) : (
              <table className="cf-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Modalidade</th>
                    <th>Tipo</th>
                    <th>Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.modality}</td>
                      <td>{s.type}</td>
                      <td>
                        {s.currency} {Number(s.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </main>
  );
}