import bcrypt from 'bcryptjs';

import { prisma } from '../lib/prisma.js';

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'Password123!';
const operatorEmail = process.env.OPERATOR_EMAIL ?? 'operator@example.com';
const operatorPassword = process.env.OPERATOR_PASSWORD ?? 'Operator123!';

async function main() {
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const operatorHash = await bcrypt.hash(operatorPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      role: 'ADMIN'
    },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      role: 'ADMIN'
    }
  });
  await prisma.user.upsert({
    where: { email: operatorEmail },
    update: {
      passwordHash: operatorHash,
      role: 'OPERATOR'
    },
    create: {
      email: operatorEmail,
      passwordHash: operatorHash,
      role: 'OPERATOR'
    }
  });
  console.log(`Seeded admin ${adminEmail} and operator ${operatorEmail}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed admin user', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
