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
   * Retorna exclusivamente as academias parceiras reais cadastradas na plataforma Finex
   */
  async getGyms(dto: GetNearbyGymsDto, currentUserId?: string, userIp?: string): Promise<{
    items: StandardGymItem[];
    source: 'PLATFORM_PARTNERS';
    cityFilter?: string;
  }> {
    const cacheKey = `gyms_${dto.city || ''}_${dto.lat || ''}_${dto.lng || ''}_${dto.radiusKm || 15}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return { items: cached.data, source: 'PLATFORM_PARTNERS', cityFilter: dto.city };
    }

    const items = await this.fetchPlatformPartnerGyms(dto);

    // Salva cache da busca
    this.cache.set(cacheKey, { timestamp: Date.now(), data: items });

    return {
      items,
      source: 'PLATFORM_PARTNERS',
      cityFilter: dto.city,
    };
  }

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
   * Busca e filtra apenas as academias parceiras reais cadastradas no Finex
   */
  private async fetchPlatformPartnerGyms(dto: GetNearbyGymsDto): Promise<StandardGymItem[]> {
    const hasGps = typeof dto.lat === 'number' && typeof dto.lng === 'number' && !isNaN(dto.lat) && !isNaN(dto.lng);
    const maxRadius = dto.radiusKm || 50;
    const items: StandardGymItem[] = [];

    // Busca apenas perfis de academia de usuários ativos
    const registeredGyms = await this.academiaProfileRepo.find({
      relations: ['user'],
    });

    for (const g of registeredGyms) {
      if (!g.user || g.user.status !== 'ATIVO') continue;

      const name = g.nomeFantasia || g.razaoSocial || '';
      const rawAddress = g.address || '';
      const city = g.city || '';

      // Ignora perfis de teste incompletos ou administrativos sem endereço
      if (
        !city ||
        !rawAddress ||
        rawAddress.trim() === '-' ||
        name.toLowerCase().includes('administrador')
      ) {
        continue;
      }

      // Atribuição de coordenadas geográficas
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

      // Verificação por GPS ou Cidade
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
        isMatch = true; // Se nenhum filtro foi selecionado, lista as parceiras da plataforma
      }

      if (isMatch) {
        items.push({
          id: g.id,
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
          photoUrl: g.coverUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
          phone: g.phone || g.whatsapp,
          openingHours: 'Seg a Sex',
          indicationCount: 0,
        });
      }
    }

    if (hasGps) {
      items.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    return items;
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
