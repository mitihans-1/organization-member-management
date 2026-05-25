# OMMS - Modern Membership Management System

A comprehensive membership management system built with modern web technologies, featuring multiple user roles, event management, services, tickets, ID cards, and more.

## Features

### User Roles
- **Super Admin**: Manages the entire platform, organizations, plans, and payments
- **Org Admin**: Manages their organization, members, events, services, blogs, and tickets
- **Member**: Views organization content, registers for events, requests services, submits tickets, and more

### Core Modules
- **Authentication & Authorization**: Secure login with JWT, Google OAuth, password reset
- **Event Management**: Create, manage, and track events with attendance tracking
- **Service Management**: Offer and manage services with requests and approvals
- **Tickets (Reports)**: Submit and track tickets between members, org admins, and super admins
- **Blog & Announcements**: Publish blogs and announcements for members
- **ID Cards**: Generate and verify digital ID cards with QR codes
- **Payments**: Integrate with multiple payment methods (Telebirr, CBE Birr, Chapa)
- **Chat System**: Real-time chat between members and org admins, and org admins with super admins
- **Notifications**: In-app notifications and email notifications
- **Fayda Integration**: ID verification using Fayda system
- **Plans & Subscriptions**: Manage subscription plans for organizations

## Tech Stack

### Backend
- **Node.js** with **Express.js** - Server framework
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database ORM
- **MongoDB** - Database
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Tesseract.js** - OCR for Fayda integration
- **Nodemailer** - Email service
- **Node-cron** - Scheduled tasks

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool
- **React Router** - Client-side routing
- **TanStack React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icons
- **Socket.io Client** - Real-time communication
- **Recharts** - Charts and data visualization
- **QRCode.react** - QR code generation
- **React-to-print** - Print functionality

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd modern-membership-system
```

2. **Set up environment variables**

Copy the example environment file and configure it:
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="mongodb://127.0.0.1:27017/omms"
JWT_SECRET="your-secret-key-here"
# Add other environment variables as needed
```

3. **Install dependencies**

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd ../frontend
npm install
```

4. **Set up the database**

```bash
cd backend
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

5. **Run the application**

Start the backend:
```bash
cd backend
npm run dev
```

Start the frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

The application should now be running:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Project Structure

```
modern-membership-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── events/
│   │   │   └── services/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layouts/
│   │   │   ├── id-card/
│   │   │   └── ...
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── member/
│   │   │   ├── super-admin/
│   │   │   └── ...
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.cjs
│   └── tsconfig.json
└── README.md
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/google` - Google OAuth login

### Main Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/members` - Get members
- `GET /api/events` - Get events
- `GET /api/services` - Get services
- `GET /api/blogs` - Get blogs
- `GET /api/reports` - Get tickets/reports
- `GET /api/payments` - Get payments
- `GET /api/plans` - Get subscription plans

## Default Credentials

After seeding the database, you can use the following default credentials:

**Super Admin:**
- Email: superadmin@omms.com
- Password: password123

**Org Admin:**
- Email: orgadmin@omms.com
- Password: password123

**Member:**
- Email: member@omms.com
- Password: password123

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for hot reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server with HMR
```

### Building for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please contact support@omms.com or visit our documentation.
