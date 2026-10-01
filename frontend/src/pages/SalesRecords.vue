<template>
  <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-950">Sales Records</h1>
        <p class="mt-1 text-sm text-slate-600">Review orders, sales totals, and profit.</p>
      </div>
      <button
        class="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
        :disabled="isExporting"
        @click="exportExcel"
      >
        {{ isExporting ? 'Exporting...' : 'Export Excel' }}
      </button>
    </div>

    <section class="mt-6 grid gap-4 rounded-lg border border-rose-100 bg-white shadow-sm p-5 md:grid-cols-4">
      <label class="block">
        <span class="text-xs font-medium text-slate-600">Date</span>
        <input
          v-model="filters.date"
          class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          type="date"
        />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-slate-600">Sales Person</span>
        <input
          v-model="filters.sales_person"
          class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          placeholder="HT"
        />
      </label>
      <label class="block md:col-span-2">
        <span class="text-xs font-medium text-slate-600">Customer or Facebook</span>
        <input
          v-model="filters.search"
          class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          type="search"
          placeholder="Search customer name or Facebook account"
        />
      </label>
      <div class="flex items-end gap-3 md:col-span-4">
        <button class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700" @click="fetchSales">
          Apply Filters
        </button>
        <button class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400" @click="clearFilters">
          Clear
        </button>
      </div>
    </section>

    <p v-if="errorMessage" class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ errorMessage }}</p>
    <p v-if="message" class="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ message }}</p>

    <section v-if="editingSale" class="mt-6 rounded-lg border border-rose-100 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-base font-semibold text-slate-950">Edit Sales Record</h2>
          <p class="text-sm text-slate-500">{{ editingSale.product_name }} / {{ editingSale.shade || '-' }}</p>
        </div>
        <button class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400" @click="cancelEdit">
          Cancel
        </button>
      </div>

      <form class="mt-4 grid gap-4 md:grid-cols-4" @submit.prevent="updateSale">
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Date</span>
          <input v-model="editForm.order_date" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" type="date" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Sales Person</span>
          <input v-model="editForm.sales_person" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Customer</span>
          <input v-model="editForm.customer_name" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Facebook Acc</span>
          <input v-model="editForm.facebook_acc" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Quantity</span>
          <input v-model.number="editForm.quantity" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" min="1" type="number" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Sell Price (MMK)</span>
          <input v-model.number="editForm.sell_price" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" min="0" type="number" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Payment</span>
          <select v-model="editForm.payment_method" class="mt-1 w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100">
            <option value="COD">COD</option>
            <option value="Prepaid">Prepaid</option>
          </select>
        </label>
        <div class="flex items-end">
          <button
            class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            :disabled="isSaving"
            type="submit"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </section>

    <section class="mt-6 overflow-hidden rounded-lg border border-rose-100 bg-white shadow-sm">
      <div class="border-b border-rose-100 px-5 py-4">
        <p class="border-l-4 border-rose-600 pl-3 text-sm font-medium text-slate-600">
          Total Orders: <span class="font-semibold text-slate-950">{{ totalOrders }}</span>
        </p>
      </div>
      <div v-if="isLoading" class="px-4 py-8 text-center text-sm text-slate-500">Loading sales records...</div>
      <div v-else-if="sales.length === 0" class="px-4 py-8 text-center text-sm text-slate-500">No sales records found.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1180px] text-left text-sm">
          <thead class="bg-rose-50 text-slate-600">
            <tr>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Sales Person</th>
              <th class="px-4 py-3">Customer</th>
              <th class="px-4 py-3">Facebook Acc</th>
              <th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">Shade</th>
              <th class="px-4 py-3">Quantity</th>
              <th class="px-4 py-3">Total Amount</th>
              <th class="px-4 py-3">Profit</th>
              <th class="px-4 py-3">Payment</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in sales" :key="`${sale.sale_id}-${sale.product_id}`" class="border-t border-rose-100">
              <td class="px-4 py-3">{{ formatDate(sale.order_date) }}</td>
              <td class="px-4 py-3">{{ sale.sales_person || '-' }}</td>
              <td class="px-4 py-3 font-medium text-slate-950">{{ sale.customer_name || '-' }}</td>
              <td class="px-4 py-3">{{ sale.facebook_acc || '-' }}</td>
              <td class="px-4 py-3">
                <p class="font-medium text-slate-950">{{ sale.product_name }}</p>
                <p class="text-xs text-slate-500">{{ sale.brand }}</p>
              </td>
              <td class="px-4 py-3">{{ sale.shade || '-' }}</td>
              <td class="px-4 py-3">{{ sale.quantity }}</td>
              <td class="px-4 py-3">{{ formatKyat(sale.total_amount) }}</td>
              <td class="px-4 py-3 font-semibold text-emerald-700">{{ formatKyat(sale.profit) }}</td>
              <td class="px-4 py-3">{{ sale.payment_method || '-' }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold hover:border-rose-500 hover:text-rose-700" @click="startEdit(sale)">
                    Edit
                  </button>
                  <button class="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50" @click="deleteSale(sale)">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { apiBaseUrl } from '../config/api';
import { formatKyat } from '../utils/currency';

const router = useRouter();
const sales = ref([]);
const isLoading = ref(false);
const isExporting = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const message = ref('');
const editingSale = ref(null);
const editForm = reactive({
  order_date: '',
  sales_person: '',
  customer_name: '',
  facebook_acc: '',
  quantity: 1,
  sell_price: 0,
  payment_method: 'COD'
});
const filters = reactive({
  date: '',
  sales_person: '',
  search: ''
});

let filterTimer;

const authHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}));

