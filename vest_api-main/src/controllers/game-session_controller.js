import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updateSessionNative = async (req, res) => {
  try {
    const { mac_address, status_weapon } = req.body;

    if (![0, 1].includes(status_weapon)) {
      return res.status(400).json({ error: 'Invalid status_weapon value. Must be 0 or 1.' });
    }

    const esp32 = await prisma.esp32.findUnique({
      where: { mac_address },
    });

    if (!esp32) {
      return res.status(404).json({ error: 'No ESP32 found for the given MAC address.' });
    }

    // Perbaiki di sini:
    const updatedPlayer = await prisma.personel.updateMany({
      where: { PlayerID: esp32.id },
      data: { statusWeapon: status_weapon === 1 },
    });

    if (updatedPlayer.count > 0) {
      res.json({ message: 'Weapon status updated successfully.' });
    } else {
      res.status(500).json({ error: 'No changes made.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};

export default { updateSessionNative };
