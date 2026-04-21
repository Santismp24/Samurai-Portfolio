import { Navigate, Route, Routes } from 'react-router-dom'
import { Login } from '../Auth/Login.jsx'
import { Register } from '../Auth/Register.jsx'
import { Navbar } from '../Navbar/Navbar.jsx'
import { Home } from '../Home/Home.jsx'
import { Bebidas } from '../Bebidas/Bebidas.jsx'
import { Menu } from '../Menu/Menu.jsx'
import { SobreNosotros } from '../SobreNosotros/SobreNosotros.jsx'
import { Reservas } from '../Reservas/Reservas.jsx'

export default function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/bebidas" element={<Bebidas />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/sobrenosotros" element={<SobreNosotros />} />
        <Route path="/reservas" element={<Reservas />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  )
}
