// ═══════════════════════════════════════════════════════
//  SAANZÉ — SCRIPT.JS
//  Full interactive experience — cart, favs, modal, forms
// ═══════════════════════════════════════════════════════

/* ── State ── */
let cart = JSON.parse(localStorage.getItem('saanze_cart') || '[]');
let favs = JSON.parse(localStorage.getItem('saanze_favs') || '[]');

/* ── Persist ── */
function saveCart() { localStorage.setItem('saanze_cart', JSON.stringify(cart)); }
function saveFavs()  { localStorage.setItem('saanze_favs',  JSON.stringify(favs)); }

/* ══════════════════════════════════════════
   BADGES & TOAST
   ══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   CART
   ══════════════════════════════════════════ */
function addToCart(name, price, img) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; }
  else { cart.push({ name, price: parseInt(price), img, qty: 1 }); }
  saveCart();
  updateBadges();
  showToast(name + ' added to bag! 🔥');
}

/* ── Cart page (opens new tab) ── */
function openCartTab() {
  if (!cart.length) { showToast('Your bag is empty 👜'); return; }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const itemsHTML = cart.map(item => `
    <div style="display:flex;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid rgba(196,150,58,.12);">
      <div style="width:60px;height:76px;background:#EDE5D8;border-radius:10px;overflow:hidden;flex-shrink:0;">
        ${item.img
          ? `<img src="${item.img}" style="width:100%;height:100%;object-fit:cover;" alt="${item.name}">`
          : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;">👜</div>'
        }
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#3D1A0E;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name}</div>
        <div style="font-size:.72rem;color:#B89880;letter-spacing:1px;text-transform:uppercase;">Qty: ${item.qty}</div>
      </div>
      <div style="font-family:'Cormorant Garamond',serif;font-weight:700;font-size:1.2rem;color:#C4963A;">₹${(item.price * item.qty).toLocaleString()}</div>
    </div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Bag — SAANZÉ</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#FAF7F2;color:#1C0D08;padding:1.5rem;min-height:100vh;display:flex;align-items:center;justify-content:center;}
.wrap{max-width:480px;width:100%;background:#fff;border-radius:20px;border:1px solid rgba(196,150,58,.18);box-shadow:0 20px 60px rgba(61,26,14,.1);padding:2rem;position:relative;overflow:hidden;}
.wrap::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#3D1A0E,#C4963A,#8B2635);}
.logo{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:700;letter-spacing:3px;color:#3D1A0E;text-transform:uppercase;margin-bottom:.2rem;}
.tag{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:#C4963A;margin-bottom:1.5rem;display:block;}
.divider{height:1px;background:linear-gradient(90deg,transparent,rgba(196,150,58,.25),transparent);margin:.5rem 0;}
.total-row{display:flex;justify-content:space-between;align-items:center;padding:.8rem 0 .4rem;}
.total-label{font-size:.7rem;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#B89880;}
.total-price{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;color:#3D1A0E;}
.savings{font-size:.72rem;color:#8B2635;font-weight:600;padding:.2rem 0 .8rem;display:none;}
.promo-wrap{margin:.8rem 0 1.2rem;display:flex;gap:8px;}
.promo-input{flex:1;padding:10px 14px;border:1.5px solid rgba(196,150,58,.25);border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.82rem;background:#FAF7F2;color:#1C0D08;outline:none;transition:border-color .25s;}
.promo-input:focus{border-color:#C4963A;}
.promo-input::placeholder{color:#B89880;}
.promo-btn{padding:10px 18px;background:#3D1A0E;color:#FAF7F2;border:none;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:background .25s;}
.promo-btn:hover{background:#8B2635;}
.promo-msg{font-size:.74rem;margin:-.6rem 0 .8rem;padding-left:4px;}
.promo-msg.success{color:#2a7a2a;}
.promo-msg.error{color:#8B2635;}
.note{font-size:.76rem;color:#B89880;margin-bottom:1.4rem;line-height:1.6;border-left:2px solid rgba(196,150,58,.3);padding-left:10px;}
.btn{display:flex;align-items:center;justify-content:center;width:100%;padding:1rem;background:#3D1A0E;color:#FAF7F2;border:none;border-radius:50px;font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;text-decoration:none;margin-bottom:.8rem;font-family:'DM Sans',sans-serif;}
.btn:hover{background:#8B2635;}
.btn2{display:flex;align-items:center;justify-content:center;width:100%;padding:.9rem;border:1.5px solid rgba(61,26,14,.15);border-radius:50px;font-size:.8rem;font-weight:500;color:#7A5C4A;cursor:pointer;text-decoration:none;font-family:'DM Sans',sans-serif;}
.btn2:hover{border-color:#C4963A;color:#C4963A;}
</style>
</head><body>
<div class="wrap">
  <div class="logo">SAANZÉ<span style="color:#C4963A">.</span></div>
  <span class="tag">Your Bag</span>
  ${itemsHTML}
  <div class="divider"></div>
  <div class="total-row">
    <span class="total-label">Total</span>
    <span class="total-price" id="displayTotal">₹${total.toLocaleString()}</span>
  </div>
  <p class="savings" id="savingsMsg">You saved ₹100 with your promo code! 🎉</p>

  <div class="promo-wrap">
    <input class="promo-input" id="promoInput" placeholder="Enter promo code…" autocomplete="off">
    <button class="promo-btn" onclick="applyPromo()">Apply</button>
  </div>
  <p class="promo-msg" id="promoMsg"></p>

  <p class="note">Each piece is handcrafted to your measurements. Tapping "Buy Now" takes you to the order form. 💅</p>
  <a class="btn" href="javascript:void(0)" onclick="goOrder()">Buy Now — Place Order ✦</a>
  <a class="btn2" href="javascript:window.close()">← Continue Shopping</a>
</div>
<script>
var baseTotal = ${total};
var discounted = false;

function applyPromo() {
  var code = document.getElementById('promoInput').value.trim();
  var msg = document.getElementById('promoMsg');
  var totalEl = document.getElementById('displayTotal');
  var savingsEl = document.getElementById('savingsMsg');

  if (discounted) {
    msg.textContent = 'Promo code already applied! 💜';
    msg.className = 'promo-msg error';
    return;
  }

  if (code.toLowerCase() === 'hotgirlswearsaanze2026') {
    var newTotal = Math.max(0, baseTotal - 100);
    totalEl.textContent = '₹' + newTotal.toLocaleString();
    savingsEl.style.display = 'block';
    msg.textContent = 'Code applied! ₹100 off your order 🔥';
    msg.className = 'promo-msg success';
    discounted = true;
    document.getElementById('promoInput').disabled = true;
  } else {
    msg.textContent = 'Invalid promo code. Try again! ✦';
    msg.className = 'promo-msg error';
  }
}

document.getElementById('promoInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') applyPromo();
});

function goOrder(){
  if(window.opener){
    window.opener.focus();
    try{ window.opener.document.getElementById('order').scrollIntoView({behavior:'smooth'}); }catch(e){}
  }
  setTimeout(()=>window.close(), 300);
}
<\/script>
</body></html>`;

  const tab = window.open('', '_blank');
  tab.document.write(html);
  tab.document.close();
}

/* ══════════════════════════════════════════
   FAVOURITES
   ══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   BOTTOM NAV
   ══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   PRODUCT MODAL
   ══════════════════════════════════════════ */
function openModal(card) {
  const name     = card.dataset.name;
  const price    = card.dataset.price;
  const ogPrice  = card.dataset.ogPrice;
  const badge    = card.dataset.badge;
  const reviews  = card.dataset.reviews;
  const img      = card.dataset.img;
  const extraImgs = [card.dataset.img2, card.dataset.img3].filter(Boolean);

  /* Main image */
  const mainImg = document.getElementById('modalMainImg');
  mainImg.src = img;

  /* Thumbnail row */
  const row = document.getElementById('modalImageRow');
  row.innerHTML = '';
  [img, ...extraImgs].slice(0, 3).forEach((src, i) => {
    const slot = document.createElement('div');
    slot.className = 'modal-img-slot' + (i === 0 ? ' active-slot' : '');
    slot.innerHTML = `<img src="${src}" alt="view ${i + 1}">`;
    slot.addEventListener('click', () => {
      mainImg.style.opacity = '0';
      setTimeout(() => { mainImg.src = src; mainImg.style.opacity = '1'; }, 180);
      row.querySelectorAll('.modal-img-slot').forEach(s => s.classList.remove('active-slot'));
      slot.classList.add('active-slot');
    });
    row.appendChild(slot);
  });

  /* Fill details */
  document.getElementById('modalTitle').textContent    = name;
  document.getElementById('modalPrice').textContent    = price;
  document.getElementById('modalPriceOg').textContent  = ogPrice;
  document.getElementById('modalBadge').textContent    = badge;
  document.getElementById('modalReviews').textContent  = reviews + ' reviews';

  const priceNum = price.replace(/[₹,]/g, '');

  /* Buttons */
  document.getElementById('modalCartBtn').onclick = () => { addToCart(name, priceNum, img); closeModal(); };

  document.getElementById('modalFavBtn').onclick = () => {
    toggleFav(name, priceNum, img);
    const isFaved = favs.some(f => f.name === name);
    document.getElementById('modalFavBtn').innerHTML = isFaved
      ? '<i class="fa-solid fa-heart"></i> Saved ✓'
      : '<i class="fa-solid fa-heart"></i> Save';
  };

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

  /* Fav state */
  const isFaved = favs.some(f => f.name === name);
  document.getElementById('modalFavBtn').innerHTML = isFaved
    ? '<i class="fa-solid fa-heart"></i> Saved ✓'
    : '<i class="fa-solid fa-heart"></i> Save';

  /* Open overlay */
  document.getElementById('productModalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════
   ORDER FORM (multi-step)
   ══════════════════════════════════════════ */
let sfStep    = 1;
let sfProduct = '';

function sfGoTo(n) {
  if (n === 2 && !sfValidate1()) return;
  if (n === 3 && !sfProduct) { alert('Pick a piece first 🛍️'); return; }

  const prevPanel = document.getElementById('sf-p'  + sfStep);
  const prevStep  = document.getElementById('sf-s'  + sfStep);
  if (prevPanel) prevPanel.classList.remove('active');
  if (prevStep)  { prevStep.classList.remove('active'); prevStep.classList.add('done'); }

  sfStep = n;
  const nextPanel = document.getElementById('sf-p' + n);
  const nextStep  = document.getElementById('sf-s' + n);
  if (nextPanel) nextPanel.classList.add('active');
  if (nextStep)  { nextStep.classList.remove('done'); nextStep.classList.add('active'); }

  if (n === 3) {
    const wrap = document.getElementById('sf-selected-tag-wrap');
    wrap.innerHTML = sfProduct
      ? `<span class="sf-selected-tag">${sfProduct}</span>`
      : '';
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

async function sfSubmit() {
  const bust     = document.getElementById('sf-bust').value;
  const waist    = document.getElementById('sf-waist').value;
  const shoulder = document.getElementById('sf-shoulder').value;
  const torso    = document.getElementById('sf-torso').value;
  if (!bust || !waist || !shoulder || !torso) { alert('Add all measurements 📏'); return; }

  try {
    await fetch('https://formspree.io/f/mwvwwvkb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    document.getElementById('sf-name').value,
        email:   document.getElementById('sf-email').value,
        phone:   document.getElementById('sf-phone').value,
        address: document.getElementById('sf-addr').value,
        product: sfProduct,
        bust, waist, shoulder, torso
      })
    });
  } catch (err) { console.error('Order form error:', err); }

  /* Transition to success */
  document.getElementById('sf-p3').classList.remove('active');
  document.getElementById('sf-s3').classList.remove('active');
  document.getElementById('sf-s3').classList.add('done');
  document.getElementById('sf-psuccess').classList.add('active');
  document.getElementById('sf-success-msg').textContent =
    `Your ${sfProduct} order is in! We'll confirm via WhatsApp soon. Stay iconic 💜`;

  cart = []; saveCart(); updateBadges();
}

/* ══════════════════════════════════════════
   EARN / AFFILIATE FORM  (Formspree)
   ══════════════════════════════════════════ */
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
    /* ── FORMSPREE: affiliate application ── */
    const res = await fetch('https://formspree.io/f/mwvwwvkb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject:    'New Saanzé Affiliate Application 💸',
        form_type:   'affiliate_onboarding',
        name,
        age,
        email,
        phone:      '+91 ' + phone,
        gender:      earnGender,
        city,
        platforms:   earnPlatforms.join(', ') || 'Not specified'
      })
    });
    if (!res.ok) throw new Error('Network response was not ok');
  } catch (err) {
    console.error('Earn form error:', err);
  }

  /* Show success state */
  const formBody  = document.getElementById('earn-form-body');
  const successEl = document.getElementById('earn-success');
  if (formBody)  formBody.style.display  = 'none';
  if (successEl) successEl.style.display = 'block';
  const msgEl = document.getElementById('earn-success-msg');
  if (msgEl) msgEl.textContent =
    `Hey ${name}! We've got your application 🎉 Expect a WhatsApp message soon. Stay iconic 💜`;
}

