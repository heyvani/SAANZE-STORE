// ═══════════════════════════════════════════════════════
//  SAANZÉ — SCRIPT.JS
//  ✅ Cart sidebar with remove-item button
//  ✅ 4 images in modal (3 product + size chart)
//  ✅ Size selector (S/M/L/XL) in modal — required before Add to Bag
//  ✅ Razorpay Standard Checkout
//  ✅ Formspree order storage
// ═══════════════════════════════════════════════════════

// ── Load Razorpay Key from server ──
fetch('/api/config')
  .then(r => r.json())
  .then(data => { window.RAZORPAY_KEY_ID = data.key_id; })
  .catch(() => console.error('Could not load payment config'));

/* ── State ── */
let cart = JSON.parse(localStorage.getItem('saanze_cart') || '[]');
let favs = JSON.parse(localStorage.getItem('saanze_favs') || '[]');

/* ── Persist ── */
function saveCart() { localStorage.setItem('saanze_cart', JSON.stringify(cart)); }
function saveFavs()  { localStorage.setItem('saanze_favs',  JSON.stringify(favs)); }

/* ── Product price map in paise (₹ × 100) ── */
const PRICE_MAP = {
  'White Crop Shirt':        79900,
  'Burgundy Corset Lace-Up': 79900,
  'Floral Halter Top':       69900,
};

/* ════════════════════════════════════════
   RAZORPAY HELPERS
   ════════════════════════════════════════ */

async function rzpCreateOrder(amountPaise, productName) {
  const res = await fetch('/api/create-order', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  'saanze_' + Date.now(),
      notes:    { product: productName }
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create order');
  return data;
}

async function rzpVerifyPayment(paymentId, orderId, signature) {
  const res = await fetch('/api/verify-payment', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_payment_id: paymentId,
      razorpay_order_id:   orderId,
      razorpay_signature:  signature
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Payment verification failed');
  return true;
}

function rzpOpenModal({ orderData, prefill, description }) {
  return new Promise((resolve, reject) => {
    const options = {
      key:         window.RAZORPAY_KEY_ID,
      order_id:    orderData.order_id,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        'Saanzé',
      description,
      image:       '/assets/logo.png',
      theme:       { color: '#C4963A' },
      prefill,
      handler: function (response) { resolve(response); }
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      reject(new Error(response.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
}

async function runRazorpayFlow({ amountPaise, productName, prefill, formspreeData, onSuccess, onCancel, onError }) {
  try {
    showToast('Opening payment… 💳');

    let orderData;
    try {
      orderData = await rzpCreateOrder(amountPaise, productName);
    } catch (err) {
      console.error('[rzp] create-order failed:', err);
      if (onError) onError(err);
      showToast('Could not start payment. Try again 💜');
      return;
    }

    let paymentResponse;
    try {
      paymentResponse = await rzpOpenModal({ orderData, prefill, description: productName });
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('cancel')) {
        showToast('Payment cancelled. Try again when ready 💜');
        if (onCancel) onCancel();
      } else {
        showToast('Payment failed: ' + (err.message || 'Unknown error') + ' 💔');
        if (onError) onError(err);
      }
      return;
    }

    try {
      await rzpVerifyPayment(
        paymentResponse.razorpay_payment_id,
        paymentResponse.razorpay_order_id,
        paymentResponse.razorpay_signature
      );
    } catch (err) {
      console.error('[rzp] verify-payment failed:', err);
      showToast('Payment verification failed. Contact us on WhatsApp 💜');
      if (onError) onError(err);
      return;
    }

    try {
      await fetch('https://formspree.io/f/mwvwwvkb', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formspreeData,
          payment_id:     paymentResponse.razorpay_payment_id,
          order_id:       paymentResponse.razorpay_order_id,
          payment_status: 'PAID ✅',
          amount_paid:    '₹' + (amountPaise / 100)
        })
      });
    } catch (err) {
      console.warn('[formspree] submission failed:', err);
    }

    if (onSuccess) onSuccess(paymentResponse.razorpay_payment_id);

  } catch (err) {
    console.error('[runRazorpayFlow] Unexpected error:', err);
    showToast('Something went wrong. Please try again 💜');
    if (onError) onError(err);
  }
}

/* ════════════════════════════════════════
   BADGES & TOAST
   ════════════════════════════════════════ */
function updateBadges() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartBadge').textContent = total;
  document.getElementById('favBadge').textContent  = favs.length;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ════════════════════════════════════════
   CART — add / remove / render
   ════════════════════════════════════════ */
function addToCart(name, price, img) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; }
  else { cart.push({ name, price: parseInt(price), img, qty: 1 }); }
  saveCart();
  updateBadges();
  renderCartSidebar();
  showToast(name + ' added to bag! 🔥');
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart();
  updateBadges();
  renderCartSidebar();
  showToast('Removed from bag 💜');
}

function changeQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(name); return; }
  saveCart();
  updateBadges();
  renderCartSidebar();
}

