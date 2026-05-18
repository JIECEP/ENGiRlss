import express from 'express';
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate
} from '../controllers/emailTemplate.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getEmailTemplates);
router.post('/', protect, createEmailTemplate);
router.put('/:id', protect, updateEmailTemplate);
router.delete('/:id', protect, deleteEmailTemplate);

export default router;
