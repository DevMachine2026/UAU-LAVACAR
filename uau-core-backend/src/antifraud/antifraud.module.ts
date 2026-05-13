import { Module } from '@nestjs/common';
import { AntifraudService } from './antifraud.service';
import { AntifraudController } from './antifraud.controller';

@Module({
  controllers: [AntifraudController],
  providers: [AntifraudService],
  exports: [AntifraudService],
})
export class AntifraudModule {}
