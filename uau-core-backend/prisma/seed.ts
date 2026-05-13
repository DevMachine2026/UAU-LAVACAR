import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed UAU+...');

  const email = process.env.SUPER_ADMIN_EMAIL ?? 'admin@uauplus.com';
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'admin123';
  const name = process.env.SUPER_ADMIN_NAME ?? 'Super Admin';

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log(`✅ Super Admin: ${admin.email}`);

  // Admin settings padrão
  const defaultSettings = [
    { key: 'platformName', value: 'UAU+' },
    { key: 'cashbackExpiryDays', value: '30' },
    { key: 'maxWashesPerDay', value: '1' },
  ];

  for (const setting of defaultSettings) {
    await prisma.adminSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Admin settings padrão criados');
  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
