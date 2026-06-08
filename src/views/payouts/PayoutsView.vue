<template>
  <div class="page">
    <div class="nav-bar"><span class="nav-title">Payouts</span></div>

    <AppLoader v-if="loading" :page="true" />

    <div v-else class="scroll-area">

      <!-- Balance card -->
      <div class="balance-card" :class="{ locked: !canPayout }">
        <div class="bal-label">Available balance</div>
        <div class="bal-amount">{{ fmt.naira(wallet.balance) }}</div>
        <div class="bal-threshold">Minimum payout threshold: {{ fmt.naira(THRESHOLD) }}</div>
        <div v-if="!canPayout" class="progress-wrap">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressPct + '%' }" />
          </div>
          <div class="progress-labels">
            <span>{{ fmt.naira(wallet.balance) }}</span>
            <span>{{ fmt.naira(THRESHOLD) }} to unlock</span>
          </div>
        </div>
        <div class="bal-meta-row">
          <div class="bal-meta">
            <div class="bal-meta-value">{{ fmt.naira(wallet.total_earned) }}</div>
            <div class="bal-meta-label">Total earned</div>
          </div>
          <div class="bal-meta">
            <div class="bal-meta-value">{{ fmt.naira(wallet.total_withdrawn) }}</div>
            <div class="bal-meta-label">Total paid out</div>
          </div>
        </div>
      </div>

      <!-- Below threshold warning -->
      <div v-if="!canPayout" class="warning-box">
        <i class="ti ti-lock" aria-hidden="true" />
        <div class="warning-text">
          Your balance is <strong>{{ fmt.naira(THRESHOLD - wallet.balance) }} below</strong> the minimum payout amount of {{ fmt.naira(THRESHOLD) }}. Keep earning to unlock a withdrawal.
        </div>
      </div>

      <!-- Bank account -->
      <div class="card">
        <div class="card-title">Bank account</div>
        <div v-if="bankAccounts.length">
          <div
            v-for="b in bankAccounts" :key="b.id"
            class="bank-row"
            :class="{ selected: selectedBank === b.id }"
            @click="selectedBank = b.id"
          >
            <div class="bank-icon"><i class="ti ti-building-bank" aria-hidden="true" /></div>
            <div class="bank-info">
              <div class="bank-name">{{ b.bank_name }}</div>
              <div class="bank-acct">{{ b.account_name }} · ••••{{ b.account_number?.slice(-4) }}</div>
            </div>
            <div class="radio" :class="{ on: selectedBank === b.id }" />
          </div>
        </div>
        <div v-else class="no-bank">No bank account added yet.</div>
        <div class="add-bank-row" @click="showAddBank = true">
          <i class="ti ti-plus" aria-hidden="true" /> Add bank account
        </div>
      </div>

      <!-- Amount + fee breakdown -->
      <template v-if="canPayout">
        <div class="card">
          <div class="card-title">Withdrawal amount</div>
          <div class="amount-wrap" :class="{ 'amount-error': amountError }">
            <span class="amount-prefix">₦</span>
            <input v-model.number="amount" type="number" :placeholder="minAmountNaira.toString()" @input="validateAmount" />
          </div>
          <div v-if="amountError" class="amount-error-msg">{{ amountError }}</div>
          <div v-else class="amount-hint">Maximum: {{ fmt.naira(wallet.balance) }} · Minimum: {{ fmt.naira(THRESHOLD) }}</div>
        </div>
        <div class="card">
          <div class="card-title">Fee breakdown</div>
          <div class="fee-row"><span class="fee-label">Withdrawal amount</span><span class="fee-value">{{ amount ? '₦' + amount.toLocaleString() : '—' }}</span></div>
          <div class="fee-row"><span class="fee-label">Transfer fee</span><span class="fee-value red">−₦100</span></div>
          <div class="fee-total-row">
            <span class="fee-total-label">You'll receive</span>
            <span class="fee-total-value">{{ amount ? '₦' + (amount - 100).toLocaleString() : '—' }}</span>
          </div>
        </div>
      </template>

      <!-- Fee teaser when locked -->
      <div v-else class="card" style="opacity:0.6">
        <div class="card-title">Fee breakdown</div>
        <div class="fee-row"><span class="fee-label">Transfer fee</span><span class="fee-value red">−₦100</span></div>
        <div class="fee-row"><span class="fee-label">On a ₦50,000 withdrawal</span><span class="fee-value">You'd receive ₦49,900</span></div>
      </div>

      <!-- CTA -->
      <button class="btn-main" :class="{ disabled: !canSubmit }" :disabled="!canSubmit || submitting" @click="requestPayout">
        <i v-if="submitting" class="ti ti-loader-2 spin" aria-hidden="true" />
        <i v-else-if="!canPayout" class="ti ti-lock" aria-hidden="true" />
        <i v-else class="ti ti-cash" aria-hidden="true" />
        {{ submitLabel }}
      </button>

      <!-- Payout history -->
      <div v-if="payouts.length">
        <div class="section-label">Payout history</div>
        <div class="history-list">
          <div v-for="p in payouts" :key="p.id" class="history-item">
            <div class="h-icon" :class="p.status === 'paid' ? 'credit' : p.status === 'cancelled' ? 'debit' : 'pending'">
              <i :class="p.status === 'paid' ? 'ti ti-check' : p.status === 'cancelled' ? 'ti ti-x' : 'ti ti-clock'" aria-hidden="true" />
            </div>
            <div class="h-info">
              <div class="h-desc">Payout request</div>
              <div class="h-date">{{ fmt.date(p.requested_at) }}</div>
              <div class="h-bank">{{ p.bank_account_detail?.bank_name }} ••••{{ p.bank_account_detail?.account_number?.slice(-4) }}</div>
            </div>
            <div class="h-right">
              <div class="h-amount" :class="p.status === 'paid' ? 'green' : ''">{{ fmt.naira(p.requested_amount) }}</div>
              <span class="spill" :class="{
                'spill-paid': p.status === 'paid',
                'spill-pending': p.status === 'pending' || p.status === 'approved',
                'spill-cancel': p.status === 'cancelled' || p.status === 'failed',
                'spill-done': false,
              }">
                {{ fmt.payoutStatus(p.status).label }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Add bank account bottom sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showAddBank" class="sheet-overlay" @click.self="showAddBank = false">
          <div class="sheet">
            <div class="sheet-handle" />
            <div class="sheet-title">Add bank account</div>

            <Transition name="fade">
              <div v-if="bankError" class="error-banner">
                <i class="ti ti-alert-circle" />{{ bankError }}
              </div>
            </Transition>

            <!-- Bank selector -->
            <div class="field">
              <label>Bank</label>
              <div class="dropdown-wrap">
                <input
                  v-model="bankSearch"
                  type="text"
                  placeholder="Search for your bank…"
                  @focus="showBankDropdown = true"
                  @click="showBankDropdown = true"
                  @input="showBankDropdown = true"
                  @blur="() => setTimeout(() => showBankDropdown = false, 200)"
                />
                <i v-if="loadingBanks" class="ti ti-loader-2 spin" />
                <i v-else class="ti ti-chevron-down" />
                <div v-if="showBankDropdown && filteredBanks.length" class="bank-dropdown">
                  <div
                    v-for="b in filteredBanks"
                    :key="b.code"
                    class="bank-option"
                    @mousedown.prevent="selectBank(b)"
                  >
                    {{ b.name }}
                  </div>
                </div>
              </div>
              <div v-if="bankForm.bank_name" class="selected-bank">
                <i class="ti ti-circle-check" /> {{ bankForm.bank_name }}
              </div>
            </div>

            <!-- Account number -->
            <div class="field" style="margin-top:12px">
              <label>Account number</label>
              <div class="input-wrap" :class="{ 'input-wrap--resolving': resolvingAccount, 'input-wrap--resolved': bankForm.account_name }">
                <input
                  v-model="bankForm.account_number"
                  type="text"
                  placeholder="10-digit account number"
                  maxlength="10"
                  :disabled="!bankForm.bank_code"
                  @input="onAccountNumberInput"
                />
                <i v-if="resolvingAccount" class="ti ti-loader-2 spin input-icon" />
                <i v-else-if="bankForm.account_name" class="ti ti-circle-check input-icon" style="color:#1D9E75" />
              </div>
              <div v-if="!bankForm.bank_code" class="field-hint">Select a bank first</div>
              <div v-else-if="resolvingAccount" class="field-hint">Looking up account name…</div>
              <div v-else-if="accountResolveError" class="field-hint" style="color:var(--red-text)">{{ accountResolveError }}</div>
            </div>

            <!-- Account name — auto-populated -->
            <div v-if="bankForm.account_name" class="field" style="margin-top:12px">
              <label>Account name</label>
              <div class="input-wrap input-locked">
                <input :value="bankForm.account_name" type="text" readonly />
                <i class="ti ti-lock input-icon" />
              </div>
              <div class="field-hint" style="color:#0F6E56">
                <i class="ti ti-circle-check" /> Confirmed by your bank
              </div>
            </div>

            <button class="btn-main" :disabled="!canSaveBank || savingBank" @click="saveBank" style="margin-top:16px">
              <i v-if="savingBank" class="ti ti-loader-2 spin" />
              <i v-else class="ti ti-check" />
              {{ savingBank ? 'Saving…' : 'Save bank account' }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import { useToastStore } from '@/stores/toast'
import AppLoader from '@/components/ui/AppLoader.vue'

const fmt   = useFormat()
const toast = useToastStore()

const THRESHOLD = 5_000_000  // ₦50,000 in kobo

// ── State ─────────────────────────────────────────────────────────────────────
const loading = ref(true)
const wallet = ref({ balance:0, total_earned:0, total_withdrawn:0 })
const bankAccounts = ref([])
const payouts = ref([])
const selectedBank = ref(null)
const amount = ref(null)
const amountError = ref('')
const submitting = ref(false)
const showAddBank = ref(false)
const savingBank = ref(false)
const bankError = ref('')
const bankForm = ref({ bank_name:'', bank_code:'', account_number:'', account_name:'' })

// Bank list
const banks = ref([])
const loadingBanks = ref(false)
const bankSearch = ref('')
const showBankDropdown = ref(false)

// Account resolution
const resolvingAccount = ref(false)
const accountResolveError = ref('')

// ── Computed ──────────────────────────────────────────────────────────────────
const canPayout = computed(() => wallet.value.balance >= THRESHOLD)
const minAmountNaira = computed(() => Math.floor(THRESHOLD / 100))
const progressPct = computed(() => Math.min(100, Math.round(wallet.value.balance / THRESHOLD * 100)))

const canSubmit = computed(() =>
  canPayout.value && selectedBank.value && amount.value >= minAmountNaira.value && !amountError.value
)

const submitLabel = computed(() => {
  if (submitting.value)  return 'Submitting…'
  if (!canPayout.value)  return 'Request payout — balance too low'
  return 'Request payout'
})

const filteredBanks = computed(() => {
  const q = bankSearch.value.toLowerCase().trim()
  if (!q) return banks.value.slice(0, 20)
  return banks.value.filter(b => b.name.toLowerCase().includes(q)).slice(0, 10)
})

const canSaveBank = computed(() =>
  bankForm.value.bank_name &&
  bankForm.value.bank_code &&
  bankForm.value.account_number.length === 10 &&
  bankForm.value.account_name &&
  !resolvingAccount.value
)

// ── Watch ─────────────────────────────────────────────────────────────────────
watch(showAddBank, (val) => {
  if (!val) resetBankForm()
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [walRes, bankRes, payRes, banksRes] = await Promise.all([
      api.get('/affiliate/wallet/'),
      api.get('/affiliate/bank-accounts/'),
      api.get('/affiliate/payouts/'),
      api.get('/affiliate/banks/'),
    ])
    wallet.value       = walRes.data
    bankAccounts.value = bankRes.data.results ?? bankRes.data
    payouts.value      = payRes.data.results  ?? payRes.data
    banks.value        = banksRes.data
    const def = bankAccounts.value.find(b => b.is_default)
    if (def) selectedBank.value = def.id
    else if (bankAccounts.value.length) selectedBank.value = bankAccounts.value[0].id
  } finally {
    loading.value = false
  }
})

// ── Methods ───────────────────────────────────────────────────────────────────
function validateAmount() {
  amountError.value = ''
  if (!amount.value) return
  const balanceNaira = Math.floor(wallet.value.balance / 100)
  if (amount.value < minAmountNaira.value) amountError.value = `Minimum withdrawal is ₦${minAmountNaira.value.toLocaleString()}`
  else if (amount.value > balanceNaira)    amountError.value = `Cannot exceed your balance of ₦${balanceNaira.toLocaleString()}`
}

function selectBank(bank) {
  bankForm.value.bank_name      = bank.name
  bankForm.value.bank_code      = bank.code
  bankSearch.value              = bank.name
  showBankDropdown.value        = false
  bankForm.value.account_number = ''
  bankForm.value.account_name   = ''
  accountResolveError.value     = ''
}

let resolveTimer = null
function onAccountNumberInput() {
  bankForm.value.account_name = ''
  accountResolveError.value   = ''
  clearTimeout(resolveTimer)
  if (bankForm.value.account_number.length === 10) {
    resolveTimer = setTimeout(resolveAccount, 300)
  }
}

async function resolveAccount() {
  if (!bankForm.value.bank_code || bankForm.value.account_number.length !== 10) return
  resolvingAccount.value    = true
  accountResolveError.value = ''
  try {
    const { data } = await api.get('/affiliate/banks/resolve/', {
      params: {
        account_number: bankForm.value.account_number,
        bank_code:      bankForm.value.bank_code,
      }
    })
    bankForm.value.account_name = data.account_name
  } catch (err) {
    accountResolveError.value   = err.response?.data?.detail ?? 'Account not found. Check the number and try again.'
    bankForm.value.account_name = ''
  } finally {
    resolvingAccount.value = false
  }
}

function resetBankForm() {
  bankForm.value            = { bank_name:'', bank_code:'', account_number:'', account_name:'' }
  bankSearch.value          = ''
  bankError.value           = ''
  accountResolveError.value = ''
}

async function requestPayout() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const { data } = await api.post('/affiliate/payouts/', {
      requested_amount: amount.value * 100,
      bank_account_id:  selectedBank.value,
    })
    payouts.value.unshift(data)
    wallet.value.balance -= amount.value * 100
    amount.value = null
    toast.show('Payout request submitted.', 'success')
  } catch (err) {
    toast.show(err.response?.data?.detail ?? 'Failed to submit request.', 'error')
  } finally {
    submitting.value = false
  }
}

