import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { verifyAccessToken } from '../auth/auth.utils';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateCompanyNewsDto } from './dto/create-company-news.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesService } from './companies.service';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser() user: { sub: string }) {
    return this.companiesService.findMine(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : null;
    const viewerId = token
      ? (() => {
          try {
            return verifyAccessToken(token).sub;
          } catch {
            return null;
          }
        })()
      : null;

    return this.companiesService.findOne(id, viewerId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/news')
  createNews(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: CreateCompanyNewsDto,
  ) {
    return this.companiesService.createNews(id, user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/subscriptions')
  subscribe(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.companiesService.subscribeToNotifications(id, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/subscriptions')
  unsubscribe(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.companiesService.unsubscribeFromNotifications(id, user.sub);
  }
}
