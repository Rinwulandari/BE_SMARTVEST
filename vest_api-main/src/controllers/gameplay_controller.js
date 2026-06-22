import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const getPlayers = async (req, res) => {
    try {
        const players = await prisma.personel.findMany({
          select: {
            name: true,
            selectedTeam: true,
            health: true,
            statusReady: true,
            esp32: { select: { mac_address: true, qrcode: true } },
          },
        });
        const result = players.map(p => ({
          ...p,
          mac_address: p.esp32?.mac_address ?? null,
          qrcode: p.esp32?.qrcode ?? null,
        }));
        res.json({ success: true, players: result });
    } catch (error) {
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
};

const updateStatusByMac = async (req, res) => {
  try {
    const { mac_address, status_ready } = req.body;

    if (!mac_address || typeof status_ready !== 'number') {
      return res.status(400).json({ error: 'Invalid input. Expected mac_address and status_ready.' });
    }
    if (![0, 1].includes(status_ready)) {
      return res.status(400).json({ error: 'Invalid status_ready value. Must be 0 or 1.' });
    }

    const esp32 = await prisma.esp32.findUnique({ where: { mac_address } });
    if (!esp32) {
      return res.status(404).json({ error: 'No esp32 found for the given MAC address.' });
    }

    const updated = await prisma.personel.updateMany({
      where: { PlayerID: esp32.id },
      data: { statusReady: status_ready === 1 }
    });

    if (updated.count > 0) {
      res.json({ message: 'Status updated successfully.' });
    } else {
      res.status(500).json({ error: 'No changes made.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};

const startButton = async (req, res) => {
    try {
        const teamAPlayerCount = await prisma.personel.count({
            where: { selectedTeam: "TeamA" },
        });

        const teamBPlayerCount = await prisma.personel.count({
            where: { selectedTeam: "TeamB" },
        });

        if (teamAPlayerCount === 0 || teamBPlayerCount === 0) {
            return res.json({ success: false, message: "Kedua tim harus memiliki minimal 1 pemain." });
        }

        const readyPlayersA = await prisma.personel.count({
            where: { selectedTeam: "TeamA", statusReady: true },
        });

        const readyPlayersB = await prisma.personel.count({
            where: { selectedTeam: "TeamB", statusReady: true },
        });

        const teamAReady = readyPlayersA === teamAPlayerCount;
        const teamBReady = readyPlayersB === teamBPlayerCount;

        if (teamAReady && teamBReady) {
            const newSessionId = crypto.randomUUID();
            await prisma.gameStatus.update({
                where: { id: 1 },
                data: { status: 1, sessionId: newSessionId },
            });

            await prisma.personel.updateMany({
                data: { statusWeapon: true }
            });

            return res.json({ success: true, message: "Kedua tim siap! Game bisa dimulai." });
        } else {
            return res.json({ success: false, message: "Belum semua pemain ready." });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const getStatus = async (req, res) => {
  try {
    const status = await checkGameStatus();
    const gameStatusData = await prisma.gameStatus.update({
      where: { id: 1 },
      data: { status },
    });
    res.json({ success: true, game_status: status, session_id: gameStatusData.sessionId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkGameStatus = async () => {
    try {
        const players = await prisma.personel.findMany();

        if (!players.length) {
            return 0; 
        }

        const teamA = players.filter(p => p.selectedTeam === "TeamA");
        const teamB = players.filter(p => p.selectedTeam === "TeamB");

        const allReady = teamA.length > 0 && teamB.length > 0 &&
                         teamA.every(p => p.statusReady) &&
                         teamB.every(p => p.statusReady);

        const currentGameStatus = await prisma.gameStatus.findUnique({
            where: { id: 1 },
        });

        if (!allReady) {
            return 0;
        }

        if (currentGameStatus?.status !== 1) {
            return currentGameStatus?.status || 0; 
        }

        const teamADead = teamA.length > 0 && teamA.every(p => typeof p.health === 'number' && p.health <= 0);
        const teamBDead = teamB.length > 0 && teamB.every(p => typeof p.health === 'number' && p.health <= 0);

        if (teamADead || teamBDead) {
            await prisma.gameStatus.update({
                where: { id: 1 },
                data: { status: 2 },
            });

            await prisma.personel.updateMany({
                data: { statusWeapon: false },
            });

            return 2; 
        }

        return 1; 

    } catch (error) {
        return 0;
    }
};

const endGameLogic = async (req, res) => {
    try {
        const gameStatus = await prisma.gameStatus.findUnique({ where: { id: 1 } });
        const sessionId = gameStatus?.sessionId || null;

        // Set status game ke 2 (finished)
        await prisma.gameStatus.update({
            where: { id: 1 },
            data: { status: 2 },
        });

        // Matikan senjata semua pemain
        await prisma.personel.updateMany({
            data: { statusWeapon: false },
        });

        return res.json({
            success: true,
            message: "Game status updated successfully.",
            session_id: sessionId,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const resetGameStatus = async (req, res) => {
    try {
        await prisma.gameStatus.update({
            where: { id: 1 },
            data: { status: 0, sessionId: null },
        });
        await prisma.personel.updateMany({
            data: { health: 100, statusReady: false, statusWeapon: false },
        });

        // Data Hitpoint & HitpointLog TIDAK dihapus agar history tiap sesi tetap tersimpan.
        // Data dipisahkan per sesi menggunakan sessionId.

        res.json({
            success: true,
            message: "Game status dan pemain berhasil direset. Data history sesi tetap tersimpan.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Database error: ${error.message}`,
        });
    }
};

const pauseGame = async (req, res) => {
    try {
        await prisma.gameStatus.update({
            where: { id: 1 },
            data: { status: 3 },
        });

        await prisma.personel.updateMany({
            data: { statusWeapon: false },
        });

        return res.json({
            success: true,
            message: "Game paused successfully.",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const resumeGame = async (req, res) => {
    try {
        await prisma.gameStatus.update({
            where: { id: 1 },
            data: { status: 1 },
        });

        await prisma.personel.updateMany({
            where: { health: { gt: 0 } },
            data: { statusWeapon: true },
        });

        return res.json({
            success: true,
            message: "Game resumed successfully.",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

export default {
    getPlayers,
    startButton,
    endGameLogic,
    getStatus,
    checkGameStatus,
    resetGameStatus,
    updateStatusByMac,
    pauseGame,
    resumeGame,
};
