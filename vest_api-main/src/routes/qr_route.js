import express from 'express';
import qrController from '../controllers/qr_controller.js';

const router = express.Router();

router.post('/scan', qrController.scanQr);
router.post('/register', qrController.registerQr);

export default router;
