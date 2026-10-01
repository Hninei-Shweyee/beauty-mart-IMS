<template>
  <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-950">Order</h1>
        <p class="mt-1 text-sm text-slate-600">Paste a voucher or add an order manually.</p>
      </div>
      <button
        class="inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        @click="showManualForm = !showManualForm"
      >
        {{ showManualForm ? 'Close Form' : 'Add Order' }}
      </button>
    </div>

    <section v-if="showManualForm" class="mt-6 rounded-lg border border-rose-100 bg-white p-6 shadow-sm">
      <h2 class="text-base font-semibold text-slate-950">Add Sales Record</h2>
      <form class="mt-4 grid gap-4 md:grid-cols-4" @submit.prevent="saveManualOrder">
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Date</span>
          <input v-model="manualForm.date" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" type="date" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Sales Person</span>
          <input v-model="manualForm.sales_person" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Customer</span>
          <input v-model="manualForm.customer_name" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Facebook Acc</span>
          <input v-model="manualForm.facebook_acc" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
        </label>
        <label class="block md:col-span-3">
          <span class="text-xs font-medium text-slate-600">Product</span>
          <select v-model="selectedProductId" class="mt-1 w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" required>
            <option value="">{{ isProductsLoading ? 'Loading products...' : 'Select product' }}</option>
            <option v-for="product in products" :key="product.id" :value="String(product.id)">
              {{ product.product_name }} - {{ product.shade || 'No shade' }} ({{ product.brand }}) - Stock {{ product.stock_quantity }}
            </option>
          </select>
          <p v-if="selectedProduct" class="mt-1 text-xs text-slate-500">
            {{ selectedProduct.brand }} / {{ selectedProduct.category || 'No category' }} / {{ selectedProduct.shade || 'No shade' }}
          </p>
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Quantity</span>
          <input v-model.number="manualForm.quantity" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" min="1" type="number" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Price (MMK)</span>
          <input v-model.number="manualForm.price" class="mt-1 w-full rounded-md border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" min="0" type="number" required />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Payment</span>
          <select v-model="manualForm.payment" class="mt-1 w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100">
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
            {{ isSaving ? 'Saving...' : 'Save Order' }}
          </button>
        </div>
      </form>
    </section>

    <section class="mt-6 rounded-lg border border-rose-100 bg-white shadow-sm p-6">
      <label class="block">
        <span class="text-sm font-medium text-slate-700">Order Voucher</span>
        <textarea
          v-model="rawOrder"
          class="mt-2 min-h-72 w-full rounded-md border border-rose-200 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          placeholder="Paste customer order voucher here..."
        />
      </label>

      <div class="mt-4 flex flex-wrap gap-3">
        <button
          class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          :disabled="isParsing || !rawOrder.trim()"
          @click="parsePreview"
        >
          {{ isParsing ? 'Parsing...' : 'Parse Preview' }}
        </button>
        <button
          class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
          @click="clearOrder"
        >
          Clear
        </button>
      </div>
    </section>

    <p v-if="message" class="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ message }}</p>
    <p v-if="errorMessage" class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ errorMessage }}</p>

    <section v-if="parsedOrder" class="mt-6 overflow-hidden rounded-lg border border-rose-100 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-rose-100 px-5 py-4">
        <h2 class="text-base font-semibold text-slate-950">Preview</h2>
        <button
          class="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
          :disabled="isSaving"
          @click="confirmSave"
        >
          {{ isSaving ? 'Saving...' : 'Confirm Save' }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead class="bg-rose-50 text-slate-600">
            <tr>
              <th class="px-4 py-3">Field</th>
              <th class="px-4 py-3">Extracted Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in previewRows" :key="row.key" class="border-t border-rose-100">
              <td class="px-4 py-3 font-medium text-slate-700">{{ row.label }}</td>
              <td class="px-4 py-3" :class="row.value === '-' ? 'text-slate-400' : 'text-slate-950'">
                {{ row.value }}
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
const rawOrder = ref('');
const parsedOrder = ref(null);
const showManualForm = ref(false);
const isParsing = ref(false);
const isSaving = ref(false);
const isProductsLoading = ref(false);
const message = ref('');
const errorMessage = ref('');
const products = ref([]);
const selectedProductId = ref('');
const emptyManualForm = {
  date: new Date().toISOString().slice(0, 10),
  sales_person: '',
  customer_name: '',
  facebook_acc: '',
  brand: '',
  product: '',
  shade: '',
  quantity: 1,
  price: 0,
  payment: 'COD'
};
const manualForm = reactive({ ...emptyManualForm });

const selectedProduct = computed(() =>
  products.value.find((product) => String(product.id) === selectedProductId.value)
);

const fieldLabels = [
  ['date', 'Date'],
  ['sales_person', 'Sales Person'],
  ['customer_name', 'Customer Name'],
  ['brand', 'Brand'],
  ['product', 'Product'],
  ['shade', 'Shade'],
  ['category', 'Category'],
  ['quantity', 'Quantity'],
  ['price', 'Price (MMK)'],
  ['payment', 'Payment'],
  ['duration', 'Duration'],
  ['facebook_acc', 'Facebook Acc']
];

const authHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}));

