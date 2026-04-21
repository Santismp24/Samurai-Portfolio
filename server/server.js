import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import { checkDatabaseConnection } from './config/db.js'
import { ensureBaseSchema } from './config/initDb.js'
import authRoutes from './routes/user.js'
import reservationRoutes from './routes/reservations.js'
import { startReservationReminders } from './services/reservationReminderService.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 3000)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(
  cors({
    origin: CLIENT_URL
  })
)
app.use(morgan('dev'))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.status(200).json({ message: 'API funcionando.' })
})

app.use('/api/auth', authRoutes)
app.use('/api/reservations', reservationRoutes)

async function startServer() {
  try {
    await checkDatabaseConnection()
    await ensureBaseSchema()
    console.log('MySQL conectado correctamente.')

    app.listen(PORT, () => {
      console.log(`Server corriendo en http://localhost:${PORT}`)
    })

    startReservationReminders()
  } catch (error) {
    console.error('Error al conectar con MySQL:', error.message)
    process.exit(1)
  }
}

startServer()
