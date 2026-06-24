import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchServicesDto } from './dto/search-services.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Busca e Geolocalização')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('services')
  searchServices(@Query() query: SearchServicesDto) {
    return this.searchService.searchServices(query);
  }
}
