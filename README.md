# Smart Lost & Found System (MERN)

A full-stack lost-and-found board: MongoDB, Express, React (Vite), Node.js.

People report items as **Lost** or **Found**, with title, description,
category, **location**, **date**, contact info and up to 5 **photos**.
Anyone can browse and filter reports (no login needed); logging in lets you
report items, claim a found item as yours, and manage your own reports.
The system also suggests **smart matches** — for a lost report it ranks
open found reports (and vice versa) by category, location and description
overlap, and date proximity.

## Structure
```
lost-found-mern/
  backend/    Express + MongoDB API + file storage (port 5001)
  frontend/   React (Vite) app (port 5173)
```

## Constraints enforced
- **Auth**: JWT-based; only logged-in users can report, edit, delete or claim.
- **Item fields**: type (`lost`/`found`), title (3–100 chars), description
  (10–1000 chars), category (fixed list), location (2–150 chars), date
  (required, **cannot be in the future**), contact name (required).
- **Images**: JPG/PNG/WEBP/GIF only, **max 5 MB each, max 5 per item** —
  enforced both in the browser (before upload) and on the server (multer).
- **Ownership**: only the person who reported an item can edit, delete it,
  or mark it resolved/reopen it.
- **Claiming**: only `found` items with status `open` can be claimed; you
  can't claim your own report; claiming sets status to `claimed` and records
  who claimed it plus an optional note.
- **Status lifecycle**: `open` → `claimed` (someone claims it) → `resolved`
  (owner confirms handoff) — the owner can reopen if a claim doesn't work out.

## Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (or a MongoDB Atlas connection string)

## 1. Backend setup
```
cd backend
npm install
cp .env.example .env
```
Edit `.env`: set `MONGO_URI` and a strong `JWT_SECRET`.

Start MongoDB locally if needed, then:
```
npm run dev      # auto-restarts on changes
# or
npm start
```
API runs at http://localhost:5001

## 2. Frontend setup
Open a second terminal:
```
cd frontend
npm install
npm run dev
```
App runs at http://localhost:5173 and calls the API at http://localhost:5001.

## 3. Using the app
1. Go to http://localhost:5173 — browse existing reports without logging in.
2. Register an account to report a lost or found item, with photos.
3. Open any report to see **possible matches** on the opposite list.
4. If you spot your item in a "Found" report, log in and click
   **"This Is Mine — Claim It"**, optionally adding proof.
5. The reporter sees the claim (name, contact, note) on the item page and
   can mark it **Resolved** once the item is handed back.

## API summary
- POST   /api/auth/register
- POST   /api/auth/login
- GET    /api/auth/me
- GET    /api/items                 (filters: type, category, location, status, q, from, to, mine)
- GET    /api/items/categories
- GET    /api/items/:id
- GET    /api/items/:id/matches     (smart-matched opposite-type reports)
- POST   /api/items                 (multipart: type, title, description, category, location, date, contactName, contactPhone, contactEmail, images[])
- PUT    /api/items/:id             (owner only)
- DELETE /api/items/:id             (owner only)
- POST   /api/items/:id/claim       { note }
- PATCH  /api/items/:id/status      { status: 'open' | 'resolved' } (owner only)

## Notes on scope
This is a solid working starting point, not production-hardened:
- Add rate limiting and stricter server-side input validation
  (e.g. express-validator) before deploying publicly.
- The "smart matching" is a lightweight heuristic (category + location/word
  overlap + date proximity) — no ML model. Good enough to surface likely
  matches; swap in a real similarity model later if needed.
- Uploaded photos are stored on local disk (backend/uploads) and served
  publicly under /uploads — move to S3/Cloud storage for a real deployment.
- Consider adding email/SMS notifications on claim, and an admin view to
  moderate reports.
