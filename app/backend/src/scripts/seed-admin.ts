import bcrypt from 'bcryptjs';

import { prisma } from '../lib/prisma.js';

const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const password = process.env.ADMIN_PASSWORD ?? 'Password123!';

async function main() {
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      role: 'ADMIN'
    },
    create: {
      email,
      passwordHash: hash,
      role: 'ADMIN'
    }
  });
  console.log(`Seeded admin ${email}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed admin user', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
