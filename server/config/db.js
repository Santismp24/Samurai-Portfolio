import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export async function checkDatabaseConnection() {
  const connection = await db.getConnection()
  connection.release()
}

export default db
