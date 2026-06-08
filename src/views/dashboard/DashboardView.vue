<template>
  <div class="dashboard">

    <!-- Gold top bar -->
    <div class="top-bar">
      <div class="top-bar-row">
        <div class="greeting">Hello, <strong>{{ firstName }}</strong> 👋</div>
      </div>

      <!-- Balance card -->
      <div class="balance-card">
        <div class="balance-label">Available balance</div>
        <div class="balance-amount" :class="{ 'balance-amount--empty': !hasBalance }">
          {{ fmt.naira(dashboard.wallet_balance) }}
        </div>
        <div class="balance-meta-row">
          <div class="balance-meta">
            <div class="balance-meta-value" :class="{ 'empty-val': !hasBalance }">{{ fmt.naira(dashboard.total_earned) }}</div>
            <div class="balance-meta-label">Total earned</div>
          </div>
          <div class="balance-meta">
            <div class="balance-meta-value" :class="{ 'empty-val': !hasBalance }">{{ dashboard.active_campaigns ?? 0 }}</div>
            <div class="balance-meta-label">Campaigns</div>
          </div>
          <div class="balance-meta">
            <div class="balance-meta-value" :class="overallConvRate ? 'green' : 'empty-val'">
              {{ overallConvRate ? overallConvRate + '%' : '—' }}
            </div>
            <div class="balance-meta-label">Conv. rate</div>
          </div>
        </div>
        <button
          class="payout-btn"
          :class="{ disabled: !canRequestPayout }"
          :disabled="!canRequestPayout"
          @click="$router.push('/payouts')"
        >
          <i class="ti ti-cash" aria-hidden="true" />
          Request payout
        </button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="scroll-area">
      <AppLoader v-if="loading" />

      <template v-else>
        <!-- Summary -->
        <div>
          <div class="section-label">Summary</div>
          <div class="summary-row">
            <div class="summary-card">
              <div class="summary-card-value" :class="dashboard.active_campaigns > 0 ? 'green' : 'empty-val'">{{ dashboard.active_campaigns ?? 0 }}</div>
              <div class="summary-card-label">Live campaigns</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-value" :class="{ 'empty-val': !hasBalance }">{{ dashboard.total_conversions ?? 0 }}</div>
              <div class="summary-card-label">Total subscriptions</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-value" :class="{ 'empty-val': !hasBalance }">{{ dashboard.total_signups ?? 0 }}</div>
              <div class="summary-card-label">Total signups</div>
            </div>
          </div>
        </div>

        <!-- Campaigns -->
        <div>
          <div class="section-label">Your campaigns</div>

          <div v-if="campaigns.length" class="campaign-list">
            <div
              v-for="c in campaigns" :key="c.id"
              class="campaign-card"
              :class="{ ended: c.status === 'ended' || c.status === 'cancelled' }"
              @click="$router.push(`/campaigns/${c.id}`)"
            >
              <div class="campaign-top">
                <div>
                  <div class="campaign-name">{{ c.name }}</div>
                  <div class="campaign-merchant">Leyyow</div>
                </div>
                <span class="badge" :class="c.status === 'active' ? 'badge-active' : 'badge-ended'">
                  <span class="badge-dot" />
                  {{ c.status === 'active' ? 'Active' : c.status === 'scheduled' ? 'Scheduled' : 'Ended' }}
                </span>
              </div>
              <div class="c-stats">
                <div class="c-stat">
                  <div class="c-stat-value">{{ fmt.naira(c.total_earned) }}</div>
                  <div class="c-stat-label">Earned</div>
                </div>
                <div class="c-stat">
                  <div class="c-stat-value">{{ c.total_conversions ?? 0 }}</div>
                  <div class="c-stat-label">Subscriptions</div>
                </div>
                <div class="c-stat">
                  <div class="c-stat-value" :class="campaignConvRate(c) > 50 ? 'green' : ''">
                    {{ campaignConvRate(c) ? campaignConvRate(c) + '%' : '—' }}
                  </div>
                  <div class="c-stat-label">Conv. rate</div>
                </div>
              </div>
              <div class="campaign-footer">
                <span class="days-left">
                  <i :class="c.status === 'active' ? 'ti ti-clock' : 'ti ti-calendar-x'" aria-hidden="true" />
                  {{ campaignFooterText(c) }}
                </span>
                <button class="view-btn" @click.stop="$router.push(`/campaigns/${c.id}`)">
                  View <i class="ti ti-arrow-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon"><i class="ti ti-speakerphone" aria-hidden="true" /></div>
            <div class="empty-title">No campaigns yet</div>
            <div class="empty-sub">You haven't been added to any campaigns yet. Once Leyyow adds you to a campaign, you'll see it here and start earning.</div>
            <div class="info-chip">
              <i class="ti ti-info-circle" aria-hidden="true" />
              <span>Your account is active. Leyyow will notify you when a campaign is ready for you.</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFormat } from '@/composables/useFormat'
