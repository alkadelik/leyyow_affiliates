<template>
  <div class="auth-page">

    <!-- Expired link state -->
    <template v-if="expired">
      <div class="hero hero--expired">
        <div class="hero-icon-wrap">
          <i class="ti ti-clock-x" aria-hidden="true" />
        </div>
        <div class="hero-wordmark">Link expired</div>
        <div class="hero-tag hero-tag--error">
          <i class="ti ti-alert-circle" aria-hidden="true" /> This link has expired
        </div>
      </div>
      <div class="form-body form-body--center">
        <div class="expired-icon">
          <i class="ti ti-clock-exclamation" aria-hidden="true" />
        </div>
        <div class="form-heading">Reset link expired</div>
        <div class="form-sub">
          Password reset links are only valid for 30 minutes. This one has expired — request a fresh link to continue.
        </div>
        <button class="btn-main" @click="$router.push('/forgot-password')">
          <i class="ti ti-refresh" aria-hidden="true" /> Request a new link
        </button>
        <div class="back-login">Or <RouterLink to="/login">go back to sign in</RouterLink></div>
      </div>
    </template>

    <!-- Active reset form -->
    <template v-else>
      <div class="hero">
        <div class="hero-icon-wrap">
          <i class="ti ti-lock-open" aria-hidden="true" />
        </div>
        <div class="hero-wordmark">New password</div>
        <div class="hero-tag">
          <i class="ti ti-shield-check" aria-hidden="true" /> Link verified
        </div>
      </div>

      <div class="form-body">
        <div class="form-heading">Set a new password</div>
        <div class="form-sub">Choose something strong. You'll use this to sign in from now on.</div>

        <!-- Email reminder -->
        <div v-if="email" class="email-reminder">
          <i class="ti ti-user-circle" aria-hidden="true" />
          <span>Resetting password for <strong>{{ email }}</strong></span>
        </div>

        <Transition name="fade">
          <div v-if="error" class="error-banner">
            <i class="ti ti-alert-circle" aria-hidden="true" /> {{ error }}
          </div>
        </Transition>

        <div class="field">
          <label>New password</label>
          <div class="input-wrap">
            <input v-model="form.password" :type="show1 ? 'text' : 'password'" placeholder="At least 8 characters" @input="checkRules" />
            <i class="ti input-icon" :class="show1 ? 'ti-eye-off' : 'ti-eye'" style="cursor:pointer" aria-hidden="true" @click="show1 = !show1" />
          </div>
          <div class="password-rules" v-if="form.password">
            <div class="rule" :class="rules.length ? 'met' : ''"><i class="ti" :class="rules.length ? 'ti-circle-check' : 'ti-circle'" />At least 8 characters</div>
            <div class="rule" :class="rules.upper  ? 'met' : ''"><i class="ti" :class="rules.upper  ? 'ti-circle-check' : 'ti-circle'" />One uppercase letter</div>
            <div class="rule" :class="rules.number ? 'met' : ''"><i class="ti" :class="rules.number ? 'ti-circle-check' : 'ti-circle'" />One number</div>
            <div class="rule" :class="rules.special? 'met' : ''"><i class="ti" :class="rules.special? 'ti-circle-check' : 'ti-circle'" />One special character</div>
          </div>
        </div>

        <div class="field">
          <label>Confirm new password</label>
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

        <button class="btn-main" :disabled="!canSubmit || loading" @click="handleSubmit">
          <i v-if="loading" class="ti ti-loader-2 spin" aria-hidden="true" />
          <i v-else class="ti ti-lock" aria-hidden="true" />
          {{ loading ? 'Saving…' : 'Save new password' }}
        </button>
      </div>
    </template>

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
const expired = ref(false)
const error   = ref('')
const loading = ref(false)
const show1   = ref(false)
const show2   = ref(false)
const form    = ref({ password: '', confirm: '' })
const rules   = ref({ length: false, upper: false, number: false, special: false })

function checkRules() {
  const p = form.value.password
  rules.value = { length: p.length >= 8, upper: /[A-Z]/.test(p), number: /[0-9]/.test(p), special: /[^A-Za-z0-9]/.test(p) }
}

const allRulesMet    = computed(() => Object.values(rules.value).every(Boolean))
const passwordsMatch = computed(() => form.value.password && form.value.confirm && form.value.password === form.value.confirm)
const canSubmit      = computed(() => allRulesMet.value && passwordsMatch.value)

