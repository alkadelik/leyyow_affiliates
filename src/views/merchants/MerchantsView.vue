<template>
  <div class="page">
    <div class="nav-bar">
      <span class="nav-title">Merchants</span>
    </div>

    <div class="scroll-area">
      <AppLoader v-if="loading" :page="true" />

      <template v-else>
        <!-- Summary -->
        <div class="summary-row">
          <div class="summary-card">
            <div class="summary-card-value">{{ merchants.length }}</div>
            <div class="summary-card-label">Total signups</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-value green">{{ merchants.filter(m => m.is_subscribed).length }}</div>
            <div class="summary-card-label">Subscribed</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filter-section">
          <div class="dropdown-wrap">
            <select v-model="selectedCampaign">
              <option value="">All campaigns</option>
              <!-- <option v-for="name in campaignNames" :key="name" :value="name">{{ name }}</option> -->
              <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <i class="ti ti-chevron-down" aria-hidden="true" />
          </div>
          <div class="pill-row">
            <button v-for="f in filters" :key="f.value" class="pill" :class="{ on: sourceFilter === f.value }" @click="sourceFilter = f.value">{{ f.label }}</button>
          </div>
        </div>

        <!-- Merchant list -->
        <div v-if="filtered.length" class="merchant-list">
          <div v-for="m in filtered" :key="m.merchant_id" class="merchant-item">
            <!-- <div class="merchant-avatar">{{ initials(m.merchant_name) }}</div> -->
            <div class="merchant-info">
              <div class="merchant-name">{{ m.merchant_name }}</div>
              <div class="merchant-meta">
                {{ fmt.shortDate(m.referred_at) }}
                <span class="attr-tag" :class="isCodeAttribution(m) ? 'code' : 'link'">{{ isCodeAttribution(m) ? 'Code' : 'Link' }}
                </span>
                <span class="status-tag" :class="m.is_subscribed ? 'status-sub' : 'status-signup'">
                  {{ m.is_subscribed ? 'Subscribed' : 'Signed up' }}
                </span>
              </div>
            </div>
            <div class="merchant-right">
              <div class="merchant-earned">{{ fmt.naira(m.total_earned) }}</div>
              <div class="merchant-commissions">{{ m.commission_count }} commission{{ m.commission_count !== 1 ? 's' : '' }}</div>
            </div>
          </div>
        </div>

        <EmptyState v-else icon="building-store" title="No merchants yet" :message="sourceFilter !== 'all' || selectedCampaign ? 'No merchants match this filter.' : 'Merchants you refer will appear here once they sign up.'" />
      </template>
    </div>
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
const merchants     = ref([])
const selectedCampaign = ref('')
const campaigns = ref([])
const sourceFilter = ref('all')

const filters = [
  { label: 'All',        value: 'all'        },
  { label: 'Subscribed', value: 'subscribed' },
  { label: 'Signed up',  value: 'signup'     },
  { label: 'Code',       value: 'code'       },
  { label: 'Link',       value: 'link'       },
]

const filtered = computed(() => {
  let list = merchants.value
  if (selectedCampaign.value) list = list.filter(m => m.campaign_id === selectedCampaign.value)
  if (sourceFilter.value === 'subscribed') list = list.filter(m => m.is_subscribed)
  if (sourceFilter.value === 'signup')     list = list.filter(m => !m.is_subscribed)
  if (sourceFilter.value === 'code') list = list.filter(m => m.attribution_source === 'affiliate_code' || m.attribution_source === 'coupon_code')
  if (sourceFilter.value === 'link') list = list.filter(m => m.attribution_source === 'affiliate_link')
  return list
})

function isCodeAttribution(m) {
  return m.attribution_source === 'affiliate_code' || m.attribution_source === 'coupon_code'
}

function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

