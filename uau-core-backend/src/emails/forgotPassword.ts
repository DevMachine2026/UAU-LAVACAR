export function forgotPasswordEmailHtml(token: string, recipientName?: string): string {
  const greeting = recipientName ? `Olá, ${recipientName}` : 'Olá';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Recuperação de senha — UAU+</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.5;">
    <p>${greeting},</p>
    <p>Recebemos uma solicitação para redefinir sua senha no UAU+.</p>
    <p>Use o código abaixo para continuar. Ele expira em breve:</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${token}</p>
    <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
    <p>Equipe UAU+</p>
  </body>
</html>
`.trim();
}
