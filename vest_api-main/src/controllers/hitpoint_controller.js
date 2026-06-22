import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bodyZoneToSensors = {
  1: [6, 7, 8, 9, 10],       // BAHU_KIRI
  2: [1, 2, 3, 4, 5],        // BAHU_KANAN
  3: [11, 12, 13, 14],       // JANTUNG/Dada
  4: [15, 27, 28, 29, 30],   // RUSUK_KANAN
  5: [16, 22, 23, 24, 25],   // RUSUK_KIRI
  6: [17, 18, 21, 32],       // PINGGANG_KIRI
  7: [19, 20, 26, 31],       // PINGGANG_KANAN
  8: [33, 34, 35, 36, 37],   // PUSAR
};

function getHitpointFromSensor(sensorId) {
  for (const [zone, sensors] of Object.entries(bodyZoneToSensors)) {
    if (sensors.includes(sensorId)) return parseInt(zone);
  }
  return 0; // Unknown
}

// Endpoint untuk mengambil data hitpoint
const getHitpoints = async (req, res) => {
  try {
    const status = await prisma.gameStatus.findUnique({ where: { id: 1 } });
    if (!status || !status.sessionId) {
      return res.json({ success: true, hitpoints: [] });
    }

    const hitpoints = await prisma.hitpoint.findMany({
      where: { sessionId: status.sessionId },
      orderBy: { id: 'desc' },
      select: {
        name: true,
        team: true,
        hitpoint: true,
        adcValue: true,
        timestamp: true,
      }
    });
    res.json({ success: true, hitpoints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Endpoint untuk mengambil log hitpoint berdasarkan nama
const getHitpointLog = async (req, res) => {
  try {
    const { name } = req.params;
    const { sessionId } = req.query; // Ambil sessionId dari query

    const whereClause = { name };
    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    const logs = await prisma.hitpointLog.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        hitpoint: true,
        sensorId: true,
        spreadSensors: true,
        adcValue: true,
        timestamp: true,
      }
    });
    res.json({ success: true, log: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Endpoint untuk update health & log hitpoint berdasarkan MAC address
const updateHealthHitpoint = async (req, res) => {
  try {
    const { mac_address, health, sensorId, spreadSensors, adcValue } = req.body;
    let { hitpoint } = req.body;

    if (!mac_address || typeof health !== 'number') {
      return res.status(400).json({ message: 'Data tidak lengkap (mac_address atau health tidak ada).' });
    }

    // Pastikan game sedang aktif berjalan (status == 1)
    const gameStatus = await prisma.gameStatus.findUnique({ where: { id: 1 } });
    if (!gameStatus || gameStatus.status !== 1) {
      return res.status(400).json({ message: 'Permainan sedang tidak aktif (jeda atau belum mulai).' });
    }

    // Jika hardware hanya mengirimkan sensorId tanpa hitpoint, kita hitung otomatis
    if (typeof hitpoint !== 'number' && typeof sensorId === 'number') {
      hitpoint = getHitpointFromSensor(sensorId);
    }

    if (typeof hitpoint !== 'number') {
       return res.status(400).json({ message: 'Data tidak lengkap (sensorId atau hitpoint tidak ada).' });
    }
    // Cari ESP32 berdasarkan mac_address
    const esp32 = await prisma.esp32.findUnique({ where: { mac_address } });
    if (!esp32) {
      return res.status(404).json({ message: 'MAC address tidak ditemukan.' });
    }
    // Cari player yang terkait dengan ESP32 ini
    const player = await prisma.personel.findFirst({ where: { PlayerID: esp32.id } });
    if (!player) {
      return res.status(404).json({ message: 'Player tidak ditemukan untuk ESP32 ini.' });
    }

    // Jika sensorId berada di zona Jantung (Zona 3: sensors 11, 12, 13, 14), HP langsung dikurangi 100 (menjadi 0)
    let finalHealth = health;
    if (sensorId && bodyZoneToSensors[3].includes(sensorId)) {
      finalHealth = Math.max(0, (player.health ?? 100) - 100);
    }

    // Update health dan statusWeapon
    await prisma.personel.update({
      where: { id: player.id },
      data: { 
        health: finalHealth,
        statusWeapon: finalHealth === 0 ? false : undefined
      },
    });

    // Ambil sessionId aktif
    const activeSessionId = gameStatus?.sessionId || null;

    // Masukkan data hitpoint ke tabel Hitpoint
    await prisma.hitpoint.create({
      data: {
        name: player.name,
        team: player.selectedTeam,
        hitpoint: hitpoint,
        sensorId: sensorId,
        spreadSensors: spreadSensors ? JSON.stringify(spreadSensors) : null,
        adcValue: typeof adcValue === 'number' ? adcValue : null,
        sessionId: activeSessionId
      }
    });
    // Masukkan data ke tabel HitpointLog
    await prisma.hitpointLog.create({
      data: {
        name: player.name,
        hitpoint: hitpoint,
        sensorId: sensorId,
        spreadSensors: spreadSensors ? JSON.stringify(spreadSensors) : null,
        adcValue: typeof adcValue === 'number' ? adcValue : null,
        sessionId: activeSessionId
      }
    });
    res.json({ message: 'Health dan hitpoint berhasil diperbarui.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};


// Endpoint untuk menembak: hit player dengan damage dan simpan log tembakan
const shoot = async (req, res) => {
  try {
    const { mac_address, damage = 1, sensorId, spreadSensors, adcValue } = req.body;
    let { hitpoint } = req.body;

    if (!mac_address || typeof damage !== 'number' || damage <= 0) {
      return res.status(400).json({ message: 'Data tidak lengkap atau damage tidak valid.' });
    }

    // Pastikan game sedang aktif berjalan (status == 1)
    const gameStatus = await prisma.gameStatus.findUnique({ where: { id: 1 } });
    if (!gameStatus || gameStatus.status !== 1) {
      return res.status(400).json({ message: 'Permainan sedang tidak aktif (jeda atau belum mulai).' });
    }

    if (typeof hitpoint !== 'number' && typeof sensorId === 'number') {
      hitpoint = getHitpointFromSensor(sensorId);
    }

    const esp32 = await prisma.esp32.findUnique({ where: { mac_address } });
    if (!esp32) {
      return res.status(404).json({ message: 'MAC address tidak ditemukan.' });
    }

    const player = await prisma.personel.findFirst({ where: { PlayerID: esp32.id } });
    if (!player) {
      return res.status(404).json({ message: 'Player tidak ditemukan untuk ESP32 ini.' });
    }

    // Jika nyawa sudah habis, abaikan tembakan ini agar tidak tercatat lagi
    if (player.health !== null && player.health <= 0) {
      return res.json({
        message: 'Pemain sudah mati. Tembakan diabaikan.',
        name: player.name,
        damage: 0,
        health: 0,
      });
    }

    // Jika sensorId berada di zona Jantung (Zona 3: sensors 11, 12, 13, 14), damage dipaksa menjadi 100
    let finalDamage = damage;
    if (sensorId && bodyZoneToSensors[3].includes(sensorId)) {
      finalDamage = 100;
    }

    const newHealth = Math.max(0, (player.health ?? 100) - finalDamage);

    await prisma.personel.update({
      where: { id: player.id },
      data: {
        health: newHealth,
        statusWeapon: newHealth === 0 ? false : undefined,
      },
    });

    const activeSessionId = gameStatus?.sessionId || null;

    await prisma.hitpoint.create({
      data: {
        name: player.name,
        team: player.selectedTeam,
        hitpoint: hitpoint ?? damage, // Use calculated hitpoint if available
        sensorId: sensorId,
        spreadSensors: spreadSensors ? JSON.stringify(spreadSensors) : null,
        adcValue: typeof adcValue === 'number' ? adcValue : null,
        sessionId: activeSessionId
      },
    });

    await prisma.hitpointLog.create({
      data: {
        name: player.name,
        hitpoint: hitpoint ?? damage,
        sensorId: sensorId,
        spreadSensors: spreadSensors ? JSON.stringify(spreadSensors) : null,
        adcValue: typeof adcValue === 'number' ? adcValue : null,
        sessionId: activeSessionId
      },
    });

    res.json({
      message: 'Tembakan tercatat.',
      name: player.name,
      damage,
      health: newHealth,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Endpoint: daftar semua sesi yang pernah ada
const getSessions = async (req, res) => {
  try {
    const allHitpoints = await prisma.hitpoint.findMany({
      where: { sessionId: { not: null } },
      select: { sessionId: true, team: true }
    });

    const sessionTeamsMap = {};
    for (const h of allHitpoints) {
      if (!sessionTeamsMap[h.sessionId]) {
        sessionTeamsMap[h.sessionId] = { teamAHits: 0, teamBHits: 0 };
      }
      const teamUpper = h.team ? h.team.toUpperCase() : '';
      if (teamUpper === 'TEAMA' || teamUpper === 'ALPHA') {
        sessionTeamsMap[h.sessionId].teamAHits++;
      } else if (teamUpper === 'TEAMB' || teamUpper === 'BRAVO') {
        sessionTeamsMap[h.sessionId].teamBHits++;
      }
    }

    // Ambil semua hitpoint yang punya sessionId, group by sessionId
    const grouped = await prisma.hitpoint.groupBy({
      by: ['sessionId'],
      where: { sessionId: { not: null } },
      _count: { id: true },
      _min: { timestamp: true },
      _max: { timestamp: true },
      orderBy: { _min: { timestamp: 'asc' } },
    });

    const sessions = grouped.map((g, index) => {
      const teamStats = sessionTeamsMap[g.sessionId] || { teamAHits: 0, teamBHits: 0 };
      return {
        sessionId: g.sessionId,
        matchNumber: index + 1,
        startTime: g._min.timestamp,
        endTime: g._max.timestamp,
        totalHits: g._count.id,
        teamAHits: teamStats.teamAHits,
        teamBHits: teamStats.teamBHits,
      };
    });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Endpoint: ambil log hitpoint berdasarkan sessionId tertentu
const getHitpointsBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId diperlukan.' });
    }

    const logs = await prisma.hitpointLog.findMany({
      where: { sessionId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        hitpoint: true,
        sensorId: true,
        spreadSensors: true,
        adcValue: true,
        sessionId: true,
        timestamp: true,
      },
    });

    res.json({ success: true, sessionId, totalHits: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  // logHitpoint,
  getHitpoints,
  getHitpointLog,
  updateHealthHitpoint,
  shoot,
  getSessions,
  getHitpointsBySession,
};