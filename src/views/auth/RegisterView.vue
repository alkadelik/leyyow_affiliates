<template>
  <div class="auth-page">
    <div class="hero">
      <div class="hero-icon-wrap"><i class="ti ti-leaf" aria-hidden="true" /></div>
      <div class="hero-wordmark">ley<span>yow</span></div>
      <div class="hero-tag"><i class="ti ti-speakerphone" aria-hidden="true" /> Affiliate portal</div>
    </div>

    <div class="form-body">
      <!-- Invite banner -->
      <div class="invite-banner">
        <div class="invite-banner-icon"><i class="ti ti-confetti" aria-hidden="true" /></div>
        <div class="invite-banner-text">
          <strong>You've been invited!</strong> You're joining as a Leyyow affiliate. Create a password to activate your account.
        </div>
      </div>

      <div class="form-heading">Create your account</div>
      <div class="form-sub">Your email is already confirmed. Just set a password.</div>

      <Transition name="fade">
        <div v-if="error" class="error-banner">
          <i class="ti ti-alert-circle" aria-hidden="true" /> {{ error }}
        </div>
      </Transition>

      <!-- Email — locked, from URL token -->
      <div class="field">
        <label>Email address</label>
        <div class="input-wrap input-locked">
          <input :value="email" type="email" readonly />
          <i class="ti ti-lock input-icon" aria-hidden="true" />
        </div>
      </div>

      <!-- Password with live rules -->
      <div class="field">
        <label>Password</label>
        <div class="input-wrap">
          <input v-model="form.password" :type="show1 ? 'text' : 'password'" placeholder="Create a password" @input="checkRules" />
          <i class="ti input-icon" :class="show1 ? 'ti-eye-off' : 'ti-eye'" style="cursor:pointer" aria-hidden="true" @click="show1 = !show1" />
        </div>
        <div class="password-rules" v-if="form.password">
          <div class="rule" :class="rules.length ? 'met' : ''">
            <i class="ti" :class="rules.length ? 'ti-circle-check' : 'ti-circle'" aria-hidden="true" />At least 8 characters
          </div>
          <div class="rule" :class="rules.upper ? 'met' : ''">
            <i class="ti" :class="rules.upper ? 'ti-circle-check' : 'ti-circle'" aria-hidden="true" />One uppercase letter
          </div>
          <div class="rule" :class="rules.number ? 'met' : ''">
            <i class="ti" :class="rules.number ? 'ti-circle-check' : 'ti-circle'" aria-hidden="true" />One number
          </div>
          <div class="rule" :class="rules.special ? 'met' : ''">
            <i class="ti" :class="rules.special ? 'ti-circle-check' : 'ti-circle'" aria-hidden="true" />One special character
          </div>
        </div>
      </div>

      <!-- Confirm password -->
      <div class="field">
        <label>Confirm password</label>
        <div class="input-wrap" :class="{ 'input-match': passwordsMatch }">
          <input v-model="form.confirm" :type="show2 ? 'text' : 'password'" placeholder="Repeat your password" />
          <i
            class="ti input-icon"
            :class="passwordsMatch ? 'ti-circle-check' : (show2 ? 'ti-eye-off' : 'ti-eye')"
            :style="passwordsMatch ? 'color:#1D9E75' : 'cursor:pointer'"
            aria-hidden="true"
            @click="!passwordsMatch && (show2 = !show2)"
          />
        </div>
        <div v-if="passwordsMatch" class="match-msg">
          <i class="ti ti-circle-check" aria-hidden="true" /> Passwords match
        </div>
      </div>

      <button class="btn-main" :disabled="!canSubmit || loading" @click="handleRegister">
        <i v-if="loading" class="ti ti-loader-2 spin" aria-hidden="true" />
        <i v-else class="ti ti-user-check" aria-hidden="true" />
        {{ loading ? 'Creating account…' : 'Create account' }}
      </button>
    </div>

    <div class="home-area"><div class="home-bar" /></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const email   = ref('')
const form    = ref({ password: '', confirm: '' })
const show1   = ref(false)
const show2   = ref(false)
const loading = ref(false)
const error   = ref('')

const rules = ref({ length: false, upper: false, number: false, special: false })

function checkRules() {
  const p = form.value.password
  rules.value = {
    length:  p.length >= 8,
    upper:   /[A-Z]/.test(p),
    number:  /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  }
}

const allRulesMet    = computed(() => Object.values(rules.value).every(Boolean))
const passwordsMatch = computed(() => form.value.password && form.value.confirm && form.value.password === form.value.confirm)
const canSubmit      = computed(() => allRulesMet.value && passwordsMatch.value)

