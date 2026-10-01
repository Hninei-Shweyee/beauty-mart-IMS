import { createRouter, createWebHistory } from 'vue-router';
import Login from '../pages/Login.vue';
import Dashboard from '../pages/Dashboard.vue';
import Products from '../pages/Products.vue';
import PasteOrder from '../pages/PasteOrder.vue';
import SalesRecords from '../pages/SalesRecords.vue';
import Customers from '../pages/Customers.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login },
  { path: '/dashboard', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/products', name: 'products', component: Products, meta: { requiresAuth: true } },
  { path: '/paste-order', name: 'paste-order', component: PasteOrder, meta: { requiresAuth: true } },
  { path: '/sales-records', name: 'sales-records', component: SalesRecords, meta: { requiresAuth: true } },
  { path: '/customers', name: 'customers', component: Customers, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    return '/login';
  }

  if (to.name === 'login' && token) {
    return '/dashboard';
  }

  return true;
});

export default router;
