<template>
  <div>
    <header class="header">
      <h1>Leyyow API Test</h1>

      <div class="env-toggle">
        <button :class="['env-btn', env === 'local' && 'active']" @click="env = 'local'">Local</button>
        <button :class="['env-btn', env === 'production' && 'active']" @click="env = 'production'">Production</button>
      </div>

      <div class="api-key-row">
        <span class="api-key-label">API Key:</span>
        <input v-model="apiKey" type="text" placeholder="X-Internal-API-Key">
      </div>
    </header>

    <nav class="nav">
      <button :class="['nav-btn', view === 'add-merchant' && 'active']" @click="view = 'add-merchant'">
        Add Merchant
      </button>
      <button :class="['nav-btn', view === 'merchant-list' && 'active']" @click="view = 'merchant-list'">
        Merchant List
      </button>
    </nav>

    <main class="main">
      <AddMerchantView
        v-if="view === 'add-merchant'"
        :base-url="baseUrl"
        :api-key="apiKey"
      />
      <MerchantListView
        v-else-if="view === 'merchant-list'"
        :base-url="baseUrl"
        :api-key="apiKey"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AddMerchantView from './views/AddMerchantView.vue'
import MerchantListView from './views/MerchantListView.vue'

const BASE_URLS = {
  local:      'http://localhost:8000',
  production: 'https://leyyowaffiliatesbackend-production.up.railway.app',
}

const env    = ref('local')
const apiKey = ref('dev-secret-change-in-production')
const view   = ref('add-merchant')

const baseUrl = computed(() => BASE_URLS[env.value])
</script>

<style>
/* ── Reset ─────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px; color: #1a1a2e; background: #f5f5f5; min-height: 100vh;
}

/* ── Header ────────────────────────────────────────────────────────────── */
.header {
  background: #1a1a2e; color: #fff;
  padding: 12px 24px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
}
.header h1 { font-size: 15px; font-weight: 600; }

.env-toggle {
  display: flex; gap: 2px;
  background: rgba(255,255,255,0.12); border-radius: 6px; padding: 2px;
}
.env-btn {
  border: none; background: none; color: rgba(255,255,255,0.65);
  padding: 4px 14px; border-radius: 4px; cursor: pointer; font-size: 12px;
}
.env-btn.active { background: #fff; color: #1a1a2e; font-weight: 600; }

.api-key-row { display: flex; align-items: center; gap: 6px; }
.api-key-label { font-size: 11px; color: rgba(255,255,255,0.55); white-space: nowrap; }
.api-key-row input {
  width: 240px; background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2); color: #fff;
  padding: 5px 9px; font-size: 12px; border-radius: 5px;
}
.api-key-row input::placeholder { color: rgba(255,255,255,0.35); }

/* ── Nav ───────────────────────────────────────────────────────────────── */
.nav { background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; padding: 0 24px; }
.nav-btn {
  padding: 12px 18px; border: none; background: none; cursor: pointer;
  font-size: 13px; color: #64748b; border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.nav-btn.active { color: #1a1a2e; border-bottom-color: #1a1a2e; font-weight: 500; }

/* ── Main ──────────────────────────────────────────────────────────────── */
.main { padding: 28px 24px; max-width: 1100px; margin: 0 auto; }

/* ── Card ──────────────────────────────────────────────────────────────── */
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 9px; padding: 22px 24px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.card h2 { font-size: 15px; font-weight: 600; }

/* ── Form elements ─────────────────────────────────────────────────────── */
.form-row { margin-bottom: 14px; }
label { display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 5px; }
input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
input[type="datetime-local"],
select {
  width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1;
  border-radius: 6px; font-size: 13px; color: #1a1a2e; background: #fff;
}
input:focus, select:focus { outline: none; border-color: #4f46e5; }
input[readonly] { background: #f8fafc; color: #64748b; cursor: default; }

/* ── Buttons ───────────────────────────────────────────────────────────── */
.btn { padding: 8px 18px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-primary { background: #1a1a2e; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #2d2d4a; }
.btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* ── Response box ──────────────────────────────────────────────────────── */
.response-box {
  margin-top: 14px; padding: 10px 12px; border-radius: 6px;
  font-size: 12px; font-family: 'Menlo', 'Consolas', monospace;
  white-space: pre-wrap; word-break: break-all;
}
.response-box.success { background: #f0fdf4; color: #14532d; border: 1px solid #86efac; }
.response-box.error   { background: #fef2f2; color: #7f1d1d; border: 1px solid #fca5a5; }

/* ── Table ─────────────────────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th {
  text-align: left; padding: 9px 12px;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
  color: #94a3b8; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #fafbfd; }
code { font-size: 12px; background: #f1f5f9; padding: 2px 5px; border-radius: 3px; }

/* ── Status badge ──────────────────────────────────────────────────────── */
.badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; white-space: nowrap; }
.badge-trial      { background: #fef3c7; color: #b45309; }
.badge-signed_up  { background: #dbeafe; color: #1d4ed8; }
.badge-subscribed { background: #dcfce7; color: #15803d; }
.badge-cancelled  { background: #fee2e2; color: #b91c1c; }
.badge-expired    { background: #f1f5f9; color: #475569; }

/* ── Ellipsis menu ─────────────────────────────────────────────────────── */
.menu-wrap { position: relative; display: inline-block; }
.menu-btn {
  background: none; border: none; cursor: pointer;
  padding: 3px 8px; border-radius: 4px; font-size: 18px; line-height: 1; color: #94a3b8;
}
.menu-btn:hover { background: #f1f5f9; color: #475569; }
.dropdown {
  position: absolute; right: 0; top: calc(100% + 4px);
  background: #fff; border: 1px solid #e2e8f0; border-radius: 7px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.1); min-width: 155px; z-index: 100; overflow: hidden;
}
.dropdown-item {
  display: block; width: 100%; text-align: left;
  padding: 9px 14px; border: none; background: none; cursor: pointer; font-size: 13px; color: #374151;
}
.dropdown-item:hover { background: #f8fafc; }

/* ── Modal ─────────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 200; display: flex; align-items: center; justify-content: center;
}
.modal {
  background: #fff; border-radius: 10px; padding: 26px 24px;
  width: 440px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}
.modal h3 { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.modal-subtitle { font-size: 12px; color: #64748b; margin-bottom: 18px; }
.modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; }

/* ── Empty state ───────────────────────────────────────────────────────── */
.empty { text-align: center; padding: 48px 20px; color: #94a3b8; }
.empty strong { display: block; margin-bottom: 6px; color: #64748b; }
</style>