async function saveBank() {
  bankError.value  = ''
  savingBank.value = true
  try {
    const { data } = await api.post('/affiliate/bank-accounts/', {
      bank_name:      bankForm.value.bank_name,
      bank_code:      bankForm.value.bank_code,
      account_number: bankForm.value.account_number,
      account_name:   bankForm.value.account_name,
    })
    bankAccounts.value.push(data)
    selectedBank.value = data.id
    showAddBank.value  = false
    resetBankForm()
    toast.show('Bank account added.', 'success')
  } catch (err) {
    bankError.value = err.response?.data?.detail ?? 'Failed to add bank account.'
  } finally {
    savingBank.value = false
  }
}
</script>

<style scoped>
.page { min-height:100vh;background:#F7F3ED;display:flex;flex-direction:column }
.nav-bar  { background:#fff;padding:14px 16px;display:flex;align-items:center;border-bottom:1px solid #EDE8E0;flex-shrink:0 }
.nav-title { font-size:16px;font-weight:700;color:#14110E;letter-spacing:-0.3px }
.scroll-area { flex:1;padding:16px;display:flex;flex-direction:column;gap:12px }
.section-label { font-size:10px;font-weight:600;color:#A09890;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:8px }
.balance-card { background:linear-gradient(135deg,#FEAA00 0%,#DF7B00 100%);border-radius:18px;padding:18px;position:relative;overflow:hidden }
.balance-card::after { content:'';position:absolute;top:-30px;right:-30px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none }
.balance-card.locked { background:linear-gradient(135deg,#8A8078 0%,#5A5248 100%) }
.bal-label    { font-size:10px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;position:relative;z-index:1 }
.bal-amount   { font-size:34px;font-weight:700;color:#fff;line-height:1;letter-spacing:-1px;margin-bottom:4px;position:relative;z-index:1 }
.bal-threshold { font-size:12px;color:rgba(255,255,255,0.7);margin-bottom:14px;position:relative;z-index:1 }
.progress-wrap { margin-bottom:14px;position:relative;z-index:1 }
.progress-track { height:6px;border-radius:99px;background:rgba(255,255,255,0.25);margin-bottom:5px;overflow:hidden }
.progress-fill  { height:100%;border-radius:99px;background:#fff;transition:width 0.5s ease }
.progress-labels { display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.65) }
.bal-meta-row { display:flex;border-top:1px solid rgba(255,255,255,0.2);padding-top:12px;position:relative;z-index:1 }
.bal-meta { flex:1;text-align:center }
.bal-meta:not(:last-child) { border-right:1px solid rgba(255,255,255,0.2) }
.bal-meta-value { font-size:13px;font-weight:600;color:#fff;line-height:1;margin-bottom:3px }
.bal-meta-label { font-size:10px;color:rgba(255,255,255,0.65) }
.warning-box { background:#FEF3DC;border:1px solid #F5D06A;border-radius:12px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start }
.warning-box i { font-size:16px;color:#7A4800;flex-shrink:0;margin-top:1px }
.warning-text { font-size:12px;color:#462C1F;line-height:1.55 }
.warning-text strong { color:#14110E;font-weight:600 }
.card { background:#fff;border-radius:14px;padding:16px;border:1px solid #EDE8E0 }
.card-title { font-size:10px;font-weight:600;color:#A09890;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:14px }
.bank-row { display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;border:1px solid #E8E2DA;cursor:pointer;margin-bottom:8px;transition:border-color 0.15s,background 0.15s }
.bank-row:hover { border-color:#D8C8A0 }
.bank-row.selected { border-color:#FEAA00;background:#FFFBF0 }
.bank-icon { width:36px;height:36px;border-radius:10px;background:#FFEECD;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.bank-icon i { font-size:18px;color:#854F0B }
.bank-info { flex:1 }
.bank-name { font-size:13px;font-weight:600;color:#14110E;margin-bottom:2px }
.bank-acct { font-size:11px;color:#A09890 }
.radio { width:18px;height:18px;border-radius:50%;border:1.5px solid #D8D2CA;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.radio.on { border-color:#FEAA00 }
.radio.on::after { content:'';width:9px;height:9px;border-radius:50%;background:#FEAA00;display:block }
.no-bank { font-size:13px;color:#A09890;text-align:center;padding:12px 0 }
.add-bank-row { display:flex;align-items:center;gap:8px;font-size:13px;color:#FEAA00;font-weight:600;cursor:pointer;padding:8px 2px 2px }
.add-bank-row i { font-size:16px }
.amount-wrap { display:flex;align-items:center;border:1px solid #E8E2DA;border-radius:10px;overflow:hidden;margin-bottom:8px;transition:border-color 0.15s,box-shadow 0.15s }
.amount-wrap:focus-within { border-color:#FEAA00;box-shadow:0 0 0 3px rgba(254,170,0,0.12) }
.amount-wrap.amount-error { border-color:#E05252 }
.amount-prefix { padding:12px 14px;background:#F7F3ED;color:#6B6560;font-size:16px;font-weight:600;border-right:1px solid #E8E2DA;flex-shrink:0 }
.amount-wrap input { flex:1;padding:12px 14px;border:none;font-size:18px;font-weight:700;color:#14110E;background:transparent;font-family:var(--font);outline:none;letter-spacing:-0.4px }
.amount-hint { font-size:11px;color:#A09890;margin-bottom:14px;line-height:1.5 }
.amount-error-msg { font-size:11px;color:#9B1F1F;margin-bottom:8px }
.fee-row { display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #F0EBE3;font-size:13px }
.fee-row:last-child { border-bottom:none }
.fee-label { color:#6B6560;font-size:12px }
.fee-value { font-weight:600;font-size:12px;color:#14110E }
.fee-value.red { color:#9B1F1F }
.fee-total-row { display:flex;justify-content:space-between;align-items:center;padding:12px 0 4px;border-top:1px solid #E8E2DA;margin-top:4px }
.fee-total-label { font-size:13px;font-weight:600;color:#14110E }
.fee-total-value { font-size:18px;font-weight:700;color:#14110E;letter-spacing:-0.4px }
.btn-main { width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#FEAA00 0%,#DF7B00 100%);font-size:15px;font-weight:600;color:#14110E;cursor:pointer;font-family:var(--font);box-shadow:0 2px 12px rgba(254,170,0,0.30);display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.15s,transform 0.1s }
.btn-main:hover:not(.disabled) { opacity:0.92;transform:translateY(-1px) }
.btn-main.disabled { background:#E8E2DA;color:#A09890;box-shadow:none;cursor:not-allowed }
.btn-main:disabled { background:#E8E2DA;color:#A09890;box-shadow:none;cursor:not-allowed }
.btn-main i { font-size:17px }
.history-list { display:flex;flex-direction:column;gap:8px }
.history-item { background:#fff;border-radius:14px;padding:14px 16px;border:1px solid #EDE8E0;display:flex;align-items:center;gap:12px }
.h-icon { width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.h-icon i { font-size:17px }
.h-icon.credit  { background:#E1F5EE }
.h-icon.credit i { color:#085041 }
.h-icon.debit   { background:#FDECEA }
.h-icon.debit i  { color:#9B1F1F }
.h-icon.pending  { background:#FEF3DC }
.h-icon.pending i { color:#7A4800 }
.h-info  { flex:1;min-width:0 }
.h-desc  { font-size:13px;font-weight:600;color:#14110E;margin-bottom:3px }
.h-date  { font-size:11px;color:#A09890 }
.h-bank  { font-size:10px;color:#A09890;margin-top:2px }
.h-right { display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0 }
.h-amount { font-size:14px;font-weight:700;color:#14110E;letter-spacing:-0.3px }
.h-amount.green { color:#0F6E56 }
.spill { font-size:10px;font-weight:600;padding:3px 8px;border-radius:99px;display:inline-block }
.spill-paid    { background:#E1F5EE;color:#085041 }
.spill-pending { background:#FEF3DC;color:#7A4800 }
.spill-done    { background:#F1EFE8;color:#5A5650 }
.spill-cancel { background:#FDECEA; color:#9B1F1F }
/* Bottom sheet */
.sheet-overlay { position:fixed;inset:0;background:rgba(20,17,14,0.55);display:flex;align-items:flex-end;z-index:200 }
.sheet { width:100%;max-width:480px;margin:0 auto;background:#fff;border-radius:28px 28px 0 0;padding:20px 20px 40px;display:flex;flex-direction:column;gap:12px }
.sheet-handle { width:40px;height:4px;border-radius:99px;background:#E8E2DA;margin:0 auto 4px }
.sheet-title  { font-size:17px;font-weight:700;color:#14110E;letter-spacing:-0.3px;margin-bottom:4px }
.field { display:flex;flex-direction:column;gap:6px }
label  { font-size:12px;font-weight:500;color:#6B6560 }
.input-wrap { display:flex;align-items:center;border:1px solid #E8E2DA;border-radius:10px;background:#fff;overflow:hidden }
.input-wrap:focus-within { border-color:#FEAA00;box-shadow:0 0 0 3px rgba(254,170,0,0.12) }
.input-wrap input { flex:1;padding:12px 14px;border:none;font-size:14px;color:#14110E;background:transparent;font-family:var(--font);outline:none }
.input-icon { padding:0 14px 0 4px;color:#C8C2BA;font-size:18px;flex-shrink:0 }
.input-locked { background:#F7F3ED }
.input-locked input { color:#6B6560 }
.input-wrap--resolving { border-color:#FEAA00 }
.input-wrap--resolved  { border-color:#1D9E75 }
.error-banner { display:flex;align-items:center;gap:8px;background:var(--red-bg);color:var(--red-text);border-radius:10px;padding:11px 14px;font-size:13px }
.error-banner i { font-size:16px;flex-shrink:0 }
.field-hint { font-size:11px;color:#A09890;line-height:1.5 }
.selected-bank { display:flex;align-items:center;gap:6px;font-size:12px;color:#0F6E56;font-weight:500;margin-top:2px }
.selected-bank i { font-size:14px }
/* Bank dropdown */
.dropdown-wrap { position:relative }
.dropdown-wrap input { width:100%;padding:12px 14px;border:1px solid #E8E2DA;border-radius:10px;font-size:14px;color:#14110E;background:#fff;font-family:var(--font);outline:none }
.dropdown-wrap input:focus { border-color:#FEAA00;box-shadow:0 0 0 3px rgba(254,170,0,0.12) }
.dropdown-wrap > i { position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#A09890;font-size:16px;pointer-events:none }
.bank-dropdown { position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #E8E2DA;border-radius:10px;box-shadow:0 4px 16px rgba(20,17,14,0.10);z-index:100;max-height:200px;overflow-y:auto;margin-top:4px }
.bank-option { padding:11px 14px;font-size:13px;color:#14110E;cursor:pointer }
.bank-option:hover { background:#F7F3ED }
/* Sheet transitions */
.sheet-enter-active,.sheet-leave-active { transition:all 0.25s ease }
.sheet-enter-from,.sheet-leave-to { opacity:0 }
.sheet-enter-from .sheet,.sheet-leave-to .sheet { transform:translateY(100%) }
.spin { animation:spin 0.6s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
</style>
