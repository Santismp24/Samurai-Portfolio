import { Link } from 'react-router-dom'
import './Home.css'

export function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="overlay">
          <span className="eyebrow">Japanese Fine Dining</span>
          <h1>Samurai</h1>
          <p>Experiencia gastronómica japonesa de autor en un entorno íntimo y contemporáneo.</p>

          <div className="buttons">
            <Link className="btn-primary hero-link" to="/reservas">
              Reservar mesa
            </Link>
            <Link className="btn-secondary hero-link" to="/menu">
              Ver menú
            </Link>
          </div>
        </div>
      </section>

      <section className="intro">
        <h2>Cocina de precisión</h2>
        <p>
          Cada plato está diseñado con técnicas tradicionales japonesas y una visión
          contemporánea de la alta cocina.
        </p>
      </section>

      <footer className="footer">
        <p>© 2026 Samurai Sushi. Todos los derechos reservados.</p>
        <p className="no-copy">Proyecto demo inspirado en un restaurante japonés contemporáneo.</p>
      </footer>
    </div>
  )
}
