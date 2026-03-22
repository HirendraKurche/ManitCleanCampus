# Facility and Cleaning Management Platform

A full-stack MERN-style operations platform for facility teams with:

- Role-based access for Admin and Worker
- Worker workflows: attendance, cleaning tasks, and inventory logging
- Admin workflows: live roster, task audit, user management, flagged record review, and inventory overview
- Offline-first client storage with later sync to server
- Direct image upload to Cloudinary to avoid backend image bottlenecks

This README documents the project status up to what is already implemented in the codebase.

## 1. Current Build Status

### Completed modules

- Backend API foundation and MongoDB models
- JWT authentication and RBAC middleware
- Worker app routes and pages
- Admin dashboard routes and pages
- IndexedDB offline data layer
- Sync engine for attendance, tasks, and inventory
- Cloudinary signature endpoint and direct upload client utility
- PWA registration/update prompt and offline indicator

### Partially implemented or future hooks

- AI vision checks are model-ready (`photoAiStatus` exists) but no background AI processing service is implemented yet
- No automated test suite is included yet
- No dedicated endpoint set for per-event attendance submit outside bulk sync (current design relies on local capture plus sync)

## 2. Tech Stack

### Client

- React 19
- React Router 7
- Vite 6
- Tailwind CSS 3
- Axios
- idb (IndexedDB wrapper)
- vite-plugin-pwa

### Server

- Node.js + Express 4
- MongoDB + Mongoose 8
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Security middleware: `helmet`, `cors`, `express-rate-limit`, `cookie-parser`
- Cloudinary SDK

### Monorepo tooling

- Root-level npm scripts
- `concurrently` for running client and server together

## 3. Monorepo Structure

```
MANIT/
	client/                     React PWA
	server/                     Express API
	.env.example                Environment template
	package.json                Root scripts (dev, install, build)
	vercel.json                 SPA rewrite config for deployment
```

Key implementation areas:

- `server/models`: user, attendance, task, and inventory schemas
- `server/routes`: auth, admin, sync, cloudinary routes
- `client/src/pages`: worker and admin screens
- `client/src/utils/db.js`: IndexedDB offline stores
- `client/src/hooks/useSync.js`: upload + sync orchestration

## 4. Implemented Features in Depth

## 4.1 Authentication and Session Management

Implemented:

- Login with either phone + password (worker use case) or email + password (admin use case)
- JWT token returned in response body and also set as HTTP-only cookie
- Session restore on app load via `/api/auth/me`
- Role-based route protection on frontend and backend
- Logout clears local session and wipes local offline IndexedDB stores

Security details currently present:

- Password hash using bcrypt with salt rounds
- Auth route rate limiter (`max: 20 / 15 min`)
- Global API rate limiter (`max: 200 / 15 min`)
- Inactive users blocked from access

## 4.2 User Identity and Role Model

Implemented:

- Auto-incremented employee codes using counter collection (`EMP-1001`, `EMP-1002`, ...)
- User roles: `Admin`, `Worker`
- `assignedAreas` per worker
- Account activation/deactivation support (`isActive`)

## 4.3 Worker Attendance Flow

Implemented behavior:

- Sequential stamp flow: `checkIn -> breakStart -> breakEnd -> checkOut`
- Each step captures:
	- Device timestamp
	- GPS coordinates
	- Selfie image (via camera capture)
- Data first saved locally in IndexedDB
- Image blobs kept locally and uploaded later during sync
- Today attendance can be hydrated from server if local DB was cleared

## 4.4 Worker Task Flow (Before/After with Timer)

Implemented behavior:

- Worker selects area (assigned areas or fallback list)
- Captures before photo
- Task timer runs in UI while cleaning
- Captures after photo to complete task
- Stores duration, before/after GPS, and timestamps
- Local-first persistence with later server sync

Model and moderation hooks already present:

- `photoAiStatus` enum field exists for future AI verification results
- Flagging and admin review fields are available

## 4.5 Worker Inventory Logging

Implemented behavior:

- Worker logs quantities per item from mobile-friendly plus/minus controls
- Fetches active item catalogue from server when online
- Falls back to default local item list if offline
- Submissions stored locally with GPS and device timestamp

## 4.6 Offline-First Data and Sync

Implemented local storage strategy:

- IndexedDB stores:
	- `attendance`
	- `tasks`
	- `inventory`
	- `images` (blob store)

Implemented sync process:

1. Read unsynced records from local stores
2. Upload linked images to Cloudinary (best effort)
3. Attach uploaded image URLs to payload
4. POST batch to `/api/sync`
5. Mark records synced
6. Garbage collect synced records and linked blobs

Additional behavior:

- Sync lock prevents overlapping sync runs
- Worker layout triggers periodic sync while online (every 30 seconds)
- Attendance records for current day are retained during garbage collection to preserve same-day UI state

## 4.7 Time Drift Detection and Flagging

Implemented in server sync route:

- Compares device timestamp vs server receipt time
- Flags record when absolute drift exceeds 5 minutes
- Stores `timeDriftSeconds` for audit visibility

Flagging applies to:

- Attendance records
- Task records
- Inventory transactions

## 4.8 Admin Dashboard Capabilities

Implemented pages and APIs:

- **Overview**
	- Total users
	- Today attendance count
	- Today tasks count
	- Combined flagged count
- **Roster**
	- Date-based attendance list with event timestamps
	- Worker names, employee code, assigned areas
	- Selfie thumbnails and GPS coordinates where present
- **Task Audit**
	- Filter by date, flagged status, AI status, worker, area
	- Before/after gallery cards with metadata
