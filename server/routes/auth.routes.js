import express from 'express';
import { login, register, getMe, verifyEmail } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.get('/me', protect, getMe);

export default router;
