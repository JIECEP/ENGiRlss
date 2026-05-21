import express from 'express';
import { getProjects, createProject, deleteProject } from '../controllers/project.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getProjects);
router.post('/', protect, authorize('admin'), createProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);

export default router;
