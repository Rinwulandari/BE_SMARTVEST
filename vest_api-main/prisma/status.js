import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Tambahkan hanya jika belum ada data
  const existing = await prisma.gameStatus.findFirst();
  if (!existing) {
        await prisma.gameStatus.create({
      data: { id: 1, status: 0 }
    });
  } else {
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
  