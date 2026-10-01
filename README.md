# Baddie Burger


Checkout the finished product before everything: https://baddie-bugers-1.onrender.com/

A burger joint website with online ordering, live order tracking, and a staff dashboard.

- **Customers:** browse the menu, add to an order, place it, and track its progress. No account needed.
- **Staff:** log in from the cap icon in the top right to see orders and update their progress.
- **Admin:** everything staff can do, plus add and remove dishes.

## Stack

| Part | Tech |
|------|------|
| `frontend/` | React 18, Vite, React Router, Phosphor icons, plain CSS |
| `backend/` | Node.js, Express, MongoDB (Mongoose), JWT |

## Project structure

```
baddie-burger/
  frontend/   React app (src/pages, src/cart.jsx, src/menu.jsx)
  backend/    Express API (index.js, seed.js, menu.js)
```

## Getting started

You need Node 20.6 or newer and a MongoDB database (a free MongoDB Atlas cluster works).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # then fill in the values below
npm run seed             # loads the starter menu, safe to re-run
npm run dev              # API on http://localhost:5000
```

`backend/.env`:

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | yes | Include a database name, e.g. `.../baddie-burger` |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | yes | Admin login (orders and menu) |
| `STAFF_USERNAME`, `STAFF_PASSWORD` | no | Kitchen login (orders only) |
| `JWT_SECRET` | yes | Random string, 16+ characters |
| `PORT` | no | Defaults to 5000 |
| `CLIENT_ORIGIN` | no | Site URL allowed to call the API. Defaults to `http://localhost:5173` |

The server refuses to start if a required variable is missing.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

In development, Vite forwards `/api` requests to the backend, so no frontend config is needed.

## Pages

| Route | Who | What |
|-------|-----|------|
| `/` | everyone | Home |
| `/menu` | everyone | Menu by category, add to order |
| `/about` | everyone | How the burgers are made |
| `/visit` | everyone | Address and opening hours |
| `/order` | everyone | Order summary and delivery details |
| `/track/:id` | everyone with the link | Live order status |
| `/staff` | staff, admin | Login, orders, menu management |

## API

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/menu` | public |
| POST | `/api/orders` | public (prices are calculated on the server) |
| GET | `/api/orders/:id` | public (status, items and total only) |
| POST | `/api/staff/login` | public, rate limited |
| GET | `/api/staff/orders` | staff, admin |
| PATCH | `/api/staff/orders/:id` | staff, admin |
| POST | `/api/staff/dishes` | admin |
| DELETE | `/api/staff/dishes/:id` | admin |

Order statuses: `received`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`.

## Deploying

Deploy the two folders separately.

1. **Backend:** set the `.env` variables on your host and run `npm start`. Set `CLIENT_ORIGIN` to your site's URL.
2. **Frontend:** copy `frontend/.env.example` to `.env`, set `VITE_API_URL` to the deployed API URL, then run `npm run build` and host the `dist/` folder. Configure the host to serve `index.html` for all routes so links like `/menu` work on refresh.

## Notes and limits

- There is one shared login per role, not one per employee.
- Dish images are links (an `https://` URL or a `/img/...` path). There is no file upload.
- The login rate limiter is in memory and resets when the server restarts.
- Login tokens last 12 hours and are stored in the browser's local storage.
- The menu prices, address, hours and phone number are sample data. Replace them with the real ones.
- The photos in `frontend/public/img` come from Wikimedia Commons. Check each file's license and attribution requirements before launch.
