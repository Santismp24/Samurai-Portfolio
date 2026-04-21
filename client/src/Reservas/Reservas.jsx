import { useEffect, useState } from 'react'
import { Button, Form, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import './Reservas.css'
import { readSession } from '../services/auth.js'
import {
  cancelMyReservation,
  createReservation,
  fetchAdminReservations,
  fetchAvailability,
  fetchMyReservations,
  updateAdminReservationStatus
} from '../services/reservations.js'

const initialForm = {
  name: '',
  lastname: '',
  email: '',
  phone: '',
  date: '',
  time: '',
  partySize: 2,
  area: 'salon',
  notes: ''
}

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No asistio'
}

function getTomorrowDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

function getTodayDate() {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

function buildFormFromSession(session) {
  return {
    ...initialForm,
    date: getTomorrowDate(),
    name: session?.user?.name || '',
    lastname: session?.user?.lastname || '',
    email: session?.user?.email || ''
  }
}

function areaLabel(area) {
  return area === 'barra' ? 'Barra omakase' : 'Salon'
}

export function Reservas() {
  const [session, setSession] = useState(() => readSession())
  const [form, setForm] = useState(() => buildFormFromSession(readSession()))
  const [availability, setAvailability] = useState([])
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [myReservations, setMyReservations] = useState([])
  const [isLoadingMine, setIsLoadingMine] = useState(false)
  const [adminReservations, setAdminReservations] = useState([])
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false)
  const [adminFilters, setAdminFilters] = useState({
    date: getTodayDate(),
    status: ''
  })

  const isLoggedIn = Boolean(session?.token)
  const isAdmin = [2, 9].includes(Number(session?.user?.type))

  useEffect(() => {
    const nextSession = readSession()
    setSession(nextSession)
    setForm((current) => ({
      ...current,
      ...buildFormFromSession(nextSession),
      phone: current.phone,
      notes: current.notes,
      partySize: current.partySize,
      area: current.area,
      time: current.time,
      date: current.date || getTomorrowDate()
    }))
  }, [])

  useEffect(() => {
    if (!form.date) {
      return
    }

    let isMounted = true
    setIsLoadingAvailability(true)

    fetchAvailability(form.date)
      .then((response) => {
        if (!isMounted) {
          return
        }

        setAvailability(response.slots)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        setFeedback({
          type: 'error',
          message: error.response?.data?.message || 'No se pudo cargar la disponibilidad.'
        })
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAvailability(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [form.date])

  useEffect(() => {
    if (!isLoggedIn) {
      setMyReservations([])
      setAdminReservations([])
      return
    }

    let isMounted = true
    setIsLoadingMine(true)

    fetchMyReservations()
      .then((response) => {
        if (isMounted) {
          setMyReservations(response.reservations)
        }
      })
      .catch(() => {
        if (isMounted) {
          setMyReservations([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMine(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isAdmin) {
      setAdminReservations([])
      return
    }

    let isMounted = true
    setIsLoadingAdmin(true)

    fetchAdminReservations(adminFilters)
      .then((response) => {
        if (isMounted) {
          setAdminReservations(response.reservations)
        }
      })
      .catch(() => {
        if (isMounted) {
          setAdminReservations([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAdmin(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [adminFilters, isAdmin])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value
    }))
  }

  const handleSelectSlot = (time, area) => {
    setForm((current) => ({
      ...current,
      time,
      area
    }))
  }

  const refreshReservations = async () => {
    if (!isLoggedIn) {
      return
    }

    const mine = await fetchMyReservations()
    setMyReservations(mine.reservations)

    if (isAdmin) {
      const admin = await fetchAdminReservations(adminFilters)
      setAdminReservations(admin.reservations)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback({ type: '', message: '' })

    if (!form.time) {
      setFeedback({
        type: 'error',
        message: 'Selecciona una franja disponible antes de enviar la reserva.'
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await createReservation({
        ...form,
        partySize: Number(form.partySize)
      })

      setFeedback({
        type: 'success',
        message: `${response.message} Codigo de reserva: ${response.reservation.code}.`
      })

      setForm((current) => ({
        ...current,
        notes: '',
        time: ''
      }))

      const availabilityResponse = await fetchAvailability(form.date)
      setAvailability(availabilityResponse.slots)
      await refreshReservations()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'No se pudo completar la reserva.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelReservation = async (reservationId) => {
    const confirmed = window.confirm('¿Quieres cancelar esta reserva?')

    if (!confirmed) {
      return
    }

    try {
      const response = await cancelMyReservation(reservationId)
      setFeedback({ type: 'success', message: response.message })
      await refreshReservations()
      const availabilityResponse = await fetchAvailability(form.date)
      setAvailability(availabilityResponse.slots)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'No se pudo cancelar la reserva.'
      })
    }
  }

  const handleAdminStatusChange = async (reservationId, status) => {
    try {
      const response = await updateAdminReservationStatus(reservationId, status)
      setFeedback({ type: 'success', message: response.message })
      await refreshReservations()
      const availabilityResponse = await fetchAvailability(form.date)
      setAvailability(availabilityResponse.slots)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'No se pudo actualizar la reserva.'
      })
    }
  }

  if (isAdmin) {
    return (
      <main className="reservas">
        <section className="reservas-hero">
          <div className="reservas-panel">
            <span className="reservas-eyebrow">Panel admin</span>
            <h1>Reservas recibidas</h1>
            <p>
              Vista interna para revisar rapidamente quien ha reservado, cuando viene y en que
              estado esta cada mesa.
            </p>
          </div>
        </section>

        <section className="dashboard-grid dashboard-grid-admin-only">
          <section className="dashboard-card admin-card">
            <div className="section-heading">
              <span>Operacion</span>
              <h2>Listado de reservas</h2>
            </div>

            {feedback.message ? (
              <div className={`feedback feedback-${feedback.type}`}>
                {feedback.message}
              </div>
            ) : null}

            <div className="admin-filters">
              <Form.Control
                type="date"
                value={adminFilters.date}
                onChange={(event) =>
                  setAdminFilters((current) => ({ ...current, date: event.target.value }))
                }
              />
              <Form.Select
                value={adminFilters.status}
                onChange={(event) =>
                  setAdminFilters((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Completada</option>
                <option value="no_show">No asistio</option>
              </Form.Select>
            </div>

            {isLoadingAdmin ? (
              <div className="loading-box">
                <Spinner animation="border" size="sm" /> Cargando panel...
              </div>
            ) : adminReservations.length === 0 ? (
              <p className="empty-state">No hay reservas con ese filtro.</p>
            ) : (
              <div className="reservation-list">
                {adminReservations.map((reservation) => (
                  <article className="reservation-item reservation-item-admin" key={reservation.id}>
                    <div className="reservation-admin-main">
                      <strong>
                        {reservation.name} {reservation.lastname}
                      </strong>
                      <p>{reservation.email}</p>
                      <p>
                        {reservation.date} · {reservation.time}
                      </p>
                      <p>
                        {reservation.partySize} personas · {areaLabel(reservation.area)}
                      </p>
                    </div>

                    <div className="reservation-admin-side">
                      <span className={`status-pill status-${reservation.status}`}>
                        {statusLabels[reservation.status] || reservation.status}
                      </span>

                      <div className="admin-actions">
                        {['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            className={reservation.status === status ? 'is-active' : ''}
                            onClick={() => handleAdminStatusChange(reservation.id, status)}
                          >
                            {statusLabels[status]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    )
  }

  return (
    <main className="reservas">
      <section className="reservas-hero">
        <div className="reservas-panel">
          <span className="reservas-eyebrow">Reserva recomendada</span>
          <h1>Tu mesa, sin esperas</h1>
          <p>
            Cierra la experiencia completa: seleccion de franja, control de aforo,
            confirmacion por correo y gestion posterior desde la propia app.
          </p>

          <div className="reservas-grid">
            <article>
              <h2>Horario</h2>
              <p>Comidas de 13:30 a 15:30 y cenas de 20:30 a 23:00.</p>
            </article>
            <article>
              <h2>Contacto</h2>
              <p>+34 600 123 456 · reservas@samurai-demo.com</p>
            </article>
          </div>

          <div className="reservas-highlight">
            <div>
              <strong>Login recomendado</strong>
              <p>Con cuenta podras confirmar al instante, revisar tus reservas y cancelarlas.</p>
            </div>
            {!isLoggedIn ? (
              <div className="reservas-inline-links">
                <Link to="/login">Entrar</Link>
                <Link to="/register">Crear cuenta</Link>
              </div>
            ) : (
              <span className="reservas-session-tag">
                Sesion activa como {session.user.name}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="reservas-layout">
        <section className="booking-card">
          <div className="section-heading">
            <span>Reserva online</span>
            <h2>Confirma tu visita</h2>
          </div>

          {feedback.message ? (
            <div className={`feedback feedback-${feedback.type}`}>
              {feedback.message}
            </div>
          ) : null}

          <Form onSubmit={handleSubmit} className="booking-form">
            <div className="booking-form-grid">
              <Form.Group>
                <Form.Label>Nombre</Form.Label>
                <Form.Control name="name" value={form.name} onChange={handleChange} />
              </Form.Group>

              <Form.Group>
                <Form.Label>Apellido</Form.Label>
                <Form.Control name="lastname" value={form.lastname} onChange={handleChange} />
              </Form.Group>

              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Telefono</Form.Label>
                <Form.Control name="phone" value={form.phone} onChange={handleChange} />
              </Form.Group>

              <Form.Group>
                <Form.Label>Fecha</Form.Label>
                <Form.Control type="date" name="date" value={form.date} onChange={handleChange} />
              </Form.Group>

              <Form.Group>
                <Form.Label>Personas</Form.Label>
                <Form.Select name="partySize" value={form.partySize} onChange={handleChange}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                    <option key={size} value={size}>
                      {size} {size === 1 ? 'persona' : 'personas'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <Form.Group>
              <Form.Label>Notas para cocina o sala</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Alergias, celebracion o peticiones especiales"
              />
            </Form.Group>

            <div className="selected-slot">
              <span>Franja elegida</span>
              <strong>
                {form.time ? `${form.time} · ${areaLabel(form.area)}` : 'Todavia sin seleccionar'}
              </strong>
            </div>

            <div className="booking-actions">
              <Button className="btn-brand" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Reservar mesa'}
              </Button>
              {!isLoggedIn ? (
                <p className="booking-note">
                  Sin login la reserva entra como pendiente, pero recibiras tu correo HTML igualmente.
                </p>
              ) : (
                <p className="booking-note">
                  Con sesion activa la reserva se confirma al momento y se guarda en tu panel.
                </p>
              )}
            </div>
          </Form>
        </section>

        <aside className="availability-card">
          <div className="section-heading">
            <span>Aforo en tiempo real</span>
            <h2>Bloqueo de franjas</h2>
          </div>

          <p className="availability-copy">
            Cada bloque muestra las plazas libres por zona. Si un tramo no tiene hueco, no podra reservarse.
          </p>

          {isLoadingAvailability ? (
            <div className="loading-box">
              <Spinner animation="border" size="sm" /> Cargando disponibilidad...
            </div>
          ) : (
            <div className="availability-list">
              {availability.map((slot) => (
                <article className="slot-card" key={slot.time}>
                  <header>
                    <strong>{slot.time}</strong>
                    <span className={slot.available ? 'status-open' : 'status-closed'}>
                      {slot.available ? 'Disponible' : 'Completo'}
                    </span>
                  </header>

                  <div className="slot-areas">
                    {slot.areas.map((area) => {
                      const isSelected = form.time === slot.time && form.area === area.key

                      return (
                        <button
                          type="button"
                          key={area.key}
                          className={`slot-choice${isSelected ? ' is-selected' : ''}`}
                          disabled={!area.available}
                          onClick={() => handleSelectSlot(slot.time, area.key)}
                        >
                          <span>{area.label}</span>
                          <strong>{area.availableSeats} plazas libres</strong>
                        </button>
                      )
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="dashboard-grid">
        <section className="dashboard-card">
          <div className="section-heading">
            <span>Seguimiento</span>
            <h2>Mis reservas</h2>
          </div>

          {!isLoggedIn ? (
            <p className="empty-state">
              Inicia sesion para ver tu historial, cancelar reservas o confirmar al instante.
            </p>
          ) : isLoadingMine ? (
            <div className="loading-box">
              <Spinner animation="border" size="sm" /> Cargando tus reservas...
            </div>
          ) : myReservations.length === 0 ? (
            <p className="empty-state">Todavia no tienes reservas asociadas a tu cuenta.</p>
          ) : (
            <div className="reservation-list">
              {myReservations.map((reservation) => (
                <article className="reservation-item" key={reservation.id}>
                  <div>
                    <strong>
                      {reservation.date} · {reservation.time}
                    </strong>
                    <p>
                      {reservation.partySize} personas · {areaLabel(reservation.area)} · Codigo {reservation.code}
                    </p>
                  </div>

                  <div className="reservation-actions">
                    <span className={`status-pill status-${reservation.status}`}>
                      {statusLabels[reservation.status] || reservation.status}
                    </span>
                    {reservation.status !== 'cancelled' ? (
                      <button type="button" onClick={() => handleCancelReservation(reservation.id)}>
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {isAdmin ? (
          <section className="dashboard-card admin-card">
            <div className="section-heading">
              <span>Operacion</span>
              <h2>Panel admin</h2>
            </div>

            <div className="admin-filters">
              <Form.Control
                type="date"
                value={adminFilters.date}
                onChange={(event) =>
                  setAdminFilters((current) => ({ ...current, date: event.target.value }))
                }
              />
              <Form.Select
                value={adminFilters.status}
                onChange={(event) =>
                  setAdminFilters((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Completada</option>
                <option value="no_show">No asistio</option>
              </Form.Select>
            </div>

            {isLoadingAdmin ? (
              <div className="loading-box">
                <Spinner animation="border" size="sm" /> Cargando panel...
              </div>
            ) : adminReservations.length === 0 ? (
              <p className="empty-state">No hay reservas con ese filtro.</p>
            ) : (
              <div className="reservation-list">
                {adminReservations.map((reservation) => (
                  <article className="reservation-item reservation-item-admin" key={reservation.id}>
                    <div>
                      <strong>
                        {reservation.date} · {reservation.time} · {reservation.name} {reservation.lastname}
                      </strong>
                      <p>
                        {reservation.email} · {reservation.phone} · {reservation.partySize} personas ·{' '}
                        {areaLabel(reservation.area)}
                      </p>
                    </div>

                    <div className="admin-actions">
                      {['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={reservation.status === status ? 'is-active' : ''}
                          onClick={() => handleAdminStatusChange(reservation.id, status)}
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </section>
    </main>
  )
}
