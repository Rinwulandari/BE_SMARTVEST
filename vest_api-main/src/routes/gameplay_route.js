import express from 'express';
import GameplayController from '../controllers/gameplay_controller.js';

const router = express.Router();

router.get('/players', GameplayController.getPlayers);

router.post('/start-button', GameplayController.startButton);
router.post('/end', GameplayController.endGameLogic);
router.post('/pause', GameplayController.pauseGame);
router.post('/resume', GameplayController.resumeGame);
router.get('/status', GameplayController.getStatus);

router.get('/check-status', GameplayController.checkGameStatus);

// untuk melihat status pemain
router.post('/status-by-mac', GameplayController.updateStatusByMac);

// 🔥 Endpoint untuk mereset game
router.post('/reset', GameplayController.resetGameStatus);

export default router;
