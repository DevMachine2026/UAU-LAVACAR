import { Global, Module } from '@nestjs/common';
import { Mailer } from './Mailer';

@Global()
@Module({
  providers: [Mailer],
  exports: [Mailer],
})
export class MailerModule {}
