import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { forgotPasswordEmailHtml } from '../emails/forgotPassword';

export interface ForgotPasswordMailContext {
  token: string;
  recipientName?: string;
}

export type SendMessageParams =
  | {
      to: string;
      subject: string;
      template: 'forgotPassword';
      context: ForgotPasswordMailContext;
    }
  | {
      to: string;
      subject: string;
      html: string;
    };

@Injectable()
export class Mailer implements OnModuleInit {
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('mailer.host');
    const port = this.config.get<number>('mailer.port');
    const user = this.config.get<string>('mailer.user');
    const pass = this.config.get<string>('mailer.pass');

    if (!host || port === undefined || !user || !pass) {
      return;
    }

    const secure = port === 465;
    const transportOptions: SMTPTransport.Options = {
      host,
      port,
      secure,
      auth: { user, pass },
    };

    if (!secure) {
      transportOptions.tls = {
        rejectUnauthorized: this.config.get<boolean>('mailer.rejectUnauthorized') ?? true,
      };
    }

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async sendMessage(params: SendMessageParams): Promise<void> {
    const transporter = this.getTransporter();
    const html =
      'html' in params ? params.html : this.renderHtml(params.template, params.context);
    const from =
      this.config.get<string>('mailer.from') ??
      this.config.get<string>('mailer.user') ??
      'noreply@uauplus.com';

    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html,
    });
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        'Serviço de e-mail não configurado. Defina MAILER_HOST, MAILER_PORT, MAILER_USER e MAILER_PASS.',
      );
    }
    return this.transporter;
  }

  private renderHtml(
    template: 'forgotPassword',
    context: ForgotPasswordMailContext,
  ): string {
    if (template === 'forgotPassword') {
      return forgotPasswordEmailHtml(context.token, context.recipientName);
    }
    throw new InternalServerErrorException(`Template de e-mail não suportado: ${template}`);
  }
}
