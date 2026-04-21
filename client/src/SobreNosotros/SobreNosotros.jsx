import './AboutUs.css'

export function SobreNosotros() {
  return (
    <div className="about">
      <section className="about-hero">
        <div className="overlay">
          <h1>Nuestra filosofía</h1>
          <p>La esencia de la cocina japonesa en su forma más pura y elegante.</p>
        </div>
      </section>

      <section className="about-content">
        <h2>Tradición y precisión</h2>
        <p>
          La cocina japonesa es un arte que respeta el producto, la estación del año y la
          armonía entre sabor y presentación. En Samurai Sushi, cada plato sigue estos
          principios con una precisión casi ritual.
        </p>

        <h2>Respeto por el ingrediente</h2>
        <p>
          Creemos que la excelencia no se añade, se revela. Por eso trabajamos con
          ingredientes frescos seleccionados a diario para mantener la autenticidad de cada
          preparación.
        </p>

        <h2>Experiencia cuidada</h2>
        <p>
          Nuestro objetivo es ofrecer una experiencia gastronómica minimalista, elegante y
          memorable, donde cada detalle cuenta desde la barra hasta el último bocado.
        </p>
      </section>

      <footer className="footer">
        <p>© 2026 Samurai Sushi. Todos los derechos reservados.</p>
        <p className="no-copy">Proyecto demo inspirado en una experiencia omakase contemporánea.</p>
      </footer>
    </div>
  )
}
