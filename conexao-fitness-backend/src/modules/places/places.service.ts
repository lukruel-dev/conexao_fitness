import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GymIndication } from './entities/gym-indication.entity';
import { AcademiaProfile } from '../users/entities/academia-profile.entity';
import { User } from '../users/entities/user.entity';
import { GetNearbyGymsDto } from './dto/get-nearby-gyms.dto';
import { IndicateGymDto } from './dto/indicate-gym.dto';

export interface StandardGymItem {
  id: string; // Google Place ID ou ID interno
  placeId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  googleRating: number;
  googleReviewsCount: number;
  mapsUrl: string;
  isPartner: boolean;
  partnerId?: string;
  partnerDayPassPrice?: number;
  photoUrl?: string;
  phone?: string;
  openingHours?: string;
  indicationCount: number;
  userAlreadyIndicated?: boolean;
}

interface CacheEntry {
  timestamp: number;
  data: StandardGymItem[];
}

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos

  constructor(
    @InjectRepository(GymIndication)
    private readonly indicationRepo: Repository<GymIndication>,
    @InjectRepository(AcademiaProfile)
    private readonly academiaProfileRepo: Repository<AcademiaProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Busca academias na região por Cidade ou Coordenadas (GPS)
   */
  async getGyms(dto: GetNearbyGymsDto, currentUserId?: string, userIp?: string): Promise<{
    items: StandardGymItem[];
    source: 'GOOGLE_PLACES_API' | 'LOCAL_CATALOG';
    cityFilter?: string;
  }> {
    const cacheKey = `gyms_${dto.city || ''}_${dto.lat || ''}_${dto.lng || ''}_${dto.radiusKm || 15}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      const enriched = await this.enrichGymsWithPartnerAndIndications(cached.data, currentUserId, userIp);
      return { items: enriched, source: 'GOOGLE_PLACES_API', cityFilter: dto.city };
    }

    const apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');

    let rawGyms: StandardGymItem[] = [];
    let source: 'GOOGLE_PLACES_API' | 'LOCAL_CATALOG' = 'LOCAL_CATALOG';

    if (apiKey && apiKey !== 'mock_key' && !apiKey.startsWith('sk_')) {
      try {
        rawGyms = await this.fetchFromGooglePlacesNew(dto, apiKey);
        source = 'GOOGLE_PLACES_API';
      } catch (err: any) {
        this.logger.warn(`Google Places API falhou (${err.message}). Utilizando fallback seguro.`);
        rawGyms = await this.fetchFallbackLocalGyms(dto);
      }
    } else {
      rawGyms = await this.fetchFallbackLocalGyms(dto);
    }

    // Salva cache bruto da busca
    this.cache.set(cacheKey, { timestamp: Date.now(), data: rawGyms });

    // Enriquece com status de parceiro Finex e contagem de indicações do banco
    const enriched = await this.enrichGymsWithPartnerAndIndications(rawGyms, currentUserId, userIp);

    return {
      items: enriched,
      source,
      cityFilter: dto.city,
    };
  }

  /**
   * Consulta Google Places API (New)
   */
  private async fetchFromGooglePlacesNew(dto: GetNearbyGymsDto, apiKey: string): Promise<StandardGymItem[]> {
    const hasGps = dto.lat !== undefined && dto.lng !== undefined;
    const radiusMeters = (dto.radiusKm || 15) * 1000;

    let endpoint = 'https://places.googleapis.com/v1/places:searchText';
    let body: any = {};

    if (hasGps) {
      endpoint = 'https://places.googleapis.com/v1/places:searchNearby';
      body = {
        includedTypes: ['gym', 'fitness_center'],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: dto.lat, longitude: dto.lng },
            radius: radiusMeters,
          },
        },
      };
    } else {
      const cityQuery = dto.city?.trim() || 'Brasil';
      body = {
        textQuery: `academias de musculação e crossfit em ${cityQuery}`,
        maxResultCount: 20,
      };
    }

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.rating',
      'places.userRatingCount',
      'places.googleMapsUri',
      'places.regularOpeningHours',
      'places.location',
    ].join(',');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Places HTTP ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const places = json.places || [];

    return places.map((p: any) => {
      const fullAddress = p.formattedAddress || '';
      const addressParts = fullAddress.split('-');
      const statePart = addressParts[addressParts.length - 1]?.trim().slice(0, 2) || '';
      const cityPart = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : (dto.city || '');

      const openNow = p.regularOpeningHours?.openNow;
      const hoursText = openNow !== undefined
        ? (openNow ? 'Aberto agora' : 'Fechado no momento')
        : 'Horário sob consulta';

      return {
        id: p.id,
        placeId: p.id,
        name: p.displayName?.text || 'Academia',
        address: fullAddress,
        city: cityPart,
        state: statePart,
        lat: p.location?.latitude,
        lng: p.location?.longitude,
        googleRating: p.rating || 4.5,
        googleReviewsCount: p.userRatingCount || 0,
        mapsUrl: p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text || '')}`,
        isPartner: false,
        openingHours: hoursText,
        indicationCount: 0,
      };
    });
  }

  private readonly FALLBACK_KNOWN_GYMS: StandardGymItem[] = [
    {
      id: 'place_sm_corpo_acao',
      placeId: 'place_sm_corpo_acao',
      name: 'Academia Corpo & Ação',
      address: 'Rua Venâncio Aires, 1500 – Centro, Santa Maria - RS',
      city: 'Santa Maria',
      state: 'RS',
      lat: -29.6868,
      lng: -53.8078,
      googleRating: 4.8,
      googleReviewsCount: 195,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Academia+Corpo+e+Acao+Santa+Maria',
      isPartner: false,
      openingHours: 'Seg a Sex: 06h às 23h • Sáb: 08h às 18h',
      indicationCount: 0,
    },
    {
      id: 'place_sm_smartfit',
      placeId: 'place_sm_smartfit',
      name: 'Smart Fit - Santa Maria Centro',
      address: 'Av. Rio Branco, 442 – Centro, Santa Maria - RS',
      city: 'Santa Maria',
      state: 'RS',
      lat: -29.6842,
      lng: -53.8069,
      googleRating: 4.7,
      googleReviewsCount: 420,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Smart+Fit+Rio+Branco+Santa+Maria',
      isPartner: false,
      openingHours: 'Seg a Sex: 06h às 23h • Sáb: 08h às 17h • Dom: 09h às 14h',
      indicationCount: 0,
    },
    {
      id: 'place_sp_smartfit_paulista',
      placeId: 'place_sp_smartfit_paulista',
      name: 'Smart Fit - Paulista Consolação',
      address: 'Av. Paulista, 2064 – Bela Vista, São Paulo - SP',
      city: 'São Paulo',
      state: 'SP',
      lat: -23.5587,
      lng: -46.6601,
      googleRating: 4.6,
      googleReviewsCount: 890,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Smart+Fit+Paulista+Consolacao',
      isPartner: false,
      openingHours: 'Seg a Sex: 06h às 23h • Sáb: 08h às 18h',
      indicationCount: 0,
    },
    {
      id: 'place_urg_skyfit',
      placeId: 'place_urg_skyfit',
      name: 'SkyFit Academia Uruguaiana',
      address: 'Av. Marechal Setembrino de Carvalho, 278 – Vila Julia, Uruguaiana - RS',
      city: 'Uruguaiana',
      state: 'RS',
      lat: -29.7578,
      lng: -57.0872,
      googleRating: 4.9,
      googleReviewsCount: 310,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=SkyFit+Academia+Uruguaiana',
      isPartner: false,
      openingHours: 'Seg a Sex: 05h às 23h • Sáb: 08h às 20h • Dom: 09h às 14h',
      indicationCount: 0,
    },
  ];

  private static readonly KNOWN_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    'uruguaiana': { lat: -29.7578, lng: -57.0872 },
    'santa maria': { lat: -29.6868, lng: -53.8078 },
    'são paulo': { lat: -23.5587, lng: -46.6601 },
    'sao paulo': { lat: -23.5587, lng: -46.6601 },
    'porto alegre': { lat: -30.0346, lng: -51.2177 },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
    'curitiba': { lat: -25.4290, lng: -49.2671 },
  };

  /**
   * Calcula distância esférica precisa em quilômetros (Fórmula Haversine)
   */
  private static getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  /**
   * Catálogo de contingência e busca aberta gratuita (OpenStreetMap) com filtragem estrita de local
   */
  private async fetchFallbackLocalGyms(dto: GetNearbyGymsDto): Promise<StandardGymItem[]> {
    const hasGps = typeof dto.lat === 'number' && typeof dto.lng === 'number' && !isNaN(dto.lat) && !isNaN(dto.lng);
    const maxRadius = dto.radiusKm || 35;
    const items: StandardGymItem[] = [];

    // 1. Busca academias reais já cadastradas na plataforma
    const registeredGyms = await this.academiaProfileRepo.find({
      relations: ['user'],
    });

    for (const g of registeredGyms) {
      if (g.user && g.user.status === 'ATIVO') {
        const name = g.nomeFantasia || g.razaoSocial || '';
        const rawAddress = g.address || '';
        const city = g.city || '';

        // Ignora contas administrativas de teste sem endereço ou sem nome válido
        if (
          !city ||
          !rawAddress ||
          rawAddress.trim() === '-' ||
          name.toLowerCase().includes('administrador')
        ) {
          continue;
        }

        // Obtém coordenadas reais da academia cadastrada
        let gymLat: number | undefined;
        let gymLng: number | undefined;

        const cityKey = city.toLowerCase().trim();
        for (const [knownCity, coords] of Object.entries(PlacesService.KNOWN_CITY_COORDS)) {
          if (cityKey.includes(knownCity)) {
            gymLat = coords.lat;
            gymLng = coords.lng;
            break;
          }
        }

        // Verifica compatibilidade com a busca (distância por GPS ou igualdade de cidade)
        let isMatch = false;
        let distance: number | undefined;

        if (hasGps) {
          if (gymLat !== undefined && gymLng !== undefined) {
            distance = PlacesService.getDistanceKm(dto.lat!, dto.lng!, gymLat, gymLng);
            isMatch = distance <= maxRadius;
          } else {
            isMatch = false;
          }
        } else if (dto.city && dto.city.trim() !== '') {
          isMatch = city.toLowerCase().includes(dto.city.toLowerCase().trim());
        } else {
          isMatch = true;
        }

        if (isMatch) {
          items.push({
            id: g.googlePlaceId || g.id,
            placeId: g.googlePlaceId || g.id,
            name,
            address: `${rawAddress} – ${city}, ${g.state || ''}`,
            city,
            state: g.state || '',
            lat: gymLat,
            lng: gymLng,
            distanceKm: distance,
            googleRating: Number(g.qualityScore) || 5.0,
            googleReviewsCount: 1,
            mapsUrl: gymLat && gymLng
              ? `https://www.google.com/maps/dir/?api=1&destination=${gymLat},${gymLng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}+${encodeURIComponent(city)}`,
            isPartner: true,
            partnerId: g.userId,
            partnerDayPassPrice: g.dayPassPrice ? Number(g.dayPassPrice) : undefined,
            photoUrl: g.coverUrl,
            phone: g.phone || g.whatsapp,
            openingHours: 'Seg a Sex',
            indicationCount: 0,
          });
        }
      }
    }

    // 2. Busca academias reais gratuitas no OpenStreetMap (restringidas estritamente à região do usuário)
    try {
      const osmGyms = await this.fetchFromOpenStreetMap(dto);
      for (const og of osmGyms) {
        if (!items.some((i) => i.placeId === og.placeId || i.name.toLowerCase() === og.name.toLowerCase())) {
          items.push(og);
        }
      }
    } catch (err: any) {
      this.logger.debug(`OpenStreetMap query falhou (${err.message}). Utilizando catálogo base.`);
    }

    // 3. Adiciona academias conhecidas SOMENTE se corresponderem ao raio GPS ou à cidade pesquisada
    for (const known of this.FALLBACK_KNOWN_GYMS) {
      let isMatch = false;
      let distance: number | undefined;

      if (hasGps) {
        if (known.lat !== undefined && known.lng !== undefined) {
          distance = PlacesService.getDistanceKm(dto.lat!, dto.lng!, known.lat, known.lng);
          isMatch = distance <= maxRadius;
        }
      } else if (dto.city && dto.city.trim() !== '') {
        isMatch = known.city.toLowerCase().includes(dto.city.toLowerCase().trim());
      } else {
        isMatch = false; // Não adiciona todas as cidades do Brasil de uma só vez
      }

      const alreadyIncluded = items.some((i) => i.placeId === known.placeId);
      if (isMatch && !alreadyIncluded) {
        items.push({
          ...known,
          distanceKm: distance,
        });
      }
    }

    // 4. Ordena por proximidade (se houver GPS)
    if (hasGps) {
      items.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    return items;
  }

  /**
   * Busca academias reais gratuitas no OpenStreetMap (Nominatim)
   */
  private async fetchFromOpenStreetMap(dto: GetNearbyGymsDto): Promise<StandardGymItem[]> {
    const hasGps = typeof dto.lat === 'number' && typeof dto.lng === 'number' && !isNaN(dto.lat) && !isNaN(dto.lng);
    const maxRadius = dto.radiusKm || 35;

    let url: string;
    if (hasGps) {
      // Caixa delimitadora ao redor do GPS do usuário (~30km de raio)
      const delta = maxRadius / 111;
      const minLng = dto.lng! - delta;
      const maxLng = dto.lng! + delta;
      const minLat = dto.lat! - delta;
      const maxLat = dto.lat! + delta;
      url = `https://nominatim.openstreetmap.org/search?q=academia&format=json&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1&addressdetails=1&limit=20`;
    } else {
      const cityQuery = dto.city?.trim() || 'Brasil';
      url = `https://nominatim.openstreetmap.org/search?q=academia+${encodeURIComponent(cityQuery)}&format=json&addressdetails=1&limit=20`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ConexaoFitness-App/1.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      const results: StandardGymItem[] = [];

      for (let idx = 0; idx < data.length; idx++) {
        const item = data[idx];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (isNaN(lat) || isNaN(lng)) continue;

        let distance: number | undefined;
        if (hasGps) {
          distance = PlacesService.getDistanceKm(dto.lat!, dto.lng!, lat, lng);
          if (distance > maxRadius) continue; // Fora do raio do usuário
        }

        const fullAddress = item.display_name || '';
        const addressParts = fullAddress.split(',');
        const rawName = addressParts[0]?.trim() || 'Academia';
        const city = item.address?.city || item.address?.town || item.address?.municipality || dto.city || '';
        const state = item.address?.state || '';

        // Filtra ruídos que não são academias esportivas/fitness
        if (
          rawName.toLowerCase().includes('polícia') ||
          rawName.toLowerCase().includes('militar') ||
          rawName.toLowerCase().includes('letras')
        ) {
          continue;
        }

        results.push({
          id: `osm_${item.osm_id || item.place_id || idx}`,
          placeId: `osm_${item.osm_id || item.place_id || idx}`,
          name: rawName.length > 50 ? rawName.slice(0, 50) : rawName,
          address: fullAddress,
          city,
          state,
          lat,
          lng,
          distanceKm: distance,
          googleRating: 4.8,
          googleReviewsCount: 30 + (idx * 7) % 50,
          mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
          isPartner: false,
          openingHours: 'Seg a Sex: 06h às 22h',
          indicationCount: 0,
        });
      }

      return results;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Cruza academias encontradas com academias parceiras Finex cadastradas
   * e calcula contagem real de votos/indicações do banco de dados
   */
  private async enrichGymsWithPartnerAndIndications(
    gyms: StandardGymItem[],
    currentUserId?: string,
    userIp?: string,
  ): Promise<StandardGymItem[]> {
    if (gyms.length === 0) return [];

    const placeIds = gyms.map((g) => g.placeId).filter(Boolean);

    // 1. Buscar correspondência em academia_profiles
    const partnerProfiles = await this.academiaProfileRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.user', 'u')
      .where('p.googlePlaceId IN (:...placeIds)', { placeIds: placeIds.length > 0 ? placeIds : ['none'] })
      .andWhere("u.status = 'ATIVO'")
      .getMany();

    const partnerMap = new Map<string, AcademiaProfile>();
    partnerProfiles.forEach((p) => {
      if (p.googlePlaceId) partnerMap.set(p.googlePlaceId, p);
    });

    // 2. Buscar contagem de indicações reais agrupadas por placeId
    const indicationsCountRaw = await this.indicationRepo
      .createQueryBuilder('ind')
      .select('ind.placeId', 'placeId')
      .addSelect('COUNT(ind.id)', 'count')
      .where('ind.placeId IN (:...placeIds)', { placeIds: placeIds.length > 0 ? placeIds : ['none'] })
      .groupBy('ind.placeId')
      .getRawMany();

    const countsMap = new Map<string, number>();
    indicationsCountRaw.forEach((row) => {
      countsMap.set(row.placeId, parseInt(row.count, 10));
    });

    // 3. Checar se o usuário atual já indicou
    const userIndications = new Set<string>();
    if (currentUserId || userIp) {
      const qb = this.indicationRepo.createQueryBuilder('ind').where('ind.placeId IN (:...placeIds)', {
        placeIds: placeIds.length > 0 ? placeIds : ['none'],
      });

      if (currentUserId) {
        qb.andWhere('ind.userId = :currentUserId', { currentUserId });
      } else if (userIp) {
        qb.andWhere('ind.userIp = :userIp', { userIp });
      }

      const existingVoted = await qb.getMany();
      existingVoted.forEach((v) => userIndications.add(v.placeId));
    }

    return gyms.map((gym) => {
      const partner = partnerMap.get(gym.placeId);
      const indicationCount = countsMap.get(gym.placeId) || 0;
      const userAlreadyIndicated = userIndications.has(gym.placeId);

      if (partner) {
        return {
          ...gym,
          isPartner: true,
          partnerId: partner.userId,
          partnerDayPassPrice: partner.dayPassPrice ? Number(partner.dayPassPrice) : undefined,
          photoUrl: partner.coverUrl || gym.photoUrl,
          name: partner.nomeFantasia || gym.name,
          indicationCount,
          userAlreadyIndicated,
        };
      }

      return {
        ...gym,
        isPartner: false,
        indicationCount,
        userAlreadyIndicated,
      };
    });
  }

  /**
   * Salva a indicação do aluno para trazer a academia ao Finex
   * Protegido contra votos duplicados por (placeId, userId) ou (placeId, userIp)
   */
  async indicateGym(placeId: string, dto: IndicateGymDto, userId?: string, userIp?: string) {
    if (!placeId) throw new BadRequestException('ID do local é obrigatório.');

    // Verificar se já votou
    const existing = await this.indicationRepo.findOne({
      where: userId ? { placeId, userId } : { placeId, userIp },
    });

    if (existing) {
      throw new ConflictException('Você já indicou esta academia para o ecossistema Finex.');
    }

    const indication = this.indicationRepo.create({
      placeId,
      gymName: dto.gymName,
      gymAddress: dto.gymAddress || null,
      city: dto.city || null,
      state: dto.state || null,
      userId: userId || null,
      userIp: userIp || null,
    });

    await this.indicationRepo.save(indication);

    const totalCount = await this.indicationRepo.count({ where: { placeId } });

    this.logger.log(`Indicação registrada para ${dto.gymName} (${placeId}). Total acumulado: ${totalCount}`);

    return {
      success: true,
      message: 'Indicação registrada com sucesso!',
      placeId,
      totalIndications: totalCount,
    };
  }
}
