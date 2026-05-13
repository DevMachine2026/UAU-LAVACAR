import { Module } from '@nestjs/common';
import { AnprService } from './anpr.service';
import { AnprController } from './anpr.controller';

@Module({
  controllers: [AnprController],
  providers: [AnprService],
  exports: [AnprService],
})
export class AnprModule {}
