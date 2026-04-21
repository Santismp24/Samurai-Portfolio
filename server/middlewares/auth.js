import jwt from 'jsonwebtoken'
import { ADMIN_USER_TYPES } from '../config/reservationConfig.js'

function getBearerToken(header = '') {
  if (!header.startsWith('Bearer ')) {
    return null
  }

  return header.slice(7)
}

function decodeToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

export function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req.headers.authorization)

    if (!token) {
      return res.status(401).json({ message: 'Necesitas iniciar sesion.' })
    }

    req.user = decodeToken(token)
    return next()
  } catch {
    return res.status(401).json({ message: 'Sesion no valida o caducada.' })
  }
}

export function optionalAuth(req, _res, next) {
  try {
    const token = getBearerToken(req.headers.authorization)
    req.user = token ? decodeToken(token) : null
  } catch {
    req.user = null
  }

  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user || !ADMIN_USER_TYPES.has(Number(req.user.type))) {
    return res.status(403).json({ message: 'No tienes permisos para esta seccion.' })
  }

  return next()
}
