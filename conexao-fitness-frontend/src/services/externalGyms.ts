// Serviço de busca e indicação de Academias Reais por Cidade / Coordenadas (Google Places & Finex)
import { apiRequest } from '@/lib/apiClient';

export interface ExternalGym {
  id: string;
  placeId: string;
  name: string;
  city: string;
  state: string;
  address: string;
  photoUrl?: string;
  googleRating: number;
  googleReviewsCount: number;
  mapsUrl: string;
  isPartner: boolean;
  partnerId?: string;
  partnerDayPassPrice?: number;
  indicationCount?: number;
  userAlreadyIndicated?: boolean;
  phone?: string;
  openingHours?: string;
  lat?: number;
  lng?: number;
}

interface GymsApiResponse {
  items: ExternalGym[];
  source: 'GOOGLE_PLACES_API' | 'LOCAL_CATALOG';
  cityFilter?: string;
}

/**
 * Consulta academias reais no backend (via Google Places API New ou catálogo local enriquecido)
 */
export async function getRealGymsByCity(
  cityName?: string,
  coords?: { lat: number; lng: number } | null
): Promise<ExternalGym[]> {
  try {
    const query: Record<string, any> = {};
    if (coords) {
      query.lat = coords.lat;
      query.lng = coords.lng;
    } else if (cityName && cityName.trim() !== '') {
      query.city = cityName.trim();
    }

    const res = await apiRequest<GymsApiResponse>('/places/gyms', {
      query,
    });

    return res.items || [];
  } catch (err) {
    console.warn('Erro ao consultar academias no backend:', err);
    return [];
  }
}

/**
 * Registra indicação da academia no banco de dados com proteção contra votos duplicados
 */
export async function indicateGymToFinex(
  gym: { placeId?: string; id?: string; name: string; address?: string; city?: string; state?: string }
): Promise<{ success: boolean; totalIndications: number; message?: string }> {
  const targetId = gym.placeId || gym.id;
  if (!targetId) {
    throw new Error('Identificador da academia não fornecido.');
  }

  return apiRequest<{ success: boolean; totalIndications: number; message?: string }>(
    `/places/gyms/${encodeURIComponent(targetId)}/indicate`,
    {
      method: 'POST',
      body: {
        gymName: gym.name,
        gymAddress: gym.address,
        city: gym.city,
        state: gym.state,
      },
    }
  );
}
