import db from '../config/db.js'
import {
  ACTIVE_RESERVATION_STATUSES,
  RESERVATION_AREAS,
  RESERVATION_SLOTS
} from '../config/reservationConfig.js'
import { sendReservationConfirmation } from '../services/emailService.js'

function normalizeDate(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTime(value) {
  return typeof value === 'string' ? value.trim().slice(0, 5) : ''
}

function createReservationCode() {
  return `SMR-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now().toString().slice(-4)}`
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function formatTime(timeValue) {
  return typeof timeValue === 'string' ? timeValue.slice(0, 5) : timeValue
}

function formatReservation(row) {
  return {
    id: row.reservation_id,
    code: row.reservation_code,
    userId: row.user_id,
    name: row.guest_name,
    lastname: row.guest_lastname,
    email: row.guest_email,
    phone: row.guest_phone,
    date: row.reservation_date instanceof Date
      ? row.reservation_date.toISOString().slice(0, 10)
      : row.reservation_date,
    time: formatTime(row.reservation_time),
    partySize: row.party_size,
    area: row.area,
    notes: row.notes || '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

async function getOccupancy(date) {
  const [rows] = await db.query(
    `
      SELECT reservation_time, area, COALESCE(SUM(party_size), 0) AS occupiedSeats
      FROM reservations
      WHERE reservation_date = ?
        AND status IN (?, ?)
      GROUP BY reservation_time, area
    `,
    [date, ...ACTIVE_RESERVATION_STATUSES]
  )

  const occupancy = new Map()

  for (const row of rows) {
    const key = `${formatTime(row.reservation_time)}-${row.area}`
    occupancy.set(key, Number(row.occupiedSeats))
  }

  return occupancy
}

export async function getAvailability(req, res) {
  const date = normalizeDate(req.query.date)

  if (!isValidDate(date)) {
    return res.status(400).json({ message: 'Debes indicar una fecha valida.' })
  }

  try {
    const occupancy = await getOccupancy(date)

    const slots = RESERVATION_SLOTS.map((slot) => {
      const areas = Object.entries(RESERVATION_AREAS).map(([areaKey, areaConfig]) => {
        const occupiedSeats = occupancy.get(`${slot}-${areaKey}`) || 0
        const availableSeats = Math.max(areaConfig.capacity - occupiedSeats, 0)

        return {
          key: areaKey,
          label: areaConfig.label,
          capacity: areaConfig.capacity,
          occupiedSeats,
          availableSeats,
          available: availableSeats > 0
        }
      })

      return {
        time: slot,
        available: areas.some((area) => area.available),
        areas
      }
    })

    return res.status(200).json({ date, slots })
  } catch {
    return res.status(500).json({ message: 'No se pudo cargar la disponibilidad.' })
  }
}

export async function createReservation(req, res) {
  const {
    name,
    lastname = '',
    email,
    phone,
    date,
    time,
    partySize,
    area,
    notes = ''
  } = req.body

  const normalizedDate = normalizeDate(date)
  const normalizedTime = normalizeTime(time)
  const normalizedArea = typeof area === 'string' ? area.trim().toLowerCase() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : ''
  const normalizedName = typeof name === 'string' ? name.trim() : ''
  const normalizedLastname = typeof lastname === 'string' ? lastname.trim() : ''
  const parsedPartySize = Number(partySize)
  const requestedStatus = req.user ? 'confirmed' : 'pending'

  if (
    !normalizedName ||
    !normalizedEmail ||
    !normalizedPhone ||
    !isValidDate(normalizedDate) ||
    !RESERVATION_SLOTS.includes(normalizedTime) ||
    !RESERVATION_AREAS[normalizedArea] ||
    !Number.isInteger(parsedPartySize) ||
    parsedPartySize < 1 ||
    parsedPartySize > 8
  ) {
    return res.status(400).json({ message: 'Completa correctamente todos los campos de la reserva.' })
  }

  try {
    const occupancy = await getOccupancy(normalizedDate)
    const occupiedSeats = occupancy.get(`${normalizedTime}-${normalizedArea}`) || 0
    const availableSeats = RESERVATION_AREAS[normalizedArea].capacity - occupiedSeats

    if (parsedPartySize > availableSeats) {
      return res.status(409).json({
        message: 'No quedan suficientes plazas para esa franja. Prueba con otro horario o zona.'
      })
    }

    const reservationCode = createReservationCode()
    const [result] = await db.query(
      `
        INSERT INTO reservations (
          reservation_code,
          user_id,
          guest_name,
          guest_lastname,
          guest_email,
          guest_phone,
          reservation_date,
          reservation_time,
          party_size,
          area,
          notes,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        reservationCode,
        req.user?.userId || null,
        normalizedName,
        normalizedLastname,
        normalizedEmail,
        normalizedPhone,
        normalizedDate,
        `${normalizedTime}:00`,
        parsedPartySize,
        normalizedArea,
        notes.trim(),
        requestedStatus
      ]
    )

    const [rows] = await db.query(
      `
        SELECT *
        FROM reservations
        WHERE reservation_id = ?
        LIMIT 1
      `,
      [result.insertId]
    )

    const reservation = rows[0]

    sendReservationConfirmation(reservation)
      .then(async () => {
        await db.query(
          `
            UPDATE reservations
            SET confirmation_sent_at = NOW()
            WHERE reservation_id = ?
          `,
          [reservation.reservation_id]
        )
      })
      .catch((error) => {
        console.warn(`No se pudo enviar confirmacion para ${reservation.reservation_code}:`, error.message)
      })

    return res.status(201).json({
      message:
        requestedStatus === 'confirmed'
          ? 'Reserva confirmada y correo preparado.'
          : 'Solicitud recibida. Te hemos preparado un correo con el resumen.',
      reservation: formatReservation(reservation)
    })
  } catch {
    return res.status(500).json({ message: 'No se pudo registrar la reserva.' })
  }
}

export async function getMyReservations(req, res) {
  try {
    const [rows] = await db.query(
      `
        SELECT *
        FROM reservations
        WHERE user_id = ?
        ORDER BY reservation_date DESC, reservation_time DESC
      `,
      [req.user.userId]
    )

    return res.status(200).json({
      reservations: rows.map(formatReservation)
    })
  } catch {
    return res.status(500).json({ message: 'No se pudieron cargar tus reservas.' })
  }
}

export async function cancelMyReservation(req, res) {
  const reservationId = Number(req.params.id)

  if (!Number.isInteger(reservationId)) {
    return res.status(400).json({ message: 'Reserva no valida.' })
  }

  try {
    const [rows] = await db.query(
      `
        SELECT *
        FROM reservations
        WHERE reservation_id = ? AND user_id = ?
        LIMIT 1
      `,
      [reservationId, req.user.userId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontro la reserva.' })
    }

    if (rows[0].status === 'cancelled') {
      return res.status(200).json({
        message: 'La reserva ya estaba cancelada.',
        reservation: formatReservation(rows[0])
      })
    }

    await db.query(
      `
        UPDATE reservations
        SET status = 'cancelled'
        WHERE reservation_id = ?
      `,
      [reservationId]
    )

    const updatedReservation = {
      ...rows[0],
      status: 'cancelled'
    }

    return res.status(200).json({
      message: 'Reserva cancelada correctamente.',
      reservation: formatReservation(updatedReservation)
    })
  } catch {
    return res.status(500).json({ message: 'No se pudo cancelar la reserva.' })
  }
}

export async function getAdminReservations(req, res) {
  const date = normalizeDate(req.query.date)
  const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : ''

  const conditions = []
  const values = []

  if (isValidDate(date)) {
    conditions.push('reservation_date = ?')
    values.push(date)
  }

  if (status) {
    conditions.push('status = ?')
    values.push(status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const [rows] = await db.query(
      `
        SELECT *
        FROM reservations
        ${whereClause}
        ORDER BY reservation_date ASC, reservation_time ASC, created_at ASC
      `,
      values
    )

    return res.status(200).json({
      reservations: rows.map(formatReservation)
    })
  } catch {
    return res.status(500).json({ message: 'No se pudieron cargar las reservas del panel.' })
  }
}

export async function updateAdminReservationStatus(req, res) {
  const reservationId = Number(req.params.id)
  const nextStatus = typeof req.body.status === 'string' ? req.body.status.trim().toLowerCase() : ''
  const allowedStatuses = new Set(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])

  if (!Number.isInteger(reservationId) || !allowedStatuses.has(nextStatus)) {
    return res.status(400).json({ message: 'Cambio de estado no valido.' })
  }

  try {
    const [rows] = await db.query(
      `
        SELECT *
        FROM reservations
        WHERE reservation_id = ?
        LIMIT 1
      `,
      [reservationId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontro la reserva.' })
    }

    await db.query(
      `
        UPDATE reservations
        SET status = ?
        WHERE reservation_id = ?
      `,
      [nextStatus, reservationId]
    )

    const updatedReservation = {
      ...rows[0],
      status: nextStatus
    }

    if (nextStatus === 'confirmed') {
      sendReservationConfirmation(updatedReservation).catch((error) => {
        console.warn(`No se pudo reenviar confirmacion para ${updatedReservation.reservation_code}:`, error.message)
      })
    }

    return res.status(200).json({
      message: 'Estado actualizado correctamente.',
      reservation: formatReservation(updatedReservation)
    })
  } catch {
    return res.status(500).json({ message: 'No se pudo actualizar la reserva.' })
  }
}
