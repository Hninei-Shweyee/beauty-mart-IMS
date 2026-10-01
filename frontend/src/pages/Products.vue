<template>
  <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-950">Products</h1>
        <p class="mt-1 text-sm text-slate-600">Track inventory, pricing, and low-stock items.</p>
      </div>
      <input
        v-model="search"
        class="w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 sm:w-80"
        type="search"
        placeholder="Search brand, product, or shade"
      />
    </div>

    <section class="mt-6 rounded-lg border border-rose-100 bg-white shadow-sm p-5">
      <h2 class="text-base font-semibold text-slate-950">{{ editingId ? 'Edit Product' : 'Add Product' }}</h2>
      <form class="mt-4 grid gap-4 md:grid-cols-4" @submit.prevent="saveProduct">
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Brand</span>
          <input v-model="form.brand" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" required />
        </label>
        <label class="block md:col-span-2">
          <span class="text-xs font-medium text-slate-600">Product Name</span>
          <input v-model="form.product_name" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Category</span>
          <input v-model="form.category" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Shade</span>
          <input v-model="form.shade" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Buy Price (THB)</span>
          <input v-model.number="form.buy_price" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" min="0" step="0.01" type="number" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Sell Price (MMK)</span>
          <input v-model.number="form.sell_price" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" min="0" step="0.01" type="number" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Stock</span>
          <input v-model.number="form.stock_quantity" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" min="0" type="number" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Low Stock Alert</span>
          <input v-model.number="form.low_stock_alert" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" min="0" type="number" />
        </label>

        <div class="flex items-end gap-3 md:col-span-4">
          <button
            class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            type="submit"
            :disabled="isSaving"
          >
            {{ isSaving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product' }}
          </button>
          <button
            v-if="editingId"
            class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
            type="button"
            @click="resetForm"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>

    <p v-if="message" class="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ message }}</p>
    <p v-if="errorMessage" class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ errorMessage }}</p>

    <section class="mt-6 overflow-hidden rounded-lg border border-rose-100 bg-white shadow-sm">
      <div v-if="isLoading" class="px-4 py-8 text-center text-sm text-slate-500">Loading products...</div>
      <div v-else-if="products.length === 0" class="px-4 py-8 text-center text-sm text-slate-500">No products found.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[920px] text-left text-sm">
          <thead class="bg-rose-50 text-slate-600">
            <tr>
              <th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Shade</th>
              <th class="px-4 py-3">Buy</th>
              <th class="px-4 py-3">Sell</th>
              <th class="px-4 py-3">Stock</th>
              <th class="px-4 py-3">Alert</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="product in products"
              :key="product.id"
              class="border-t border-rose-100"
              :class="isLowStock(product) ? 'bg-amber-50' : 'bg-white'"
            >
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-950">{{ product.product_name }}</p>
                <p class="text-xs text-slate-500">{{ product.brand }}</p>
              </td>
              <td class="px-4 py-3">{{ product.category || '-' }}</td>
              <td class="px-4 py-3">{{ product.shade || '-' }}</td>
              <td class="px-4 py-3">{{ formatBaht(product.buy_price) }}</td>
              <td class="px-4 py-3">{{ formatKyat(product.sell_price) }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-1 text-xs font-semibold"
                  :class="isLowStock(product) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'"
                >
                  {{ product.stock_quantity }}
                  <span v-if="isLowStock(product)">Low</span>
                </span>
              </td>
              <td class="px-4 py-3">{{ product.low_stock_alert }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold hover:border-rose-500 hover:text-rose-700" @click="editProduct(product)">
                    Edit
                  </button>
                  <button class="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50" @click="deleteProduct(product)">
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
import { formatBaht, formatKyat } from '../utils/currency';

const router = useRouter();
const products = ref([]);
const search = ref('');
const isLoading = ref(false);
const isSaving = ref(false);
const editingId = ref(null);
const message = ref('');
const errorMessage = ref('');

const emptyForm = {
  brand: '',
  product_name: '',
  category: '',
  shade: '',
  buy_price: 0,
  sell_price: 0,
  stock_quantity: 0,
  low_stock_alert: 5
};

const form = reactive({ ...emptyForm });

const authHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}));

let searchTimer;

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchProducts, 250);
});

onMounted(fetchProducts);

const handleUnauthorized = (response) => {
  if (response.status !== 401) {
    return false;
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
  return true;
};

async function fetchProducts() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = new URLSearchParams();

    if (search.value.trim()) {
      params.set('search', search.value.trim());
    }

    const response = await fetch(`${apiBaseUrl}/products?${params.toString()}`, {
      headers: authHeaders.value
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load products.');
    }

    products.value = data;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

const saveProduct = async () => {
  isSaving.value = true;
  message.value = '';
  errorMessage.value = '';

  try {
    const url = editingId.value ? `${apiBaseUrl}/products/${editingId.value}` : `${apiBaseUrl}/products`;
    const method = editingId.value ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: authHeaders.value,
      body: JSON.stringify(form)
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to save product.');
    }

    message.value = editingId.value ? 'Product updated.' : 'Product added.';
    resetForm();
    await fetchProducts();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSaving.value = false;
  }
};

const editProduct = (product) => {
  editingId.value = product.id;
  Object.assign(form, {
    brand: product.brand || '',
    product_name: product.product_name || '',
    category: product.category || '',
    shade: product.shade || '',
    buy_price: Number(product.buy_price || 0),
    sell_price: Number(product.sell_price || 0),
    stock_quantity: Number(product.stock_quantity || 0),
    low_stock_alert: Number(product.low_stock_alert || 5)
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deleteProduct = async (product) => {
  const confirmed = window.confirm(`Delete ${product.product_name}?`);

  if (!confirmed) {
    return;
  }

  message.value = '';
  errorMessage.value = '';

  try {
    const response = await fetch(`${apiBaseUrl}/products/${product.id}`, {
      method: 'DELETE',
      headers: authHeaders.value
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to delete product.');
    }

    if (editingId.value === product.id) {
      resetForm();
    }

    message.value = 'Product deleted.';
    await fetchProducts();
  } catch (error) {
    errorMessage.value = error.message;
  }
};

const resetForm = () => {
  editingId.value = null;
  Object.assign(form, { ...emptyForm });
};

const isLowStock = (product) => Number(product.stock_quantity) <= Number(product.low_stock_alert);

</script>
