/* ═══════════════════════════════════════════════════════════════════════════
   TAARUN'S HOTWHEELS — Frontend JavaScript
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── State ──────────────────────────────────────────────────────────────────
let products = [];
let cart = [];

// ─── DOM Ready ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  createHeroParticles();
  setupNavbarScroll();
});

// ─── Load Products from API ─────────────────────────────────────────────────
async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    renderProducts();
  } catch (err) {
    grid.innerHTML = `
      <div class="loading-spinner">
        <p style="color: var(--danger);">Failed to load products. Please refresh.</p>
      </div>
    `;
    console.error('Error loading products:', err);
  }
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = products.map(product => `
    <div class="product-card" id="product-${product.id}">
      <div class="card-image">
        <img src="${product.image_url}" alt="${product.name}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400&h=300&fit=crop'">
        <span class="price-badge">₹${parseFloat(product.price).toFixed(0)}</span>
      </div>
      <div class="card-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <button class="add-to-cart-btn" id="addBtn-${product.id}" onclick="addToCart(${product.id})">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

// ─── Cart Logic ─────────────────────────────────────────────────────────────
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  // Button feedback
  const btn = document.getElementById(`addBtn-${productId}`);
  if (btn) {
    btn.classList.add('added');
    btn.innerHTML = `✓ Added`;
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        Add to Cart
      `;
    }, 1200);
  }

  updateCart();
  animateCartBadge();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCart();
}

function updateQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  updateCart();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCart() {
  const countEl = document.getElementById('cartCount');
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');

  const count = getCartCount();
  const total = getCartTotal();

  countEl.textContent = count;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <p>🛒 Your cart is empty</p>
        <span>Add some awesome Hot Wheels!</span>
      </div>
    `;
    footerEl.style.display = 'none';
  } else {
    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image_url}" alt="${item.name}"
             onerror="this.src='https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400&h=300&fit=crop'">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <span class="cart-item-price">₹${(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
            <span class="cart-item-qty">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Remove">✕</button>
      </div>
    `).join('');
    footerEl.style.display = 'block';
    totalEl.textContent = `₹${total.toFixed(0)}`;
  }
}

function animateCartBadge() {
  const badge = document.getElementById('cartCount');
  badge.style.transform = 'scale(1.4)';
  setTimeout(() => { badge.style.transform = 'scale(1)'; }, 300);
}

// ─── Cart Drawer Toggle ─────────────────────────────────────────────────────
function toggleCart() {
  document.getElementById('cartOverlay').classList.toggle('active');
  document.getElementById('cartDrawer').classList.toggle('active');
  document.body.style.overflow = document.getElementById('cartDrawer').classList.contains('active') ? 'hidden' : '';
}

// ─── Checkout Modal ─────────────────────────────────────────────────────────
function openCheckout() {
  // Close cart drawer
  document.getElementById('cartOverlay').classList.remove('active');
  document.getElementById('cartDrawer').classList.remove('active');

  // Build order summary
  const summaryEl = document.getElementById('orderSummary');
  const total = getCartTotal();
  summaryEl.innerHTML = cart.map(item => `
    <div class="order-summary-item">
      <span>${item.name} × ${item.quantity}</span>
      <span>₹${(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
    </div>
  `).join('') + `
    <div class="order-summary-item">
      <span>Total</span>
      <span>₹${total.toFixed(0)}</span>
    </div>
  `;

  document.getElementById('orderTotalBtn').textContent = `₹${total.toFixed(0)}`;

  // Show modal
  document.getElementById('checkoutOverlay').classList.add('active');
  document.getElementById('checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('active');
  document.getElementById('checkoutModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ─── Place Order ────────────────────────────────────────────────────────────
async function placeOrder(e) {
  e.preventDefault();

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.querySelector('span:first-child').textContent = 'Placing Order...';

  const orderData = {
    customerName: document.getElementById('custName').value,
    phone: document.getElementById('custPhone').value,
    address: document.getElementById('custAddress').value,
    city: document.getElementById('custCity').value,
    pincode: document.getElementById('custPincode').value,
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price)
    })),
    total: getCartTotal()
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const data = await res.json();

    if (data.success) {
      closeCheckout();
      showSuccess(data.orderId);
      // Clear cart
      cart = [];
      updateCart();
      document.getElementById('checkoutForm').reset();
    } else {
      alert('Failed to place order. Please try again.');
    }
  } catch (err) {
    console.error('Order error:', err);
    alert('Something went wrong. Please try again.');
  } finally {
    btn.disabled = false;
    btn.querySelector('span:first-child').textContent = 'Place Order — COD';
  }
}

// ─── Success Modal ──────────────────────────────────────────────────────────
function showSuccess(orderId) {
  document.getElementById('successOrderId').textContent = `Order #${orderId}`;
  document.getElementById('successOverlay').classList.add('active');
  document.getElementById('successModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSuccess() {
  document.getElementById('successOverlay').classList.remove('active');
  document.getElementById('successModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ─── Contact Form ───────────────────────────────────────────────────────────
async function handleContact(e) {
  e.preventDefault();

  const btn = document.getElementById('contactSubmitBtn');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Sending...';

  const contactData = {
    name: document.getElementById('contactName').value,
    email: document.getElementById('contactEmail').value,
    message: document.getElementById('contactMessage').value
  };

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });

    const data = await res.json();

    if (data.success) {
      // Show inline success
      btn.style.background = 'var(--success)';
      btn.querySelector('span').textContent = '✓ Message Sent!';
      document.getElementById('contactForm').reset();
      setTimeout(() => {
        btn.style.background = '';
        btn.querySelector('span').textContent = 'Send Message';
        btn.disabled = false;
      }, 3000);
    } else {
      alert('Failed to send message. Please try again.');
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Send Message';
    }
  } catch (err) {
    console.error('Contact error:', err);
    alert('Something went wrong. Please try again.');
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Send Message';
  }
}

// ─── Navbar Scroll Effect ───────────────────────────────────────────────────
function setupNavbarScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(10, 10, 15, 0.95)';
      navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    } else {
      navbar.style.background = 'rgba(10, 10, 15, 0.85)';
      navbar.style.boxShadow = 'none';
    }
  });
}

// ─── Mobile Menu ────────────────────────────────────────────────────────────
function toggleMobileMenu() {
  document.querySelector('.nav-links').classList.toggle('active');
}

// ─── Hero Particles ─────────────────────────────────────────────────────────
function createHeroParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 4 + 1}px;
      height: ${Math.random() * 4 + 1}px;
      background: rgba(255, 107, 0, ${Math.random() * 0.3 + 0.1});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: float ${Math.random() * 6 + 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 4}s;
    `;
    container.appendChild(particle);
  }

  // Add floating keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
      25% { transform: translateY(-30px) translateX(10px); opacity: 0.7; }
      50% { transform: translateY(-15px) translateX(-10px); opacity: 0.5; }
      75% { transform: translateY(-40px) translateX(5px); opacity: 0.8; }
    }
  `;
  document.head.appendChild(style);
}
