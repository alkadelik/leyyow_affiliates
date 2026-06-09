<template>
  <div class="card" style="max-width: 460px;">
    <h2>Add Merchant</h2>
    <br>

    <div class="form-row">
      <label>Merchant ID</label>
      <input v-model="form.merchant_id" type="text" placeholder="test-merchant-1">
    </div>
    <div class="form-row">
      <label>Merchant Name</label>
      <input v-model="form.merchant_name" type="text" placeholder="Default">
    </div>
    <div class="form-row">
      <label>Affiliate Code</label>
      <input v-model="form.affiliate_code" type="text" placeholder="AFFL-1234">
    </div>
    <div class="form-row">
      <label>Signed Up At</label>
      <input v-model="form.signed_up_at" type="datetime-local">
    </div>

    <button class="btn btn-primary" :disabled="loading" @click="submit">
      {{ loading ? 'Adding…' : 'Add Merchant' }}
    </button>

    <div v-if="response" :class="['response-box', response.ok ? 'success' : 'error']">{{ response.text }}</div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'

const props = defineProps(['baseUrl', 'apiKey'])

function nowLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

const form = reactive({
  merchant_id:   '',
  merchant_name: '',
  affiliate_code: '',
  signed_up_at:  nowLocal(),
})

const loading  = ref(false)
const response = ref(null)

async function submit() {
  if (!form.merchant_id || !form.merchant_name || !form.affiliate_code || !form.signed_up_at) {
    response.value = { ok: false, text: 'All fields are required.' }
    return
  }
  loading.value  = true
  response.value = null
  try {
    const { data } = await axios.post(
      `${props.baseUrl}/api/internal/merchant-signup/`,
      {
        merchant_id:   form.merchant_id,
        merchant_name: form.merchant_name,
        affiliate_code: form.affiliate_code,
        signed_up_at:  new Date(form.signed_up_at).toISOString(),
      },
      { headers: { 'X-Internal-API-Key': props.apiKey } }
    )
    response.value = { ok: true, text: JSON.stringify(data, null, 2) }
  } catch (err) {
    const detail = err.response?.data
    response.value = { ok: false, text: JSON.stringify(detail ?? err.message, null, 2) }
  } finally {
    loading.value = false
  }
}
</script>