function openCartSidebar() {
  renderCartSidebar();
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartSidebar() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartSidebar() {
  const body   = document.getElementById('cartSidebarBody');
  const footer = document.getElementById('cartSidebarFooter');
  if (!body) return;

  if (!cart.length) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">👜</div>
        <p class="cart-empty-title">Your bag is empty</p>
        <p class="cart-empty-sub">Add something stunning 💜</p>
      </div>`;
    footer.style.display = 'none';
    return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  body.innerHTML = cart.map(item => `
    <div class="cart-item" data-name="${item.name}">
      <div class="cart-item-img">
        ${item.img
          ? `<img src="${item.img}" alt="${item.name}">`
          : `<div class="cart-item-img-placeholder">👜</div>`}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString()}</div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" onclick="changeQty('${item.name}', -1)">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" onclick="changeQty('${item.name}', 1)">+</button>
        </div>
      </div>
      <button class="cart-remove-btn" onclick="removeFromCart('${item.name}')" aria-label="Remove ${item.name}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>`).join('');

  footer.style.display = 'block';
  document.getElementById('cartSidebarTotal').textContent = '₹' + total.toLocaleString();
}

function cartCheckout() {
  if (!cart.length) { showToast('Your bag is empty 👜'); return; }

  const total      = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalPaise = total * 100;
  const itemNames  = cart.map(i => i.name + ' x' + i.qty).join(', ');

  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  if (checkoutBtn) { checkoutBtn.disabled = true; checkoutBtn.textContent = 'Processing…'; }

  runRazorpayFlow({
    amountPaise:  totalPaise,
    productName:  itemNames,
    prefill:      { name: '', email: '', contact: '' },
    formspreeData: {
      _subject:  'New Saanzé Cart Order 🛍️',
      form_type: 'cart_order',
      items:     cart.map(i => i.name + ' x' + i.qty + ' (₹' + (i.price * i.qty) + ')').join(' | '),
      total:     '₹' + total,
    },
    onSuccess: (paymentId) => {
      cart = []; saveCart(); updateBadges(); renderCartSidebar();
      closeCartSidebar();
      showToast('Order confirmed! 🎉 Payment ID: ' + paymentId);
      if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.textContent = 'Checkout — Pay Securely ✦'; }
    },
    onCancel: () => {
      if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.textContent = 'Checkout — Pay Securely ✦'; }
    },
    onError: () => {
      if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.textContent = 'Checkout — Pay Securely ✦'; }
    }
  });
}

/* ════════════════════════════════════════
   FAVOURITES
   ════════════════════════════════════════ */
function toggleFav(name, price, img) {
  const idx = favs.findIndex(i => i.name === name);
  if (idx > -1) { favs.splice(idx, 1); showToast(name + ' removed from faves 💔'); }
  else           { favs.push({ name, price: parseInt(price), img }); showToast(name + ' saved to faves 💜'); }
  saveFavs();
  updateBadges();
  updateHeartButtons();
}

function updateHeartButtons() {
  document.querySelectorAll('.card-heart-btn').forEach(btn => {
    btn.classList.toggle('faved', favs.some(f => f.name === btn.dataset.product));
  });
}

/* ════════════════════════════════════════
   BOTTOM NAV
   ════════════════════════════════════════ */
