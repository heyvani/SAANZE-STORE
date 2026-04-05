// ═══════════════════════════════════════════
// SAANZE — Full Interactive Experience
// ═══════════════════════════════════════════

// ── State ──
let cart = JSON.parse(localStorage.getItem('saanze_cart') || '[]');
let favs = JSON.parse(localStorage.getItem('saanze_favs') || '[]');

// ── Product Data (for search indexing) ──
const PRODUCT_INDEX = [
    {
        name: 'Floral Halter Top',
        keywords: ['floral', 'halter', 'top', 'flower', 'pink', 'trendy', 'summer'],
        section: '#catalogue',
        badge: 'TRENDY🔥',
        price: '₹699',
        img: 'assets/floral_halter_top.jpg'
    },
    {
        name: 'Burgundy Corset Lace-Up',
        keywords: ['burgundy', 'corset', 'lace', 'red', 'fire', 'lace-up', 'corset top'],
        section: '#catalogue',
        badge: 'FIRE 🔥',
        price: '₹799',
        img: 'assets/burgundy_corset_front.jpg'
    },
    {
        name: 'White Crop Shirt',
        keywords: ['white', 'crop', 'shirt', 'clean', 'minimal', 'top', 'white crop'],
        section: '#catalogue',
        badge: 'NEW 🔥',
        price: '₹799',
        img: 'assets/white_crop_shirt.jpg'
    },
    {
        name: 'Lookbook',
        keywords: ['lookbook', 'editorial', 'model', 'styled', 'shoot', 'fashion', 'editorial'],
        section: '#lookbook',
        price: null,
        img: null
    },
    {
        name: 'Pre-order / Place Order',
        keywords: ['order', 'pre-order', 'preorder', 'buy', 'purchase', 'form', 'custom', 'tailor'],
        section: '#order',
        price: null,
        img: null
    }
];

// ── Helpers ──
function saveCart() { localStorage.setItem('saanze_cart', JSON.stringify(cart)); }
function saveFavs()  { localStorage.setItem('saanze_favs',  JSON.stringify(favs)); }

function updateBadges() {
    const totalCart = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cartBadge').textContent = totalCart;
    document.getElementById('favBadge').textContent  = favs.length;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Add to Cart ──
function addToCart(name, price, img) {
    const existing = cart.find(i => i.name === name);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name, price: parseInt(price), img, qty: 1 });
    }
    saveCart();
    updateBadges();
    showToast(name + ' added to bag! 🔥');
}

// ── Add to Favourites ──
function toggleFav(name, price, img) {
    const idx = favs.findIndex(i => i.name === name);
    if (idx > -1) {
        favs.splice(idx, 1);
        showToast(name + ' removed from faves 💔');
    } else {
        favs.push({ name, price: parseInt(price), img });
        showToast(name + ' saved to faves 💜');
    }
    saveFavs();
    updateBadges();
    updateHeartButtons();
}

function updateHeartButtons() {
    document.querySelectorAll('.card-heart-btn').forEach(btn => {
        const name = btn.dataset.product;
        const isFaved = favs.some(f => f.name === name);
        btn.classList.toggle('faved', isFaved);
    });
}

