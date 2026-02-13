const state = {
  orders: JSON.parse(localStorage.getItem('orders') || '[]'),
  contacts: JSON.parse(localStorage.getItem('contacts') || '[]'),
  restaurants: JSON.parse(localStorage.getItem('restaurants') || '[]'),
  history: JSON.parse(localStorage.getItem('history') || '[]'),
  notes: localStorage.getItem('notes') || '',
  calc: '0'
};

const restaurantSeed = {
  default: [
    { name: 'Burger Express', phone: '+12025550101' },
    { name: 'Italian Corner', phone: '+12025550102' },
    { name: 'Sushi Point', phone: '+12025550103' }
  ],
  casablanca: [
    { name: 'La Grillardière', phone: '+212522400111' },
    { name: 'Pizza Napoli Casa', phone: '+212522401222' },
    { name: 'Tacos Avenue Casa', phone: '+212522402333' }
  ],
  rabat: [
    { name: 'Rabat Burger House', phone: '+212537700111' },
    { name: 'Marina Pizza Rabat', phone: '+212537701222' },
    { name: 'Wok Station Rabat', phone: '+212537702333' }
  ]
};

const orderForm = document.getElementById('orderForm');
const historyList = document.getElementById('historyList');
const contactList = document.getElementById('contactList');
const restaurantList = document.getElementById('restaurantList');
const notes = document.getElementById('notes');
const fileInput = document.getElementById('fileInput');

function save() {
  localStorage.setItem('orders', JSON.stringify(state.orders));
  localStorage.setItem('contacts', JSON.stringify(state.contacts));
  localStorage.setItem('restaurants', JSON.stringify(state.restaurants));
  localStorage.setItem('history', JSON.stringify(state.history));
  localStorage.setItem('notes', state.notes);
}

function addHistory(type, text) {
  state.history.unshift({ type, text, at: new Date().toISOString() });
  state.history = state.history.slice(0, 100);
}

function formatMoney(v) {
  return `$${Number(v).toFixed(2)}`;
}

function refreshStats() {
  const totalOrders = state.orders.length;
  const totalRevenue = state.orders.reduce((sum, o) => sum + o.orderValue, 0);
  const totalEarnings = state.orders.reduce((sum, o) => sum + o.deliveryFee, 0);

  document.getElementById('totalOrders').textContent = totalOrders;
  document.getElementById('totalRevenue').textContent = formatMoney(totalRevenue);
  document.getElementById('totalEarnings').textContent = formatMoney(totalEarnings);
}

function callLinks(number, name, type = 'call') {
  return `<div class="action-links">
      <a href="tel:${number}" data-log="call" data-name="${name}" data-number="${number}">📞 Call</a>
      <a href="https://wa.me/${number.replace(/\D/g, '')}" target="_blank" rel="noopener" data-log="whatsapp" data-name="${name}" data-number="${number}">💬 WhatsApp</a>
    </div>`;
}

function refreshContacts() {
  contactList.innerHTML = state.contacts
    .map(c => `<li><strong>${c.name}</strong><br/>${c.phone}${callLinks(c.phone, c.name)}</li>`)
    .join('') || '<li>No saved contacts yet.</li>';
}

function refreshRestaurants() {
  restaurantList.innerHTML = state.restaurants
    .map(r => `<li><strong>${r.name}</strong><br/>${r.phone}${callLinks(r.phone, r.name)}</li>`)
    .join('') || '<li>Load restaurants for your city.</li>';
}

function refreshHistory() {
  historyList.innerHTML = state.history
    .map(h => {
      const date = new Date(h.at).toLocaleString();
      return `<li><strong>${h.type.toUpperCase()}</strong> - ${h.text}<small>${date}</small></li>`;
    })
    .join('') || '<li>No activity yet.</li>';
}

orderForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const customerName = document.getElementById('customerName').value.trim();
  const restaurantName = document.getElementById('restaurantName').value.trim();
  const orderValue = Number(document.getElementById('orderValue').value);
  const deliveryFee = Number(document.getElementById('deliveryFee').value);

  state.orders.push({ customerName, restaurantName, orderValue, deliveryFee, at: Date.now() });
  addHistory('order', `${customerName} - ${restaurantName} | earning ${formatMoney(deliveryFee)}`);

  orderForm.reset();
  refreshStats();
  refreshHistory();
  save();
});

document.getElementById('saveContact').addEventListener('click', () => {
  const name = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('contactNumber').value.trim();
  if (!name || !phone) return;

  state.contacts.push({ name, phone });
  addHistory('contact', `Saved ${name} (${phone})`);
  document.getElementById('contactName').value = '';
  document.getElementById('contactNumber').value = '';
  refreshContacts();
  refreshHistory();
  save();
});

document.body.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-log]');
  if (!link) return;
  const type = link.dataset.log === 'whatsapp' ? 'whatsapp call' : 'call';
  addHistory(type, `${link.dataset.name} (${link.dataset.number})`);
  refreshHistory();
  save();
});

document.getElementById('loadRestaurants').addEventListener('click', () => {
  const city = document.getElementById('cityInput').value.trim().toLowerCase();
  state.restaurants = restaurantSeed[city] || restaurantSeed.default;
  document.getElementById('mapFrame').src = `https://www.google.com/maps?q=${encodeURIComponent(city || 'restaurants near me')}&output=embed`;
  addHistory('map', `Loaded restaurants for ${city || 'default city'}`);
  refreshRestaurants();
  refreshHistory();
  save();
});

document.getElementById('importContacts').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const [file] = e.target.files;
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (Array.isArray(data)) {
      state.contacts.push(...data.filter(c => c?.name && c?.phone));
      addHistory('contact', `Imported ${data.length} contacts from JSON`);
      refreshContacts();
      refreshHistory();
      save();
    }
  } catch (err) {
    alert('Invalid JSON file. Use: [{"name":"...","phone":"..."}]');
  }
  e.target.value = '';
});

notes.value = state.notes;
notes.addEventListener('input', () => {
  state.notes = notes.value;
  save();
});

document.getElementById('clearData').addEventListener('click', () => {
  if (!confirm('Clear all stored data?')) return;
  localStorage.clear();
  location.reload();
});

function initCalculator() {
  const display = document.getElementById('calcDisplay');
  const grid = document.getElementById('calcGrid');
  const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', 'C', '+', '='];

  keys.forEach((k) => {
    const btn = document.createElement('button');
    btn.textContent = k;
    btn.className = ['/', '*', '-', '+'].includes(k) ? 'op' : k === '=' ? 'eq' : '';
    btn.addEventListener('click', () => {
      if (k === 'C') {
        state.calc = '0';
      } else if (k === '=') {
        try {
          state.calc = String(Function(`"use strict"; return (${state.calc})`)());
        } catch {
          state.calc = 'Error';
        }
      } else {
        if (state.calc === '0' || state.calc === 'Error') state.calc = '';
        state.calc += k;
      }
      display.textContent = state.calc;
    });
    grid.appendChild(btn);
  });
}

refreshStats();
refreshContacts();
refreshRestaurants();
refreshHistory();
initCalculator();
