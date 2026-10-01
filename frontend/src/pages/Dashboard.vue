<template>
  <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-950">Dashboard</h1>
        <p class="mt-1 text-sm text-slate-600">Owner view for sales, profit, inventory, customers, and orders.</p>
      </div>
      <button
        class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-rose-500 hover:text-rose-700"
        @click="fetchSummary"
      >
        Refresh
      </button>
    </div>

    <section class="mt-6 rounded-lg border border-rose-100 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-base font-semibold text-slate-950">Sales Date Range</h2>
          <p class="mt-1 text-sm text-slate-500">{{ rangeLabel }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in presets"
            :key="preset.key"
            class="rounded-md px-3 py-2 text-sm font-semibold transition"
            :class="activePreset === preset.key ? 'bg-rose-600 text-white shadow-sm shadow-rose-200' : 'border border-rose-200 text-slate-700 hover:border-rose-500 hover:text-rose-700'"
            @click="applyPreset(preset.key)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Start Date</span>
          <input
            v-model="filters.start_date"
            class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            type="date"
            @change="activePreset = 'custom'"
          />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">End Date</span>
          <input
            v-model="filters.end_date"
            class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            type="date"
            @change="activePreset = 'custom'"
          />
        </label>
        <div class="flex items-end gap-3">
          <button class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700" @click="fetchSummary">
            Apply Dates
          </button>
          <button class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400" @click="clearDates">
            All Time
          </button>
        </div>
      </div>
    </section>

    <p v-if="errorMessage" class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ errorMessage }}</p>

    <div class="mt-6 grid gap-4 md:grid-cols-3">
      <article v-for="card in cards" :key="card.label" class="rounded-lg border border-rose-100 bg-white p-5 shadow-sm">
        <p class="text-sm text-slate-500">{{ card.label }}</p>
        <p class="mt-2 text-3xl font-bold" :class="card.className">{{ card.value }}</p>
      </article>
    </div>

    <section class="mt-8 overflow-hidden rounded-lg border border-rose-100 bg-white shadow-sm">
      <div class="border-b border-rose-100 px-5 py-4">
        <h2 class="text-base font-semibold text-slate-950">Low Stock Products</h2>
      </div>
      <div v-if="isLoading" class="px-4 py-8 text-center text-sm text-slate-500">Loading inventory...</div>
      <div v-else-if="lowStockProducts.length === 0" class="px-4 py-8 text-center text-sm text-slate-500">No low-stock products.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="bg-rose-50 text-slate-600">
            <tr>
              <th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Shade</th>
              <th class="px-4 py-3">Stock</th>
              <th class="px-4 py-3">Alert</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in lowStockProducts" :key="product.id" class="border-t border-rose-100 bg-amber-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-950">{{ product.product_name }}</p>
                <p class="text-xs text-slate-500">{{ product.brand }}</p>
              </td>
              <td class="px-4 py-3">{{ product.category || '-' }}</td>
              <td class="px-4 py-3">{{ product.shade || '-' }}</td>
              <td class="px-4 py-3 font-semibold text-amber-800">{{ product.stock_quantity }}</td>
              <td class="px-4 py-3">{{ product.low_stock_alert }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiBaseUrl } from '../config/api';
import { formatKyat } from '../utils/currency';

const router = useRouter();
const isLoading = ref(false);
const errorMessage = ref('');
const activePreset = ref('month');
const summary = ref({
  total_sales_amount: 0,
  total_profit: 0,
  filtered_orders: 0,
  filtered_customers: 0,
  total_products: 0,
  low_stock_products: 0,
  total_customers: 0,
  total_orders: 0
});
const filters = reactive({
  start_date: '',
  end_date: ''
});
const lowStockProducts = ref([]);

const presets = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' }
];

const cards = computed(() => [
  {
    label: 'Sales Count',
    value: summary.value.filtered_orders,
    className: 'text-slate-950'
  },
  {
    label: 'Customers',
    value: summary.value.filtered_customers,
    className: 'text-slate-950'
  },
  {
    label: 'Total Products',
    value: summary.value.total_products,
    className: 'text-slate-950'
  },
  {
    label: 'Sales Amount',
    value: formatKyat(summary.value.total_sales_amount),
    className: 'text-slate-950'
  },
  {
    label: 'Profit',
    value: formatKyat(summary.value.total_profit),
    className: 'text-emerald-700'
  },
  {
    label: 'Low Stock Products',
    value: summary.value.low_stock_products,
    className: 'text-amber-700'
  }
]);

const rangeLabel = computed(() => {
  if (!filters.start_date && !filters.end_date) {
    return 'Showing all sales dates.';
  }

  if (filters.start_date && filters.end_date) {
    return 'Showing ' + formatDisplayDate(filters.start_date) + ' to ' + formatDisplayDate(filters.end_date) + '.';
  }

  if (filters.start_date) {
    return 'Showing sales from ' + formatDisplayDate(filters.start_date) + '.';
  }

  return 'Showing sales until ' + formatDisplayDate(filters.end_date) + '.';
});

onMounted(() => {
  applyPreset('month');
});

const handleUnauthorized = (response) => {
  if (response.status !== 401) {
    return false;
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
  return true;
};

async function fetchSummary() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = new URLSearchParams();

    if (filters.start_date) {
      params.set('start_date', filters.start_date);
    }

    if (filters.end_date) {
      params.set('end_date', filters.end_date);
    }

    const queryString = params.toString();
    const url = apiBaseUrl + '/dashboard/summary' + (queryString ? '?' + queryString : '');
    const response = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load dashboard summary.');
    }

    summary.value = data.summary;
    lowStockProducts.value = data.low_stock_products;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

function applyPreset(preset) {
  activePreset.value = preset;
  const now = new Date();

  if (preset === 'today') {
    filters.start_date = formatInputDate(now);
    filters.end_date = formatInputDate(now);
  }

  if (preset === 'week') {
    const start = new Date(now);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    filters.start_date = formatInputDate(start);
    filters.end_date = formatInputDate(now);
  }

  if (preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    filters.start_date = formatInputDate(start);
    filters.end_date = formatInputDate(end);
  }

  fetchSummary();
}

function clearDates() {
  activePreset.value = 'all';
  filters.start_date = '';
  filters.end_date = '';
  fetchSummary();
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return year + '-' + month + '-' + day;
}

function formatDisplayDate(value) {
  return new Date(value + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
</script>
