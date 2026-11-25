# MHA Backend API (`mha-backend`)

Common REST API server for the **MHA Public Website** and **MHA Admin Panel**, built with **Node.js, Express, PostgreSQL, and Prisma ORM**.

## Folder Structure
- `prisma/schema.prisma` — Full PostgreSQL database schema (E-commerce + MLM/Business + Admin)
- `prisma/seed.js` — Seeds the 4 categories, 43 original products, default offers, coupon (`MHAWELCOME`), FAQs, settings, and initial admin user
- `src/config/` — Environment variables, Prisma client, MLM constants
- `src/middleware/` — Customer JWT auth, separate Admin JWT + RBAC auth, Zod validation, Multer uploads, error handler
- `src/services/` — Razorpay payment service, MLM rewards/payout calculator, notifications, uploads
- `src/models/` — Prisma model exports
- `src/controllers/` — Business logic for Auth, Products, Cart, Orders, Wishlist/Reviews/Coupons, CMS/Support, Member, and Admin
- `src/routes/` — REST API routes mounted under `/api`

## Quick Start
1. Configure `.env` with your PostgreSQL `DATABASE_URL` and secrets.
2. Run migrations & seed:
   ```bash
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
4. Health check: `GET http://127.0.0.1:5000/health`
