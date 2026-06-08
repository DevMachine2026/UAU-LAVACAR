export function forgotPasswordEmailHtml(code: string, recipientName?: string): string {
  const greeting = recipientName ? `Olá, ${recipientName}` : 'Olá';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Recuperação de senha — UAU+</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fa;font-family:Arial,sans-serif;color:#101828;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#0BA95B;padding:28px 40px;text-align:center;">
                <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">UAU+</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px;">
                <p style="margin:0 0 12px;font-size:16px;">${greeting},</p>
                <p style="margin:0 0 24px;font-size:15px;color:#667085;">
                  Recebemos uma solicitação para redefinir a senha da sua conta UAU+.
                  Use o código abaixo para continuar.
                </p>
                <div style="background:#f5f7fa;border-radius:10px;padding:24px;text-align:center;margin:0 0 24px;">
                  <p style="margin:0 0 8px;font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:1px;">Seu código de verificação</p>
                  <p style="margin:0;font-size:36px;font-weight:bold;letter-spacing:10px;color:#0BA95B;">${code}</p>
                </div>
                <p style="margin:0 0 8px;font-size:13px;color:#667085;">
                  ⏱ Este código expira em <strong>15 minutos</strong>.
                </p>
                <p style="margin:0;font-size:13px;color:#667085;">
                  Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanece a mesma.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f5f7fa;padding:20px 40px;text-align:center;border-top:1px solid #eaecf0;">
                <p style="margin:0;font-size:12px;color:#98a2b3;">© ${new Date().getFullYear()} UAU+ Lavacar · uaulavacar.com.br</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}
