export const RESERVATION_SLOTS = ['13:30', '14:00', '14:30', '20:30', '21:00', '21:30']

export const RESERVATION_AREAS = {
  salon: {
    label: 'Salon',
    capacity: 16
  },
  barra: {
    label: 'Barra omakase',
    capacity: 6
  }
}

export const ACTIVE_RESERVATION_STATUSES = ['pending', 'confirmed']
export const ADMIN_USER_TYPES = new Set([2, 9])