function navTo(sectionId, navId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(navId).classList.add('active');
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateNavOnScroll() {
  const mapping = [
    { id: 'earn',      navId: 'navEarn'       },
    { id: 'order',     navId: 'navOrder'      },
    { id: 'catalogue', navId: 'navCollection' },
  ];
  const scrollY = window.scrollY + 150;
  let activeNav = 'navCollection';
  mapping.forEach(s => {
    const el = document.getElementById(s.id);
    if (el && el.offsetTop <= scrollY) activeNav = s.navId;
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeEl = document.getElementById(activeNav);
  if (activeEl) activeEl.classList.add('active');
}

/* ════════════════════════════════════════
   PRODUCT MODAL
   — 4 image slots (3 product + size chart)
   — Size selector before Add to Bag
   ════════════════════════════════════════ */

// Track selected size per modal open
let modalSelectedSize = '';

function openModal(card) {
  const name    = card.dataset.name;
  const price   = card.dataset.price;
  const ogPrice = card.dataset.ogPrice;
  const badge   = card.dataset.badge;
  const reviews = card.dataset.reviews;
  const img     = card.dataset.img;
  const img2    = card.dataset.img2;
  const img3    = card.dataset.img3;

  // ── 4 images: 3 product shots + size chart ──
  const productImgs = [img, img2, img3].filter(src => src && src.trim() !== '');
  const sizeChartSrc = 'assets/size chart.jpg';
  const allImgs = [
    ...productImgs.map(src => ({ src, label: null, isSizeChart: false })),
    { src: sizeChartSrc, label: '📏 Size Chart', isSizeChart: true }
  ];

  // Reset selected size
  modalSelectedSize = '';
  const sizeBtns = document.querySelectorAll('.modal-size-btn');
  sizeBtns.forEach(b => b.classList.remove('selected'));
  const sizeError = document.getElementById('modalSizeError');
  if (sizeError) sizeError.style.display = 'none';

  // Set main image
  const mainImg = document.getElementById('modalMainImg');
  mainImg.src   = allImgs[0].src;
  mainImg.style.opacity = '1';

  // Build thumbnail row (4 slots)
  const row = document.getElementById('modalImageRow');
  row.innerHTML = '';
  // Make the grid always 4 columns in modal
  row.style.gridTemplateColumns = 'repeat(4,1fr)';

  allImgs.forEach((item, i) => {
    const slot = document.createElement('div');
    slot.className = 'modal-img-slot' + (i === 0 ? ' active-slot' : '') + (item.isSizeChart ? ' size-chart-slot' : '');

    slot.innerHTML = `
      <img src="${item.src}" alt="${item.isSizeChart ? 'Size Chart' : 'View ' + (i + 1)}" loading="lazy">
      ${item.isSizeChart ? '<span class="size-chart-badge">📏</span>' : ''}
    `;

    slot.addEventListener('click', () => {
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = item.src;
        mainImg.style.opacity = '1';
      }, 180);
      row.querySelectorAll('.modal-img-slot').forEach(s => s.classList.remove('active-slot'));
      slot.classList.add('active-slot');
    });
    row.appendChild(slot);
  });

  // Fill text details
  document.getElementById('modalTitle').textContent   = name;
  document.getElementById('modalPrice').textContent   = price;
  document.getElementById('modalPriceOg').textContent = ogPrice;
  document.getElementById('modalBadge').textContent   = badge;
  document.getElementById('modalReviews').textContent = reviews + ' reviews';

  const priceNum = price.replace(/[₹,]/g, '');

  // ── "Size Guide" button → show size chart in main image ──
  document.getElementById('modalSizeGuideBtn').onclick = () => {
    mainImg.style.opacity = '0';
    setTimeout(() => {
      mainImg.src = sizeChartSrc;
      mainImg.style.opacity = '1';
    }, 180);
    row.querySelectorAll('.modal-img-slot').forEach(s => s.classList.remove('active-slot'));
    const sizeSlot = row.querySelector('.size-chart-slot');
    if (sizeSlot) sizeSlot.classList.add('active-slot');
  };

  // ── Size buttons ──
  sizeBtns.forEach(btn => {
    btn.onclick = () => {
      sizeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      modalSelectedSize = btn.dataset.size;
      if (sizeError) sizeError.style.display = 'none';
    };
  });

  // ── Add to Bag — requires size ──
  document.getElementById('modalCartBtn').onclick = () => {
    if (!modalSelectedSize) {
      if (sizeError) {
        sizeError.style.display = 'flex';
        // shake the size buttons
        const sizeBtnsWrap = document.getElementById('modalSizeBtns');
        sizeBtnsWrap.style.animation = 'none';
        sizeBtnsWrap.offsetHeight;
        sizeBtnsWrap.style.animation = 'modalSizeShake 0.45s ease';
      }
      showToast('Please pick a size first 👗');
      return;
    }
    const cartName = name + ' — ' + modalSelectedSize;
    addToCart(cartName, priceNum, img);
    closeModal();
  };

  // ── Favourite ──
  document.getElementById('modalFavBtn').onclick = () => {
    toggleFav(name, priceNum, img);
    const isFaved = favs.some(f => f.name === name);
    document.getElementById('modalFavBtn').innerHTML = isFaved
      ? '<i class="fa-solid fa-heart"></i> Saved ✓'
      : '<i class="fa-solid fa-heart"></i> Save';
  };

  // ── Pre-order button ──
  document.getElementById('modalOrderBtn').onclick = () => {
    closeModal();
    setTimeout(() => {
      document.getElementById('order').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        document.querySelectorAll('.sf-product-pick').forEach(p => {
          if (p.querySelector('.sf-pname')?.textContent.trim() === name) sfSelectProduct(p, name);
        });
      }, 800);
    }, 300);
  };

  // Set initial fav state
  const isFaved = favs.some(f => f.name === name);
  document.getElementById('modalFavBtn').innerHTML = isFaved
    ? '<i class="fa-solid fa-heart"></i> Saved ✓'
    : '<i class="fa-solid fa-heart"></i> Save';

  document.getElementById('productModalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModalOverlay').classList.remove('active');
  document.body.style.overflow = '';
  // Reset size selection
  modalSelectedSize = '';
  document.querySelectorAll('.modal-size-btn').forEach(b => b.classList.remove('selected'));
  const sizeError = document.getElementById('modalSizeError');
  if (sizeError) sizeError.style.display = 'none';
}

