import db from './db.js'

export async function ensureBaseSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      reservation_id INT AUTO_INCREMENT PRIMARY KEY,
      reservation_code VARCHAR(24) NOT NULL UNIQUE,
      user_id INT NULL,
      guest_name VARCHAR(80) NOT NULL,
      guest_lastname VARCHAR(120) NOT NULL DEFAULT '',
      guest_email VARCHAR(160) NOT NULL,
      guest_phone VARCHAR(30) NOT NULL,
      reservation_date DATE NOT NULL,
      reservation_time TIME NOT NULL,
      party_size INT NOT NULL,
      area VARCHAR(20) NOT NULL,
      notes TEXT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      confirmation_sent_at DATETIME NULL,
      reminder_sent_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reservations_user_id (user_id),
      INDEX idx_reservations_date_time (reservation_date, reservation_time),
      INDEX idx_reservations_status (status)
    )
  `)
}
