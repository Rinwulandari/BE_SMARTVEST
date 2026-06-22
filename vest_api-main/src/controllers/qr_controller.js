import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 📌 Scan QR
export const scanQr = async (req, res) => {
    try {
        const { qrcode, mac_address } = req.body;
        
        if (!mac_address) {
            return res.status(404).json({ success: false, message: "Vest not registered or MAC address needed" });
        }

        const existingESP32 = await prisma.esp32.findUnique({ where: { mac_address } });
        if (!existingESP32) {
            return res.status(404).json({ success: false, message: "ESP32 not found" });
        }

        const existingPlayer = await prisma.personel.findUnique({ where: { PlayerID: existingESP32.id } });
        if (!existingPlayer) {
            return res.status(404).json({ success: false, message: "Player not found" });
        }

        return res.json({
            success: true,
            player: existingPlayer,
            esp32: existingESP32
        });
    } catch (error) {
        console.error("Error scan QR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 📌 Register via QR
export const registerQr = async (req, res) => {
    try {
        const { qrcode, name, selectedTeam, mac_address } = req.body;

        if (!name || !mac_address) {
            return res.status(400).json({ success: false, message: "Name and MAC address are required" });
        }

        // Pastikan ESP32 ada, jika belum buat baru
        let esp32 = await prisma.esp32.findUnique({ where: { mac_address } });
        if (!esp32) {
            esp32 = await prisma.esp32.create({
                data: { mac_address, qrcode, isUsed: true }
            });
        } else {
            await prisma.esp32.update({
                where: { mac_address },
                data: { qrcode, isUsed: true }
            });
        }

        // Cek apakah PlayerID sudah ada
        const existingPlayer = await prisma.personel.findUnique({ where: { PlayerID: esp32.id } });
        if (existingPlayer) {
            // Delete old player if they want to override, or just reject. Reject for now.
            // Wait, we should probably delete the old player or return conflict.
            return res.status(409).json({ success: false, message: "Rompi ini sudah terdaftar ke pemain lain. Hapus pemain lama terlebih dahulu di Team Info." });
        }

        const formattedTeam = selectedTeam ? selectedTeam.replace(/\s+/g, "") : "TeamA";

        const newPlayer = await prisma.personel.create({
            data: {
                name,
                selectedTeam: formattedTeam,
                PlayerID: esp32.id,
            },
        });

        res.status(201).json({
            success: true,
            message: "QR Registration successful.",
            player: newPlayer,
        });
    } catch (error) {
        console.error("Error registering QR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export default { scanQr, registerQr };