/* ════════════════════════════════════════
   ORDER FORM (multi-step) + Razorpay
   ════════════════════════════════════════ */
let sfStep    = 1;
let sfProduct = '';

function sfGoTo(n) {
  if (n === 2 && !sfValidate1()) return;
  if (n === 3 && !sfProduct) { alert('Pick a piece first 🛍️'); return; }

  const prevPanel = document.getElementById('sf-p' + sfStep);
  const prevStep  = document.getElementById('sf-s' + sfStep);
  if (prevPanel) prevPanel.classList.remove('active');
  if (prevStep)  { prevStep.classList.remove('active'); prevStep.classList.add('done'); }

  sfStep = n;
  const nextPanel = document.getElementById('sf-p' + n);
  const nextStep  = document.getElementById('sf-s' + n);
  if (nextPanel) nextPanel.classList.add('active');
  if (nextStep)  { nextStep.classList.remove('done'); nextStep.classList.add('active'); }

  if (n === 3) {
    const wrap = document.getElementById('sf-selected-tag-wrap');
    wrap.innerHTML = sfProduct ? `<span class="sf-selected-tag">${sfProduct}</span>` : '';
  }
}

function sfValidate1() {
  const name  = document.getElementById('sf-name').value.trim();
  const email = document.getElementById('sf-email').value.trim();
  const phone = document.getElementById('sf-phone').value.trim();
  const addr  = document.getElementById('sf-addr').value.trim();
  if (!name || !email || !phone || !addr) { alert('Fill in all fields first ✦'); return false; }
  return true;
}

function sfSelectProduct(el, name) {
  document.querySelectorAll('.sf-product-pick').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  sfProduct = name;
}

