// ═══════════════════════════════════════════
// LOCO — Gen-Z Interactive Experience
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

    // ─── Custom Cursor ───
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');

    if (cursor && follower) {
        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX - 6 + 'px';
            cursor.style.top = mouseY - 6 + 'px';
        });

        // Smooth follower
        function animateFollower() {
            followerX += (mouseX - followerX) * 0.12;
            followerY += (mouseY - followerY) * 0.12;
            follower.style.left = followerX - 20 + 'px';
            follower.style.top = followerY - 20 + 'px';
            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        // Hover states for interactive elements
        const hoverTargets = document.querySelectorAll('a, button, .tilt-card, .icon-btn, .magnetic-btn, .product-card');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => {
                follower.classList.add('hover');
                cursor.style.transform = 'scale(2)';
            });
            el.addEventListener('mouseleave', () => {
                follower.classList.remove('hover');
                cursor.style.transform = 'scale(1)';
            });
        });
    }

    // ─── Magnetic Buttons ───
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });

    // ─── 3D Tilt Cards ───
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rotateX = (0.5 - y) * 12;
            const rotateY = (x - 0.5) * 12;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    // ─── Scroll Reveal ───
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-up').forEach(el => {
        revealObserver.observe(el);
    });

    // ─── Navbar Hide/Show on Scroll ───
    let lastScroll = 0;
    const header = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    });

    // ─── Counter Animation ───
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                let current = 0;
                const increment = target / 60;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    entry.target.textContent = Math.floor(current);
                }, 25);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    // ─── Quick Add Toast ───
    const quickAddBtns = document.querySelectorAll('.quick-add');
    const toast = document.getElementById('toast');

    quickAddBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // ripple
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = 'scale(1)', 150);

            // toast
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        });
    });

    // ─── Smooth Scroll ───
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ─── Parallax Hero Cards on Scroll ───
    const heroCards = document.querySelectorAll('.hero-card');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        heroCards.forEach((card, i) => {
            const speed = i === 0 ? 0.15 : 0.25;
            card.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });

    // ─── Hero Title Letter Animation ───
    const titleLines = document.querySelectorAll('.title-line');
    titleLines.forEach((line, i) => {
        line.style.opacity = '0';
        line.style.transform = 'translateY(80px)';
        setTimeout(() => {
            line.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            line.style.opacity = '1';
            line.style.transform = 'translateY(0)';
        }, 300 + i * 200);
    });

    console.log('%c LOCO. %c ✦ Feel The Vibes ✦', 
        'background: #c8ff00; color: #000; font-size: 20px; font-weight: 900; padding: 10px 20px; border-radius: 8px;',
        'color: #c8ff00; font-size: 14px; padding: 10px;'
    );
});
