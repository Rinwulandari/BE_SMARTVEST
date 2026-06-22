import express from 'express';
import HitpointController from '../controllers/hitpoint_controller.js';

const router = express.Router();

// Endpoint untuk mendapatkan data hitpoint
router.get('/', HitpointController.getHitpoints);

router.get('/log/:name', HitpointController.getHitpointLog);

router.post('/healthUpdate', HitpointController.updateHealthHitpoint);
router.post('/shoot', HitpointController.shoot);

// Endpoint untuk history multi-sesi
router.get('/sessions', HitpointController.getSessions);
router.get('/by-session/:sessionId', HitpointController.getHitpointsBySession);

export default router;