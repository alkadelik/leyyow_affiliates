<template>
  <div class="page">
    <AppLoader v-if="loading" :page="true" />

    <template v-else-if="!campaign">
      <EmptyState icon="alert-circle" title="Campaign not found" />
    </template>

    <template v-else>
      <!-- Nav bar -->
      <div class="nav-bar">
        <button class="back-btn" @click="$router.back()"><i class="ti ti-arrow-left" aria-hidden="true" /></button>
        <span class="nav-title">{{ campaign.name }}</span>
        <span class="badge" :class="badgeClass(campaign.status)">
          <span class="badge-dot" />{{ statusLabel(campaign.status) }}
        </span>
      </div>

      <div class="scroll-area">

        <!-- Gold earnings hero card -->
        <div class="hero-card" :class="{ 'hero-card--ended': campaign.status !== 'active' && campaign.status !== 'scheduled' }">
          <div class="hero-card-label">Earned this campaign</div>
          <div class="hero-card-value">{{ fmt.naira(campaign.total_earned) }}</div>
          <div class="hero-stats-row">
            <div class="h-stat">
              <div class="h-stat-value">{{ campaign.total_conversions ?? 0 }}</div>
              <div class="h-stat-label">Subscriptions</div>
            </div>
            <div class="h-stat">
              <div class="h-stat-value">{{ campaign.total_signups ?? 0 }}</div>
              <div class="h-stat-label">Signups</div>
            </div>
            <div class="h-stat">
              <div class="h-stat-value">{{ convRate !== null ? convRate + '%' : '—' }}</div>
              <div class="h-stat-label">Conv. rate</div>
            </div>
            <div class="h-stat">
              <div class="h-stat-value">{{ daysLeft }}</div>
              <div class="h-stat-label">{{ campaign.status === 'active' ? 'Days left' : 'Status' }}</div>
            </div>
          </div>
        </div>

        <!-- Tracking link -->
        <div v-if="campaign.link?.full_url" class="card">
          <div class="card-title">Your tracking link</div>
          <div class="link-box">
            <span class="link-text">{{ campaign.link.full_url }}</span>
            <button class="copy-btn" @click="copy(campaign.link.full_url, 'link')">
              <i :class="copied === 'link' ? 'ti ti-check' : 'ti ti-copy'" aria-hidden="true" />
              {{ copied === 'link' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <div class="hint-row">
            <i class="ti ti-info-circle" aria-hidden="true" />
            Share this link to track signups and earn commissions. 30-day cookie window.
          </div>
        </div>

        <!-- Coupon code -->
        <div v-if="campaign.code?.code" class="card">
          <div class="card-title">Your coupon code</div>

          <!-- View mode -->
          <template v-if="!editingCode">
            <div class="code-box">
              <span class="code-value">{{ campaign.code.code }}</span>
              <div class="code-actions">
                <button class="icon-btn" @click="copy(campaign.code.code, 'code')">
                  <i :class="copied === 'code' ? 'ti ti-check' : 'ti ti-copy'" aria-hidden="true" />
                  {{ copied === 'code' ? 'Copied' : 'Copy' }}
                </button>
                <button v-if="campaign.status === 'active'" class="icon-btn" @click="startEdit">
                  <i class="ti ti-pencil" aria-hidden="true" />Edit
                </button>
              </div>
            </div>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <div class="edit-panel">
              <div class="edit-panel-title">Customise your code</div>
              <div class="edit-panel-sub">Choose a unique code. Letters and numbers only, no spaces.</div>
              <div class="edit-input-wrap">
                <input v-model="newCode" type="text" :placeholder="campaign.code.code" @input="validateCode" style="text-transform:uppercase" />
                <span class="edit-input-status" :class="codeStatus.cls">{{ codeStatus.label }}</span>
              </div>
              <div v-if="codeMsg" class="validation-row" :class="codeValid ? 'ok' : 'error'">
                <i :class="codeValid ? 'ti ti-circle-check' : 'ti ti-alert-circle'" aria-hidden="true" />
                {{ codeMsg }}
              </div>
              <div class="edit-actions">
                <button class="btn-cancel" @click="editingCode = false">Cancel</button>
                <button class="btn-save" :disabled="!codeValid || savingCode" @click="saveCode">
                  <i v-if="savingCode" class="ti ti-loader-2 spin" aria-hidden="true" />
                  {{ savingCode ? 'Saving…' : 'Save code' }}
                </button>
              </div>
            </div>
          </template>

          <div class="hint-row" style="margin-top:10px">
            <i class="ti ti-info-circle" aria-hidden="true" />
            Merchants enter this code at signup. Code always wins over link.
          </div>
        </div>

        <!-- Commission structure -->
        <div class="card">
          <div class="card-title">Commission structure</div>
          <div class="detail-row">
            <span class="detail-label">Commission type</span>
            <span class="detail-value">{{ commissionTypeLabel }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Earned per subscription</span>
            <span class="detail-value green">{{ fmt.commissionDisplay(campaign) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Campaign start</span>
            <span class="detail-value">{{ campaign.starts_at ? fmt.date(campaign.starts_at) : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Campaign end</span>
            <span class="detail-value">
              {{ campaign.ends_at
                  ? fmt.date(campaign.ends_at)
                  : campaign.conversion_limit
                    ? campaign.conversion_limit + ' conversions'
                    : 'Until cancelled' }}
            </span>
          </div>
        </div>

        <!-- Support -->
        <div class="card">
          <div class="card-title">Support</div>
          <div class="contact-row">
            <i class="ti ti-mail" aria-hidden="true" />
            <a class="contact-link" href="mailto:campaigns@leyyow.com">campaigns@leyyow.com</a>
          </div>
          <div class="contact-row" style="border-bottom:none">
            <i class="ti ti-info-circle" aria-hidden="true" />
            <span class="contact-value">For campaign questions, contact Leyyow directly — not the merchant.</span>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import { useToastStore } from '@/stores/toast'
import AppLoader  from '@/components/ui/AppLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const route = useRoute()
const fmt   = useFormat()
const toast = useToastStore()

const loading     = ref(true)
const campaign    = ref(null)
const copied      = ref('')
const editingCode = ref(false)
const newCode     = ref('')
const codeMsg     = ref('')
const codeValid   = ref(false)
const savingCode  = ref(false)
const codeStatus  = ref({ label: '', cls: '' })

const convRate = computed(() => {
  const c = campaign.value
  if (!c || !c.total_signups || !c.total_conversions) return null
  return Math.round((c.total_conversions / c.total_signups) * 100)
})

const daysLeft = computed(() => {
  if (!campaign.value) return '—'
  if (campaign.value.status !== 'active') return statusLabel(campaign.value.status)
  if (!campaign.value.ends_at) return '∞'
  const d = Math.ceil((new Date(campaign.value.ends_at) - new Date()) / 86400000)
  return d > 0 ? d : 0
})

const commissionTypeLabel = computed(() => ({
  flat_fee: 'Flat fee', percentage: 'Percentage', percentage_capped: 'Percentage + cap',
}[campaign.value?.commission_type] ?? '—'))

function badgeClass(status) {
  return { active: 'badge-active', scheduled: 'badge-scheduled', ended: 'badge-ended', cancelled: 'badge-ended' }[status] ?? 'badge-ended'
}
function statusLabel(status) {
  return { active: 'Active', scheduled: 'Scheduled', ended: 'Ended', cancelled: 'Cancelled', draft: 'Draft' }[status] ?? status
}

function copy(text, key) {
  navigator.clipboard.writeText(text).catch(() => {})
  copied.value = key
  setTimeout(() => { if (copied.value === key) copied.value = '' }, 2000)
}

function startEdit() {
  newCode.value = campaign.value.code.code
  codeMsg.value = ''
  codeValid.value = false
  codeStatus.value = { label: '', cls: '' }
  editingCode.value = true
}

function validateCode() {
  const code = newCode.value.toUpperCase().trim()
  newCode.value = code
  codeMsg.value = ''
  codeValid.value = false
  codeStatus.value = { label: '', cls: '' }

  if (!code || code === campaign.value.code.code) {
    codeStatus.value = { label: '', cls: '' }
    return
  }
  if (!/^[A-Z0-9-]{4,16}$/.test(code)) {
    codeMsg.value = 'Letters, numbers and hyphens only. 4–16 characters.'
    codeStatus.value = { label: 'Invalid', cls: 'taken' }
    return
  }

  codeValid.value = true
  codeStatus.value = { label: 'Valid format', cls: 'available' }
}

async function saveCode() {
  savingCode.value = true
  try {
    await api.patch(`/affiliate/codes/${campaign.value.code.id}/`, { code: newCode.value.toUpperCase() })
    campaign.value.code.code = newCode.value.toUpperCase()
    editingCode.value = false
    toast.show('Coupon code updated.', 'success')
  } catch (err) {
    toast.show(err.response?.data?.detail ?? 'Failed to update code.', 'error')
  } finally { savingCode.value = false }
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/affiliate/campaigns/${route.params.id}/`)
    campaign.value = data
  } catch { campaign.value = null }
  finally { loading.value = false }
})
</script>

<style scoped>
.page { min-height:100vh;background:#F7F3ED;display:flex;flex-direction:column }
.nav-bar { background:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #EDE8E0;flex-shrink:0;position:sticky;top:0;z-index:10 }
.back-btn { width:32px;height:32px;border-radius:50%;border:1px solid #E8E2DA;background:#F7F3ED;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0 }
.back-btn i { font-size:16px;color:#6B6560 }
.nav-title { font-size:15px;font-weight:600;flex:1;color:#14110E;letter-spacing:-0.2px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
.badge { display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;flex-shrink:0 }
.badge-dot { width:5px;height:5px;border-radius:50%;background:currentColor;opacity:0.75 }
.badge-active    { background:#E1F5EE;color:#085041 }
.badge-scheduled { background:#FEF3DC;color:#7A4800 }
.badge-ended     { background:#F1EFE8;color:#5A5650 }
.scroll-area { flex:1;padding:16px;display:flex;flex-direction:column;gap:12px }
.hero-card { background:linear-gradient(135deg,#FEAA00 0%,#DF7B00 100%);border-radius:18px;padding:18px;position:relative;overflow:hidden }
.hero-card::after { content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08);pointer-events:none }
.hero-card--ended { background:linear-gradient(135deg,#6B6560 0%,#3A3430 100%) }
.hero-card-label { font-size:10px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;position:relative;z-index:1 }
.hero-card-value { font-size:32px;font-weight:700;color:#fff;line-height:1;margin-bottom:16px;letter-spacing:-1px;position:relative;z-index:1 }
.hero-stats-row { display:flex;border-top:1px solid rgba(255,255,255,0.2);padding-top:12px;position:relative;z-index:1 }
.h-stat { flex:1;text-align:center }
.h-stat:not(:last-child) { border-right:1px solid rgba(255,255,255,0.2) }
.h-stat-value { font-size:13px;font-weight:600;color:#fff;line-height:1;margin-bottom:3px }
.h-stat-label { font-size:10px;color:rgba(255,255,255,0.65);font-weight:400 }
.card { background:#fff;border-radius:14px;padding:16px;border:1px solid #EDE8E0 }
.card-title { font-size:10px;font-weight:600;color:#A09890;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:14px }
.link-box { background:#F7F3ED;border:1px solid #E8E2DA;border-radius:10px;padding:11px 12px;display:flex;align-items:center;gap:10px;margin-bottom:10px }
.link-text { font-size:12px;color:#6B6560;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace }
.copy-btn { background:linear-gradient(135deg,#FEAA00,#DF7B00);border:none;border-radius:8px;padding:7px 12px;font-size:11px;font-weight:600;color:#14110E;cursor:pointer;flex-shrink:0;display:flex;align-items:center;gap:5px;font-family:var(--font);box-shadow:0 1px 6px rgba(254,170,0,0.28);transition:opacity 0.15s }
.copy-btn:hover { opacity:0.88 }
.copy-btn i { font-size:13px }
.hint-row { display:flex;align-items:flex-start;gap:6px;font-size:11px;color:#A09890;line-height:1.5 }
.hint-row i { font-size:13px;flex-shrink:0;margin-top:1px }
.code-box { background:#F7F3ED;border:1px solid #E8E2DA;border-radius:10px;padding:14px;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px }
.code-value { font-size:22px;font-weight:700;font-family:monospace;letter-spacing:0.08em;color:#14110E }
.code-actions { display:flex;gap:7px }
.icon-btn { background:#fff;border:1px solid #E8E2DA;border-radius:8px;padding:7px 10px;cursor:pointer;display:flex;align-items:center;gap:5px;font-size:11px;font-weight:500;color:#6B6560;font-family:var(--font);transition:border-color 0.15s,background 0.1s }
.icon-btn:hover { border-color:#FEAA00;background:#FFFBF0 }
.icon-btn i { font-size:14px }
.edit-panel { background:#fff;border-radius:14px;border:2px solid #FEAA00;padding:16px;box-shadow:0 4px 20px rgba(254,170,0,0.15) }
.edit-panel-title { font-size:14px;font-weight:600;color:#14110E;margin-bottom:4px;letter-spacing:-0.2px }
.edit-panel-sub   { font-size:12px;color:#6B6560;margin-bottom:14px;line-height:1.5 }
.edit-input-wrap  { display:flex;align-items:center;border:1px solid #E8E2DA;border-radius:10px;background:#F7F3ED;overflow:hidden;margin-bottom:10px }
.edit-input-wrap input { flex:1;padding:12px 14px;border:none;background:transparent;font-size:16px;font-weight:700;font-family:monospace;letter-spacing:0.06em;color:#14110E;outline:none }
.edit-input-status { padding:0 12px;font-size:12px;font-weight:600;flex-shrink:0 }
.checking  { color:#A09890 }
.available { color:#0F6E56 }
.taken     { color:#9B1F1F }
.validation-row { display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:10px }
.validation-row.ok    { color:#0F6E56 }
.validation-row.error { color:#9B1F1F }
.validation-row i { font-size:13px }
.edit-actions { display:flex;gap:8px }
.btn-save   { flex:1;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#FEAA00,#DF7B00);font-size:13px;font-weight:600;color:#14110E;cursor:pointer;font-family:var(--font);box-shadow:0 2px 8px rgba(254,170,0,0.28);display:flex;align-items:center;justify-content:center;gap:6px }
.btn-save:disabled { opacity:0.5;cursor:not-allowed }
.btn-cancel { padding:11px 16px;border-radius:10px;border:1px solid #E8E2DA;background:#F7F3ED;font-size:13px;font-weight:500;color:#6B6560;cursor:pointer;font-family:var(--font) }
.detail-row { display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #F0EBE3;font-size:13px }
.detail-row:last-child { border-bottom:none }
.detail-label { color:#6B6560;font-size:12px;font-weight:400 }
.detail-value { font-weight:600;font-size:12px;color:#14110E;text-align:right }
.detail-value.green { color:#0F6E56 }
.contact-row { display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F0EBE3 }
.contact-row i { font-size:16px;color:#A09890;flex-shrink:0 }
.contact-value { font-size:12px;color:#6B6560 }
.contact-link  { font-size:12px;color:#FEAA00;font-weight:600 }
.spin { animation:spin 0.6s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
</style>