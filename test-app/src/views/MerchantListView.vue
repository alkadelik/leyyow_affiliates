<template>
  <div class="card">
    <div class="card-header">
      <h2>Merchants</h2>
      <button class="btn btn-secondary" :disabled="loading" @click="load">
        {{ loading ? 'Loading…' : 'Refresh' }}
      </button>
    </div>

    <div v-if="error" class="response-box error" style="margin-bottom:16px;">{{ error }}</div>

    <div v-if="loading && !merchants.length" class="empty">
      <strong>Loading…</strong>
    </div>

    <div v-else-if="!merchants.length" class="empty">
      <strong>No merchants found</strong>
      <span>Add one on the Add Merchant screen, then refresh.</span>
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Merchant ID</th>
            <th>Affiliate</th>
            <th>Status</th>
            <th>Subscription ID</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in merchants" :key="m.id">
            <td>{{ m.merchant_name }}</td>
            <td><code>{{ m.merchant_id }}</code></td>
            <td>{{ m.affiliate_name }}</td>
            <td><span :class="['badge', 'badge-' + m.status]">{{ m.status }}</span></td>
            <td><code>{{ m.id }}</code></td>
            <td style="text-align:right;">
              <div class="menu-wrap" v-click-outside="() => closeMenu(m.id)">
                <button class="menu-btn" @click.stop="toggleMenu(m.id)">⋯</button>
                <div v-if="openMenuId === m.id" class="dropdown">
                  <button class="dropdown-item" @click="openModal('subscribe', m)">Subscribe</button>
                  <button class="dropdown-item" @click="openModal('cancel', m)">Cancel</button>
                  <button class="dropdown-item" @click="openModal('expire', m)">Expire</button>
                  <button class="dropdown-item" @click="openModal('resubscribe', m)">Resubscribe</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal -->
  <Teleport to="body">
    <div v-if="modal.open" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <h3>{{ TITLES[modal.action] }}</h3>
        <p class="modal-subtitle">{{ modal.merchant.merchant_name }} · {{ modal.merchant.merchant_id }}</p>

        <template v-if="modal.action === 'subscribe' || modal.action === 'resubscribe'">
          <div class="form-row">
            <label>Subscription Tier</label>
            <select v-model="modal.form.subscription_tier">
              <option value="bloom">bloom</option>
              <option value="burst">burst</option>
            </select>
          </div>
          <div class="form-row">
            <label>Subscription Start</label>
            <input v-model="modal.form.subscription_start" type="datetime-local" @change="autoSetEndDate">
          </div>
          <div class="form-row">
            <label>Amount Paid (kobo)</label>
            <input v-model="modal.form.amount_paid_kobo" type="number" placeholder="1000000">
          </div>
          <div class="form-row">
            <label>Merchant Subscription ID</label>
            <input v-model="modal.form.merchant_subscription_id" type="text">
          </div>
        </template>

        <div class="form-row">
          <label>Occurred At</label>
          <input v-model="modal.form.occurred_at" type="datetime-local">
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" :disabled="modal.loading" @click="submitModal">
            {{ modal.loading ? 'Submitting…' : 'Submit' }}
          </button>
        </div>

        <div v-if="modal.response" :class="['response-box', modal.response.ok ? 'success' : 'error']">
          {{ modal.response.text }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps(['baseUrl', 'apiKey'])

const merchants  = ref([])
const loading    = ref(false)
const error      = ref('')
const openMenuId = ref(null)

const TITLES = {
  subscribe:   'Subscribe',
  cancel:      'Cancel Subscription',
  expire:      'Expire Subscription',
  resubscribe: 'Resubscribe',
}

const modal = reactive({
  open:     false,
  action:   null,
  merchant: null,
  form:     {},
  loading:  false,
  response: null,
})

// ── Data ──────────────────────────────────────────────────────────────────────

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const { data } = await axios.get(
      `${props.baseUrl}/api/internal/merchant-leads/`,
      { headers: { 'X-Internal-API-Key': props.apiKey } }
    )
    merchants.value = data.results ?? data
  } catch (err) {
    error.value = err.response?.data?.error ?? 'Failed to load merchants.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Menu ──────────────────────────────────────────────────────────────────────

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu(id) {
  if (openMenuId.value === id) openMenuId.value = null
}

const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  },
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function autoSetEndDate() {
  const start = modal.form.subscription_start
  if (!start) return
  const d = new Date(start)
  d.setMonth(d.getMonth() + 1)
  d.setDate(d.getDate() - 1)
  modal.form.subscription_end = d.toISOString().slice(0, 16)
}

function nowLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

function openModal(action, merchant) {
  openMenuId.value = null
  modal.action   = action
  modal.merchant = merchant
  modal.response = null
  modal.form = {
    subscription_tier:        merchant.subscription_tier || 'bloom',
    subscription_start:       '',
    subscription_end:         '',
    amount_paid_kobo:         '',
    merchant_subscription_id: merchant.id,
    occurred_at:              nowLocal(),
  }
  modal.open = true
}

function closeModal() {
  modal.open = false
}

async function submitModal() {
  modal.loading  = true
  modal.response = null

  const f = modal.form
  const m = modal.merchant
  let body

  if (modal.action === 'subscribe' || modal.action === 'resubscribe') {
    body = {
      merchant_id:              m.merchant_id,
      event_type:               'subscribed',
      subscription_tier:        f.subscription_tier,
      subscription_start:       f.subscription_start ? new Date(f.subscription_start).toISOString() : null,
      subscription_end:         f.subscription_end   ? new Date(f.subscription_end).toISOString()   : null,
      amount_paid_kobo:         parseInt(f.amount_paid_kobo, 10),
      merchant_subscription_id: f.merchant_subscription_id,
      occurred_at:              new Date(f.occurred_at).toISOString(),
    }
  } else {
    body = {
      merchant_id: m.merchant_id,
      event_type:  modal.action === 'cancel' ? 'cancelled' : 'expired',
      occurred_at: new Date(f.occurred_at).toISOString(),
    }
  }

  try {
    const { data } = await axios.post(
      `${props.baseUrl}/api/internal/merchant-subscription/`,
      body,
      { headers: { 'X-Internal-API-Key': props.apiKey } }
    )
    modal.response = { ok: true, text: JSON.stringify(data, null, 2) }
    await load()
  } catch (err) {
    const detail = err.response?.data
    modal.response = { ok: false, text: JSON.stringify(detail ?? err.message, null, 2) }
  } finally {
    modal.loading = false
  }
}
</script>
