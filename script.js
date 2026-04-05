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
        <div style="display:flex;align-items:center;gap:16px;padding:18px 0;border-bottom:1px solid rgba(196,150,58,0.12);">
            <div style="width:68px;height:86px;background:#EDE5D8;border-radius:12px;overflow:hidden;flex-shrink:0;border:1px solid rgba(196,150,58,0.15);">
                ${item.img
                    ? `<img src="${item.img}" style="width:100%;height:100%;object-fit:cover;" alt="${item.name}">`
                    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">👜</div>`
                }
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.5px;color:#3D1A0E;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
                <div style="font-size:0.75rem;color:#B89880;letter-spacing:1px;text-transform:uppercase;">Qty: ${item.qty}</div>
            </div>
            <div style="font-family:'Cormorant Garamond',serif;font-weight:700;font-size:1.25rem;color:#C4963A;flex-shrink:0;">₹${(item.price * item.qty).toLocaleString()}</div>
        </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Bag — SAANZÉ</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    min-height: 100vh;
    background: #FAF7F2;
    font-family: 'DM Sans', sans-serif;
    color: #1C0D08;
  }
  body {
    display: flex; align-items: center; justify-content: center;
    padding: 2rem;
    background-image:
      radial-gradient(ellipse 600px 400px at 80% -10%, rgba(196,150,58,0.09) 0%, transparent 70%),
      radial-gradient(ellipse 400px 400px at -5% 80%, rgba(139,38,53,0.07) 0%, transparent 70%);
  }

  .bag-wrap {
    max-width: 520px; width: 100%;
    background: #fff;
    border-radius: 24px;
    border: 1px solid rgba(196,150,58,0.18);
    box-shadow: 0 24px 80px rgba(61,26,14,0.1), 0 2px 8px rgba(196,150,58,0.08);
    padding: 2.5rem;
    position: relative; overflow: hidden;
  }

  /* top accent bar */
  .bag-wrap::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3D1A0E 0%, #C4963A 40%, #D4B87A 60%, #8B2635 100%);
  }

  /* subtle grain */
  .bag-wrap::after {
    content: '';
    position: absolute; inset: 0; pointer-events: none; border-radius: 24px;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .bag-header {
    display: flex; align-items: center; gap: 0.8rem;
    margin-bottom: 0.5rem;
  }
  .bag-logo-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 700;
    letter-spacing: 3px; text-transform: uppercase;
    color: #3D1A0E;
    line-height: 1;
  }
  .bag-logo-dot { color: #C4963A; }

  .bag-tagline {
    font-size: 0.62rem; letter-spacing: 2.5px; text-transform: uppercase;
    color: #C4963A; font-weight: 500; margin-bottom: 1.5rem;
  }

  .bag-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(196,150,58,0.08); border: 1px solid rgba(196,150,58,0.22);
    border-radius: 50px; padding: 5px 14px;
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
    color: #C4963A; margin-bottom: 1.5rem;
  }
  .bag-pill-dot {
    width: 6px; height: 6px; background: #C4963A; border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

  .bag-items { margin-bottom: 0.5rem; }

  .bag-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(196,150,58,0.25), transparent);
    margin: 0.5rem 0;
  }

  .bag-total-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1.2rem 0;
  }
  .bag-total-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; color: #B89880;
  }
  .bag-total-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.2rem; font-weight: 700; color: #3D1A0E;
  }
  .bag-total-price span { color: #C4963A; }

  .bag-note {
    font-size: 0.78rem; color: #B89880; margin-bottom: 1.5rem; line-height: 1.6;
    border-left: 2px solid rgba(196,150,58,0.3); padding-left: 12px;
  }

  .bag-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    width: 100%; padding: 1.1rem 2rem;
    background: #3D1A0E; color: #FAF7F2;
    border: none; border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1.5px;
    cursor: pointer; text-decoration: none; text-align: center;
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    position: relative; overflow: hidden;
  }
  .bag-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, #C4963A, #8B2635);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .bag-btn:hover::before { opacity: 1; }
  .bag-btn span { position: relative; z-index: 1; }
  .bag-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(61,26,14,0.25); }

  .bag-btn-outline {
    display: flex; align-items: center; justify-content: center;
    width: 100%; padding: 0.9rem 2rem; margin-top: 0.8rem;
    background: transparent;
    border: 1.5px solid rgba(61,26,14,0.15); border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem; font-weight: 500;
    color: #7A5C4A; letter-spacing: 0.5px;
    cursor: pointer; text-decoration: none; text-align: center;
    transition: all 0.25s;
  }
  .bag-btn-outline:hover { border-color: #C4963A; color: #C4963A; }

  .bag-empty {
    text-align: center; padding: 3rem 0;
  }
  .bag-empty-icon { font-size: 3rem; margin-bottom: 1rem; }
  .bag-empty-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1px;
    color: #B89880;
  }
