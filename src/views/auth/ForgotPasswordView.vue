<template>
  <div class="auth-page">
    <!-- Hero — compact with back arrow -->
    <div class="hero">
      <div class="back-row">
        <RouterLink to="/login" class="back-btn">
          <i class="ti ti-arrow-left" aria-hidden="true" />
        </RouterLink>
        <span class="back-label">Back to sign in</span>
      </div>
      <div class="hero-icon-wrap">
        <i :class="sent ? 'ti ti-mail-opened' : 'ti ti-lock-question'" aria-hidden="true" />
      </div>
      <div class="hero-wordmark">{{ sent ? 'Check your inbox' : 'Reset password' }}</div>
    </div>

    <!-- Before send -->
    <div v-if="!sent" class="form-body">
      <div class="form-heading">Forgot your password?</div>
      <div class="form-sub">Enter the email address linked to your affiliate account. We'll send you a reset link.</div>

      <div class="field">
        <label>Email address</label>
        <div class="input-wrap">
          <input v-model="email" type="email" placeholder="your@email.com" autocomplete="email" />
          <i class="ti ti-mail input-icon" aria-hidden="true" />
        </div>
      </div>

      <button class="btn-main" :disabled="loading || !email" @click="handleSubmit">
        <i v-if="loading" class="ti ti-loader-2 spin" aria-hidden="true" />
        <i v-else class="ti ti-send" aria-hidden="true" />
        {{ loading ? 'Sending…' : 'Send reset link' }}
      </button>

      <div class="footnote">Only registered affiliate emails will receive a reset link.</div>
    </div>

    <!-- After send — check inbox screen -->
    <div v-else class="form-body form-body--center">
      <div class="form-heading">Email on its way</div>
      <div class="form-sub">
        We sent a reset link to<br>
        <strong>{{ email }}</strong>
      </div>

      <!-- Steps -->
      <div class="steps-card">
        <div class="step-row">
          <div class="step-num">1</div>
          <div class="step-text">Open the email from <strong>Leyyow</strong></div>
        </div>
        <div class="step-row">
          <div class="step-num">2</div>
          <div class="step-text">Tap <strong>Reset my password</strong> in the email</div>
        </div>
        <div class="step-row">
          <div class="step-num">3</div>
          <div class="step-text">Create your new password</div>
        </div>
      </div>

      <!-- Expiry notice -->
      <div class="expiry-box">
        <i class="ti ti-clock" aria-hidden="true" />
        <span>This link expires in <strong>30 minutes</strong>. Request a new one if it expires.</span>
      </div>

      <div class="resend-row">
        Didn't get it? Check spam or
        <button class="link-btn" @click="sent = false">resend email</button>
      </div>
    </div>

    <div class="home-area"><div class="home-bar" /></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api/axios'

const email   = ref('')
const loading = ref(false)
const sent    = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    await api.post('/affiliate/auth/forgot-password/', { email: email.value })
  } catch { /* silent — don't reveal if email exists */ }
  loading.value = false
  sent.value = true
}
</script>

<style scoped>
.auth-page { min-height:100vh;display:flex;flex-direction:column;background:#FDFAF5 }
.hero { background:linear-gradient(160deg,#FEAA00 0%,#DF7B00 100%);padding:20px 24px 28px;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;overflow:hidden;flex-shrink:0 }
.hero::after { content:'';position:absolute;bottom:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.08) }
.back-row { width:100%;display:flex;align-items:center;gap:8px;margin-bottom:4px;position:relative;z-index:1 }
.back-btn { width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.back-btn i { font-size:16px;color:#fff }
.back-label { font-size:13px;color:rgba(255,255,255,0.85);font-weight:500 }
.hero-icon-wrap { width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;position:relative;z-index:1;box-shadow:0 4px 16px rgba(20,17,14,0.12) }
.hero-icon-wrap i { font-size:24px;color:#fff }
.hero-wordmark { font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.6px;position:relative;z-index:1 }
.form-body { padding:24px 24px 8px;flex:1;display:flex;flex-direction:column }
.form-body--center { align-items:center;text-align:center }
.form-heading { font-size:20px;font-weight:600;color:#14110E;letter-spacing:-0.4px;margin-bottom:4px }
.form-sub { font-size:13px;color:#6B6560;margin-bottom:20px;line-height:1.55 }
.form-sub strong { color:#14110E;font-weight:600 }
.field { margin-bottom:16px;width:100% }
label  { display:block;font-size:12px;font-weight:500;color:#6B6560;margin-bottom:6px }
.input-wrap { display:flex;align-items:center;border:1px solid #E8E2DA;border-radius:10px;background:#fff;transition:border-color 0.15s,box-shadow 0.15s;overflow:hidden }
.input-wrap:focus-within { border-color:#FEAA00;box-shadow:0 0 0 3px rgba(254,170,0,0.14) }
.input-wrap input { flex:1;padding:12px 14px;border:none;font-size:14px;color:#14110E;background:transparent;font-family:var(--font);outline:none }
.input-wrap input::placeholder { color:#C8C2BA }
.input-icon { padding:0 14px 0 4px;color:#C8C2BA;font-size:18px;flex-shrink:0 }
.btn-main { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#FEAA00 0%,#DF7B00 100%);font-size:15px;font-weight:600;color:#14110E;cursor:pointer;margin-top:8px;font-family:var(--font);transition:opacity 0.15s,transform 0.1s;box-shadow:0 2px 12px rgba(254,170,0,0.35) }
.btn-main:hover:not(:disabled) { opacity:0.92;transform:translateY(-1px) }
.btn-main:disabled { opacity:0.5;cursor:not-allowed }
.btn-main i { font-size:17px }
.footnote { text-align:center;font-size:12px;color:#A09890;line-height:1.55;margin-top:18px;padding-bottom:8px }
/* Sent state */
.steps-card { background:#F7F3ED;border:1px solid #E8E2DA;border-radius:12px;padding:16px;width:100%;margin-bottom:14px;text-align:left }
.step-row   { display:flex;gap:12px;align-items:flex-start;margin-bottom:12px }
.step-row:last-child { margin-bottom:0 }
.step-num   { width:24px;height:24px;border-radius:50%;background:#FEAA00;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:#14110E }
.step-text  { font-size:13px;color:#14110E;line-height:1.5;padding-top:2px }
.step-text strong { font-weight:600 }
.expiry-box { display:flex;align-items:center;gap:8px;background:#FEF3DC;border:1px solid #F5D06A;border-radius:10px;padding:10px 12px;width:100%;margin-bottom:16px;text-align:left }
.expiry-box i { font-size:16px;color:#7A4800;flex-shrink:0 }
.expiry-box span { font-size:12px;color:#7A4800;line-height:1.5 }
.expiry-box strong { font-weight:600 }
.resend-row { font-size:13px;color:#6B6560;padding-bottom:8px }
.link-btn   { background:none;border:none;cursor:pointer;color:#FEAA00;font-weight:600;font-size:13px;font-family:var(--font);padding:0 }
.link-btn:hover { color:#DF7B00 }
.home-area { height:32px;background:#FDFAF5;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.home-bar  { width:100px;height:4px;background:#E8E2DA;border-radius:99px }
.spin { animation:spin 0.6s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
</style>