const totalOrders = computed(() => new Set(sales.value.map((sale) => sale.sale_id)).size);

watch(filters, () => {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(fetchSales, 300);
});

onMounted(fetchSales);

const handleUnauthorized = (response) => {
  if (response.status !== 401) {
    return false;
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
  return true;
};

async function fetchSales() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = buildFilterParams();
    const response = await fetch(`${apiBaseUrl}/sales?${params.toString()}`, {
      headers: authHeaders.value
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load sales records.');
    }

    sales.value = data;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

const startEdit = (sale) => {
  editingSale.value = sale;
  message.value = '';
  errorMessage.value = '';
  Object.assign(editForm, {
    order_date: formatDate(sale.order_date),
    sales_person: sale.sales_person || '',
    customer_name: sale.customer_name || '',
    facebook_acc: sale.facebook_acc || '',
    quantity: Number(sale.quantity || 1),
    sell_price: Number(sale.sell_price || 0),
    payment_method: sale.payment_method || 'COD'
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const cancelEdit = () => {
  editingSale.value = null;
};

async function updateSale() {
  if (!editingSale.value) {
    return;
  }

  isSaving.value = true;
  message.value = '';
  errorMessage.value = '';

  try {
    const response = await fetch(
      `${apiBaseUrl}/sales/${editingSale.value.sale_id}/items/${editingSale.value.sale_item_id}`,
      {
        method: 'PUT',
        headers: {
          ...authHeaders.value,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      }
    );

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to update sales record.');
    }

    message.value = data.message || 'Sales record updated.';
    editingSale.value = null;
    await fetchSales();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSaving.value = false;
  }
}

async function deleteSale(sale) {
  const confirmed = window.confirm(`Delete sale for ${sale.customer_name || 'this customer'}? Stock will be restored.`);

  if (!confirmed) {
    return;
  }

  message.value = '';
  errorMessage.value = '';

  try {
    const response = await fetch(`${apiBaseUrl}/sales/${sale.sale_id}`, {
      method: 'DELETE',
      headers: authHeaders.value
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to delete sales record.');
    }

    if (editingSale.value?.sale_id === sale.sale_id) {
      editingSale.value = null;
    }

    message.value = data.message || 'Sales record deleted.';
    await fetchSales();
  } catch (error) {
    errorMessage.value = error.message;
  }
}

async function exportExcel() {
  isExporting.value = true;
  errorMessage.value = '';

  try {
    const params = buildFilterParams();
    const response = await fetch(`${apiBaseUrl}/sales/export-excel?${params.toString()}`, {
      headers: authHeaders.value
    });

    if (handleUnauthorized(response)) {
      return;
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Unable to export sales records.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sales-records.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isExporting.value = false;
  }
}

const clearFilters = () => {
  filters.date = '';
  filters.sales_person = '';
  filters.search = '';
  fetchSales();
};

const buildFilterParams = () => {
  const params = new URLSearchParams();

  if (filters.date) params.set('date', filters.date);
  if (filters.sales_person.trim()) params.set('sales_person', filters.sales_person.trim());
  if (filters.search.trim()) params.set('search', filters.search.trim());

  return params;
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  return String(value).slice(0, 10);
};
</script>
