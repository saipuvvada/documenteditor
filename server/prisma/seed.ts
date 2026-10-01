import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    id: 'user-sai',
    name: 'Sai',
    email: 'sai@example.com',
  },
  {
    id: 'user-priya',
    name: 'Priya',
    email: 'priya@example.com',
  },
  {
    id: 'user-alex',
    name: 'Alex',
    email: 'alex@example.com',
  },
];

async function main() {
  console.log('Seeding database with demo users...');

  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
      },
      create: user,
    });
  }

  console.log('Demo users seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