onMounted(async () => {
  const token = route.query.token
  if (!token) { error.value = 'Invalid invite link.'; return }

  // Fetch the email associated with this invite token
  try {
    const { data } = await api.get('/affiliate/auth/invite/', { params: { token } })
    email.value = data.email
  } catch {
    error.value = 'This invite link is invalid or has expired.'
  }
})

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/affiliate/auth/register/', {
      token:    route.query.token,
      new_password: form.value.password,
    })
    // Auto sign in after registration
    localStorage.setItem('aff_access_token',  data.access)
    localStorage.setItem('aff_refresh_token', data.refresh)
    await auth.fetchMe()
    router.push('/dashboard')
  } catch (err) {
    error.value = err.response?.data?.detail
      || err.response?.data?.password?.[0]
      || 'Registration failed. Your invite link may have expired.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height:100vh;display:flex;flex-direction:column;background:#FDFAF5 }
.hero { background:linear-gradient(160deg,#FEAA00 0%,#DF7B00 100%);padding:32px 28px 36px;display:flex;flex-direction:column;align-items:center;gap:10px;position:relative;overflow:hidden;flex-shrink:0 }
.hero::after { content:'';position:absolute;bottom:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08) }
.hero::before { content:'';position:absolute;top:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.06) }
.hero-icon-wrap { width:60px;height:60px;border-radius:18px;background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;position:relative;z-index:1;box-shadow:0 4px 16px rgba(20,17,14,0.12) }
.hero-icon-wrap i { font-size:28px;color:#fff }
.hero-wordmark { font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.8px;position:relative;z-index:1;line-height:1 }
.hero-wordmark span { opacity:0.75;font-weight:400 }
.hero-tag { display:inline-flex;align-items:center;gap:5px;background:rgba(20,17,14,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:99px;padding:4px 12px;font-size:11px;font-weight:600;color:#fff;letter-spacing:0.06em;text-transform:uppercase;position:relative;z-index:1 }
.hero-tag i { font-size:12px }
.form-body { padding:24px 24px 8px;flex:1;display:flex;flex-direction:column }
.form-heading { font-size:20px;font-weight:600;color:#14110E;letter-spacing:-0.4px;margin-bottom:4px }
.form-sub  { font-size:13px;color:#6B6560;margin-bottom:20px;line-height:1.55 }
.invite-banner { background:#FFEECD;border:1px solid #F5D06A;border-radius:12px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start;margin-bottom:20px }
.invite-banner-icon { width:28px;height:28px;border-radius:8px;background:#FEAA00;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.invite-banner-icon i { font-size:14px;color:#14110E }
.invite-banner-text { font-size:12px;color:#462C1F;line-height:1.55 }
.invite-banner-text strong { font-weight:600;color:#14110E }
.field { margin-bottom:16px }
label  { display:block;font-size:12px;font-weight:500;color:#6B6560;margin-bottom:6px }
.input-wrap { display:flex;align-items:center;border:1px solid #E8E2DA;border-radius:10px;background:#fff;transition:border-color 0.15s,box-shadow 0.15s;overflow:hidden }
.input-wrap:focus-within { border-color:#FEAA00;box-shadow:0 0 0 3px rgba(254,170,0,0.14) }
.input-wrap input { flex:1;padding:12px 14px;border:none;font-size:14px;color:#14110E;background:transparent;font-family:var(--font);outline:none }
.input-wrap input::placeholder { color:#C8C2BA }
.input-icon { padding:0 14px 0 4px;color:#C8C2BA;font-size:18px;flex-shrink:0 }
.input-locked { background:#F7F3ED;border-color:#E8E2DA }
.input-locked input { color:#6B6560 }
.input-match { border-color:#1D9E75;box-shadow:0 0 0 3px rgba(29,158,117,0.12) }
.input-match:focus-within { border-color:#1D9E75;box-shadow:0 0 0 3px rgba(29,158,117,0.12) }
.match-msg { display:flex;align-items:center;gap:5px;font-size:11px;color:#0F6E56;margin-top:6px;font-weight:500 }
.match-msg i { font-size:13px }
.error-banner { display:flex;align-items:center;gap:8px;background:var(--red-bg);color:var(--red-text);border-radius:10px;padding:11px 14px;font-size:13px;margin-bottom:16px }
.password-rules { background:#F7F3ED;border:1px solid #E8E2DA;border-radius:10px;padding:12px 14px;margin-top:10px;display:flex;flex-direction:column;gap:7px }
.rule { display:flex;align-items:center;gap:8px;font-size:12px;color:#A09890;transition:color 0.15s }
.rule i { font-size:14px;flex-shrink:0 }
.rule.met { color:#0F6E56;font-weight:500 }
.rule.met i { color:#1D9E75 }
.btn-main { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#FEAA00 0%,#DF7B00 100%);font-size:15px;font-weight:600;color:#14110E;cursor:pointer;margin-top:20px;font-family:var(--font);transition:opacity 0.15s,transform 0.1s;box-shadow:0 2px 12px rgba(254,170,0,0.35) }
.btn-main:hover:not(:disabled) { opacity:0.92;transform:translateY(-1px) }
.btn-main:disabled { opacity:0.5;cursor:not-allowed }
.btn-main i { font-size:17px }
.home-area { height:32px;background:#FDFAF5;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.home-bar  { width:100px;height:4px;background:#E8E2DA;border-radius:99px }
.spin { animation:spin 0.6s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
</style>
