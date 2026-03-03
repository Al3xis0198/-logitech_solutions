let allProducts = [];
let allSuppliers = [];
let allCustomers = [];
let currentCustomerId = null;
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSearch();
    loadProducts();
    loadSuppliers();
    loadCustomers();
    loadInsights();
});


function initTabs() {
    const btns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.tab-content');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            btns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tab}-section`).classList.add('active');
            handleSearch(document.getElementById('global-search').value);
        });
    });
}

function initSearch() {
    document.getElementById('global-search').addEventListener('input', e =>
        handleSearch(e.target.value.toLowerCase())
    );
}

function handleSearch(query) {
    const activeTab = document.querySelector('.nav-btn.active').dataset.tab;
    if (activeTab === 'products') {
        renderProducts(allProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query) ||
            p.category_name.toLowerCase().includes(query) ||
            p.supplier_name.toLowerCase().includes(query)
        ));
    } else if (activeTab === 'suppliers') {
        renderSuppliers(allSuppliers.filter(s => s.supplier_name.toLowerCase().includes(query)));
    } else if (activeTab === 'customers') {
        renderCustomers(allCustomers.filter(c =>
            c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
        ));
    } else if (activeTab === 'bi') {
        renderInsights(allProducts.filter(p =>
            p.name.toLowerCase().includes(query) || p.category_name.toLowerCase().includes(query)
        ).sort((a, b) => b.price - a.price).slice(0, 6));
    }
}

async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
        renderProducts(allProducts);
    } catch (err) {
        showNotification('Error loading products', 'error');
    }
}

function renderProducts(data) {
    document.getElementById('product-count').textContent = `${data.length} Products`;
    document.querySelector('#products-table tbody').innerHTML = data.map(p => {
        const stock = p.stock !== undefined ? p.stock : '—';
        const stockClass = (p.stock !== undefined && p.stock <= 5) ? 'low' : '';
        return `
        <tr>
            <td><code style="color:#818cf8">${p.sku}</code></td>
            <td>${p.name}</td>
            <td>$${parseFloat(p.price).toLocaleString()}</td>
            <td><span class="stock-badge ${stockClass}">${stock}</span></td>
            <td><span class="badge" style="background:rgba(255,255,255,0.1)">${p.category_name}</span></td>
            <td style="color:#94a3b8">${p.supplier_name}</td>
            <td>
                <button class="delete-btn" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>`;
    }).join('');
}

async function loadSuppliers() {
    try {
        const res = await fetch('/api/bi/suppliers');
        allSuppliers = await res.json();
        renderSuppliers(allSuppliers);
    } catch (err) { console.error(err); }
}

function renderSuppliers(data) {
    document.getElementById('suppliers-grid').innerHTML = data.map(s => `
        <div class="card">
            <h3>${s.supplier_name}</h3>
            <p>Inventory Value</p>
            <div class="stat">$${parseFloat(s.total_inventory_value).toLocaleString()}</div>
            <p>${s.total_items} total items in stock</p>
        </div>
    `).join('');
}

async function loadCustomers() {
    try {
        const res = await fetch('/api/customers');
        allCustomers = await res.json();
        renderCustomers(allCustomers);
    } catch (err) { console.error(err); }
}

function renderCustomers(data) {
    document.getElementById('customers-list-grid').innerHTML = data.map(c => `
        <div class="customer-card-small" onclick="loadCustomerHistory('${c.email}', '${c.name}', ${c.id}, this)">
            <h4>${c.name}</h4>
            <p>${c.email}</p>
        </div>
    `).join('');
}

async function loadCustomerHistory(email, name, customerId, element) {
    document.querySelectorAll('.customer-card-small').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    currentCustomerId = customerId;

    document.getElementById('sale-customer-label').textContent = `Customer: ${name}`;

    try {
        const res = await fetch(`/api/bi/customers/${encodeURIComponent(email)}/history`);
        const history = await res.json();

        document.getElementById('history-placeholder').classList.add('hidden');
        document.getElementById('history-container').classList.remove('hidden');
        document.getElementById('current-customer-name').textContent = `Orders — ${name}`;

        const tbody = document.querySelector('#history-table tbody');
        tbody.innerHTML = history.length === 0
            ? '<tr><td colspan="4" style="text-align:center; padding: 2rem; color:var(--text-dim)">No orders yet</td></tr>'
            : history.map(h => `
                <tr>
                    <td>${new Date(h.order_date).toLocaleDateString()}</td>
                    <td>${h.name}</td>
                    <td>${h.quantity}</td>
                    <td style="color:var(--primary); font-weight:600">$${parseFloat(h.total).toLocaleString()}</td>
                </tr>
            `).join('');
    } catch (err) {
        showNotification('Error loading history', 'error');
    }
}

