import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import salesRoutes from './salesRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import customerRoutes from './customerRoutes.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', authMiddleware, productRoutes);
router.use('/orders', authMiddleware, orderRoutes);
router.use('/sales', authMiddleware, salesRoutes);
router.use('/dashboard', authMiddleware, dashboardRoutes);
router.use('/customers', authMiddleware, customerRoutes);

export default router;
