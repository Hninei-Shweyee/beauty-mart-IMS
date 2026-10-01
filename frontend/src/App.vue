<template>
  <div class="min-h-screen bg-rose-50 text-slate-900">
    <RouterView v-if="$route.name === 'login'" />

    <div v-else class="min-h-screen lg:flex">
      <aside class="hidden w-72 shrink-0 border-r border-rose-100 bg-white/95 px-5 py-6 shadow-sm lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <RouterLink to="/dashboard" class="flex items-center gap-3 px-2">
          <img :src="logo" alt="Beauty Mart" class="h-11 w-11 rounded-md object-cover" />
          <span>
            <span class="block text-lg font-bold text-slate-950">Beauty Mart</span>
            <span class="block text-xs font-medium uppercase tracking-wide text-rose-500">Inventory Admin</span>
          </span>
        </RouterLink>

        <nav class="mt-8 space-y-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="block rounded-md px-4 py-3 text-sm font-semibold transition"
            :class="navClass(item.to)"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <button
          class="mt-auto rounded-md border border-rose-200 px-4 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
          @click="logout"
        >
          Logout
        </button>
      </aside>

      <div class="lg:ml-72 lg:flex-1">
        <header class="sticky top-0 z-30 border-b border-rose-100 bg-white/90 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <div class="flex items-center justify-between">
            <RouterLink to="/dashboard" class="flex items-center gap-3">
              <img :src="logo" alt="Beauty Mart" class="h-10 w-10 rounded-md object-cover" />
              <span class="text-base font-bold text-slate-950">Beauty Mart</span>
            </RouterLink>
            <button
              class="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700"
              @click="isMobileMenuOpen = true"
            >
              Menu
            </button>
          </div>
        </header>

        <div v-if="isMobileMenuOpen" class="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" @click="isMobileMenuOpen = false"></div>
        <aside
          class="fixed inset-y-0 left-0 z-50 w-72 transform border-r border-rose-100 bg-white px-5 py-6 shadow-xl transition lg:hidden"
          :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
        >
          <div class="flex items-center justify-between">
            <RouterLink to="/dashboard" class="flex items-center gap-3" @click="isMobileMenuOpen = false">
              <img :src="logo" alt="Beauty Mart" class="h-11 w-11 rounded-md object-cover" />
              <span>
                <span class="block text-lg font-bold text-slate-950">Beauty Mart</span>
                <span class="block text-xs font-medium uppercase tracking-wide text-rose-500">Inventory Admin</span>
              </span>
            </RouterLink>
            <button class="rounded-md px-3 py-2 text-sm font-semibold text-slate-500" @click="isMobileMenuOpen = false">
              Close
            </button>
          </div>

          <nav class="mt-8 space-y-1">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="block rounded-md px-4 py-3 text-sm font-semibold transition"
              :class="navClass(item.to)"
              @click="isMobileMenuOpen = false"
            >
              {{ item.label }}
            </RouterLink>
          </nav>

          <button
            class="mt-6 w-full rounded-md border border-rose-200 px-4 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            @click="logout"
          >
            Logout
          </button>
        </aside>

        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import logo from './assets/logo.jpg';

const router = useRouter();
const route = useRoute();
const isMobileMenuOpen = ref(false);

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Products', to: '/products' },
  { label: 'Add Order', to: '/paste-order' },
  { label: 'Sales Records', to: '/sales-records' },
  { label: 'Customers', to: '/customers' }
];

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false;
  }
);

const navClass = (path) => {
  if (route.path === path) {
    return 'bg-rose-600 text-white shadow-sm shadow-rose-200';
  }

  return 'text-slate-600 hover:bg-rose-50 hover:text-rose-700';
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  isMobileMenuOpen.value = false;
  router.push('/login');
};
</script>