import api from '@/api/axios'
import AppLoader from '@/components/ui/AppLoader.vue'

const auth = useAuthStore()
const fmt  = useFormat()

const loading   = ref(true)
const dashboard = ref({
  wallet_balance:    0,
  total_earned:      0,
  total_withdrawn:   0,
  active_campaigns:  0,
  total_conversions: 0,
  total_signups: 0,
  total_clicks:      0,
  recent_commissions: [],
})
const campaigns = ref([])

const PAYOUT_THRESHOLD = 5_000_000

const firstName      = computed(() => auth.user?.full_name?.split(' ')[0] || 'there')
const hasBalance     = computed(() => dashboard.value.total_earned > 0)
const canRequestPayout = computed(() => dashboard.value.wallet_balance >= PAYOUT_THRESHOLD)

// Overall conv rate across all campaigns: conversions / clicks
const overallConvRate = computed(() => {
  const signups = dashboard.value.total_signups
  const convs   = dashboard.value.total_conversions
  if (!signups || !convs) return null
  return Math.round((convs / signups) * 100)
})

// Per-campaign conv rate
function campaignConvRate(c) {
  if (!c.total_clicks || !c.total_conversions) return null
  return Math.round((c.total_conversions / c.total_clicks) * 100)
}

function campaignFooterText(c) {
  if (c.status === 'active' && c.ends_at) {
    const days = Math.ceil((new Date(c.ends_at) - new Date()) / 86400000)
    return days > 0 ? `${days} days left` : 'Ending today'
  }
  if (c.status === 'active') return 'No end date'
  if (c.ends_at) return `Ended ${fmt.shortDate(c.ends_at)}`
  return 'Ended'
}

