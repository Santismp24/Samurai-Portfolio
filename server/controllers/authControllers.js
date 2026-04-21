import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from '../config/db.js'

function createToken(user) {
  return jwt.sign(
    {
      userId: user.user_id,
      email: user.email,
      type: user.type
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
}

function buildUserResponse(user) {
  return {
    id: user.user_id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    type: user.type
  }
}

export async function register(req, res) {
  const { name, lastname = '', email, password } = req.body

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({
      message: 'Nombre, email y contraseña son obligatorios.'
    })
  }

  if (password.trim().length < 6) {
    return res.status(400).json({
      message: 'La contraseña debe tener al menos 6 caracteres.'
    })
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()
    const [existingUsers] = await db.query(
      'SELECT user_id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: 'Ya existe una cuenta con ese email.'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const [result] = await db.query(
      `
        INSERT INTO users (name, lastname, email, password)
        VALUES (?, ?, ?, ?)
      `,
      [name.trim(), lastname.trim(), normalizedEmail, hashedPassword]
    )

    const user = {
      user_id: result.insertId,
      name: name.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail,
      type: 1
    }

    return res.status(201).json({
      message: 'Usuario creado correctamente.',
      token: createToken(user),
      user: buildUserResponse(user)
    })
  } catch (error) {
    return res.status(500).json({
      message: 'No se pudo registrar el usuario.'
    })
  }
}

export async function login(req, res) {
  const { email, password } = req.body

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({
      message: 'Email y contraseña son obligatorios.'
    })
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()
    const [users] = await db.query(
      `
        SELECT user_id, name, lastname, email, password, type
        FROM users
        WHERE email = ? AND is_deleted = 0
        LIMIT 1
      `,
      [normalizedEmail]
    )

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Credenciales incorrectas.'
      })
    }

    const user = users[0]
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({
        message: 'Credenciales incorrectas.'
      })
    }

    return res.status(200).json({
      message: 'Inicio de sesión correcto.',
      token: createToken(user),
      user: buildUserResponse(user)
    })
  } catch (error) {
    return res.status(500).json({
      message: 'No se pudo iniciar sesión.'
    })
  }
}
