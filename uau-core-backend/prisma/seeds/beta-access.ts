import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BETA_EMAILS: string[] = [
  'email-do-eduardo@gmail.com',
  'email-testador-2@gmail.com',
  'email-testador-3@gmail.com',
  'email-testador-4@gmail.com',
];

async function main() {
  if (BETA_EMAILS.length === 0) {
    console.log('Nenhum e-mail na lista. Edite BETA_EMAILS em prisma/seeds/beta-access.ts');
    return;
  }

  let liberados = 0;
  let naoEncontrados: string[] = [];

  for (const email of BETA_EMAILS) {
    const result = await prisma.user.updateMany({
      where: { email },
      data: { betaAccess: true },
    });

    if (result.count === 0) {
      naoEncontrados.push(email);
    } else {
      liberados++;
      console.log(`✓ ${email}`);
    }
  }

  if (naoEncontrados.length > 0) {
    console.log(`\nNão encontrados (sem cadastro):`);
    naoEncontrados.forEach((e) => console.log(`  ✗ ${e}`));
  }

  console.log(`\nConcluído: ${liberados} usuário(s) liberado(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());