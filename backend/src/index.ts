import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import memberRoutes from './routes/memberRoutes';
import planRoutes from './routes/planRoutes';
import paymentRoutes from './routes/paymentRoutes';
import blogRoutes from './routes/blogRoutes';
import eventRoutes from './routes/eventRoutes';
import adminRoutes from './routes/adminRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Organization Membership Management API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
