import './Bebidas.css'

const bebidas = [
  {
    nombre: 'Té verde japonés',
    descripcion: 'Infusión tradicional caliente, suave y aromática.',
    precio: '2.50€'
  },
  {
    nombre: 'Ramune',
    descripcion: 'Refresco japonés cítrico en su icónica botella de vidrio.',
    precio: '3.00€'
  },
  {
    nombre: 'Sake premium',
    descripcion: 'Bebida alcohólica tradicional japonesa, delicada y fermentada.',
    precio: '6.50€'
  },
  {
    nombre: 'Cerveza Asahi',
    descripcion: 'Cerveza japonesa ligera, seca y refrescante.',
    precio: '3.50€'
  },
  {
    nombre: 'Té matcha frío',
    descripcion: 'Bebida fría energizante con matcha ceremonial.',
    precio: '4.00€'
  },
  {
    nombre: 'Calpis',
    descripcion: 'Bebida dulce japonesa con perfil lácteo y refrescante.',
    precio: '3.20€'
  }
]

export function Bebidas() {
  return (
    <div className="bebidas-container">
      <div className="bebidas-overlay">
        <h1 className="bebidas-title">Carta de bebidas</h1>
        <p className="bebidas-subtitle">Selección tradicional japonesa</p>

        <div className="bebidas-grid">
          {bebidas.map((item) => (
            <article className="bebida-card" key={item.nombre}>
              <h2>{item.nombre}</h2>
              <p>{item.descripcion}</p>
              <span className="precio">{item.precio}</span>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
