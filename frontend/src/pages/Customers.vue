<template>
  <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-950">Customers</h1>
        <p class="mt-1 text-sm text-slate-600">Customer directory for Beauty Mart orders.</p>
      </div>
      <input
        v-model="search"
        class="w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 sm:w-80"
        type="search"
        placeholder="Search customer or Facebook"
      />
    </div>

    <p v-if="errorMessage" class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ errorMessage }}</p>

    <section class="mt-6 overflow-hidden rounded-lg border border-rose-100 bg-white shadow-sm">
      <div class="border-b border-rose-100 px-5 py-4">
        <p class="border-l-4 border-rose-600 pl-3 text-sm font-medium text-slate-600">
          Total Customers: <span class="font-semibold text-slate-950">{{ customers.length }}</span>
        </p>
      </div>
      <div v-if="isLoading" class="px-4 py-8 text-center text-sm text-slate-500">Loading customers...</div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead class="bg-rose-50 text-slate-600">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Phone</th>
              <th class="px-4 py-3">Facebook Acc</th>
              <th class="px-4 py-3">Address</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!isLoading && customers.length === 0" class="border-t border-rose-100">
              <td class="px-4 py-8 text-center text-slate-500" colspan="4">No customers found.</td>
            </tr>
            <tr v-for="customer in customers" :key="customer.id" class="border-t border-rose-100">
              <td class="px-4 py-3 font-semibold text-slate-950">{{ customer.name }}</td>
              <td class="px-4 py-3">{{ customer.phone || '-' }}</td>
              <td class="px-4 py-3">{{ customer.facebook_acc || '-' }}</td>
              <td class="px-4 py-3">{{ customer.address || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { apiBaseUrl } from '../config/api';

const router = useRouter();
const search = ref('');
const customers = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
let searchTimer;

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchCustomers, 250);
});

onMounted(fetchCustomers);

const handleUnauthorized = (response) => {
  if (response.status !== 401) {
    return false;
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
  return true;
};

async function fetchCustomers() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = new URLSearchParams();

    if (search.value.trim()) {
      params.set('search', search.value.trim());
    }

    const response = await fetch(`${apiBaseUrl}/customers?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load customers.');
    }

    customers.value = data;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}
</script>