function sfSubmit() {
  const bust     = document.getElementById('sf-bust').value;
  const waist    = document.getElementById('sf-waist').value;
  const shoulder = document.getElementById('sf-shoulder').value;
  const torso    = document.getElementById('sf-torso').value;
  if (!bust || !waist || !shoulder || !torso) { alert('Add all measurements 📏'); return; }

  const amountPaise = PRICE_MAP[sfProduct] || 79900;

  const orderData = {
    _subject:  'New Saanzé Pre-Order — ' + sfProduct + ' 🛍️',
    form_type: 'pre_order',
    name:      document.getElementById('sf-name').value,
    email:     document.getElementById('sf-email').value,
    phone:     document.getElementById('sf-phone').value,
    address:   document.getElementById('sf-addr').value,
    product:   sfProduct,
    bust:      bust + ' in',
    waist:     waist + ' in',
    shoulder:  shoulder + ' in',
    torso:     torso + ' in'
  };

  const submitBtn = document.querySelector('#sf-p3 .sf-btn-next');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Processing…'; }

  runRazorpayFlow({
    amountPaise,
    productName: sfProduct,
    prefill: {
      name:    orderData.name,
      email:   orderData.email,
      contact: orderData.phone
    },
    formspreeData: orderData,
    onSuccess: (paymentId) => {
      document.getElementById('sf-p3').classList.remove('active');
      document.getElementById('sf-s3').classList.remove('active');
      document.getElementById('sf-s3').classList.add('done');
      document.getElementById('sf-psuccess').classList.add('active');
      document.getElementById('sf-success-msg').textContent =
        `Payment confirmed ✅ Your ${sfProduct} is being crafted! We'll WhatsApp you soon. Stay iconic 💜`;
      cart = []; saveCart(); updateBadges(); renderCartSidebar();
    },
    onCancel: () => {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order ✦'; }
    },
    onError: () => {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order ✦'; }
    }
  });
}

/* ════════════════════════════════════════
   EARN / AFFILIATE FORM
   ════════════════════════════════════════ */
let earnGender    = '';
let earnPlatforms = [];

function selectGender(btn) {
  document.querySelectorAll('.earn-gender-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  earnGender = btn.dataset.gender;
}

function togglePlatform(btn) {
  const p = btn.dataset.p;
  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
    earnPlatforms = earnPlatforms.filter(x => x !== p);
  } else {
    btn.classList.add('selected');
    earnPlatforms.push(p);
  }
}

async function submitEarnForm() {
  const name  = document.getElementById('earn-name').value.trim();
  const age   = document.getElementById('earn-age').value.trim();
  const email = document.getElementById('earn-email').value.trim();
  const phone = document.getElementById('earn-phone').value.trim();
  const city  = document.getElementById('earn-city').value.trim();

  if (!name || !age || !email || !phone || !city) { alert('Please fill in all required fields ✦'); return; }
  if (!earnGender) { alert('Please select your gender 💜'); return; }

  const submitBtn = document.querySelector('.earn-submit-btn');
  if (submitBtn) { submitBtn.innerHTML = '<span>Submitting…</span>'; submitBtn.disabled = true; }

  try {
    const res = await fetch('https://formspree.io/f/mwvwwvkb', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject:  'New Saanzé Affiliate Application 💸',
        form_type: 'affiliate_onboarding',
        name, age, email,
        phone:     '+91 ' + phone,
        gender:    earnGender,
        city,
        platforms: earnPlatforms.join(', ') || 'Not specified'
      })
    });
    if (!res.ok) throw new Error('Formspree response not OK');
  } catch (err) {
    console.error('Earn form error:', err);
  }

  const formBody  = document.getElementById('earn-form-body');
  const successEl = document.getElementById('earn-success');
  if (formBody)  formBody.style.display  = 'none';
  if (successEl) successEl.style.display = 'block';
  const msgEl = document.getElementById('earn-success-msg');
  if (msgEl) msgEl.textContent =
    `Hey ${name}! We've got your application 🎉 Expect a WhatsApp message soon. Stay iconic 💜`;
}

