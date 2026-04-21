import { useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import './Navbar.css'
import '../Botones/Botones.css'
import { clearSession, readSession } from '../services/auth.js'

const publicLinks = [
  { to: '/menu', label: 'Carta' },
  { to: '/bebidas', label: 'Bebidas' },
  { to: '/reservas', label: 'Reservas' },
  { to: '/sobrenosotros', label: 'Sobre Nosotros' }
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const session = useMemo(() => readSession(), [location.pathname])
  const isAdmin = [2, 9].includes(Number(session?.user?.type))

  const authLinks = session
    ? [
        { to: '/reservas', label: isAdmin ? 'Panel' : 'Mis reservas' },
        { action: 'logout', label: 'Salir' }
      ]
    : [
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Registro' }
      ]

  const closeMenu = () => setIsOpen(false)

  const handleLogout = () => {
    clearSession()
    closeMenu()
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-custom">
      <div className="container-fluid navbar-shell">
        <NavLink className="navbar-brand" to="/home" onClick={closeMenu}>
          Samurai
        </NavLink>

        <button
          className="navbar-toggler custom-toggler"
          type="button"
          aria-label="Abrir navegación"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          Menu
        </button>

        <div className={`navbar-collapse ${isOpen ? 'is-open' : ''}`} id="navbarNav">
          <ul className="navbar-nav">
            {publicLinks.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  to={link.to}
                  onClick={closeMenu}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar-auth">
            {session?.user?.name ? (
              <span className="navbar-user">Hola, {session.user.name}</span>
            ) : null}

            {authLinks.map((link) =>
              link.action === 'logout' ? (
                <button className="nav-auth-button" key={link.action} onClick={handleLogout}>
                  {link.label}
                </button>
              ) : (
                <NavLink
                  className={({ isActive }) => `nav-link nav-link-auth${isActive ? ' active' : ''}`}
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                >
                  {link.label}
                </NavLink>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
