import express from 'express'
import {
  cancelMyReservation,
  createReservation,
  getAdminReservations,
  getAvailability,
  getMyReservations,
  updateAdminReservationStatus
} from '../controllers/reservationControllers.js'
import { optionalAuth, requireAdmin, requireAuth } from '../middlewares/auth.js'

const router = express.Router()

router.get('/availability', getAvailability)
router.post('/', optionalAuth, createReservation)
router.get('/mine', requireAuth, getMyReservations)
router.patch('/mine/:id/cancel', requireAuth, cancelMyReservation)
router.get('/admin', requireAuth, requireAdmin, getAdminReservations)
router.patch('/admin/:id/status', requireAuth, requireAdmin, updateAdminReservationStatus)

export default router
