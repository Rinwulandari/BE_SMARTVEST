import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const statusValues = [0, 1, 2];
  let idx = 0;

  while (true) {
    try {
      const status = statusValues[idx];
      await prisma.gameStatus.update({
        where: { id: 1 },
        data: { status },
      });
      await new Promise(r => setTimeout(r, 3000)); // Delay 1 detik

      idx = (idx + 1) % statusValues.length; // Kembali ke 0 setelah 2
    } catch (e) {
      console.error('Loop error:', e);
      await new Promise(r => setTimeout(r, 2000)); // Delay sebelum retry jika error
    }
  }
}

main();