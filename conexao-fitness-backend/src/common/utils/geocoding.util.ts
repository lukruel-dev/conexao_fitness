/**
 * Utilitário de Geocodificação Automática de Cidades Brasileiras
 * Atribui coordenadas latitude/longitude automaticamente como fallback
 * para que prestadores de serviços e academias nunca fiquem invisíveis no cálculo de proximidade GPS (Haversine).
 */

interface Coordinates {
  lat: number;
  lng: number;
}

const CITY_COORDINATES: Record<string, Coordinates> = {
  // Rio Grande do Sul
  viamao: { lat: -30.0811, lng: -51.0238 },
  portoalegre: { lat: -30.0346, lng: -51.2177 },
  canoas: { lat: -29.9177, lng: -51.1836 },
  alvorada: { lat: -30.0016, lng: -51.0772 },
  gravatai: { lat: -29.9436, lng: -50.9934 },
  cachoeirinha: { lat: -29.9511, lng: -51.0944 },
  santamaria: { lat: -29.6842, lng: -53.8069 },
  uruguaiana: { lat: -29.7547, lng: -57.0883 },
  caxiasdosul: { lat: -29.1678, lng: -51.1794 },
  pelotas: { lat: -31.7654, lng: -52.3376 },
  passofundo: { lat: -28.2612, lng: -52.4083 },
  novohamburgo: { lat: -29.6783, lng: -51.1306 },
  saoleopoldo: { lat: -29.7601, lng: -51.1472 },
  bentogoncalves: { lat: -29.1714, lng: -51.5186 },
  riogrande: { lat: -32.0353, lng: -52.0986 },
  bage: { lat: -31.3314, lng: -54.1069 },
  santana: { lat: -30.8872, lng: -55.5328 }, // Santana do Livramento
  santanadolivramento: { lat: -30.8872, lng: -55.5328 },
  erechim: { lat: -27.6342, lng: -52.2689 },
  lajeado: { lat: -29.4678, lng: -51.9614 },
  santacruzdosul: { lat: -29.7186, lng: -52.4289 },

  // São Paulo
  saopaulo: { lat: -23.5505, lng: -46.6333 },
  campinas: { lat: -22.9099, lng: -47.0626 },
  guarulhos: { lat: -23.4542, lng: -46.5333 },
  santos: { lat: -23.9608, lng: -46.3336 },
  saojosedoscampos: { lat: -23.2237, lng: -45.9009 },
  ribeiraopreto: { lat: -21.1704, lng: -47.8103 },
  sorocaba: { lat: -23.5015, lng: -47.4526 },
  osasco: { lat: -23.5329, lng: -46.7917 },
  santoandre: { lat: -23.6639, lng: -46.5383 },
  saobernardodocampo: { lat: -23.6944, lng: -46.5653 },

  // Rio de Janeiro
  riodejaneiro: { lat: -22.9068, lng: -43.1729 },
  niteroi: { lat: -22.8833, lng: -43.1036 },
  saogoncalo: { lat: -22.8267, lng: -43.0539 },
  duquedecaxias: { lat: -22.7856, lng: -43.3117 },
  novaiquacu: { lat: -22.7561, lng: -43.4511 },

  // Paraná
  curitiba: { lat: -25.4284, lng: -49.2733 },
  londrina: { lat: -23.3045, lng: -51.1696 },
  maringa: { lat: -23.4210, lng: -51.9331 },
  pontagrossa: { lat: -25.0994, lng: -50.1583 },
  cascavel: { lat: -24.9578, lng: -53.4595 },
  fozdoiguacu: { lat: -25.5163, lng: -54.5854 },

  // Santa Catarina
  florianopolis: { lat: -27.5954, lng: -48.5480 },
  joinville: { lat: -26.3045, lng: -48.8487 },
  blumenau: { lat: -26.9194, lng: -49.0661 },
  saojose: { lat: -27.6136, lng: -48.6366 },
  chapeco: { lat: -27.1004, lng: -52.6152 },
  criciuma: { lat: -28.6775, lng: -49.3703 },

  // Minas Gerais
  belohorizonte: { lat: -19.9167, lng: -43.9345 },
  uberlandia: { lat: -18.9186, lng: -48.2772 },
  contagem: { lat: -19.9386, lng: -44.0536 },
  juizdefora: { lat: -21.7587, lng: -43.3496 },

  // Distrito Federal / Centro-Oeste
  brasilia: { lat: -15.7975, lng: -47.8919 },
  goiania: { lat: -16.6869, lng: -49.2648 },
  campogrande: { lat: -20.4697, lng: -54.6201 },
  cuiaba: { lat: -15.6014, lng: -56.0979 },

  // Nordeste / Norte
  salvador: { lat: -12.9777, lng: -38.5016 },
  recife: { lat: -8.0476, lng: -34.8770 },
  fortaleza: { lat: -3.7319, lng: -38.5267 },
  natal: { lat: -5.7945, lng: -35.2110 },
  joaopessoa: { lat: -7.1195, lng: -34.8450 },
  maceio: { lat: -9.6658, lng: -35.7350 },
  manaus: { lat: -3.1190, lng: -60.0217 },
  belem: { lat: -1.4558, lng: -48.4902 },
};

/**
 * Normaliza o nome da cidade removendo acentos, traços, estados e pontuação.
 */
function normalizeCityName(cityName: string): string {
  return cityName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/\s*-\s*[a-z]{2}$/i, '') // remove sigla de estado ex: " - RS", " - SP"
    .replace(/[^a-z0-9]/g, '') // remove espaços e caracteres especiais
    .trim();
}

/**
 * Retorna as coordenadas de latitude e longitude centrais para a cidade fornecida.
 */
export function resolveCityCoordinates(cityStr?: string | null): Coordinates | null {
  if (!cityStr || typeof cityStr !== 'string') return null;

  const key = normalizeCityName(cityStr);
  if (!key) return null;

  // Busca exata
  if (CITY_COORDINATES[key]) {
    return CITY_COORDINATES[key];
  }

  // Busca por correspondência parcial
  for (const [candidateKey, coords] of Object.entries(CITY_COORDINATES)) {
    if (key.includes(candidateKey) || candidateKey.includes(key)) {
      return coords;
    }
  }

  return null;
}
