import express from 'express';
import deletePlayerController from '../controllers/delete-player_controller.js';

const router = express.Router();

router.delete('/player/:mac_address', deletePlayerController.deletePlayer);
router.get('/esp32-status', deletePlayerController.syncEsp32Status);

export default router;