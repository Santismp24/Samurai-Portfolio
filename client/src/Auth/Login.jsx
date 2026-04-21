import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'
import { loginUser, saveSession } from '../services/auth.js'

const initialValue = {
  email: '',
  password: ''
}

export function Login() {
  const [login, setLogin] = useState(initialValue)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setLogin((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!login.email || !login.password) {
      setErrorMessage('Algún campo está sin rellenar')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await loginUser(login)

      saveSession({
        token: response.token,
        user: response.user
      })

      navigate('/reservas')
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'No se pudo iniciar sesión.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Form onSubmit={onSubmit}>
          <h2 className="auth-title">Iniciar sesión</h2>
          <p className="form-help">
            Accede a tu cuenta para gestionar tus reservas y continuar tu experiencia.
          </p>

          <Form.Group className="mb-3" controlId="formLoginEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Introduce tu email"
              name="email"
              value={login.email}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formLoginPassword">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              placeholder="Introduce tu contraseña"
              name="password"
              value={login.password}
              onChange={handleChange}
            />
          </Form.Group>

          <span className="errorMessage">{errorMessage}</span>

          <p className="auth-switch">
            ¿No tienes cuenta? <Link to="/register">Créala aquí</Link>
          </p>

          <div className="auth-actions">
            <Button className="btn-brand ms-1 me-1" variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Aceptar'}
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
