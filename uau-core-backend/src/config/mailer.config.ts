import { registerAs } from '@nestjs/config';

export default registerAs('mailer', () => ({
  host: process.env.MAILER_HOST,
  port: process.env.MAILER_PORT ? Number(process.env.MAILER_PORT) : undefined,
  user: process.env.MAILER_USER,
  pass: process.env.MAILER_PASS,
  from: process.env.MAILER_FROM,
  rejectUnauthorized: process.env.MAILER_REJECT_UNAUTHORIZED !== 'false',
}));
