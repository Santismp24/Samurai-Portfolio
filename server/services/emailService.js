import fs from 'fs/promises'
import path from 'path'

function buildReservationEmail({ reservation, heading, intro, ctaLabel, ctaUrl }) {
  const areaLabel = reservation.area === 'barra' ? 'Barra omakase' : 'Salon'

  return `
    <div style="background:#0d0b0b;padding:32px;font-family:Georgia,serif;color:#f3eee5;">
      <div style="max-width:620px;margin:0 auto;background:#151111;border:1px solid rgba(255,255,255,.08);padding:32px;">
        <p style="margin:0 0 10px;color:#c8a96a;letter-spacing:.25em;text-transform:uppercase;font-size:12px;">Samurai</p>
        <h1 style="margin:0 0 14px;font-weight:400;">${heading}</h1>
        <p style="margin:0 0 24px;color:#d1c8ba;line-height:1.7;">${intro}</p>
        <div style="background:rgba(255,255,255,.03);padding:20px;border:1px solid rgba(255,255,255,.08);margin-bottom:24px;">
          <p style="margin:0 0 8px;"><strong>Codigo:</strong> ${reservation.reservation_code}</p>
          <p style="margin:0 0 8px;"><strong>Fecha:</strong> ${reservation.reservation_date}</p>
          <p style="margin:0 0 8px;"><strong>Hora:</strong> ${reservation.reservation_time}</p>
          <p style="margin:0 0 8px;"><strong>Personas:</strong> ${reservation.party_size}</p>
          <p style="margin:0;"><strong>Zona:</strong> ${areaLabel}</p>
        </div>
        ${
          ctaUrl
            ? `<a href="${ctaUrl}" style="display:inline-block;background:#c8a96a;color:#111;text-decoration:none;padding:12px 18px;font-weight:700;border-radius:999px;">${ctaLabel}</a>`
            : ''
        }
      </div>
    </div>
  `
}

async function deliverWithNodemailer(message) {
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null
  }

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  })

  const result = await transporter.sendMail(message)
  return result.messageId
}

async function savePreview(subject, html, to) {
  const directory = path.resolve('mail-previews')
  await fs.mkdir(directory, { recursive: true })

  const filename = `${Date.now()}-${subject.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.html`
  const filePath = path.join(directory, filename)

  await fs.writeFile(filePath, html, 'utf8')
  console.log(`Preview email para ${to} guardado en ${filePath}`)
}

async function sendHtmlEmail({ to, subject, html }) {
  const from = process.env.MAIL_FROM || 'Samurai <no-reply@samurai.local>'

  try {
    const messageId = await deliverWithNodemailer({
      from,
      to,
      subject,
      html
    })

    if (messageId) {
      return { delivered: true, preview: false, messageId }
    }
  } catch (error) {
    console.warn('No se pudo enviar el email real. Se generara preview.', error.message)
  }

  await savePreview(subject, html, to)
  return { delivered: false, preview: true }
}

export async function sendReservationConfirmation(reservation) {
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173'
  const html = buildReservationEmail({
    reservation,
    heading: reservation.status === 'confirmed' ? 'Reserva confirmada' : 'Reserva recibida',
    intro:
      reservation.status === 'confirmed'
        ? 'Tu mesa ya esta confirmada. Te esperamos para una experiencia japonesa cuidada al detalle.'
        : 'Hemos recibido tu solicitud. Si eres cliente registrado podras seguir el estado desde la app.',
    ctaLabel: 'Ver mis reservas',
    ctaUrl: `${appUrl}/reservas`
  })

  return sendHtmlEmail({
    to: reservation.guest_email,
    subject: `Samurai | Reserva ${reservation.reservation_code}`,
    html
  })
}

export async function sendReservationReminder(reservation) {
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173'
  const html = buildReservationEmail({
    reservation,
    heading: 'Recordatorio de tu reserva',
    intro: 'Tu experiencia en Samurai empieza pronto. Si necesitas revisar o cancelar la reserva, hazlo con antelacion.',
    ctaLabel: 'Gestionar reserva',
    ctaUrl: `${appUrl}/reservas`
  })

  return sendHtmlEmail({
    to: reservation.guest_email,
    subject: `Samurai | Recordatorio ${reservation.reservation_code}`,
    html
  })
}
