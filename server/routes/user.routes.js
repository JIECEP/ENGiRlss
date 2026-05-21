import express from 'express';
import { getAllUsers, createSupervisor, updateUser, deleteUser, toggleUserStatus, updateProfile, uploadAvatarCtrl, getActivityLog } from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../middleware/upload.middleware.js';

const router = express.Router();

// Protected routes for all logged in users
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, uploadAvatar.single('avatar'), uploadAvatarCtrl);
router.get('/activity-log', protect, getActivityLog);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.post('/supervisor', protect, authorize('admin'), createSupervisor);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.patch('/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

export default router;
