# Facility & Cleaning Management Platform

A comprehensive MERN-stack PWA for managing facility operations — attendance tracking, cleaning task management, and inventory record-keeping with full offline support.

## Project Structure

```
MANIT/
├── server/                    # Express backend
│   ├── models/
│   │   ├── User.js            # Auto-incrementing employeeCode, bcrypt, RBAC
│   │   ├── Attendance.js      # Check-in/break/check-out with GPS + selfie
│   │   ├── Task.js            # Before/After photo proof, AI vision hooks
│   │   └── Item.js            # Item catalogue + inventory transactions
│   ├── routes/
│   │   ├── auth.js            # Login, register (Admin-only), /me, logout
│   │   ├── cloudinary.js      # Presigned upload signatures (direct-to-cloud)
│   │   ├── sync.js            # Bulk offline sync with time-drift detection
│   │   └── admin.js           # User mgmt, roster, task audit, inventory
│   ├── middleware/
│   │   └── auth.js            # JWT + RBAC middleware (Bearer + cookie)
│   ├── scripts/
│   │   └── seedAdmin.js       # Bootstrap first Admin user
│   ├── server.js              # Express entry point
│   └── package.json
├── client/                    # React Vite PWA
│   ├── src/
│   │   ├── components/        # (Phase 2-3)
│   │   ├── context/           # (Phase 2-3)
│   │   ├── hooks/             # (Phase 2-3)
│   │   ├── layouts/           # (Phase 2-3)
│   │   ├── pages/             # (Phase 2-3)
│   │   ├── utils/             # (Phase 2-3)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js         # PWA + API proxy
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── .env.example
├── .gitignore
├── package.json               # Root monorepo scripts
└── README.md
```

## Quick Start

```bash
# 1. Copy environment config
cp .env.example .env           # Fill in your values

# 2. Install dependencies
npm run install:all

# 3. Seed admin user
npm run seed                   # Creates admin@facility.com / Admin@1234

# 4. Run both servers
npm run dev                    # Server :5000 + Client :5173
```

## Architecture Highlights

| Feature | Implementation |
|---|---|
| **Auth** | JWT (Bearer + HTTP-only cookie), bcrypt, RBAC (Admin/Worker) |
| **Employee IDs** | Auto-incrementing `EMP-1001`, `EMP-1002`, ... |
| **Image Upload** | Direct-to-Cloudinary (presigned signatures) |
| **Offline Sync** | IndexedDB + Service Worker Background Sync → `/api/sync` |
| **Time-Travel Prevention** | Server flags records with >5min device/server time drift |
| **AI Vision** | `photoAiStatus` field ready for Before/After image comparison |

## Phases

- [x] **Phase 1:** Backend Foundation (Schemas, Auth, Sync API)
- [ ] **Phase 2:** Frontend PWA Setup (IndexedDB, Cloudinary upload, SW caching)
- [ ] **Phase 3:** Worker UI (Attendance, Tasks, Inventory)
- [ ] **Phase 4:** Admin Dashboard (Roster, Audit, Users)
