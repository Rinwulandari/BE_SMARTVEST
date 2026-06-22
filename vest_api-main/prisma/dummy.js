import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mac_addresses = [
  "20:EA:A1:9C:1A:5C",
  "30:AB:CD:12:34:56",
  "50:EF:90:87:65:43",
];

async function main() {
  await prisma.esp32.deleteMany(); // Hapus semua data lama
  for (const mac_address of mac_addresses) {
    await prisma.esp32.create({
      data: { mac_address }
    });
  }
  console.log('Mac addresses inserted into esp32 table');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });