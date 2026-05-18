import express from 'express';
import { createEvent, getEvents, getEvent, updateEvent, deleteEvent } from '../controllers/event.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin', 'supervisor'), createEvent);
router.get('/', getEvents);
router.get('/:id', getEvent);
router.put('/:id', authorize('admin', 'supervisor'), updateEvent);
router.delete('/:id', authorize('admin', 'supervisor'), deleteEvent);

export default router;
