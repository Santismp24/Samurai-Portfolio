import api from './api.js'
import { readSession } from './auth.js'

function getAuthConfig() {
  const session = readSession()

  if (!session?.token) {
    return {}
  }

  return {
    headers: {
      Authorization: `Bearer ${session.token}`
    }
  }
}

export async function fetchAvailability(date) {
  const { data } = await api.get('/reservations/availability', {
    params: { date }
  })

  return data
}

export async function createReservation(payload) {
  const { data } = await api.post('/reservations', payload, getAuthConfig())
  return data
}

export async function fetchMyReservations() {
  const { data } = await api.get('/reservations/mine', getAuthConfig())
  return data
}

export async function cancelMyReservation(id) {
  const { data } = await api.patch(`/reservations/mine/${id}/cancel`, {}, getAuthConfig())
  return data
}

export async function fetchAdminReservations(filters = {}) {
  const { data } = await api.get('/reservations/admin', {
    ...getAuthConfig(),
    params: filters
  })

  return data
}

export async function updateAdminReservationStatus(id, status) {
  const { data } = await api.patch(
    `/reservations/admin/${id}/status`,
    { status },
    getAuthConfig()
  )

  return data
}
