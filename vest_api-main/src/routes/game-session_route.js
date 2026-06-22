import express from 'express';
import gameSession from '../controllers/game-session_controller.js';

const router = express.Router();

router.post('/updateSessionNative', gameSession.updateSessionNative);

export default router;