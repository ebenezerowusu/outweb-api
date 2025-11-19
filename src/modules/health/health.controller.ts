import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { SkipAuth, SkipCountryGuard } from '@/common/decorators/auth.decorators';

/**
 * Health Check Controller
 * Provides endpoints for service diagnostics and monitoring
 */
@ApiTags('Health')
@Controller('health')
@SkipAuth()
@SkipCountryGuard()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Service Liveness Check
   * Returns 200 if the service is running
   */
  @Get()
  @ApiOperation({ summary: 'Check service liveness' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async checkHealth() {
    return this.healthService.checkHealth();
  }

  /**
   * Cosmos DB Connection Test
   * Verifies connection to Azure Cosmos DB
   */
  @Get('cosmos')
  @ApiOperation({ summary: 'Check Cosmos DB connection' })
  @ApiResponse({ status: 200, description: 'Cosmos DB is accessible' })
  @ApiResponse({ status: 503, description: 'Cosmos DB is not accessible' })
  async checkCosmos() {
    return this.healthService.checkCosmos();
  }

  /**
   * Azure Storage Connection Test
   * Verifies connection to Azure Blob Storage
   */
  @Get('storage')
  @ApiOperation({ summary: 'Check Azure Storage connection' })
  @ApiResponse({ status: 200, description: 'Azure Storage is accessible' })
  @ApiResponse({ status: 503, description: 'Azure Storage is not accessible' })
  async checkStorage() {
    return this.healthService.checkStorage();
  }
}
