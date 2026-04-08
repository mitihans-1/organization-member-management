# Member Management System (OMMS)

A robust platform for managing organization members, events, and payments with built-in Fayda National ID verification.

## Prerequisites

- **Node.js**: v18.x or later
- **npm**: v9.x or later
- **SQLite**: (Automatically handled by Prisma)

## Getting Started

Follow these steps to set up and run the application locally.

### 1. Clone the project
If you haven't already, ensure you are in the project root:
```bash
cd organization-member-management
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env` (if not already done).
   - Ensure `DATABASE_URL` is set: `DATABASE_URL="file:./prisma/dev.db"`
4. Initialize the database:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   npm run prisma:seed
   ```
5. Start the backend:
   ```bash
   npm run dev
   ```
   The backend will run on [http://localhost:5000](http://localhost:5000).

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```
   The frontend will run on [http://localhost:5173](http://localhost:5173).

## Default Credentials (Seeded)

After running the seed command, you can log in with:

- **Role**: SuperAdmin
- **Email**: `owner@omms.com`
- **Password**: `OwnerDev123!` (See `.env` for the current password)

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Backend**: Express, Prisma, JWT Authentication
- **Database**: SQLite (local development)
- **Identity**: Fayda ID integration
