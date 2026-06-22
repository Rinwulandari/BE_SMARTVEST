import express from 'express';
import registerController from '../controllers/register_controller.js';

const router = express.Router();

// Routes for ESP32
router.post('/esp32', registerController.registerESP32);
router.get('/esp32', registerController.getESP32s);

// Routes for Player
router.post('/player', registerController.registerPlayer);
router.get('/player', registerController.getPlayers);

export default router;
