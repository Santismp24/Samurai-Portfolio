import db from '../config/db.js'
import { sendReservationReminder } from './emailService.js'

let reminderInterval = null

async function processReservationReminders() {
  const [rows] = await db.query(
    `
      SELECT *
      FROM reservations
      WHERE status = 'confirmed'
        AND reminder_sent_at IS NULL
        AND TIMESTAMP(reservation_date, reservation_time) BETWEEN DATE_ADD(NOW(), INTERVAL 23 HOUR)
        AND DATE_ADD(NOW(), INTERVAL 25 HOUR)
    `
  )

  for (const reservation of rows) {
    try {
      await sendReservationReminder(reservation)
      await db.query(
        `
          UPDATE reservations
          SET reminder_sent_at = NOW()
          WHERE reservation_id = ?
        `,
        [reservation.reservation_id]
      )
    } catch (error) {
      console.warn(`No se pudo enviar recordatorio para ${reservation.reservation_code}:`, error.message)
    }
  }
}

export function startReservationReminders() {
  if (reminderInterval) {
    return
  }

  processReservationReminders().catch((error) => {
    console.warn('No se pudo ejecutar el barrido inicial de recordatorios:', error.message)
  })

  reminderInterval = setInterval(() => {
    processReservationReminders().catch((error) => {
      console.warn('No se pudo ejecutar el barrido de recordatorios:', error.message)
    })
  }, 15 * 60 * 1000)
}
