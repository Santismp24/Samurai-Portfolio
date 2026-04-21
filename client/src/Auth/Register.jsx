import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'
import { registerUser, saveSession } from '../services/auth.js'

const initialValue = {
  name: '',
  lastname: '',
  email: '',
  password: ''
}

export function Register() {
  const [register, setRegister] = useState(initialValue)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setRegister((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!register.name || !register.email || !register.password) {
      setErrorMessage('Algún campo está sin rellenar')
      return
    }

    if (register.password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await registerUser(register)

      saveSession({
        token: response.token,
        user: response.user
      })

      navigate('/reservas')
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMessage('Email duplicado')
      } else {
        setErrorMessage(err.response?.data?.message || 'No se pudo crear la cuenta.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Form onSubmit={onSubmit}>
          <h2 className="auth-title">Crear cuenta</h2>
          <p className="form-help">
            Empieza tu perfil y guarda una sesión lista para tus próximas reservas.
          </p>

          <Form.Group className="mb-3" controlId="formBasicName">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              placeholder="Introduce tu nombre"
              name="name"
              value={register.name}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicLastname">
            <Form.Label>Apellido</Form.Label>
            <Form.Control
              type="text"
              placeholder="Introduce tu apellido"
              name="lastname"
              value={register.lastname}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Introduce tu email"
              name="email"
              value={register.email}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              placeholder="Crea una contraseña"
              name="password"
              value={register.password}
              onChange={handleChange}
            />
          </Form.Group>

          <span className="errorMessage">{errorMessage}</span>

          <p className="auth-switch">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>

          <div className="auth-actions">
            <Button className="btn-brand ms-1 me-1" variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Aceptar'}
            </Button>
            <Button
              className="btn-outline-brand ms-1 me-1"
              variant="secondary"
              type="button"
              onClick={() => navigate('/home')}
            >
              Cancelar
            </Button>
          </div>
        </Form>
      </section>
    </main>
  )
}
