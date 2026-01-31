import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

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
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No tickets yet - make a test call!</td></tr>'
    return
  }

  tbody.innerHTML = data.map(t => `
    <tr>
      <td><strong>${t.ticket_id}</strong></td>
      <td>${t.customer_name}</td>
      <td>${t.issue_type.replace('_', ' ')}</td>
      <td><span class="priority ${t.priority}">${t.priority}</span></td>
      <td><span class="status ${t.status}">${t.status}</span></td>
    </tr>
  `).join('')
}

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

  const total = (parseInt(document.getElementById('openTickets').textContent) || 0) +
               (parseInt(document.getElementById('pendingNotifications').textContent) || 0)
  document.getElementById('totalCalls').textContent = total

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No notifications yet</td></tr>'
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

async function loadData() {
  await Promise.all([loadOutages(), loadTickets(), loadNotifications()])
}

// Real-time subscriptions
supabase.channel('changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'outages' }, loadOutages)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, loadTickets)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'outage_notifications' }, loadNotifications)
  .subscribe()

// Initialize
window.loadData = loadData
loadData()
setInterval(loadData, 10000)
