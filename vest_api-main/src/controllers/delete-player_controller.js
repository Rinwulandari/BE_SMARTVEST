import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const deletePlayer = async (req, res) => {
    // menghapus pemain berdasarkan mac_address
    try {
        const { mac_address } = req.params;  

        if (!mac_address) {
            return res.status(400).json({ success: false, message: "Invalid mac_address" });
        }

        const existingEsp32 = await prisma.esp32.findUnique({
            where: { mac_address: mac_address },
            include: { players: true }, 
        });

        if (!existingEsp32 || existingEsp32.players.length === 0) {
            return res.status(404).json({ success: false, message: "Player not found" });
        }

        const existingPlayer = existingEsp32.players[0]; 

        await prisma.personel.delete({
            where: { PlayerID: existingPlayer.PlayerID }, 
        });

        // Update status dari ESP32 menjadi tidak digunakan
        await prisma.esp32.update({
            where: { id: existingEsp32.id },
            data: { isUsed: false },
        });

        res.json({
            success: true,
            message: "Player deleted successfully.",
        });
    } catch (error) {
        console.error("Error deleting player:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting player.",
            error: error.message,
        });
    }
};

const syncEsp32Status = async (req, res) => {
    try {
        const unusedEsp32s = await prisma.esp32.findMany({
            where: {
                id: {
                    notIn: await prisma.personel.findMany({
                        select: { PlayerID: true },
                        where: { PlayerID: { not: null } },
                    }).then((players) => players.map((player) => player.PlayerID)),
                },
            },
        });

        await prisma.esp32.updateMany({
            where: {
                id: {
                    in: unusedEsp32s.map((esp32) => esp32.id),
                },
            },
            data: { isUsed: false },
        });

        res.json({
            success: true,
            message: "ESP32 statuses synchronized successfully.",
        });
    } catch (error) {
        console.error("Error synchronizing ESP32 statuses:", error);
        res.status(500).json({
            success: false,
            message: "Server error while synchronizing ESP32 statuses.",
            error: error.message,
        });
    }
};

export default {
    deletePlayer,
    syncEsp32Status,
};