async function submitCustomer(e) {
    e.preventDefault();
    const name = document.getElementById('c-name').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const address = document.getElementById('c-address').value.trim();

    try {
        const res = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, address })
        });
        const data = await res.json();
        if (!res.ok) return showNotification(data.error || 'Error creating customer', 'error');

        showNotification(`Customer "${name}" created!`, 'success');
        closeModal('customer-modal');
        document.getElementById('customer-form').reset();
        await loadCustomers();
    } catch (err) {
        showNotification('Network error', 'error');
    }
}

function openSaleModal() {
    if (!currentCustomerId) return showNotification('Select a customer first', 'error');
    cart = [];
    renderCart();

    const select = document.getElementById('sale-product-select');
    select.innerHTML = allProducts.map(p =>
        `<option value="${p.id}" data-price="${p.price}" data-stock="${p.stock}">${p.name} (Stock: ${p.stock}) — $${parseFloat(p.price).toLocaleString()}</option>`
    ).join('');

    openModal('sale-modal');
}

function addToCart() {
    const select = document.getElementById('sale-product-select');
    const qty = parseInt(document.getElementById('sale-qty').value) || 1;
    const option = select.options[select.selectedIndex];
    const productId = parseInt(select.value);
    const price = parseFloat(option.dataset.price);
    const stock = parseInt(option.dataset.stock);
    const name = option.text.split(' (Stock')[0];

    if (qty > stock) return showNotification(`Only ${stock} units available`, 'error');
    if (qty < 1) return;

    const existing = cart.find(i => i.product_id === productId);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ product_id: productId, quantity: qty, unit_price: price, name });
    }
    renderCart();
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const total = cart.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    document.getElementById('cart-total').textContent = `Total: $${total.toLocaleString()}`;

    if (cart.length === 0) {
        container.innerHTML = '<p style="color:var(--text-dim); text-align:center; padding:1rem">No items added yet</p>';
        return;
    }
    container.innerHTML = `
        <div class="table-container header-mini">
            <table>
                <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th><th></th></tr></thead>
                <tbody>${cart.map((item, i) => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.unit_price.toLocaleString()}</td>
                        <td style="color:var(--primary)">$${(item.unit_price * item.quantity).toLocaleString()}</td>
                        <td><button class="delete-btn" onclick="removeFromCart(${i})">✕</button></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>`;
}

async function submitSale() {
    if (cart.length === 0) return showNotification('Add at least one product', 'error');

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: currentCustomerId, items: cart })
        });
        const data = await res.json();
        if (!res.ok) return showNotification(data.error || 'Error creating order', 'error');

        showNotification(`Sale completed! Total: $${parseFloat(data.total).toLocaleString()}`, 'success');
        closeModal('sale-modal');
        await loadProducts();
        const active = document.querySelector('.customer-card-small.active');
        if (active) active.click();
    } catch (err) {
        showNotification('Network error', 'error');
    }
}

async function loadInsights() {
    try {
        if (allProducts.length === 0) {
            const res = await fetch('/api/products');
            allProducts = await res.json();
        }
        renderInsights(allProducts.sort((a, b) => b.price - a.price).slice(0, 6));
    } catch (err) { console.error(err); }
}

function renderInsights(data) {
    document.getElementById('star-products-grid').innerHTML = data.map(p => `
        <div class="card" style="border-left: 4px solid var(--primary)">
            <h3>${p.name}</h3>
            <p>${p.category_name}</p>
            <div class="stat">$${parseFloat(p.price).toLocaleString()}</div>
            <p>SKU: ${p.sku}</p>
        </div>
    `).join('');
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product? It will be archived in MongoDB.')) return;
    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showNotification('Product deleted and audited in MongoDB', 'success');
            loadProducts();
        } else {
            showNotification('Error deleting product', 'error');
        }
    } catch (err) { showNotification('Network error', 'error'); }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function closeModalOverlay(e, id) { if (e.target.classList.contains('modal-overlay')) closeModal(id); }
function showNotification(msg, type) {
    const el = document.getElementById('notification');
    el.textContent = msg;
    el.className = `active ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}
