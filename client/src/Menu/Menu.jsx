import './Menu.css'

const sections = [
  {
    title: '前菜 | Entrantes',
    items: [
      {
        name: 'Tartar de Atún Akami',
        description: 'Yema curada, soja envejecida y wasabi fresco',
        price: '18€'
      },
      {
        name: 'Gyoza de Wagyu',
        description: 'Reducción de ponzu cítrico',
        price: '16€'
      }
    ]
  },
  {
    title: '寿司 | Sushi selección',
    items: [
      {
        name: 'Nigiri Toro',
        description: 'Atún graso y arroz avinagrado premium',
        price: '12€/pieza'
      },
      {
        name: 'Nigiri Hamachi',
        description: 'Yellowtail con toque de yuzu',
        price: '10€/pieza'
      }
    ]
  },
  {
    title: '主菜 | Platos principales',
    items: [
      {
        name: 'Bacalao negro miso',
        description: 'Marinado 48 horas, acompañado de daikon',
        price: '28€'
      },
      {
        name: 'Wagyu A5 teppanyaki',
        description: 'Corte japonés premium con sal ahumada',
        price: '65€'
      }
    ]
  },
  {
    title: '甘味 | Postres',
    items: [
      {
        name: 'Mochi artesanal',
        description: 'Relleno de té matcha y anko',
        price: '9€'
      },
      {
        name: 'Cheesecake de yuzu',
        description: 'Base crujiente con crema cítrica japonesa',
        price: '11€'
      }
    ]
  }
]

export function Menu() {
  return (
    <div className="menu-container">
      <header className="menu-header">
        <h1>KAZE</h1>
        <p>Experiencia omakase contemporánea</p>
      </header>

      {sections.map((section) => (
        <section className="menu-section" key={section.title}>
          <h2>{section.title}</h2>

          {section.items.map((item) => (
            <div className="menu-item" key={item.name}>
              <div className="menu-item-header">
                <h3>{item.name}</h3>
                <span>{item.price}</span>
              </div>
              <p>{item.description}</p>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
