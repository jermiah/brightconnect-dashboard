import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Load all data
async function loadData() {
  await Promise.all([
    loadOutages(),
    loadAccounts(),
    loadTickets(),
    loadNotifications(),
    loadPaymentLinks()
  ])
}

// Load Outages
async function loadOutages() {
  const { data, error } = await supabase
    .from('outages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('Error:', error); return }

  const tbody = document.getElementById('outagesTable')
  const activeCount = data.filter(o => o.active).length
  document.getElementById('activeOutages').textContent = activeCount

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No outages</td></tr>'
    return
  }

  tbody.innerHTML = data.map(o => `
    <tr>
      <td><strong>${o.zip_code}</strong></td>
      <td><span class="status ${o.active ? 'active' : 'resolved'}">${o.active ? 'Active' : 'Resolved'}</span></td>
      <td>${o.estimated_resolution || '-'}</td>
      <td>${o.reason || '-'}</td>
    </tr>
  `).join('')
}

// Load Accounts
async function loadAccounts() {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('Error:', error); return }

  const tbody = document.getElementById('accountsTable')
  document.getElementById('totalAccounts').textContent = data.length

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No accounts - add one!</td></tr>'
    return
  }

  tbody.innerHTML = data.map(a => `
    <tr>
      <td>${a.account_phone}</td>
      <td>${a.customer_name}</td>
      <td><strong>$${parseFloat(a.balance).toFixed(2)}</strong></td>
      <td>${a.due_date || '-'}</td>
    </tr>
  `).join('')
}

// Load Tickets
async function loadTickets() {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) { console.error('Error:', error); return }

  const tbody = document.getElementById('ticketsTable')
  const openCount = data.filter(t => t.status === 'open').length
  document.getElementById('openTickets').textContent = openCount

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No tickets yet</td></tr>'
    return
  }

  tbody.innerHTML = data.map(t => `
    <tr>
      <td><strong>${t.ticket_id}</strong></td>
      <td>${t.customer_name}</td>
      <td>${t.issue_type?.replace('_', ' ') || '-'}</td>
      <td><span class="priority ${t.priority}">${t.priority}</span></td>
    </tr>
  `).join('')
}

// Load Notifications
async function loadNotifications() {
  const { data, error } = await supabase
    .from('outage_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) { console.error('Error:', error); return }

  const tbody = document.getElementById('notificationsTable')
  const pendingCount = data.filter(n => !n.notified).length
  document.getElementById('pendingNotifications').textContent = pendingCount
  document.getElementById('notifBadge').textContent = `${pendingCount} pending`

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No notifications</td></tr>'
    return
  }

  tbody.innerHTML = data.map(n => `
    <tr>
      <td>${n.phone_number}</td>
      <td>${n.zip_code}</td>
      <td><span class="status ${n.notified ? 'notified' : 'waiting'}">${n.notified ? 'Sent' : 'Waiting'}</span></td>
      <td class="timestamp">${new Date(n.created_at).toLocaleString()}</td>
    </tr>
  `).join('')
}

// Load Payment Links
async function loadPaymentLinks() {
  const { data, error } = await supabase
    .from('payment_links')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) { console.error('Error:', error); return }

  const tbody = document.getElementById('paymentLinksTable')
  document.getElementById('paymentLinks').textContent = data.length

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No payment links</td></tr>'
    return
  }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.account_phone}</td>
      <td><span class="status ${p.delivery_method}">${p.delivery_method.toUpperCase()}</span></td>
      <td>${p.sent_to}</td>
      <td><strong>${p.confirmation_code}</strong></td>
    </tr>
  `).join('')
}

// Modal functions
window.openModal = function(id) {
  document.getElementById(id).classList.add('active')
}

window.closeModal = function(id) {
  document.getElementById(id).classList.remove('active')
  document.getElementById(id).querySelector('form').reset()
}

// Submit Outage
window.submitOutage = async function(e) {
  e.preventDefault()
  const form = e.target
  const formData = new FormData(form)

  const { error } = await supabase.from('outages').insert({
    zip_code: formData.get('zip_code'),
    active: formData.get('active') === 'true',
    estimated_resolution: formData.get('estimated_resolution') || null,
    reason: formData.get('reason') || null
  })

  if (error) {
    alert('Error adding outage: ' + error.message)
    return
  }

  closeModal('outageModal')
  loadOutages()
}

// Submit Account
window.submitAccount = async function(e) {
  e.preventDefault()
  const form = e.target
  const formData = new FormData(form)

  const { error } = await supabase.from('accounts').insert({
    account_phone: formData.get('account_phone').replace(/\D/g, ''),
    customer_name: formData.get('customer_name'),
    balance: parseFloat(formData.get('balance')),
    due_date: formData.get('due_date'),
    email: formData.get('email') || null
  })

  if (error) {
    alert('Error adding account: ' + error.message)
    return
  }

  closeModal('accountModal')
  loadAccounts()
}

// Real-time subscriptions
supabase.channel('all-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'outages' }, loadOutages)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, loadAccounts)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, loadTickets)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'outage_notifications' }, loadNotifications)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_links' }, loadPaymentLinks)
  .subscribe()

// Initialize
window.loadData = loadData
loadData()
setInterval(loadData, 15000)
