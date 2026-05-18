import express from 'express';
import { getAllUsers, createSupervisor, updateUser, deleteUser, toggleUserStatus } from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getAllUsers);
router.post('/supervisor', createSupervisor);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;
