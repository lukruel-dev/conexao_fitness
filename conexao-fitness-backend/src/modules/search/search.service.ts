import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { SearchServicesDto } from './dto/search-services.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Service)
    private readonly servicesRepo: Repository<Service>,
    private readonly configService: ConfigService,
  ) {}

  async searchServices(dto: SearchServicesDto): Promise<any[]> {
    const { lat, lng, radiusKm = 50, modality, maxPrice, providerType, targetCity } = dto;
    
    // Configuração da cidade piloto (Uruguaiana) para dar o super boost
    // Quando o app expandir, basta remover do .env
    const pilotCity = this.configService.get<string>('PILOT_CITY', 'Uruguaiana');

    const radius = radiusKm || 5000;

    // A fórmula de Haversine em SQL puro para calcular distância (em KM)
    // 6371 é o raio da Terra em KM
    let distanceFormula = '0';
    if (lat !== undefined && lng !== undefined) {
      distanceFormula = `
        ( 6371 * acos(
            cos(radians(:userLat)) * cos(radians(provider.lastLat)) *
            cos(radians(provider.lastLng) - radians(:userLng)) +
            sin(radians(:userLat)) * sin(radians(provider.lastLat))
        ) )
      `;
    }

    // Vamos construir a query puxando Service e fazendo JOIN com User (provedor)
    const qb = this.servicesRepo.createQueryBuilder('service')
      .leftJoinAndSelect('service.provider', 'provider')
      .where('service.isActive = :isActive', { isActive: true })
      // Filtra provedores que já passaram pelo KYC
      .andWhere("provider.status = 'ATIVO'");
      
    if (lat !== undefined && lng !== undefined) {
      qb.andWhere(`provider.lastLat IS NOT NULL AND provider.lastLng IS NOT NULL`)
        .andWhere(`${distanceFormula} <= :radiusKm`, { userLat: lat, userLng: lng, radiusKm: radius });
    }

    // Aplicar filtros dinâmicos
    if (modality) {
      qb.andWhere('service.modality ILIKE :modality', { modality: `%${modality}%` });
    }
    if (maxPrice) {
      qb.andWhere('service.price <= :maxPrice', { maxPrice });
    }
    if (providerType) {
      qb.andWhere('service.providerType = :providerType', { providerType });
    }
    if (targetCity) {
      qb.andWhere('provider.cityBase ILIKE :targetCity', { targetCity: `%${targetCity}%` });
    }

    // Fórmula de Score (Ranking)
    // (Qualidade * 10) - Distância + (Boost Assinatura) + (Boost Piloto)
    // Usamos coalesce para lidar com nulos no qualityScore (precisaremos puxar do Profile, mas como não temos JOIN com Profile, usaremos default 0 ou adicionaremos um campo no User)
    // Vamos basear na tabela User:
    // NOTA: Como o 'subscriptionPlanId' e 'qualityScore' estão nos perfis (Personal/Academia), 
    // precisaremos de um join específico ou calcular um peso genérico no MVP.
    // Vamos fazer um LEFT JOIN condicional ou apenas focar no boost regional e distância para esta query inicial.
    
    qb.addSelect(`${distanceFormula}`, 'distance_km');
    
    // Score Formula: Base 100 - (Distance * 1) + Boost Uruguaiana
    const scoreFormula = `
      (100 - ${distanceFormula}) + 
      CASE WHEN provider.cityBase ILIKE :pilotCity THEN 1000 ELSE 0 END
    `;
    
    qb.addSelect(scoreFormula, 'ranking_score');
    qb.setParameter('pilotCity', `%${pilotCity}%`);

    qb.orderBy('ranking_score', 'DESC');

    // Executar a query
    const rawAndEntities = await qb.getRawAndEntities();

    // Mapear resultado para incluir a distância e o score calculado no JSON final
    return rawAndEntities.entities.map((entity, index) => {
      const raw = rawAndEntities.raw[index];
      return {
        ...entity,
        distanceKm: Number(raw.distance_km).toFixed(2),
        rankingScore: Number(raw.ranking_score).toFixed(2),
      };
    });
  }
}