/* ══════════════════════════════════════════
   DOM READY — wire everything up
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  updateBadges();
  updateHeartButtons();

  /* ── Top header shadow on scroll ── */
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
      let current  = 0;
      const inc    = target / 60;
      const timer  = setInterval(() => {
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
    line.style.opacity  = '0';
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

  /* ── Parallax on hero cards (desktop only) ── */
  const heroCards = document.querySelectorAll('.hero-card');
  window.addEventListener('scroll', () => {
    if (window.innerWidth < 1024) return;
    heroCards.forEach((card, i) => {
      card.style.transform = `translateY(${window.scrollY * (i === 0 ? 0.12 : 0.22)}px)`;
    });
  }, { passive: true });

  /* ── Magnetic buttons (desktop only) ── */
  if (window.innerWidth >= 1024) {
    document.querySelectorAll('.btn-glow, .btn-outline, .icon-btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
    });

    /* 3D tilt on product cards */
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

  /* ── Quick-add buttons ── */
  document.querySelectorAll('.quick-add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.style.transform = 'scale(0.93)';
      setTimeout(() => { btn.style.transform = 'scale(1)'; }, 150);
      addToCart(btn.dataset.product, btn.dataset.price, btn.dataset.img);
    });
  });

  /* ── Modal close ── */
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('productModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('productModalOverlay')) closeModal();
  });

  /* ── Cart & fav icon buttons ── */
  document.getElementById('cartBtn').addEventListener('click', openCartTab);
  document.getElementById('favBtn').addEventListener('click', () => {
    if (!favs.length) showToast('No faves yet — heart a piece! 💜');
    else showToast(`You have ${favs.length} fave(s) 💜`);
  });

  /* ── Escape key ── */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ── Console brand ── */
  console.log(
    '%c SAANZÉ. %c ✦ Feel The Vibes ✦',
    'background:#C4963A;color:#3D1A0E;font-size:18px;font-weight:900;padding:10px 20px;border-radius:8px;',
    'color:#C4963A;font-size:13px;padding:10px;'
  );
});