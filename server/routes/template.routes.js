import express from 'express';
import { uploadTemplate as uploadCtrl, getTemplates, deleteTemplate } from '../controllers/template.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadTemplate } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/upload', authorize('admin', 'supervisor'), uploadTemplate.single('template'), uploadCtrl);
router.get('/', getTemplates);
router.delete('/:id', authorize('admin', 'supervisor'), deleteTemplate);

export default router;