onMounted(() => {
  email.value = route.query.email || ''
  if (!route.query.token) expired.value = true
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/affiliate/auth/reset-password/', {
      token:    route.query.token,
      password: form.value.password,
    })
    // Auto sign in
    localStorage.setItem('aff_access_token',  data.access)
    localStorage.setItem('aff_refresh_token', data.refresh)
    await auth.fetchMe()
    router.push('/dashboard')
  } catch (err) {
    const detail = err.response?.data?.detail || ''
    if (detail.toLowerCase().includes('expired') || detail.toLowerCase().includes('invalid')) {
      expired.value = true
    } else {
      error.value = detail || 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height:100vh;display:flex;flex-direction:column;background:#FDFAF5 }
.hero { background:linear-gradient(160deg,#FEAA00 0%,#DF7B00 100%);padding:20px 24px 28px;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;overflow:hidden;flex-shrink:0 }
.hero::after { content:'';position:absolute;bottom:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.08) }
.hero--expired { background:linear-gradient(160deg,#6B6560 0%,#3A3430 100%) }
.hero-icon-wrap { width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;position:relative;z-index:1;box-shadow:0 4px 16px rgba(20,17,14,0.12) }
.hero-icon-wrap i { font-size:24px;color:#fff }
.hero-wordmark { font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.6px;position:relative;z-index:1 }
.hero-tag { display:inline-flex;align-items:center;gap:5px;background:rgba(20,17,14,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:99px;padding:4px 12px;font-size:11px;font-weight:600;color:#fff;letter-spacing:0.06em;text-transform:uppercase;position:relative;z-index:1 }
.hero-tag--error { background:rgba(224,82,82,0.25);border-color:rgba(224,82,82,0.4) }
.hero-tag i { font-size:12px }
.form-body { padding:24px 24px 8px;flex:1;display:flex;flex-direction:column }
.form-body--center { align-items:center;text-align:center }
.form-heading { font-size:20px;font-weight:600;color:#14110E;letter-spacing:-0.4px;margin-bottom:4px }
.form-sub { font-size:13px;color:#6B6560;margin-bottom:20px;line-height:1.55 }
.expired-icon { width:64px;height:64px;border-radius:20px;background:#FDECEA;border:1px solid #F0C0C0;display:flex;align-items:center;justify-content:center;margin:8px auto 16px }
.expired-icon i { font-size:28px;color:#9B1F1F }
.email-reminder { display:flex;align-items:center;gap:8px;background:#F7F3ED;border:1px solid #E8E2DA;border-radius:10px;padding:10px 12px;margin-bottom:18px;font-size:12px;color:#6B6560 }
.email-reminder i { font-size:16px;color:#A09890;flex-shrink:0 }
.email-reminder strong { color:#14110E;font-weight:600 }
.error-banner { display:flex;align-items:center;gap:8px;background:var(--red-bg);color:var(--red-text);border-radius:10px;padding:11px 14px;font-size:13px;margin-bottom:16px }
.field { margin-bottom:16px }
label  { display:block;font-size:12px;font-weight:500;color:#6B6560;margin-bottom:6px }
.input-wrap { display:flex;align-items:center;border:1px solid #E8E2DA;border-radius:10px;background:#fff;transition:border-color 0.15s,box-shadow 0.15s;overflow:hidden }
.input-wrap:focus-within { border-color:#FEAA00;box-shadow:0 0 0 3px rgba(254,170,0,0.14) }
.input-wrap input { flex:1;padding:12px 14px;border:none;font-size:14px;color:#14110E;background:transparent;font-family:var(--font);outline:none }
.input-wrap input::placeholder { color:#C8C2BA }
.input-icon { padding:0 14px 0 4px;color:#C8C2BA;font-size:18px;flex-shrink:0 }
.input-match { border-color:#1D9E75;box-shadow:0 0 0 3px rgba(29,158,117,0.12) }
.input-match:focus-within { border-color:#1D9E75 }
.match-msg { display:flex;align-items:center;gap:5px;font-size:11px;color:#0F6E56;margin-top:6px;font-weight:500 }
.password-rules { background:#F7F3ED;border:1px solid #E8E2DA;border-radius:10px;padding:12px 14px;margin-top:10px;display:flex;flex-direction:column;gap:7px }
.rule { display:flex;align-items:center;gap:8px;font-size:12px;color:#A09890;transition:color 0.15s }
.rule i { font-size:14px;flex-shrink:0 }
.rule.met { color:#0F6E56;font-weight:500 }
.rule.met i { color:#1D9E75 }
.btn-main { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#FEAA00 0%,#DF7B00 100%);font-size:15px;font-weight:600;color:#14110E;cursor:pointer;margin-top:8px;font-family:var(--font);transition:opacity 0.15s,transform 0.1s;box-shadow:0 2px 12px rgba(254,170,0,0.35) }
.btn-main:hover:not(:disabled) { opacity:0.92;transform:translateY(-1px) }
.btn-main:disabled { opacity:0.5;cursor:not-allowed }
.btn-main i { font-size:17px }
.back-login { margin-top:16px;font-size:13px;color:#6B6560;padding-bottom:8px }
.back-login a { color:#FEAA00;font-weight:600 }
.home-area { height:32px;background:#FDFAF5;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.home-bar  { width:100px;height:4px;background:#E8E2DA;border-radius:99px }
.spin { animation:spin 0.6s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
</style>
