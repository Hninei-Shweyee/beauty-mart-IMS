<template>
  <main class="flex min-h-screen items-center justify-center bg-rose-50 px-6">
    <section class="w-full max-w-md rounded-lg border border-rose-100 bg-white p-8 shadow-sm">
      <h1 class="text-2xl font-bold text-slate-950">Beauty Mart Inventory</h1>
      <p class="mt-2 text-sm text-slate-600">Sign in to manage products, orders, and sales.</p>

      <form class="mt-8 space-y-5" @submit.prevent="login">
        <label class="block">
          <span class="text-sm font-medium text-slate-700">Email</span>
          <input
            v-model="email"
            class="mt-2 w-full rounded-md border border-rose-200 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            type="email"
            placeholder="admin@beautymart.com"
            required
          />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-slate-700">Password</span>
          <input
            v-model="password"
            class="mt-2 w-full rounded-md border border-rose-200 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            type="password"
            placeholder="password"
            required
          />
        </label>

        <p v-if="errorMessage" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ errorMessage }}
        </p>

        <button
          class="w-full rounded-md bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          type="submit"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiBaseUrl } from '../config/api';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const login = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push('/dashboard');
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};
</script>