// ── Open Cart in New Tab ──
function openCartTab() {
    if (cart.length === 0) {
        showToast('Your bag is empty 👜');
        return;
    }

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const itemsHTML = cart.map(item => `
        <div style="display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
            <div style="width:70px;height:90px;background:#1a1a1a;border-radius:12px;overflow:hidden;flex-shrink:0;">
                ${item.img ? `<img src="${item.img}" style="width:100%;height:100%;object-fit:cover;" alt="${item.name}">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">👜</div>'}
            </div>
            <div style="flex:1;">
                <div style="font-family:Syne,sans-serif;font-weight:700;font-size:1rem;text-transform:uppercase;letter-spacing:-0.5px;">${item.name}</div>
                <div style="color:#888;font-size:0.8rem;margin-top:4px;">Qty: ${item.qty}</div>
            </div>
            <div style="font-family:Syne,sans-serif;font-weight:800;font-size:1.1rem;color:#c8ff00;">₹${(item.price * item.qty).toLocaleString()}</div>
        </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Bag — SAANZE</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#0a0a0a;color:#fff;font-family:'Space Grotesk',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;}
  .bag-wrap{max-width:540px;width:100%;background:#111;border-radius:24px;border:1px solid rgba(255,255,255,0.07);padding:2.5rem;position:relative;overflow:hidden;}
  .bag-wrap::before{content:'';position:absolute;top:-80px;right:-80px;width:200px;height:200px;background:#c8ff00;border-radius:50%;filter:blur(100px);opacity:0.08;}
  .bag-logo{font-family:Syne,sans-serif;font-size:1.8rem;font-weight:800;letter-spacing:-2px;margin-bottom:0.3rem;}
  .bag-logo span{color:#c8ff00;}
  .bag-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(200,255,0,0.08);border:1px solid rgba(200,255,0,0.2);border-radius:50px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c8ff00;margin-bottom:1.5rem;}
  .bag-items{margin:1.5rem 0;}
  .bag-total-row{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 0;margin-top:0.5rem;}
  .bag-total-label{font-family:Syne,sans-serif;font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;}
  .bag-total-price{font-family:Syne,sans-serif;font-size:2rem;font-weight:800;color:#c8ff00;}
  .bag-note{font-size:0.8rem;color:#555;margin-bottom:1.5rem;line-height:1.5;border-left:2px solid rgba(200,255,0,0.3);padding-left:10px;}
  .bag-btn{display:block;width:100%;padding:1.1rem;background:#c8ff00;color:#000;border:none;border-radius:50px;font-family:Syne,sans-serif;font-size:1rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer;transition:all 0.25s;text-align:center;text-decoration:none;}
  .bag-btn:hover{transform:scale(1.02);box-shadow:0 0 30px rgba(200,255,0,0.3);}
  .bag-continue{display:block;text-align:center;margin-top:1rem;color:#555;font-size:0.85rem;text-decoration:none;transition:color 0.2s;}
  .bag-continue:hover{color:#c8ff00;}
  .empty-state{text-align:center;padding:3rem 0;}
  .empty-icon{font-size:3rem;margin-bottom:1rem;}
</style>
</head>
<body>
<div class="bag-wrap">
  <div class="bag-logo">SAANZE<span>.</span></div>
  <div class="bag-tag">● Your Bag</div>
  <div class="bag-items">${itemsHTML}</div>
  <div class="bag-total-row">
    <span class="bag-total-label">Total</span>
    <span class="bag-total-price">₹${total.toLocaleString()}</span>
  </div>
  <p class="bag-note">Each piece is handcrafted to your measurements. Clicking "Buy Now" takes you to our order form to complete your custom fit details. 💅</p>
  <a class="bag-btn" href="javascript:void(0)" onclick="goToOrder()">Buy Now — Place Order ✦</a>
  <a class="bag-continue" href="javascript:window.close()">← Continue Shopping</a>
</div>
<script>
function goToOrder(){
  window.opener && window.opener.focus();
  try { window.opener.scrollToOrder(); } catch(e) {}
  setTimeout(()=>window.close(), 300);
}
</script>
</body>
</html>`;

    const tab = window.open('', '_blank');
    tab.document.write(html);
    tab.document.close();
}

// ── Scroll to order from cart tab ──
window.scrollToOrder = function() {
    const el = document.getElementById('order');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ── Product Modal ──
function openProductModal(card) {
    const name    = card.dataset.name;
    const price   = card.dataset.price;
    const ogPrice = card.dataset.ogPrice;
    const badge   = card.dataset.badge;
    const reviews = card.dataset.reviews;
    const img     = card.dataset.img;

    // Collect all images for this product (main + up to 3 extras)
    const extraImgs = [card.dataset.img2, card.dataset.img3, card.dataset.img4].filter(Boolean);

    // Set main image
    const mainImgEl = document.getElementById('modalMainImg');
    mainImgEl.src = img;

    // Fill the 3 thumbnail slots dynamically
    const slotsContainer = document.querySelector('.modal-image-slots');
    slotsContainer.innerHTML = '';

    extraImgs.forEach((src, i) => {
        const slot = document.createElement('div');
        slot.className = 'modal-img-slot modal-img-slot--filled';
        slot.innerHTML = `<img src="${src}" alt="View ${i + 2}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
        slot.addEventListener('click', () => {
            // Swap: clicked thumbnail becomes main, main goes to this slot
            const prev = mainImgEl.src;
            mainImgEl.style.opacity = '0';
            setTimeout(() => {
                mainImgEl.src = src;
                mainImgEl.style.opacity = '1';
            }, 180);
            slot.querySelector('img').src = prev;
            // Highlight active slot
            slotsContainer.querySelectorAll('.modal-img-slot').forEach(s => s.classList.remove('active-slot'));
            slot.classList.add('active-slot');
        });
        slotsContainer.appendChild(slot);
    });

    // If fewer than 3 extras, fill remaining with placeholder slots
    for (let i = extraImgs.length; i < 3; i++) {
        const slot = document.createElement('div');
        slot.className = 'modal-img-slot';
        slot.innerHTML = `<span>+ Add Photo</span>`;
        slotsContainer.appendChild(slot);
    }

    // Set text info
    document.getElementById('modalTitle').textContent = name;
    document.getElementById('modalPrice').textContent = price;
    document.getElementById('modalPriceOg').textContent = ogPrice;
    document.getElementById('modalBadge').textContent = badge;
    document.getElementById('modalReviews').textContent = reviews + ' reviews';

    // Wire up buttons
    const priceNum = price.replace(/[₹,]/g, '');
    document.getElementById('modalCartBtn').onclick = () => {
        addToCart(name, priceNum, img);
        closeProductModal();
    };
    document.getElementById('modalFavBtn').onclick = () => {
        toggleFav(name, priceNum, img);
        const isFaved = favs.some(f => f.name === name);
        document.getElementById('modalFavBtn').innerHTML = isFaved
            ? '<i class="fa-solid fa-heart"></i> Saved ✓'
            : '<i class="fa-solid fa-heart"></i> Save to Faves';
    };
    document.getElementById('modalOrderBtn').onclick = () => {
        closeProductModal();
        setTimeout(() => {
            document.getElementById('order').scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
                document.querySelectorAll('.sf-product-pick').forEach(p => {
                    if (p.querySelector('.sf-pname') && p.querySelector('.sf-pname').textContent.trim() === name) {
                        sfSelectProduct(p, name);
                    }
                });
            }, 800);
        }, 300);
    };

    // Fav button state
    const isFaved = favs.some(f => f.name === name);
    document.getElementById('modalFavBtn').innerHTML = isFaved
        ? '<i class="fa-solid fa-heart"></i> Saved ✓'
        : '<i class="fa-solid fa-heart"></i> Save to Faves';

    document.getElementById('productModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ── Search ──
function openSearch() {
    document.getElementById('searchOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('searchInput').focus(), 200);
}

function closeSearch() {
    document.getElementById('searchOverlay').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function doSearch(query) {
    const q = query.toLowerCase().trim();
    const resultsEl = document.getElementById('searchResults');

    if (!q) { resultsEl.innerHTML = ''; return; }

    const hits = PRODUCT_INDEX.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.keywords.some(k => k.includes(q) || q.includes(k))
    );

    if (hits.length === 0) {
        resultsEl.innerHTML = '<div class="search-no-results">No results for "' + query + '" 😔<br><span>Try: corset · white · halter · lookbook</span></div>';
        return;
    }

    resultsEl.innerHTML = hits.map(hit => `
        <div class="search-result-item" onclick="goToSection('${hit.section}')">
            <div class="search-result-img">
                ${hit.img ? `<img src="${hit.img}" alt="${hit.name}">` : '<span>🛍️</span>'}
            </div>
            <div class="search-result-info">
                <div class="search-result-name">${hit.name}</div>
                ${hit.price ? `<div class="search-result-price">${hit.price}</div>` : '<div class="search-result-price" style="color:#888">→ Jump to section</div>'}
            </div>
            <div class="search-result-arrow">→</div>
        </div>
    `).join('');
}

function goToSection(selector) {
    closeSearch();
    setTimeout(() => {
        const el = document.querySelector(selector);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// ── DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {

    // Init badges
    updateBadges();
    updateHeartButtons();

    // ── Custom Cursor ──
    const cursor   = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');

    if (cursor && follower) {
        let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;
        document.addEventListener('mousemove', e => {
            mouseX = e.clientX; mouseY = e.clientY;
            cursor.style.left = mouseX - 6 + 'px';
            cursor.style.top  = mouseY - 6 + 'px';
        });
        function animateFollower() {
            followerX += (mouseX - followerX) * 0.12;
            followerY += (mouseY - followerY) * 0.12;
            follower.style.left = followerX - 20 + 'px';
            follower.style.top  = followerY - 20 + 'px';
            requestAnimationFrame(animateFollower);
        }
        animateFollower();
        const hoverTargets = document.querySelectorAll('a, button, .tilt-card, .icon-btn, .magnetic-btn, .product-card');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => { follower.classList.add('hover'); cursor.style.transform = 'scale(2)'; });
            el.addEventListener('mouseleave', () => { follower.classList.remove('hover'); cursor.style.transform = 'scale(1)'; });
        });
    }

    // ── Magnetic Buttons ──
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top  - r.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
    });

    // ── 3D Tilt Cards ──
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top)  / r.height;
            card.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 12}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)'; });
    });

    // ── Scroll Reveal ──
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

    // ── Navbar scroll ──
    const header = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 100);
    });

    // ── Counter Animation ──
    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                let current = 0;
                const inc = target / 60;
                const timer = setInterval(() => {
                    current += inc;
                    if (current >= target) { current = target; clearInterval(timer); }
                    entry.target.textContent = Math.floor(current);
                }, 25);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-number').forEach(c => counterObserver.observe(c));

    // ── Parallax Hero Cards ──
    const heroCards = document.querySelectorAll('.hero-card');
    window.addEventListener('scroll', () => {
        heroCards.forEach((card, i) => {
            card.style.transform = `translateY(${window.scrollY * (i === 0 ? 0.15 : 0.25)}px)`;
        });
    });

    // ── Hero Title Animation ──
    document.querySelectorAll('.title-line').forEach((line, i) => {
        line.style.opacity = '0';
        line.style.transform = 'translateY(80px)';
        setTimeout(() => {
            line.style.transition = 'all 0.8s cubic-bezier(0.16,1,0.3,1)';
            line.style.opacity = '1';
            line.style.transform = 'translateY(0)';
        }, 300 + i * 200);
    });

    // ══════════════════════════════════════
    // NEW FEATURES
    // ══════════════════════════════════════

    // ── 1. Pre-order link → scroll to form ──
    document.querySelectorAll('.preorder-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.getElementById('order').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // ── 2. Search button ──
    document.getElementById('searchBtn').addEventListener('click', openSearch);
    document.getElementById('searchClose').addEventListener('click', closeSearch);
    document.getElementById('searchOverlay').addEventListener('click', e => {
        if (e.target === document.getElementById('searchOverlay')) closeSearch();
    });
    document.getElementById('searchInput').addEventListener('input', e => doSearch(e.target.value));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeSearch();
            closeProductModal();
        }
    });

    // ── 3. Cart button → open new tab ──
    document.getElementById('cartBtn').addEventListener('click', openCartTab);

    // ── 4. Fav button (navbar) → scroll to first faved product or show toast ──
    document.getElementById('favBtn').addEventListener('click', () => {
        if (favs.length === 0) {
            showToast('No faves yet — heart a piece! 💜');
        } else {
            showToast('You have ' + favs.length + ' fave(s): ' + favs.map(f => f.name).join(', ') + ' 💜');
        }
    });

    // ── 5. Heart buttons on product cards ──
    document.querySelectorAll('.card-heart-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            toggleFav(btn.dataset.product, btn.dataset.price, btn.dataset.img);
        });
    });

    // ── 6. Quick Add (cart) ──
    document.querySelectorAll('.quick-add').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = 'scale(1)', 150);
            addToCart(btn.dataset.product, btn.dataset.price, btn.dataset.img);
        });
    });

    // ── 7. Product card click → open modal ──
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', e => {
            // Don't open modal if clicking heart or quick-add
            if (e.target.closest('.card-heart-btn') || e.target.closest('.quick-add')) return;
            openProductModal(card);
        });
    });

    // ── 8. Modal close ──
    document.getElementById('modalClose').addEventListener('click', closeProductModal);
    document.getElementById('productModalOverlay').addEventListener('click', e => {
        if (e.target === document.getElementById('productModalOverlay')) closeProductModal();
    });

    // ── 9. Smooth scroll for all anchor links ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    console.log('%c SAANZE. %c ✦ Feel The Vibes ✦',
        'background:#c8ff00;color:#000;font-size:20px;font-weight:900;padding:10px 20px;border-radius:8px;',
        'color:#c8ff00;font-size:14px;padding:10px;'
    );
});

// ══════════════════════════════════════
// SAANZE ORDER FORM
// ══════════════════════════════════════
let sfStep = 1;
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
        wrap.innerHTML = sfProduct ? '<span class="sf-selected-tag">' + sfProduct + '</span>' : '';
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

    if (!bust || !waist || !shoulder || !torso) {
        alert('Add all measurements so we can fit it perfectly 📏');
        return;
    }

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
    } catch (err) { console.error('Form error:', err); }

    document.getElementById('sf-p3').classList.remove('active');
    document.getElementById('sf-s3').classList.remove('active');
    document.getElementById('sf-s3').classList.add('done');
    document.getElementById('sf-psuccess').classList.add('active');
    document.getElementById('sf-success-msg').textContent =
        'Your ' + sfProduct + ' order is in! We\'ll confirm via WhatsApp / email soon. Stay iconic 💜';

    // Clear cart after successful order
    cart = [];
    saveCart();
    updateBadges();
}