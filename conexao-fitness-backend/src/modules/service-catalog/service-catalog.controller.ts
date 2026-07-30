import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service';
import { CreateServiceCatalogDto } from './dto/create-service-catalog.dto';
import { UpdateServiceCatalogDto } from './dto/update-service-catalog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Service Catalog (Admin)')
@Controller('service-catalog')
export class ServiceCatalogController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() createServiceCatalogDto: CreateServiceCatalogDto) {
    return this.serviceCatalogService.create(createServiceCatalogDto);
  }

  // Aberto a todos (ou pelo menos profissionais) para listar o dropdown
  @Get()
  findAll(@Query('all') all?: string) {
    // se mandar ?all=true o admin ve ate os inativos, senao ve so os ativos
    return this.serviceCatalogService.findAll(all !== 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceCatalogService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceCatalogDto: UpdateServiceCatalogDto) {
    return this.serviceCatalogService.update(id, updateServiceCatalogDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceCatalogService.remove(id);
  }
}
