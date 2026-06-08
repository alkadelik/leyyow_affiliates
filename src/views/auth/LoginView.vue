<template>
  <div class="auth-page">
    <div class="hero">
      <div class="hero-icon-wrap"><i class="ti ti-leaf" aria-hidden="true" /></div>
      <div class="hero-wordmark">ley<span>yow</span></div>
      <div class="hero-tag"><i class="ti ti-speakerphone" aria-hidden="true" /> Affiliate portal</div>
    </div>

    <div class="form-body">
      <div class="form-heading">Welcome back</div>
      <div class="form-sub">Sign in to view your campaigns and earnings.</div>

      <Transition name="fade">
        <div v-if="loginError" class="error-banner">
          <i class="ti ti-alert-circle" aria-hidden="true" /> {{ loginError }}
        </div>
      </Transition>

      <div class="field">
        <label>Email address</label>
        <div class="input-wrap">
          <input v-model="form.email" type="email" placeholder="your@email.com" autocomplete="email" />
          <i class="ti ti-mail input-icon" aria-hidden="true" />
        </div>
      </div>

      <div class="field">
        <label>Password</label>
        <div class="input-wrap">
          <input v-model="form.password" :type="showPass ? 'text' : 'password'" placeholder="Enter your password" autocomplete="current-password" />
          <i class="ti input-icon" :class="showPass ? 'ti-eye-off' : 'ti-eye'" style="cursor:pointer" aria-hidden="true" @click="showPass = !showPass" />
        </div>
        <div class="forgot"><RouterLink to="/forgot-password">Forgot password?</RouterLink></div>
      </div>

      <button class="btn-main" :disabled="loading" @click="handleLogin">
        <i v-if="loading" class="ti ti-loader-2 spin" aria-hidden="true" />
        <i v-else class="ti ti-login" aria-hidden="true" />
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>

      <div class="divider-row"><div class="divider-line" /><span>or</span><div class="divider-line" /></div>
      <div class="register-row">Don't have an account? <RouterLink to="/register">Register</RouterLink></div>
    </div>

    <div class="home-area"><div class="home-bar" /></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const form       = ref({ email: '', password: '' })
const showPass   = ref(false)
const loading    = ref(false)
const loginError = ref('')

async function handleLogin() {
  loginError.value = ''
  if (!form.value.email || !form.value.password) { loginError.value = 'Please enter your email and password.'; return }
  loading.value = true
  const result = await auth.login(form.value.email, form.value.password)
  loading.value = false
  if (result.ok) { router.push('/dashboard') } else { loginError.value = result.error }
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
.form-sub { font-size:13px;color:#6B6560;margin-bottom:20px;line-height:1.55 }
.field { margin-bottom:16px }
label { display:block;font-size:12px;font-weight:500;color:#6B6560;margin-bottom:6px }
.input-wrap { display:flex;align-items:center;border:1px solid #E8E2DA;border-radius:10px;background:#fff;transition:border-color 0.15s,box-shadow 0.15s;overflow:hidden }
.input-wrap:focus-within { border-color:#FEAA00;box-shadow:0 0 0 3px rgba(254,170,0,0.14) }
.input-wrap input { flex:1;padding:12px 14px;border:none;font-size:14px;color:#14110E;background:transparent;font-family:var(--font);outline:none }
.input-wrap input::placeholder { color:#C8C2BA }
.input-icon { padding:0 14px 0 4px;color:#C8C2BA;font-size:18px;flex-shrink:0 }
.error-banner { display:flex;align-items:center;gap:8px;background:var(--red-bg);color:var(--red-text);border-radius:10px;padding:11px 14px;font-size:13px;margin-bottom:16px }
.error-banner i { font-size:16px;flex-shrink:0 }
.forgot { text-align:right;margin-top:8px }
.forgot a { font-size:12px;color:#FEAA00;font-weight:500 }
.btn-main { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#FEAA00 0%,#DF7B00 100%);font-size:15px;font-weight:600;color:#14110E;cursor:pointer;margin-top:20px;font-family:var(--font);transition:opacity 0.15s,transform 0.1s;box-shadow:0 2px 12px rgba(254,170,0,0.35) }
.btn-main:hover:not(:disabled) { opacity:0.92;transform:translateY(-1px) }
.btn-main:disabled { opacity:0.5;cursor:not-allowed }
.btn-main i { font-size:17px }
.divider-row { display:flex;align-items:center;gap:12px;margin:16px 0 }
.divider-line { flex:1;height:1px;background:#E8E2DA }
.divider-row span { font-size:11px;color:#C8C2BA;font-weight:500 }
.register-row { text-align:center;font-size:13px;color:#6B6560;padding-bottom:8px }
.register-row a { color:#FEAA00;font-weight:600 }
.home-area { height:32px;background:#FDFAF5;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.home-bar  { width:100px;height:4px;background:#E8E2DA;border-radius:99px }
.spin { animation:spin 0.6s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
</style>
