import express from 'express';
const router = express.Router();

// autentikasi
//===========================================================
import authRouter from './auth_route.js';
//===========================================================

// Tambah dan hapus pemain
//===========================================================
import registerRouter from './register_route.js';
import deleteRouter from './delete-player_route.js';
import qrRouter from './qr_route.js';
//===========================================================

// Gampelay System
//===========================================================
import gameplayRouter from './gameplay_route.js';
import gameSessionRouter from './game-session_route.js';
import HitpointRouter from './hitpoint_route.js';
//===========================================================


// autentikasi
//===========================================================
router.use('/auth', authRouter);
//===========================================================

// Tambah dan hapus pemain
//===========================================================
router.use('/delete', deleteRouter);
router.use('/add', registerRouter);
router.use('/qr', qrRouter);
//===========================================================

// Gampelay System
//===========================================================
router.use('/game-sessions', gameSessionRouter);
router.use('/hitpoint', HitpointRouter);
router.use('/gameplay', gameplayRouter);
//===========================================================

export default router;
