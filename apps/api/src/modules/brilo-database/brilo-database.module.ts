import { Global, Module } from '@nestjs/common';
import { BriloDatabaseService } from './brilo-database.service.js';

@Global()
@Module({
  providers: [BriloDatabaseService],
  exports: [BriloDatabaseService],
})
export class BriloDatabaseModule {}