</style>
</head>
<body>
<div class="bag-wrap">
  <div class="bag-header">
    <span class="bag-logo-text">SAANZÉ<span class="bag-logo-dot">.</span></span>
  </div>
  <div class="bag-tagline">Feel The Vibes</div>

  <div class="bag-pill">
    <span class="bag-pill-dot"></span>
    Your Bag
  </div>

  <div class="bag-items">${itemsHTML}</div>

  <div class="bag-divider"></div>

  <div class="bag-total-row">
    <span class="bag-total-label">Total</span>
    <span class="bag-total-price">₹<span>${total.toLocaleString()}</span></span>
  </div>

  <p class="bag-note">Each piece is handcrafted to your measurements. "Buy Now" takes you to our order form to complete your custom fit. 💅</p>

  <a class="bag-btn" href="javascript:void(0)" onclick="goToOrder()">
    <span>Buy Now — Place Order ✦</span>
  </a>
  <a class="bag-btn-outline" href="javascript:window.close()">← Continue Shopping</a>
</div>

<script>
function goToOrder() {
  window.opener && window.opener.focus();
  try { window.opener.scrollToOrder(); } catch(e) {}
  setTimeout(() => window.close(), 300);
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

    const extraImgs = [card.dataset.img2, card.dataset.img3, card.dataset.img4].filter(Boolean);

    const mainImgEl = document.getElementById('modalMainImg');
    mainImgEl.src = img;

    const slotsContainer = document.querySelector('.modal-image-slots');
    slotsContainer.innerHTML = '';

    extraImgs.forEach((src, i) => {
        const slot = document.createElement('div');
        slot.className = 'modal-img-slot modal-img-slot--filled';
        slot.innerHTML = `<img src="${src}" alt="View ${i + 2}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
        slot.addEventListener('click', () => {
            const prev = mainImgEl.src;
            mainImgEl.style.opacity = '0';
            setTimeout(() => {
                mainImgEl.src = src;
                mainImgEl.style.opacity = '1';
            }, 180);
            slot.querySelector('img').src = prev;
            slotsContainer.querySelectorAll('.modal-img-slot').forEach(s => s.classList.remove('active-slot'));
            slot.classList.add('active-slot');
        });
        slotsContainer.appendChild(slot);
    });

    for (let i = extraImgs.length; i < 3; i++) {
        const slot = document.createElement('div');
        slot.className = 'modal-img-slot';
        slot.innerHTML = `<span>+ Add Photo</span>`;
        slotsContainer.appendChild(slot);
    }

    document.getElementById('modalTitle').textContent = name;
    document.getElementById('modalPrice').textContent = price;
    document.getElementById('modalPriceOg').textContent = ogPrice;
    document.getElementById('modalBadge').textContent = badge;
    document.getElementById('modalReviews').textContent = reviews + ' reviews';

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
                ${hit.price ? `<div class="search-result-price">${hit.price}</div>` : '<div class="search-result-price" style="color:#B89880">→ Jump to section</div>'}
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

    // ── Pre-order link ──
    document.querySelectorAll('.preorder-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.getElementById('order').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // ── Search ──
    document.getElementById('searchBtn').addEventListener('click', openSearch);
    document.getElementById('searchClose').addEventListener('click', closeSearch);
    document.getElementById('searchOverlay').addEventListener('click', e => {
        if (e.target === document.getElementById('searchOverlay')) closeSearch();
    });
    document.getElementById('searchInput').addEventListener('input', e => doSearch(e.target.value));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeSearch(); closeProductModal(); }
    });

    // ── Cart ──
    document.getElementById('cartBtn').addEventListener('click', openCartTab);

    // ── Favs ──
    document.getElementById('favBtn').addEventListener('click', () => {
        if (favs.length === 0) {
            showToast('No faves yet — heart a piece! 💜');
        } else {
            showToast('You have ' + favs.length + ' fave(s): ' + favs.map(f => f.name).join(', ') + ' 💜');
        }
    });

    // ── Heart buttons ──
    document.querySelectorAll('.card-heart-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            toggleFav(btn.dataset.product, btn.dataset.price, btn.dataset.img);
        });
    });

    // ── Quick Add ──
    document.querySelectorAll('.quick-add').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = 'scale(1)', 150);
            addToCart(btn.dataset.product, btn.dataset.price, btn.dataset.img);
        });
    });

    // ── Product card → modal ──
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('.card-heart-btn') || e.target.closest('.quick-add')) return;
            openProductModal(card);
        });
    });

    // ── Modal close ──
    document.getElementById('modalClose').addEventListener('click', closeProductModal);
    document.getElementById('productModalOverlay').addEventListener('click', e => {
        if (e.target === document.getElementById('productModalOverlay')) closeProductModal();
    });

    // ── Smooth scroll anchors ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    console.log('%c SAANZÉ. %c ✦ Feel The Vibes ✦',
        'background:#C4963A;color:#3D1A0E;font-size:18px;font-weight:900;padding:10px 20px;border-radius:8px;',
        'color:#C4963A;font-size:13px;padding:10px;'
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

    cart = [];
    saveCart();
    updateBadges();
}