onMounted(async () => {
  try {
    const [mRes, cRes] = await Promise.all([
      api.get('/affiliate/merchants/'),
      api.get('/affiliate/campaigns/'),
    ])
    console.log('merchants raw:', mRes.data)
    console.log('campaigns raw:', cRes.data)
    merchants.value = mRes.data.results ?? mRes.data
    // All campaigns this affiliate is on — not derived from merchant data
    campaigns.value = (cRes.data.results ?? cRes.data)
    console.log('merchants.value:', merchants.value)
    console.log('campaigns.value:', campaigns.value)
  } finally { loading.value = false }
})
</script>

<style scoped>
.page { min-height:100vh;background:#F7F3ED;display:flex;flex-direction:column }
.nav-bar  { background:#fff;padding:14px 16px;display:flex;align-items:center;border-bottom:1px solid #EDE8E0;flex-shrink:0 }
.nav-title { font-size:16px;font-weight:700;color:#14110E;letter-spacing:-0.3px }
.scroll-area { flex:1;padding:16px;display:flex;flex-direction:column;gap:12px }
.summary-row  { display:grid;grid-template-columns:repeat(2,1fr);gap:8px }
.summary-card { background:#fff;border-radius:12px;padding:12px 8px;border:1px solid #EDE8E0;text-align:center }
.summary-card-value { font-size:18px;font-weight:700;line-height:1;margin-bottom:4px;letter-spacing:-0.5px }
.summary-card-label { font-size:10px;color:#A09890;line-height:1.3;font-weight:400 }
.green { color:#0F6E56 }
.filter-section { display:flex;flex-direction:column;gap:8px }
.dropdown-wrap  { position:relative }
.dropdown-wrap select { width:100%;padding:10px 36px 10px 14px;border:1px solid #E8E2DA;border-radius:10px;font-size:13px;font-weight:500;color:#14110E;background:#fff;font-family:var(--font);appearance:none;cursor:pointer }
.dropdown-wrap select:focus { outline:none;border-color:#FEAA00;box-shadow:0 0 0 3px rgba(254,170,0,0.12) }
.dropdown-wrap i { position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:16px;color:#A09890;pointer-events:none }
.pill-row { display:flex;gap:6px }
.pill { padding:7px 14px;border-radius:99px;border:1px solid #E8E2DA;background:transparent;font-size:12px;font-weight:500;color:#6B6560;cursor:pointer;white-space:nowrap;font-family:var(--font);transition:all 0.12s }
.pill.on { background:#FFEECD;border-color:#FEAA00;color:#14110E;font-weight:600 }
.merchant-list { display:flex;flex-direction:column;gap:8px }
.merchant-item { background:#fff;border-radius:14px;padding:14px 16px;border:1px solid #EDE8E0;display:flex;align-items:center;gap:12px }
.merchant-avatar { width:38px;height:38px;border-radius:50%;background:#FFEECD;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#633806;flex-shrink:0;border:1px solid #F5D06A }
.merchant-info  { flex:1;min-width:0 }
.merchant-name  { font-size:14px;font-weight:600;color:#14110E;margin-bottom:3px;letter-spacing:-0.2px }
.merchant-meta  { display:flex;align-items:center;gap:6px;font-size:11px;color:#A09890 }
.attr-tag { display:inline-block;padding:2px 7px;border-radius:99px;font-size:10px;font-weight:500;background:#F7F3ED;color:#6B6560;border:1px solid #E8E2DA }
.attr-tag.link { background:#EDF5FF;color:#1C5FAA;border-color:#C5DCFF }
.attr-tag.code { background:#F5EFF8;color:#6B2FA0;border-color:#D9C4ED }
.merchant-right { display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0 }
.merchant-earned { font-size:13px;font-weight:600;color:#14110E;line-height:1 }
.merchant-commissions { font-size:11px;color:#A09890 }
.status-tag { display:inline-block;padding:2px 7px;border-radius:99px;font-size:10px;font-weight:500;border:1px solid }
.status-sub { background:#E1F5EE;color:#085041;border-color:#A8DFC8 }
.status-signup { background:#F1EFE8;color:#5A5650;border-color:#D8D4CC }
</style>
