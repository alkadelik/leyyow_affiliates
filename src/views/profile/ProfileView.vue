<template>
  <div class="page">
    <div class="nav-bar"><span class="nav-title">{{ editMode ? editTitle : 'Profile' }}</span>
      <button v-if="editMode" class="back-btn" @click="editMode = null"><i class="ti ti-arrow-left" /></button>
    </div>

    <!-- Profile home -->
    <div v-if="!editMode" class="scroll-area">

      <!-- Avatar hero -->
      <div class="profile-hero">
        <div class="avatar">{{ initials }}</div>
        <div class="profile-name">{{ auth.user?.full_name }}</div>
        <div class="profile-email">{{ auth.user?.email }}</div>
        <span class="badge-active"><span class="badge-dot" />Active affiliate</span>
        <div class="stats-strip">
          <div class="strip-stat">
            <div class="strip-value">{{ profileStats.campaigns }}</div>
            <div class="strip-label">Campaigns</div>
          </div>
          <div class="strip-stat">
            <div class="strip-value green">{{ profileStats.earned }}</div>
            <div class="strip-label">Total earned</div>
          </div>
          <div class="strip-stat">
            <div class="strip-value">{{ profileStats.merchants }}</div>
            <div class="strip-label">Merchants</div>
          </div>
        </div>
      </div>

      <!-- Account section -->
      <div class="menu-section">
        <div class="menu-section-label">Account</div>
        <div class="menu-item" @click="editMode = 'details'">
          <div class="menu-icon gold"><i class="ti ti-user" /></div>
          <div class="menu-text"><div class="menu-title">Personal details</div><div class="menu-sub">Name and contact info</div></div>
          <i class="ti ti-chevron-right menu-arrow" />
        </div>
        <div class="menu-item" @click="editMode = 'password'">
          <div class="menu-icon gold"><i class="ti ti-lock" /></div>
          <div class="menu-text"><div class="menu-title">Change password</div><div class="menu-sub">Update your login password</div></div>
          <i class="ti ti-chevron-right menu-arrow" />
        </div>
      </div>

      <!-- Support -->
      <div class="menu-section">
        <div class="menu-section-label">Support</div>
        <div class="menu-item" @click="openSupport">
          <div class="menu-icon blue"><i class="ti ti-help-circle" /></div>
          <div class="menu-text"><div class="menu-title">Help &amp; support</div><div class="menu-sub">Contact Leyyow affiliate support</div></div>
          <i class="ti ti-chevron-right menu-arrow" />
        </div>
      </div>

      <!-- Sign out -->
      <button class="signout-btn" @click="handleLogout">
        <i class="ti ti-logout" />Sign out
      </button>

    </div>

    <!-- Edit personal details -->
    <div v-else-if="editMode === 'details'" class="scroll-area">
      <div class="card">
        <div class="card-title">Your details</div>

        <Transition name="fade">
          <div v-if="detailsSuccess" class="success-banner"><i class="ti ti-circle-check" />Details updated successfully.</div>
        </Transition>

        <div class="field">
          <label>Full name</label>
          <div class="input-wrap"><input v-model="detailForm.full_name" type="text" placeholder="Your full name" /></div>
        </div>
        <div class="field" style="margin-top:12px">
          <label>Email address</label>
          <div class="input-wrap input-locked">
            <input :value="auth.user?.email" type="email" readonly />
            <i class="ti ti-lock input-icon" />
          </div>
          <div class="field-hint">Email address cannot be changed in v1.</div>
        </div>

        <button class="btn-save" :disabled="savingDetails" @click="saveDetails" style="margin-top:20px">
          <i v-if="savingDetails" class="ti ti-loader-2 spin" />
          <i v-else class="ti ti-check" />
          {{ savingDetails ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </div>

    <!-- Change password -->
    <div v-else-if="editMode === 'password'" class="scroll-area">
      <div class="card">
        <div class="card-title">Change password</div>

        <Transition name="fade">
          <div v-if="pwError" class="error-banner"><i class="ti ti-alert-circle" />{{ pwError }}</div>
          <div v-else-if="pwSuccess" class="success-banner"><i class="ti ti-circle-check" />Password changed successfully.</div>
        </Transition>

        <div class="field">
          <label>Current password</label>
          <div class="input-wrap">
            <input v-model="pwForm.current" :type="showPw[0] ? 'text' : 'password'" placeholder="Your current password" />
            <i class="ti input-icon" :class="showPw[0] ? 'ti-eye-off' : 'ti-eye'" style="cursor:pointer" @click="showPw[0] = !showPw[0]" />
          </div>
        </div>
        <div class="field" style="margin-top:12px">
          <label>New password</label>
          <div class="input-wrap">
            <input v-model="pwForm.password" :type="showPw[1] ? 'text' : 'password'" placeholder="At least 8 characters" @input="checkPwRules" />
            <i class="ti input-icon" :class="showPw[1] ? 'ti-eye-off' : 'ti-eye'" style="cursor:pointer" @click="showPw[1] = !showPw[1]" />
          </div>
          <div class="password-rules" v-if="pwForm.password">
            <div class="rule" :class="pwRules.length ? 'met':''"><i class="ti" :class="pwRules.length ? 'ti-circle-check':'ti-circle'" />At least 8 characters</div>
            <div class="rule" :class="pwRules.upper  ? 'met':''"><i class="ti" :class="pwRules.upper  ? 'ti-circle-check':'ti-circle'" />One uppercase letter</div>
            <div class="rule" :class="pwRules.number ? 'met':''"><i class="ti" :class="pwRules.number ? 'ti-circle-check':'ti-circle'" />One number</div>
          </div>
        </div>
        <div class="field" style="margin-top:12px">
          <label>Confirm new password</label>
          <div class="input-wrap" :class="{ 'input-match': pwMatch }">
            <input v-model="pwForm.confirm" :type="showPw[2] ? 'text' : 'password'" placeholder="Repeat your password" />
            <i class="ti input-icon" :class="pwMatch ? 'ti-circle-check' : (showPw[2] ? 'ti-eye-off' : 'ti-eye')" :style="pwMatch ? 'color:#1D9E75' : 'cursor:pointer'" @click="!pwMatch && (showPw[2] = !showPw[2])" />
          </div>
        </div>
        <button class="btn-save" :disabled="!pwCanSave || savingPw" @click="changePassword" style="margin-top:20px">
          <i v-if="savingPw" class="ti ti-loader-2 spin" />
          <i v-else class="ti ti-lock" />
          {{ savingPw ? 'Saving…' : 'Change password' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useFormat } from '@/composables/useFormat'
import api from '@/api/axios'

const auth   = useAuthStore()
const toast  = useToastStore()
const router = useRouter()
const fmt    = useFormat()

const editMode = ref(null)
const editTitle = computed(() => ({ details: 'Personal details', password: 'Change password' }[editMode.value] ?? ''))

const profileStats = ref({ campaigns: 0, earned: '₦0', merchants: 0 })
const initials = computed(() => (auth.user?.full_name || '').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase())

// Details form
const detailForm     = ref({ full_name: '' })
const savingDetails  = ref(false)
const detailsSuccess = ref(false)

// Password form
const pwForm    = ref({ current:'', password:'', confirm:'' })
const showPw    = ref([false, false, false])
const pwRules   = ref({ length:false, upper:false, number:false })
const savingPw  = ref(false)
const pwError   = ref('')
const pwSuccess = ref(false)
const pwMatch   = computed(() => pwForm.value.password && pwForm.value.confirm && pwForm.value.password === pwForm.value.confirm)
const pwCanSave = computed(() => pwForm.value.current && Object.values(pwRules.value).every(Boolean) && pwMatch.value)

function checkPwRules() {
  const p = pwForm.value.password
  pwRules.value = { length: p.length >= 8, upper: /[A-Z]/.test(p), number: /[0-9]/.test(p) }
}

onMounted(async () => {
  if (auth.user) detailForm.value.full_name = auth.user.full_name
  try {
    // Fetch dashboard and merchants in parallel
    const [dashRes, merchantRes] = await Promise.all([
      api.get('/affiliate/dashboard/'),
      api.get('/affiliate/merchants/'),
    ])
    const d = dashRes.data
    const merchantList = merchantRes.data.results ?? merchantRes.data
    profileStats.value = {
      campaigns: d.active_campaigns ?? 0,
      earned:    fmt.naira(d.total_earned ?? 0),
      merchants: merchantList.length ?? 0,
    }
  } catch {}
})

async function saveDetails() {
  savingDetails.value = true
  detailsSuccess.value = false
  try {
    const { data } = await api.patch('/affiliate/profile/', { full_name: detailForm.value.full_name })
    auth.user.full_name = data.full_name
    detailsSuccess.value = true
    setTimeout(() => detailsSuccess.value = false, 3000)
  } catch { toast.show('Failed to save details.', 'error') }
  finally { savingDetails.value = false }
}

async function changePassword() {
  pwError.value = ''
  pwSuccess.value = false
  savingPw.value = true
  try {
    await api.post('/affiliate/profile/change-password/', {
      current_password: pwForm.value.current,
      new_password:     pwForm.value.password,
    })
    pwSuccess.value = true
    pwForm.value = { current:'', password:'', confirm:'' }
  } catch (err) {
    pwError.value = err.response?.data?.detail ?? 'Failed to change password.'
  } finally { savingPw.value = false }
}

function openSupport() { window.location.href = 'mailto:campaigns@leyyow.com' }

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.page { min-height:100vh;background:#F7F3ED;display:flex;flex-direction:column }
.nav-bar  { background:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #EDE8E0;flex-shrink:0 }
.nav-title { font-size:16px;font-weight:700;color:#14110E;letter-spacing:-0.3px;flex:1 }
.back-btn { width:32px;height:32px;border-radius:50%;border:1px solid #E8E2DA;background:#F7F3ED;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;order:-1 }
.back-btn i { font-size:16px;color:#6B6560 }
.scroll-area { flex:1;padding:16px;display:flex;flex-direction:column;gap:12px }
.profile-hero { background:#fff;border-radius:18px;padding:20px 16px;border:1px solid #EDE8E0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px }
.avatar { width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#FEAA00,#DF7B00);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#14110E;margin-bottom:4px }
.profile-name  { font-size:18px;font-weight:700;color:#14110E;letter-spacing:-0.4px }
.profile-email { font-size:12px;color:#A09890 }
.badge-active { display:inline-flex;align-items:center;gap:4px;background:#E1F5EE;color:#085041;border-radius:99px;padding:4px 10px;font-size:11px;font-weight:600 }
.badge-dot { width:5px;height:5px;border-radius:50%;background:currentColor;opacity:0.75 }
.stats-strip { display:flex;width:100%;border-top:1px solid #F0EBE3;padding-top:14px;margin-top:8px }
.strip-stat  { flex:1;text-align:center }
.strip-stat:not(:last-child) { border-right:1px solid #F0EBE3 }
.strip-value { font-size:16px;font-weight:700;color:#14110E;line-height:1;margin-bottom:3px }
.strip-label { font-size:10px;color:#A09890;font-weight:400 }
.green { color:#0F6E56 }
.menu-section { background:#fff;border-radius:16px;border:1px solid #EDE8E0;overflow:hidden }
.menu-section-label { font-size:10px;font-weight:600;color:#A09890;text-transform:uppercase;letter-spacing:0.09em;padding:12px 16px 6px }
.menu-item  { display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer;border-top:1px solid #F7F3ED;transition:background 0.1s }
.menu-item:hover { background:#FDFAF5 }
.menu-icon  { width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.menu-icon i { font-size:17px }
.menu-icon.gold  { background:#FFEECD }
.menu-icon.gold i { color:#854F0B }
.menu-icon.blue  { background:#E6F1FB }
.menu-icon.blue i { color:#0C447C }
.menu-text  { flex:1;min-width:0 }
.menu-title { font-size:14px;font-weight:600;color:#14110E;margin-bottom:2px }
.menu-sub   { font-size:12px;color:#A09890 }
.menu-arrow { font-size:16px;color:#C8C2BA;flex-shrink:0 }
.signout-btn { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;border-radius:12px;border:1px solid #E8E2DA;background:#fff;font-size:14px;font-weight:500;color:#6B6560;cursor:pointer;font-family:var(--font);transition:background 0.1s }
.signout-btn:hover { background:#F7F3ED }
.signout-btn i { font-size:17px }
.card { background:#fff;border-radius:14px;padding:16px;border:1px solid #EDE8E0 }
.card-title { font-size:10px;font-weight:600;color:#A09890;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:14px }
.field { display:flex;flex-direction:column;gap:6px }
label  { font-size:12px;font-weight:500;color:#6B6560 }
.input-wrap { display:flex;align-items:center;border:1px solid #E8E2DA;border-radius:10px;background:#fff;overflow:hidden }
.input-wrap:focus-within { border-color:#FEAA00;box-shadow:0 0 0 3px rgba(254,170,0,0.12) }
.input-wrap input { flex:1;padding:12px 14px;border:none;font-size:14px;color:#14110E;background:transparent;font-family:var(--font);outline:none }
.input-icon { padding:0 14px 0 4px;color:#C8C2BA;font-size:17px;flex-shrink:0 }
.input-locked { background:#F7F3ED }
.input-locked input { color:#6B6560 }
.input-match { border-color:#1D9E75;box-shadow:0 0 0 3px rgba(29,158,117,0.12) }
.field-hint { font-size:11px;color:#A09890;margin-top:4px;line-height:1.5 }
.password-rules { background:#F7F3ED;border:1px solid #E8E2DA;border-radius:10px;padding:12px 14px;margin-top:10px;display:flex;flex-direction:column;gap:7px }
.rule { display:flex;align-items:center;gap:8px;font-size:12px;color:#A09890;transition:color 0.15s }
.rule i { font-size:14px;flex-shrink:0 }
.rule.met { color:#0F6E56;font-weight:500 }
.rule.met i { color:#1D9E75 }
.btn-save { width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#FEAA00,#DF7B00);font-size:14px;font-weight:600;color:#14110E;cursor:pointer;font-family:var(--font);box-shadow:0 2px 10px rgba(254,170,0,0.28);display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.15s,transform 0.1s }
.btn-save:hover:not(:disabled) { opacity:0.92;transform:translateY(-1px) }
.btn-save:disabled { opacity:0.5;cursor:not-allowed }
.btn-save i { font-size:17px }
.success-banner { display:flex;align-items:center;gap:8px;background:var(--green-bg);color:var(--green-text);border-radius:10px;padding:11px 14px;font-size:13px;margin-bottom:14px }
.error-banner   { display:flex;align-items:center;gap:8px;background:var(--red-bg);color:var(--red-text);border-radius:10px;padding:11px 14px;font-size:13px;margin-bottom:14px }
.spin { animation:spin 0.6s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
</style>
