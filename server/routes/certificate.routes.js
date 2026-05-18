import express from 'express';
import { generateCertificates, sendEmails, getCertificates, downloadCertificate, getStats } from '../controllers/certificate.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate', authorize('admin', 'supervisor'), generateCertificates);
router.post('/send-email', authorize('admin', 'supervisor'), sendEmails);
router.get('/', getCertificates);
router.get('/stats', getStats);
router.get('/download/:id', downloadCertificate);

export default router;
