/**
 * src/composables/useFormat.js
 * Shared formatting helpers. Money always in kobo.
 */
export function useFormat() {

  function naira(kobo) {
    if (kobo == null) return '₦0'
    return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG')
  }

  function date(value) {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  function shortDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short',
    })
  }

  function campaignStatus(status) {
    return {
      draft:     { label: 'Draft',     cls: 'badge--gray'  },
      scheduled: { label: 'Scheduled', cls: 'badge--amber' },
      active:    { label: 'Active',    cls: 'badge--green' },
      ended:     { label: 'Ended',     cls: 'badge--gray'  },
      cancelled: { label: 'Cancelled', cls: 'badge--red'   },
    }[status] ?? { label: status, cls: 'badge--gray' }
  }

  function payoutStatus(status) {
    return {
      pending:   { label: 'Pending',   cls: 'badge--amber' },
      approved:  { label: 'Approved',  cls: 'badge--blue'  },
      paid:      { label: 'Paid',      cls: 'badge--green' },
      cancelled: { label: 'Cancelled', cls: 'badge--gray'  },
    }[status] ?? { label: status, cls: 'badge--gray' }
  }

  function commissionDisplay(campaign) {
    if (!campaign) return '—'
    const v = campaign.commission_value ?? 0
    const type = campaign.commission_type
    if (type === 'flat_fee')           return `₦${(v / 100).toLocaleString('en-NG')} per subscription`
    if (type === 'percentage')         return `${v / 100}% of payment`
    if (type === 'percentage_capped')  return `${v / 100}% (cap ₦${((campaign.commission_cap ?? 0) / 100).toLocaleString('en-NG')})`
    return '—'
  }

  return { naira, date, shortDate, campaignStatus, payoutStatus, commissionDisplay }
}
