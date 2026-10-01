# Beauty Mart Inventory

Full-stack inventory starter for a beauty mart.

## Tech Stack

- Frontend: Vue 3, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MySQL

## Project Structure

```text
beauty-mart-inventory/
  frontend/
    src/pages/
      Login.vue
      Dashboard.vue
      Products.vue
      PasteOrder.vue
      SalesRecords.vue
  backend/
    src/server.js
    src/config/db.js
    src/config/schema.sql
    src/routes/
    src/controllers/
    src/middleware/
```

## Database Setup

1. Create the database and starter tables:

```bash
mysql -u root -p < backend/src/config/schema.sql
```

2. Copy the backend environment example:

```bash
cd backend
cp .env.example .env
```

3. Update `.env` with your MySQL username, password, host, port, database name, and `THB_TO_MMK_RATE`.

`products.buy_price` is entered in THB. When an order is saved, the backend converts that buy price into MMK using `THB_TO_MMK_RATE`, then calculates profit in MMK.

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:5000` by default.

Useful endpoints:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/products`
- `GET /api/dashboard/summary`
- `GET /api/customers`
- `POST /api/orders/parse`
- `POST /api/orders/save-from-text`
- `POST /api/orders/paste`
- `GET /api/sales`
- `GET /api/sales/export-excel`

Default seeded admin:

- Email: `admin@beautymart.com`
- Password: `admin123`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## Notes

The login page currently uses demo navigation and the dashboard/product/sales pages include starter placeholder data. Connect these pages to the backend API as the next implementation step.
