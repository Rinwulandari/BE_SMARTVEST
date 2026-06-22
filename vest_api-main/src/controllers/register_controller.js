import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 📌 Register a new ESP32
const registerESP32 = async (req, res) => {
    try {
        const { mac_address } = req.body; 

        // Validasi format MAC address
        const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i;
        if (!macRegex.test(mac_address)) {
            return res.status(400).json({ success: false, message: 'Invalid MAC address format.' });
        }

        const existingESP32 = await prisma.esp32.findUnique({
            where: { mac_address }
        });

        if (existingESP32) {
            return res.status(400).json({ success: false, message: 'MAC address sudah terdaftar.' });
        }

        const newESP32 = await prisma.esp32.create({
            data: { mac_address }
        });

        res.json({ success: true, message: 'MAC address berhasil ditambahkan.', esp32: newESP32 });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

// 📌 Get all ESP32 data
const getESP32s = async (req, res) => {
    try {
        const esp32s = await prisma.esp32.findMany({
            where: { isUsed: false }, // Hanya ambil yang belum digunakan
            select: {
                id: true,
                mac_address: true,
            },
        });

        // Konversi MAC address menjadi format ID
        const formattedESP32s = esp32s.map((esp32, index) => ({
            id: `ID-${String(esp32.id).padStart(3, '0')}`, // Format ID-001, ID-002, ...
            mac_address: esp32.mac_address,
        }));

        res.json({
            success: true,
            esp32s: formattedESP32s,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        });
    }
};

// 📌 Register a new Player (Auto-assign team)
const registerPlayer = async (req, res) => {
    try {
        console.log("Request Body:", req.body);

        const { name, mac_address, selectedTeam } = req.body;

        // Validasi nama
        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        // Validasi format MAC address
        const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i;
        if (!mac_address || !macRegex.test(mac_address)) {
            return res.status(400).json({ success: false, message: "Valid mac_address is required" });
        }

        // Cek apakah ESP32 ada di database
        const existingESP32 = await prisma.esp32.findUnique({ where: { mac_address } });
        if (!existingESP32) {
            return res.status(400).json({ success: false, message: "ESP32 ID not found" });
        }

        // Cek apakah PlayerID sudah ada di personel
        const existingPlayer = await prisma.personel.findUnique({ where: { PlayerID: existingESP32.id } });
        if (existingPlayer) {
            return res.status(409).json({ success: false, message: "Player with this ID already exists." });
        }

        // Ubah "Team A" -> "TeamA" untuk ENUM Prisma
        const formattedTeam = selectedTeam.replace(/\s+/g, "");

        // Simpan data pemain baru
        const newPlayer = await prisma.personel.create({
            data: {
                name,
                selectedTeam: formattedTeam,
                PlayerID: existingESP32.id, // Gunakan mac_address dari ESP32 sebagai PlayerID
            },
        });

        // Update status ESP32 menjadi sudah digunakan
        await prisma.esp32.update({
            where: { mac_address: existingESP32.mac_address },
            data: { isUsed: true },
        });

        res.json({
            success: true,
            message: "Player registered successfully.",
            player: newPlayer,
        });
    } catch (error) {
        console.error("Error registering player:", error);
        res.status(500).json({
            success: false,
            message: "Server error while registering player.",
            error: error.message,
        });
    }
};


// 📌 Get all Players
const getPlayers = async (req, res) => {
  try {
    const players = await prisma.personel.findMany({
      select: {
        id: true, // ID auto-increment
        name: true,
        PlayerID: true, // Ambil PlayerID dari database
        selectedTeam: true,
        health: true,
        esp32: {select: { mac_address: true }}, // Ambil MAC address dari relasi ESP32
      },
    });

    // Konversi PlayerID menjadi format sederhana
    const formattedPlayers = players.map((personel) => ({
      id: personel.id,
      name: personel.name,
      displayId: `ID-${String(personel.PlayerID).padStart(3, '0')}`, // Format ID-001
      PlayerID: personel.PlayerID, // Sertakan PlayerID sebagai int
      selectedTeam: personel.selectedTeam,
      health: personel.health,
      mac_address: personel.esp32?.mac_address || null, // Ambil MAC address dari relasi ESP32
    }));

    res.json({ success: true, players: formattedPlayers });
  } catch (error) {
    console.error("Error in getPlayers:", error);
    res.status(500).json({ success: false, message: `Error: ${error.message}` });
  }
};

// 📌 Export all controllers
export default {
    registerESP32,
    getESP32s,
    registerPlayer,
    getPlayers,
};
