import api from './api.js'

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export function saveSession(session) {
  localStorage.setItem('samuraiAuth', JSON.stringify(session))
}

export function readSession() {
  const rawSession = localStorage.getItem('samuraiAuth')

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession)
  } catch {
    localStorage.removeItem('samuraiAuth')
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('samuraiAuth')
}
