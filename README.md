# Samurai Portfolio

Aplicacion fullstack inspirada en un restaurante japones contemporaneo, pensada como proyecto de portfolio.

## Stack

- React
- Vite
- Express
- MySQL
- Bootstrap

## Funcionalidades

- Registro e inicio de sesion
- Reserva de mesas desde la app
- Gestion de "Mis reservas"
- Panel admin para revisar reservas
- Bloqueo de franjas por aforo
- Correos de confirmacion y recordatorios

## Estructura

- `client/`: frontend en React + Vite
- `server/`: API en Express + MySQL

## Configuracion

### Client

Instalar dependencias y ejecutar:

```bash
cd client
npm install
npm run dev
```

### Server

Instalar dependencias y configurar `server/.env` con:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `CLIENT_URL`

Opcional para email:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `MAIL_FROM`

Ejecutar:

```bash
cd server
npm install
npm run dev
```

## Base de datos

La base de datos MySQL usada en el proyecto se llama `samurai` y trabaja con las tablas `users` y `reservations`.

## Autor

Santiago
