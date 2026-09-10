# DEV Fly Ash Bricks — Management System

> Premium Fly Ash Bricks by Dev Kumar Dansena — Sondka, Kharsia, Raigarh, Chhattisgarh

A full-stack web application for managing a fly ash bricks manufacturing business: labour tracking, production, billing, inventory, fleet management, and a public website — plus a native **Android app** via Capacitor.

---

## 🏗️ Project Structure

```
fly ash briks/
├── backend/                  ← Express.js + MongoDB REST API
│   ├── src/
│   │   ├── models/           ← Mongoose schemas
│   │   ├── routes/           ← API route handlers
│   │   ├── controllers/      ← Business logic
│   │   ├── core/             ← Auth, rate limiting, error handling
│   │   └── server.js         ← Entry point
│   ├── uploads/              ← User-uploaded files (gitignored)
│   └── .env.example          ← Environment variable template
├── frontend/                 ← Vanilla HTML + CSS + JS multi-page app
│   ├── index.html            ← Public landing page
│   ├── login.html            ← Staff login
│   ├── dashboard.html        ← Main admin dashboard
│   ├── js/                   ← Per-page JavaScript modules
│   └── css/                  ← Stylesheet
├── capacitor-app/            ← Android app wrapper (Capacitor)
│   └── android/              ← Android Studio project
├── render.yaml               ← Render deployment config (backend)
├── vercel.json               ← Vercel deployment config (frontend)
└── package.json              ← Root dev scripts (runs both servers)
```

---

## 🚀 Features

- **Labour Management** — Track worker groups, attendance, advances
- **Production Tracking** — Daily brick production records
- **Billing & Wages** — Auto-calculate bills, generate PDF invoices
- **Fleet & Trips** — Track trucks, drivers, trip earnings
- **Inventory** — Material stock management
- **Reports** — Export data to PDF/CSV
- **Public Website** — Landing page with gallery, about, contact
- **Android App** — Native wrapper via Capacitor

---

## ⚡ Local Development

### Prerequisites
- Node.js >= 20
- MongoDB Atlas account (or local MongoDB)

### Setup

```bash
# 1. Install root dependencies
npm install

# 2. Set up backend environment
cp backend/.env.example backend/.env
# → Edit backend/.env with your MongoDB URI and JWT secret

# 3. Start both servers concurrently
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health check**: http://localhost:5000/api/health

### Seed Admin User
```bash
cd backend
npm run seed
```
Default credentials: `admin@devbricks.com` / `Admin@123`

---

## 🌐 Deployment

### Backend → Render
1. Push this repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Root Directory** = `backend`
4. Set **Build Command** = `npm install`
5. Set **Start Command** = `npm start`
6. Add environment variables from `backend/.env.example`

### Frontend → Vercel
1. Create a new project on [vercel.com](https://vercel.com)
2. Set **Root Directory** = `frontend`
3. Framework: **Other** (static HTML)
4. No build command needed

### Android App → APK
```bash
cd capacitor-app
npx cap sync android
npx cap open android   # Opens Android Studio
```
See [`capacitor-app/README.md`](capacitor-app/README.md) for full instructions.

---

## 🔐 Environment Variables

See [`backend/.env.example`](backend/.env.example) for all required variables.

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Min 32-char random string |
| `PORT` | ✅ | Server port (Render sets automatically) |
| `CLIENT_URL` | ✅ | Frontend URL for CORS whitelist |
| `OWNER_EMAIL` | ⚠️ | Email for enquiry notifications |
| `SMTP_USER` / `SMTP_PASS` | ⚠️ | SMTP credentials for emails |

---

## 📱 Android App

The app is built with **Capacitor** wrapping the existing HTML frontend.

- App ID: `com.devbricks.app`
- Backend: configured in [`capacitor-app/capacitor.config.json`](capacitor-app/capacitor.config.json)
- Requires **Android Studio** to build APK

---

*Built by Dev Kumar Dansena & Shivam Dansena*
