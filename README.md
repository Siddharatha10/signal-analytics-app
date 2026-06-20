# Signal — User Analytics Application

A small full-stack application that tracks user interactions (page views and
clicks) on a webpage via a lightweight JavaScript snippet, stores them in
MongoDB, and visualizes them in a React dashboard — built as the **Full Stack
Engineer** take-home assignment for CausalFunnel.

```
causalfunnel-analytics/
├── backend/         Node.js + Express API, MongoDB models
├── frontend/        React (Vite) dashboard — Sessions view + Heatmap view
└── tracker-demo/    Standalone tracker.js + two demo HTML pages to test it
```

---

## Tech stack

| Layer       | Choice                                  |
|-------------|------------------------------------------|
| Tracking    | Vanilla JavaScript (no dependencies)     |
| Backend     | Node.js, Express                         |
| Database    | MongoDB, Mongoose                        |
| Frontend    | React 18 (Vite), React Router            |
| Styling     | Plain CSS with design tokens (no UI framework) |

---

## Setup steps

### Prerequisites
- Node.js 18+
- A MongoDB instance — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env if your MongoDB URI or port differs from the defaults
npm start
```

The API starts on `http://localhost:5000` by default. Health check: `GET /health`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# edit .env if your backend isn't running on localhost:5000
npm run dev
```

The dashboard starts on `http://localhost:5173`.

### 3. Tracker demo (to generate data)

The `tracker-demo/` folder is two plain HTML pages with `tracker.js`
embedded. Serve them with any static server, e.g.:

```bash
cd tracker-demo
npx serve .
```

Then open the served page (typically `http://localhost:3000`), click around,
and navigate between "Home" and "Pricing" — this generates `page_view` and
`click` events against the backend. Refresh the dashboard's Sessions or
Heatmap views to see them appear.

> If your backend isn't on `http://localhost:5000`, update the
> `data-api-url` attribute on the `<script src="tracker.js" ...>` tag in
> `index.html` and `page2.html`.

---

## How tracking works

`tracker-demo/tracker.js` is a self-contained script with no build step:

- On load, it generates a `session_id` (UUID v4) and persists it in
  `localStorage`. The session is treated as expired after 30 minutes of
  inactivity, after which a new session starts.
- It fires a `page_view` event as soon as the page loads.
- It fires a `click` event (with `clientX`/`clientY` coordinates) on every
  click anywhere on the page, using event delegation on `document`.
- Events are sent via `navigator.sendBeacon` (falling back to `fetch` with
  `keepalive: true`), so events fired right before page unload still reach
  the server.

To use it on any other page, just drop in:

```html
<script src="tracker.js" data-api-url="http://your-backend/api/events"></script>
```

---

## API reference

| Method | Route                              | Purpose                                      |
|--------|-------------------------------------|-----------------------------------------------|
| POST   | `/api/events`                      | Store a single tracked event                  |
| GET    | `/api/sessions`                    | List all sessions with event/page counts       |
| GET    | `/api/sessions/:sessionId/events`  | Ordered event journey for one session         |
| GET    | `/api/pages`                       | Distinct page URLs that have tracked events    |
| GET    | `/api/heatmap?pageUrl=...`         | All click coordinates for a given page         |

---

## Dashboard

- **Sessions view** (`/`) — lists every session with its event/page counts,
  sorted by most recent activity. Selecting a session shows its full
  chronological journey (page views and clicks, with time deltas between
  steps).
- **Heatmap view** (`/heatmap`) — pick a tracked page URL from a dropdown and
  see every click plotted on a normalized canvas, pooled across all sessions
  that visited that page. Hover a dot for the exact coordinates, session, and
  timestamp.

---

## Assumptions & trade-offs

- **Heatmap normalization.** Click `x`/`y` are raw pixel coordinates from the
  visitor's browser, which can have wildly different viewport sizes. Each
  click is stored together with the viewport size at the time, and the
  dashboard normalizes `x/viewportWidth` and `y/viewportHeight` into a 0–1
  fraction before plotting, so clicks from different screen sizes still line
  up spatially. This assumes a roughly similar page layout across viewport
  sizes (i.e., not wildly different mobile vs. desktop layouts) — a
  production version would likely bucket by device class instead.
- **Session boundary.** A session is defined client-side as "same
  `localStorage` value, no longer than 30 minutes idle." This is a simple
  heuristic, not based on server-side session validation — there's no
  authentication layer, since the assignment treats sessions as anonymous
  visitor sessions, not logged-in users.
- **No deduplication / retry logic.** If `sendBeacon`/`fetch` fails, the
  event is simply dropped rather than queued for retry. For a take-home
  assignment this trade-off favors simplicity; a production tracker would
  likely batch events and retry with backoff.
- **Sessions list uses aggregation, not pre-computed counters.** `GET
  /api/sessions` aggregates over the `events` collection on every request
  rather than maintaining a separate `sessions` collection with running
  counters. This keeps the data model simpler (single source of truth) at
  the cost of a heavier query as data grows — acceptable at this scale, but
  the first thing to revisit for a high-traffic production deployment.
- **No auth/rate-limiting on the ingestion endpoint.** `POST /api/events` is
  open, matching the assignment's scope of a demo tracking pipeline. A real
  deployment would add an API key per site and basic rate limiting to guard
  against abuse.
- **Hosting.** Hosting was listed as optional; this submission focuses on a
  clean local setup. The app is structured (env-driven config, CORS allow-
  list) so it can be deployed as-is — e.g. backend on Render/Railway with a
  MongoDB Atlas URI, frontend on Vercel/Netlify with `VITE_API_BASE_URL`
  pointed at the deployed backend.