- **Inventory Admin**
	- Aggregated stock summary from transaction log
	- Active item catalogue list
	- Add item flow
- **Users**
	- List users
	- Register Worker/Admin accounts
	- Toggle active/inactive
- **Flagged Records**
	- Consolidated flagged attendance/task/inventory view
	- Task review action to clear flagged state and store admin note

## 4.9 Direct-to-Cloudinary Uploads

Implemented architecture:

- Backend `/api/cloudinary/sign` issues signed upload params
- Client uploads image binaries directly to Cloudinary upload API
- Backend does not proxy image payloads

Benefit:

- Prevents API overload from large binary uploads during mass sync windows

## 4.10 PWA and Client Runtime Behavior

Implemented:

- PWA plugin integration with web manifest
- Service worker update prompt banner
- Offline status indicator
- API proxy in Vite dev server (`/api -> localhost:5000`)

Notes:

- Service worker update check is periodically triggered in client

## 5. API Reference (Implemented Endpoints)

Base URL: `/api`

### Auth routes

- `POST /auth/login`
- `POST /auth/register` (Admin only)
- `GET /auth/me`
- `GET /auth/attendance/today`
- `POST /auth/logout`

### Sync routes

- `POST /sync` (Worker/Admin)

### Cloudinary routes

- `POST /cloudinary/sign` (authenticated)

### Admin routes (Admin only)

- `GET /admin/users`
- `PATCH /admin/users/:employeeCode`
- `GET /admin/roster`
- `GET /admin/tasks`
- `PATCH /admin/tasks/:id/review`
- `GET /admin/inventory`
- `GET /admin/flagged`
- `GET /admin/items`
- `POST /admin/items`
- `PATCH /admin/items/:id`

### Utility

- `GET /health`

## 6. Database Model Summary

### User

- `employeeCode`, `name`, `phone`, `email`, `password`, `role`, `assignedAreas`, `isActive`

### Attendance

- `worker`, `date`
- `checkIn`, `breakStart`, `breakEnd`, `checkOut` (timestamp + serverTime + imageUrl + gps)
- `isOfflineSync`, `flaggedForReview`, `timeDriftSeconds`, `reviewNote`

### Task

- `worker`, `area`, `startedAt`, `completedAt`, `durationSeconds`
- `beforePhotoUrl`, `afterPhotoUrl`, `beforeGps`, `afterGps`, `status`, `date`
- `photoAiStatus`, `photoAiNote`
- `isOfflineSync`, `flaggedForReview`, `timeDriftSeconds`, `reviewNote`

### ItemCatalogue and InventoryTx

- Catalogue: `name`, `unit`, `category`, `isActive`
- Transactions: `worker`, `item`, `qty`, `notes`, `gps`, `date`, drift and flag fields

## 7. Environment Variables

Create `.env` at project root based on `.env.example`.

Required server variables:

```env
MONGO_URI=mongodb://localhost:27017/facility-management
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Optional client variable:

```env
VITE_API_URL=
```

If empty, client uses relative API calls and relies on Vite proxy in local development.

## 8. Local Development Setup

## 8.1 Prerequisites

- Node.js 18+
- npm 9+
- MongoDB running locally or accessible remotely

## 8.2 Install

```bash
npm run install:all
```

## 8.3 Configure environment

```bash
cp .env.example .env
```

Fill in MongoDB and Cloudinary credentials.

## 8.4 Seed users

```bash
npm run seed
```

Default admin created by seed script:

- Email: `admin@facility.com`
- Password: `Admin@1234`

Additional scripts available in `server/scripts`:

- `seedWorker.js` (create worker)
- `seedWorker2.js` (create second worker)
- `resetUsers.js` (delete all users and recreate seed users)

## 8.5 Run app

```bash
npm run dev
```

Expected local ports:

- API server: `http://localhost:5000`
- Vite client: configured on port `5175`

Note: `.env.example` currently sets `CLIENT_URL=http://localhost:5173`. Update this to `5175` (or change Vite port) so CORS origin matches your local client port.

## 9. Build and Deployment

## 9.1 Build client

```bash
npm run build
```

## 9.2 Vercel

`vercel.json` is configured to:

- Build using root script `npm run vercel-build`
- Serve output from `client/dist`
- Rewrite all routes to `index.html` for SPA routing

You still need to provide backend hosting and environment variables for API usage in production.

## 10. Security and Operational Notes

- Store production secrets only in environment variables
- Rotate default seeded credentials immediately in non-dev environments
- Ensure HTTPS in production for secure cookie transport
- Keep API rate limiting enabled
- Monitor flagged drift records from admin panel for abuse patterns

## 11. Known Gaps and Next Practical Steps

Based on current implementation, these are the most valuable next tasks:

1. Add automated tests for auth, sync, and admin endpoints
2. Implement AI photo comparison worker/job that updates `photoAiStatus`
3. Add explicit server-side validation schemas for request payloads
4. Improve inventory semantics to support both positive and negative stock movements in worker UI
5. Add observability (structured logs, error tracking, metrics)

## 12. Quick Functional Checklist

Use this list for verification after setup:

- Admin can login and view all dashboard pages
- Admin can create users and toggle active/inactive
- Worker can login and perform attendance sequence with photos
- Worker can run task flow with before/after capture and timer
- Worker can submit inventory entries
- Offline capture works and syncs when network returns
- Flagged records appear when device time drift is large
- Admin can review flagged tasks and clear them

---

If you want, the next README iteration can include request/response payload examples for each endpoint and a troubleshooting section for camera permissions, IndexedDB cleanup, and sync conflict handling.
