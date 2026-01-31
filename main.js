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
      <td><button class="btn edit" onclick="editOutage(${o.id}, '${o.zip_code}', ${o.active}, '${o.estimated_resolution || ''}', '${o.reason || ''}')">Edit</button></td>
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
      <td><button class="btn edit" onclick="editAccount(${a.id}, '${a.account_phone}', '${a.customer_name}', ${a.balance}, '${a.due_date || ''}', '${a.email || ''}')">Edit</button></td>
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
  // Reset hidden ID fields
  const idInput = document.getElementById(id).querySelector('input[name="id"]')
  if (idInput) idInput.value = ''
}

// Open Outage Modal (Add mode)
window.openOutageModal = function() {
  document.getElementById('outageModalTitle').textContent = 'Add Service Outage'
  document.getElementById('outageSubmitBtn').textContent = 'Add Outage'
  document.getElementById('outageForm').reset()
  document.querySelector('#outageForm input[name="id"]').value = ''
  openModal('outageModal')
}

// Edit Outage
window.editOutage = function(id, zipCode, active, resolution, reason) {
  document.getElementById('outageModalTitle').textContent = 'Edit Service Outage'
  document.getElementById('outageSubmitBtn').textContent = 'Save Changes'
  document.querySelector('#outageForm input[name="id"]').value = id
  document.querySelector('#outageForm input[name="zip_code"]').value = zipCode
  document.querySelector('#outageForm select[name="active"]').value = active.toString()
  document.querySelector('#outageForm input[name="estimated_resolution"]').value = resolution
  document.querySelector('#outageForm input[name="reason"]').value = reason
  openModal('outageModal')
}

// Open Account Modal (Add mode)
window.openAccountModal = function() {
  document.getElementById('accountModalTitle').textContent = 'Add Customer Account'
  document.getElementById('accountSubmitBtn').textContent = 'Add Account'
  document.getElementById('accountForm').reset()
  document.querySelector('#accountForm input[name="id"]').value = ''
  openModal('accountModal')
}

// Edit Account
window.editAccount = function(id, phone, name, balance, dueDate, email) {
  document.getElementById('accountModalTitle').textContent = 'Edit Customer Account'
  document.getElementById('accountSubmitBtn').textContent = 'Save Changes'
  document.querySelector('#accountForm input[name="id"]').value = id
  document.querySelector('#accountForm input[name="account_phone"]').value = phone
  document.querySelector('#accountForm input[name="customer_name"]').value = name
  document.querySelector('#accountForm input[name="balance"]').value = balance
  document.querySelector('#accountForm input[name="due_date"]').value = dueDate
  document.querySelector('#accountForm input[name="email"]').value = email
  openModal('accountModal')
}

// Submit Outage (Add or Update)
window.submitOutage = async function(e) {
  e.preventDefault()
  const form = e.target
  const formData = new FormData(form)
  const id = formData.get('id')

  const outageData = {
    zip_code: formData.get('zip_code'),
    active: formData.get('active') === 'true',
    estimated_resolution: formData.get('estimated_resolution') || null,
    reason: formData.get('reason') || null
  }

  let error
  if (id) {
    // Update existing
    const result = await supabase.from('outages').update(outageData).eq('id', id)
    error = result.error
  } else {
    // Insert new
    const result = await supabase.from('outages').insert(outageData)
    error = result.error
  }

  if (error) {
    alert('Error saving outage: ' + error.message)
    return
  }

  closeModal('outageModal')
  loadOutages()
}

// Submit Account (Add or Update)
window.submitAccount = async function(e) {
  e.preventDefault()
  const form = e.target
  const formData = new FormData(form)
  const id = formData.get('id')

  const accountData = {
    account_phone: formData.get('account_phone').replace(/\D/g, ''),
    customer_name: formData.get('customer_name'),
    balance: parseFloat(formData.get('balance')),
    due_date: formData.get('due_date'),
    email: formData.get('email') || null
  }

  let error
  if (id) {
    // Update existing
    const result = await supabase.from('accounts').update(accountData).eq('id', id)
    error = result.error
  } else {
    // Insert new
    const result = await supabase.from('accounts').insert(accountData)
    error = result.error
  }

  if (error) {
    alert('Error saving account: ' + error.message)
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