onMounted(async () => {
  try {
    const [dashRes, campRes] = await Promise.all([
      api.get('/affiliate/dashboard/'),
      api.get('/affiliate/campaigns/'),
    ])
    const d = dashRes.data
    dashboard.value = {
      wallet_balance:     d.wallet_balance     ?? 0,
      total_earned:       d.total_earned        ?? 0,
      total_withdrawn:    d.total_withdrawn     ?? 0,
      active_campaigns:   d.active_campaigns    ?? 0,
      total_conversions:  d.total_conversions   ?? 0,
      total_signups:      d.total_signups       ?? 0,
      total_clicks:       d.total_clicks        ?? 0,
      recent_commissions: d.recent_commissions  ?? [],
    }
    const order = { active:0, scheduled:1, ended:2, cancelled:3, draft:4 }
    campaigns.value = (campRes.data.results ?? campRes.data).sort(
      (a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)
    )
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard { display:flex;flex-direction:column;min-height:100vh;background:#F7F3ED }
.top-bar { background:linear-gradient(135deg,#FEAA00 0%,#DF7B00 100%);padding:4px 16px 20px;flex-shrink:0;position:relative;overflow:hidden }
.top-bar::after  { content:'';position:absolute;top:-40px;right:-40px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none }
.top-bar::before { content:'';position:absolute;bottom:-50px;left:-20px;width:120px;height:120px;border-radius:50%;background:rgba(20,17,14,0.05);pointer-events:none }
.top-bar-row { display:flex;align-items:center;justify-content:space-between;padding:10px 0 14px;position:relative;z-index:1 }
.greeting { font-size:14px;color:rgba(255,255,255,0.85);font-weight:400 }
.greeting strong { color:#fff;font-weight:600 }
.balance-card { background:#fff;border-radius:18px;padding:18px;position:relative;z-index:1;box-shadow:0 4px 20px rgba(20,17,14,0.12) }
.balance-label  { font-size:10px;font-weight:600;color:#A09890;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px }
.balance-amount { font-size:32px;font-weight:700;color:#14110E;line-height:1;margin-bottom:14px;letter-spacing:-1px }
.balance-amount--empty { color:#C8C2BA }
.balance-meta-row { display:flex;border-top:1px solid #F0EBE3;padding-top:12px;margin-bottom:14px }
.balance-meta { flex:1;text-align:center }
.balance-meta:not(:last-child) { border-right:1px solid #F0EBE3 }
.balance-meta-value { font-size:13px;font-weight:600;color:#14110E;line-height:1;margin-bottom:3px }
.balance-meta-label { font-size:10px;color:#A09890;font-weight:400 }
.empty-val { color:#C8C2BA !important }
.green { color:#0F6E56 }
.payout-btn { width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#FEAA00 0%,#DF7B00 100%);font-size:13px;font-weight:600;color:#14110E;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;font-family:var(--font);box-shadow:0 2px 10px rgba(254,170,0,0.30);transition:opacity 0.15s,transform 0.1s }
.payout-btn:hover:not(.disabled) { opacity:0.92;transform:translateY(-1px) }
.payout-btn.disabled { background:#E8E2DA;color:#A09890;box-shadow:none;cursor:not-allowed }
.payout-btn i { font-size:15px }
.scroll-area { flex:1;padding:16px;display:flex;flex-direction:column;gap:16px }
.section-label { font-size:10px;font-weight:600;color:#A09890;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:10px }
.summary-row  { display:grid;grid-template-columns:repeat(3,1fr);gap:8px }
.summary-card { background:#fff;border-radius:12px;padding:12px 8px;border:1px solid #EDE8E0;text-align:center }
.summary-card-value { font-size:18px;font-weight:700;line-height:1;margin-bottom:4px;letter-spacing:-0.5px }
.summary-card-label { font-size:10px;color:#A09890;line-height:1.3;font-weight:400 }
.campaign-list { display:flex;flex-direction:column;gap:10px }
.campaign-card { background:#fff;border-radius:14px;padding:16px;border:1px solid #EDE8E0;cursor:pointer;transition:opacity 0.2s,box-shadow 0.15s }
.campaign-card:hover { box-shadow:0 2px 12px rgba(20,17,14,0.08) }
.campaign-card.ended { opacity:0.55 }
.campaign-top { display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px }
.campaign-name     { font-size:14px;font-weight:600;color:#14110E;line-height:1.3;letter-spacing:-0.2px }
.campaign-merchant { font-size:11px;color:#A09890;margin-top:3px;font-weight:400 }
.badge { display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:99px;font-size:11px;font-weight:600;flex-shrink:0 }
.badge-dot { width:5px;height:5px;border-radius:50%;background:currentColor;opacity:0.75 }
.badge-active { background:#E1F5EE;color:#085041 }
.badge-ended  { background:#F1EFE8;color:#5A5650 }
.c-stats { display:flex;border-top:1px solid #F0EBE3;padding-top:12px }
.c-stat  { flex:1;text-align:center }
.c-stat:not(:last-child) { border-right:1px solid #F0EBE3 }
.c-stat-value { font-size:13px;font-weight:600;color:#14110E;line-height:1;margin-bottom:3px }
.c-stat-label { font-size:10px;color:#A09890;font-weight:400 }
.campaign-footer { display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid #F0EBE3 }
.days-left { display:flex;align-items:center;gap:5px;font-size:11px;color:#6B6560;font-weight:400 }
.days-left i { font-size:13px }
.view-btn { display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#FEAA00;background:none;border:none;cursor:pointer;font-family:var(--font);padding:0 }
.view-btn i { font-size:14px }
.empty-state { display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px 8px;gap:8px }
.empty-icon  { width:60px;height:60px;border-radius:18px;background:#FFEECD;border:1px solid #F5D06A;display:flex;align-items:center;justify-content:center;margin-bottom:4px }
.empty-icon i { font-size:26px;color:#854F0B }
.empty-title { font-size:15px;font-weight:600;color:#14110E;letter-spacing:-0.2px }
.empty-sub   { font-size:13px;color:#6B6560;line-height:1.6;max-width:280px }
.info-chip   { display:flex;align-items:center;gap:7px;background:#FFEECD;border:1px solid #F5D06A;border-radius:10px;padding:10px 14px;margin-top:8px;text-align:left }
.info-chip i { font-size:16px;color:#854F0B;flex-shrink:0 }
.info-chip span { font-size:12px;color:#462C1F;line-height:1.55 }
</style>