onMounted(fetchProducts);

watch(selectedProduct, (product) => {
  if (!product) {
    manualForm.brand = '';
    manualForm.product = '';
    manualForm.shade = '';
    return;
  }

  manualForm.brand = product.brand || '';
  manualForm.product = product.product_name || '';
  manualForm.shade = product.shade || '';

  if (Number(product.sell_price) > 0) {
    manualForm.price = Number(product.sell_price);
  }
});

const previewRows = computed(() => {
  if (!parsedOrder.value) {
    return [];
  }

  return fieldLabels.map(([key, label]) => ({
    key,
    label,
    value: key === 'price' && parsedOrder.value[key] != null
      ? formatKyat(parsedOrder.value[key])
      : parsedOrder.value[key] ?? '-'
  }));
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

async function fetchProducts() {
  isProductsLoading.value = true;

  try {
    const response = await fetch(`${apiBaseUrl}/products`, {
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
    isProductsLoading.value = false;
  }
}

const resetManualForm = () => {
  Object.assign(manualForm, { ...emptyManualForm });
  selectedProductId.value = '';
};

const parsePreview = async () => {
  isParsing.value = true;
  message.value = '';
  errorMessage.value = '';

  try {
    const response = await fetch(`${apiBaseUrl}/orders/parse`, {
      method: 'POST',
      headers: authHeaders.value,
      body: JSON.stringify({ rawOrder: rawOrder.value })
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to parse order.');
    }

    parsedOrder.value = data;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isParsing.value = false;
  }
};

const confirmSave = async () => {
  isSaving.value = true;
  message.value = '';
  errorMessage.value = '';

  try {
    const response = await fetch(`${apiBaseUrl}/orders/save-from-text`, {
      method: 'POST',
      headers: authHeaders.value,
      body: JSON.stringify({ rawOrder: rawOrder.value })
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to save order.');
    }

    message.value = data.message || 'Order saved.';
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSaving.value = false;
  }
};

const saveManualOrder = async () => {
  isSaving.value = true;
  message.value = '';
  errorMessage.value = '';

  try {
    const response = await fetch(`${apiBaseUrl}/orders/manual`, {
      method: 'POST',
      headers: authHeaders.value,
      body: JSON.stringify(manualForm)
    });

    if (handleUnauthorized(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to save order.');
    }

    message.value = data.message || 'Order saved.';
    resetManualForm();
    showManualForm.value = false;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSaving.value = false;
  }
};

const clearOrder = () => {
  rawOrder.value = '';
  parsedOrder.value = null;
  message.value = '';
  errorMessage.value = '';
};
</script>