/* ════════════════════════════════════════
   DOM READY
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Inject cart sidebar HTML ── */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="cart-overlay" id="cartOverlay" onclick="closeCartSidebar()"></div>
    <aside class="cart-sidebar" id="cartSidebar" aria-label="Shopping bag">
      <div class="cart-sidebar-header">
        <div class="cart-sidebar-title">
          <i class="fa-solid fa-bag-shopping"></i>
          Your Bag
          <span class="cart-sidebar-count" id="cartSidebarCount"></span>
        </div>
        <button class="cart-sidebar-close" onclick="closeCartSidebar()" aria-label="Close cart">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="cart-sidebar-body" id="cartSidebarBody"></div>
      <div class="cart-sidebar-footer" id="cartSidebarFooter" style="display:none;">
        <div class="cart-sidebar-total-row">
          <span class="cart-sidebar-total-label">Total</span>
          <span class="cart-sidebar-total-price" id="cartSidebarTotal">₹0</span>
        </div>
        <p class="cart-sidebar-note">Secure checkout via Razorpay — UPI, cards, netbanking 💳</p>
        <button class="cart-checkout-btn" id="cartCheckoutBtn" onclick="cartCheckout()">
          Checkout — Pay Securely ✦
        </button>
        <button class="cart-continue-btn" onclick="closeCartSidebar()">← Continue Shopping</button>
      </div>
    </aside>
  `);

  /* ── Inject cart sidebar CSS + modal size selector CSS ── */
  const injectedStyles = document.createElement('style');
  injectedStyles.textContent = `

    /* ── CART SIDEBAR ── */
    .cart-overlay {
      position: fixed; inset: 0; z-index: 7000;
      background: rgba(28,13,8,0.55); backdrop-filter: blur(8px);
      opacity: 0; pointer-events: none; transition: opacity 0.35s;
    }
    .cart-overlay.open { opacity: 1; pointer-events: all; }
    .cart-sidebar {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 7500;
      width: min(420px, 100vw); background: var(--cream);
      border-left: 1px solid rgba(196,150,58,0.15);
      box-shadow: -20px 0 60px rgba(28,13,8,0.12);
      display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
    }
    .cart-sidebar.open { transform: translateX(0); }
    .cart-sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.2rem 1.4rem; border-bottom: 1px solid rgba(196,150,58,0.12);
      background: var(--cream); position: sticky; top: 0; z-index: 2;
    }
    .cart-sidebar-header::after {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, var(--accent-3), var(--accent), var(--accent-2));
    }
    .cart-sidebar-title {
      font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1px; color: var(--accent-3);
      display: flex; align-items: center; gap: 0.55rem;
    }
    .cart-sidebar-count {
      background: var(--accent); color: white; border-radius: 50px;
      font-size: 0.6rem; font-weight: 700; padding: 2px 8px; letter-spacing: 0.5px;
    }
    .cart-sidebar-close {
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(61,26,14,0.06); border: 1px solid rgba(196,150,58,0.15);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent-3); font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
    }
    .cart-sidebar-close:hover { background: var(--accent-2); color: white; border-color: var(--accent-2); }
    .cart-sidebar-body {
      flex: 1; overflow-y: auto; padding: 1rem 1.4rem;
      scrollbar-width: thin; scrollbar-color: rgba(196,150,58,0.2) transparent;
    }
    .cart-empty { text-align: center; padding: 3rem 1rem; }
    .cart-empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .cart-empty-title { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--accent-3); text-transform: uppercase; margin-bottom: 0.3rem; }
    .cart-empty-sub { font-size: 0.82rem; color: var(--text-muted); }
    .cart-item {
      display: flex; align-items: flex-start; gap: 0.85rem;
      padding: 1rem 0; border-bottom: 1px solid rgba(196,150,58,0.1); position: relative;
    }
    .cart-item:last-child { border-bottom: none; }
    .cart-item-img {
      width: 70px; height: 88px; border-radius: 10px; overflow: hidden;
      background: var(--bg-card); flex-shrink: 0; border: 1px solid rgba(196,150,58,0.1);
    }
    .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
    .cart-item-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; }
    .cart-item-info { flex: 1; min-width: 0; }
    .cart-item-name {
      font-family: var(--font-heading); font-size: 0.82rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.3px; color: var(--accent-3);
      margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .cart-item-price { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: var(--accent); margin-bottom: 0.55rem; }
    .cart-item-controls { display: flex; align-items: center; gap: 0.4rem; }
    .cart-qty-btn {
      width: 26px; height: 26px; border-radius: 50%;
      background: rgba(61,26,14,0.06); border: 1px solid rgba(196,150,58,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 700; color: var(--accent-3);
      cursor: pointer; transition: all 0.2s; line-height: 1;
    }
    .cart-qty-btn:hover { background: var(--accent); color: white; border-color: var(--accent); }
    .cart-qty-num { font-size: 0.82rem; font-weight: 700; color: var(--accent-3); min-width: 20px; text-align: center; }
    .cart-remove-btn {
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(139,38,53,0.07); border: 1px solid rgba(139,38,53,0.15);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent-2); font-size: 0.72rem; cursor: pointer;
      transition: all 0.2s; flex-shrink: 0; margin-top: 2px;
    }
    .cart-remove-btn:hover { background: var(--accent-2); color: white; border-color: var(--accent-2); transform: scale(1.1); }
    .cart-sidebar-footer {
      padding: 1.2rem 1.4rem; border-top: 1px solid rgba(196,150,58,0.12);
      background: var(--cream); position: sticky; bottom: 0;
    }
    .cart-sidebar-total-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; }
    .cart-sidebar-total-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text-muted); }
    .cart-sidebar-total-price { font-family: var(--font-display); font-size: 1.8rem; font-weight: 700; color: var(--accent-3); }
    .cart-sidebar-note { font-size: 0.72rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5; }
    .cart-checkout-btn {
      width: 100%; padding: 1rem; background: var(--accent-3); color: white;
      border: none; border-radius: 50px; font-family: var(--font-body);
      font-size: 0.88rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
      cursor: pointer; margin-bottom: 0.6rem; transition: all 0.25s;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    }
    .cart-checkout-btn:hover:not(:disabled) { background: var(--accent-2); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(61,26,14,0.2); }
    .cart-checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .cart-continue-btn {
      width: 100%; padding: 0.8rem; background: transparent;
      border: 1.5px solid rgba(61,26,14,0.12); border-radius: 50px;
      font-family: var(--font-body); font-size: 0.8rem; font-weight: 500;
      color: var(--text-muted); cursor: pointer; transition: all 0.25s;
    }
    .cart-continue-btn:hover { border-color: var(--accent); color: var(--accent); }

    /* ── MODAL: 4-column image row ── */
    #modalImageRow { grid-template-columns: repeat(4,1fr) !important; }

    /* Size chart thumbnail special style */
    .size-chart-slot { position: relative; border-color: rgba(196,150,58,0.3) !important; }
    .size-chart-slot img { object-fit: contain !important; background: #faf7f2; }
    .size-chart-badge {
      position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
      font-size: 0.7rem; line-height: 1;
    }

    /* Hint below image row */
    .modal-size-chart-hint {
      font-size: 0.68rem; color: var(--text-light);
      display: flex; align-items: center; gap: 0.35rem;
      margin-top: -0.4rem; margin-bottom: 0.2rem;
      padding: 0 0.2rem;
    }

    /* ── MODAL SIZE SELECTOR ── */
    .modal-size-section {
      margin-bottom: 1.2rem;
      padding: 0.9rem 1rem;
      background: rgba(196,150,58,0.04);
      border: 1px solid rgba(196,150,58,0.14);
      border-radius: 12px;
    }
    .modal-size-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .modal-size-label {
      font-size: 0.62rem; font-weight: 700; letter-spacing: 2.5px;
      text-transform: uppercase; color: var(--text-muted);
    }
    .modal-size-guide-btn {
      font-size: 0.68rem; font-weight: 600; color: var(--accent);
      background: none; border: none; cursor: pointer;
      display: flex; align-items: center; gap: 0.3rem;
      padding: 0.25rem 0.7rem; border-radius: 50px;
      border: 1px solid rgba(196,150,58,0.25);
      transition: all 0.2s; font-family: var(--font-body);
    }
    .modal-size-guide-btn:hover {
      background: rgba(196,150,58,0.1); border-color: var(--accent);
    }
    .modal-size-btns {
      display: flex; gap: 0.55rem;
    }
    .modal-size-btn {
      width: 44px; height: 44px; border-radius: 10px;
      border: 1.5px solid rgba(61,26,14,0.15);
      background: white; color: var(--accent-3);
      font-family: var(--font-body); font-size: 0.82rem; font-weight: 700;
      cursor: pointer; transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
      display: flex; align-items: center; justify-content: center;
      letter-spacing: 0.5px;
    }
    .modal-size-btn:hover {
      border-color: var(--accent); color: var(--accent); transform: translateY(-2px);
    }
    .modal-size-btn.selected {
      background: var(--accent-3); color: white;
      border-color: var(--accent-3);
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(61,26,14,0.22);
    }
    .modal-size-error {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.72rem; color: var(--accent-2); font-weight: 600;
      margin-top: 0.65rem;
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

    /* Size selector shake animation */
    @keyframes modalSizeShake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px); }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(injectedStyles);

  updateBadges();
  updateHeartButtons();
  renderCartSidebar();

  const header = document.getElementById('topHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
    updateNavOnScroll();
  }, { passive: true });

  /* ── Scroll reveal ── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal-up').forEach(el => revealObs.observe(el));

  /* ── Counter animation ── */
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const target = parseInt(entry.target.getAttribute('data-count'));
      let current = 0;
      const inc   = target / 60;
      const timer = setInterval(() => {
        current += inc;
        if (current >= target) { current = target; clearInterval(timer); }
        entry.target.textContent = Math.floor(current);
      }, 25);
      counterObs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-number').forEach(el => counterObs.observe(el));

  /* ── Hero title stagger ── */
  document.querySelectorAll('.hero-title span').forEach((line, i) => {
    line.style.opacity   = '0';
    line.style.transform = 'translateY(60px)';
    setTimeout(() => {
      line.style.transition = 'all 0.8s cubic-bezier(0.16,1,0.3,1)';
      line.style.opacity    = '1';
      line.style.transform  = 'translateY(0)';
    }, 200 + i * 180);
  });

  /* ── Hero badge fade in ── */
  const heroBadge = document.querySelector('.hero-badge');
  if (heroBadge) {
    heroBadge.style.opacity = '0';
    setTimeout(() => { heroBadge.style.transition = 'opacity 0.6s ease'; heroBadge.style.opacity = '1'; }, 100);
  }

  /* ── Parallax hero cards (desktop) ── */
  const heroCards = document.querySelectorAll('.hero-card');
  window.addEventListener('scroll', () => {
    if (window.innerWidth < 1024) return;
    heroCards.forEach((card, i) => {
      card.style.transform = `translateY(${window.scrollY * (i === 0 ? 0.12 : 0.22)}px)`;
    });
  }, { passive: true });

  /* ── Magnetic buttons (desktop) ── */
  if (window.innerWidth >= 1024) {
    document.querySelectorAll('.btn-glow, .btn-outline, .icon-btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
    });

    document.querySelectorAll('.product-card, .lookbook-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top)  / r.height;
        card.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 10}deg) scale(1.02) translateY(-3px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
      });
    });
  }

  /* ── Smooth anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  /* ── Product cards → modal ── */
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.card-heart-btn') || e.target.closest('.quick-add-btn')) return;
      openModal(card);
    });
  });

  /* ── Heart buttons ── */
  document.querySelectorAll('.card-heart-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFav(btn.dataset.product, btn.dataset.price, btn.dataset.img);
    });
  });

  /* ── Quick-add buttons (opens modal so user picks size) ── */
  document.querySelectorAll('.quick-add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      // Open modal so user can pick size before adding
      const card = btn.closest('.product-card');
      if (card) openModal(card);
    });
  });

  /* ── Modal close ── */
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('productModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('productModalOverlay')) closeModal();
  });

  /* ── Cart button → opens sidebar ── */
  document.getElementById('cartBtn').addEventListener('click', openCartSidebar);

  /* ── Fav button ── */
  document.getElementById('favBtn').addEventListener('click', () => {
    if (!favs.length) showToast('No faves yet — heart a piece! 💜');
    else showToast(`You have ${favs.length} fave(s) 💜`);
  });

  /* ── Escape key ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeCartSidebar(); }
  });

  console.log(
    '%c SAANZÉ. %c ✦ Feel The Vibes ✦',
    'background:#C4963A;color:#3D1A0E;font-size:18px;font-weight:900;padding:10px 20px;border-radius:8px;',
    'color:#C4963A;font-size:13px;padding:10px;'
  );
});