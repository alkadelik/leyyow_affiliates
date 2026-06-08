<template>
  <div class="page">
    <!-- Header -->
    <div class="nav-bar">
      <div class="nav-title">Campaigns</div>
    </div>

    <AppLoader v-if="loading" :page="true" />

    <template v-else>
      <!-- Filter pills -->
      <div class="filters">
        <button v-for="f in filters" :key="f.value" class="pill" :class="{ 'pill--active': activeFilter === f.value }" @click="activeFilter = f.value">
          {{ f.label }}
        </button>
      </div>

      <!-- Campaign list -->
      <div v-if="filtered.length" class="campaign-list">
        <div v-for="c in filtered" :key="c.id" class="campaign-card" :class="{ ended: c.status === 'ended' || c.status === 'cancelled' }" @click="$router.push(`/campaigns/${c.id}`)">
          <div class="campaign-top">
            <div>
              <div class="campaign-name">{{ c.name }}</div>
              <div class="campaign-sub">{{ commissionDisplay(c) }}</div>
            </div>
            <span class="badge" :class="badgeClass(c.status)">
              <span class="badge-dot" />{{ statusLabel(c.status) }}
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
              <div class="c-stat-value">{{ c.total_signups ?? 0 }}</div>
              <div class="c-stat-label">Signups</div>
            </div>
          </div>
          <div class="campaign-footer">
            <span class="footer-meta">
              <i :class="c.status === 'active' ? 'ti ti-clock' : 'ti ti-calendar'" aria-hidden="true" />
              {{ footerText(c) }}
            </span>
            <span class="footer-arrow"><i class="ti ti-arrow-right" aria-hidden="true" /></span>
          </div>
        </div>
      </div>

      <EmptyState v-else icon="speakerphone" title="No campaigns" :message="activeFilter === 'all' ? 'You haven\'t been added to any campaigns yet.' : 'No campaigns in this category.'" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import AppLoader  from '@/components/ui/AppLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const fmt     = useFormat()
const loading = ref(true)
const campaigns = ref([])
const activeFilter = ref('all')

const filters = [
  { label: 'All',       value: 'all'       },
  { label: 'Active',    value: 'active'    },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Ended',     value: 'ended'     },
]

const filtered = computed(() => {
  if (activeFilter.value === 'all') return campaigns.value
  if (activeFilter.value === 'ended') return campaigns.value.filter(c => c.status === 'ended' || c.status === 'cancelled')
  return campaigns.value.filter(c => c.status === activeFilter.value)
})

function badgeClass(status) {
  return { active: 'badge-active', scheduled: 'badge-scheduled', ended: 'badge-ended', cancelled: 'badge-ended', draft: 'badge-ended' }[status] ?? 'badge-ended'
}
function statusLabel(status) {
  return { active: 'Active', scheduled: 'Scheduled', ended: 'Ended', cancelled: 'Cancelled', draft: 'Draft' }[status] ?? status
}
function commissionDisplay(c) { return fmt.commissionDisplay(c) }

function footerText(c) {
  if (c.status === 'active' && c.ends_at) {
    const days = Math.ceil((new Date(c.ends_at) - new Date()) / 86400000)
    return days > 0 ? `${days} days left` : 'Ending today'
  }
  if (c.status === 'active') return 'No end date'
  if (c.status === 'scheduled' && c.starts_at) return `Starts ${fmt.shortDate(c.starts_at)}`
  if (c.ends_at) return `Ended ${fmt.shortDate(c.ends_at)}`
  return 'Ended'
}

onMounted(async () => {
  try {
    const { data } = await api.get('/affiliate/campaigns/')
    const order = { active:0, scheduled:1, ended:2, cancelled:3, draft:4 }
    campaigns.value = (data.results ?? data).sort((a,b) => (order[a.status]??9)-(order[b.status]??9))
  } finally { loading.value = false }
})
</script>

<style scoped>
.page { padding:0 0 16px }
.nav-bar  { background:#fff;padding:14px 16px;display:flex;align-items:center;border-bottom:1px solid #EDE8E0;flex-shrink:0 }
.nav-title { font-size:16px;font-weight:700;color:#14110E;letter-spacing:-0.3px }
.filters { display:flex;gap:7px;padding:16px 16px 12px;overflow-x:auto;-webkit-overflow-scrolling:touch }
.filters::-webkit-scrollbar { display:none }
.pill { padding:6px 14px;border-radius:99px;border:1px solid var(--border);background:var(--surface);font-size:12px;font-weight:500;color:var(--text-secondary);cursor:pointer;font-family:var(--font);flex-shrink:0;transition:all 0.1s }
.pill--active { background:var(--brand);border-color:var(--brand);color:var(--brand-deep);font-weight:600 }
.campaign-list { display:flex;flex-direction:column;gap:10px;padding:0 16px }
.campaign-card { background:#fff;border-radius:14px;padding:16px;border:1px solid #EDE8E0;cursor:pointer;transition:opacity 0.2s,box-shadow 0.15s }
.campaign-card:hover { box-shadow:0 2px 12px rgba(20,17,14,0.08) }
.campaign-card.ended { opacity:0.6 }
.campaign-top { display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px }
.campaign-name { font-size:14px;font-weight:600;color:#14110E;line-height:1.3;letter-spacing:-0.2px }
.campaign-sub  { font-size:11px;color:#A09890;margin-top:3px }
.badge { display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:99px;font-size:11px;font-weight:600;flex-shrink:0 }
.badge-dot { width:5px;height:5px;border-radius:50%;background:currentColor;opacity:0.75 }
.badge-active    { background:#E1F5EE;color:#085041 }
.badge-scheduled { background:#FEF3DC;color:#7A4800 }
.badge-ended     { background:#F1EFE8;color:#5A5650 }
.c-stats { display:flex;border-top:1px solid #F0EBE3;padding-top:12px }
.c-stat  { flex:1;text-align:center }
.c-stat:not(:last-child) { border-right:1px solid #F0EBE3 }
.c-stat-value { font-size:13px;font-weight:600;color:#14110E;line-height:1;margin-bottom:3px }
.c-stat-label { font-size:10px;color:#A09890;font-weight:400 }
.green { color:#0F6E56 }
.campaign-footer { display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid #F0EBE3 }
.footer-meta  { display:flex;align-items:center;gap:5px;font-size:11px;color:#6B6560 }
.footer-meta i { font-size:13px }
.footer-arrow { color:#C8C2BA;font-size:16px }
</style>
