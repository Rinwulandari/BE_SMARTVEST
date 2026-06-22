import express from 'express';
import { register, login, profile } from '../controllers/auth_controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/regis', register);
router.post('/login', login);
router.get('/profile', verifyToken, profile); 

export default router;
