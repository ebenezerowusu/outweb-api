import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CosmosService } from '@/common/services/cosmos.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, CosmosService],
  exports: [UsersService],
})
export class UsersModule {}
