/* ============================================================
   NANCY VUU — theme.js  v2.0.0
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ── SCROLL PROGRESS ───────────────────────────────────────
  var progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', function() {
      var total = document.body.scrollHeight - window.innerHeight;
      progressBar.style.width = (total > 0 ? window.scrollY / total * 100 : 0) + '%';
    }, { passive: true });
  }

  // ── NAVBAR SCROLL SHADOW ──────────────────────────────────
  var navbar = document.querySelector('.site-nav');
  if (navbar) {
    window.addEventListener('scroll', function() {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ── MENU TOGGLE ───────────────────────────────────────────
  window.toggleMenu = function() {
    var menu   = document.getElementById('menu-overlay');
    var toggle = document.getElementById('menu-toggle-btn');
    if (!menu) return;

    var isOpen = !menu.classList.contains('menu-overlay--closed');
    if (isOpen) {
      menu.classList.add('menu-overlay--closed');
      document.body.classList.remove('menu-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    } else {
      menu.classList.remove('menu-overlay--closed');
      document.body.classList.add('menu-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      var closeBtn = document.getElementById('menu-close-btn');
      if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 100);
    }
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var menu = document.getElementById('menu-overlay');
      if (menu && !menu.classList.contains('menu-overlay--closed')) window.toggleMenu();
      closeCart();
      window.closeAudienceModal();
    }
  });

  // ── CART DRAWER ───────────────────────────────────────────
  window.openCart = function() {
    var drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
      var closeBtn = drawer.querySelector('.cart-drawer__close');
      if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 100);
    }
  };

  window.closeCart = function() {
    var drawer = document.getElementById('cart-drawer');
    if (drawer && drawer.getAttribute('aria-hidden') === 'false') {
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
      var toggle = document.getElementById('cart-toggle-btn');
      if (toggle) toggle.focus();
    }
  };

  window.updateCartItem = function(key, qty) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    })
    .then(function(r) { return r.json(); })
    .then(function(cart) {
      updateCartCount(cart.item_count);
      refreshCartDrawer();
    })
    .catch(function(err) { console.error('Cart update error:', err); });
  };

  function updateCartCount(count) {
    var badge = document.getElementById('cart-count');
    if (!badge) return;
    badge.textContent = count;
    badge.classList.toggle('cart-count--hidden', count === 0);
  }

  function refreshCartDrawer() {
    fetch('/?section_id=cart-drawer-items')
      .catch(function() {
        // fallback: reload page on cart update
        window.location.reload();
      });
  }

  // Add to cart with drawer open
  var productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = document.getElementById('add-to-cart-btn');
      if (btn) { btn.textContent = 'Adding…'; btn.disabled = true; }

      var formData = new FormData(productForm);
      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
      .then(function(r) { return r.json(); })
      .then(function() {
        if (btn) { btn.textContent = 'Added!'; }
        return fetch('/cart.js');
      })
      .then(function(r) { return r.json(); })
      .then(function(cart) {
        updateCartCount(cart.item_count);
        window.openCart();
        setTimeout(function() {
          if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }
        }, 1500);
      })
      .catch(function(err) {
        console.error('Add to cart error:', err);
        productForm.submit();
      });
    });
  }

  // ── SCROLL REVEAL ─────────────────────────────────────────
  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) {
    revealObserver.observe(el);
  });

  // ── PILLAR NAV SMOOTH SCROLL ──────────────────────────────
  document.querySelectorAll('.academy-pillar-nav__link[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      var nav = document.querySelector('.academy-pillar-nav');
      var offset = nav ? nav.offsetHeight + 20 : 80;
      window.scrollTo({
        top: target.offsetTop - offset,
        behavior: 'smooth'
      });
    });
  });

  // ── SETH EDEN SPLIT HERO INTERACTION ──────────────────────
  var splitPanels = document.querySelectorAll('.seth-split-hero__panel');
  if (splitPanels.length === 2) {
    splitPanels.forEach(function(panel) {
      panel.addEventListener('mouseenter', function() {
        splitPanels.forEach(function(p) {
          p.style.flex = p === panel ? '1.3' : '0.7';
          var img = p.querySelector('.seth-split-hero__img');
          if (img) img.style.filter = p === panel ? 'grayscale(0%)' : 'grayscale(100%)';
        });
      });
      panel.addEventListener('mouseleave', function() {
        splitPanels.forEach(function(p) {
          p.style.flex = '1';
          var img = p.querySelector('.seth-split-hero__img');
          if (img) img.style.filter = '';
        });
      });
    });
  }

  // ── AUDIENCE MODAL ────────────────────────────────────────
  window.openAudienceModal = function(retreatType) {
    var modal = document.getElementById('audience-modal');
    if (!modal) return;
    if (retreatType) {
      var select = modal.querySelector('select');
      if (select) select.value = retreatType;
    }
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
    document.body.classList.add('menu-open');
  };

  window.closeAudienceModal = function() {
    var modal = document.getElementById('audience-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    document.body.classList.remove('menu-open');
  };

  // ── COLLECTION PAGINATION SCROLL TO TOP ───────────────────
  if (sessionStorage.getItem('paginationScrollTop') === '1') {
    sessionStorage.removeItem('paginationScrollTop');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.pagination__link');
    if (link && link.getAttribute('href') && link.getAttribute('href') !== '#') {
      sessionStorage.setItem('paginationScrollTop', '1');
    }
  });

  // ── PHOTOGRAPHY PARALLAX ───────────────────────────────
  var parallaxSections = document.querySelectorAll('[data-parallax]');
  if (parallaxSections.length) {
    var ticking = false;
    function updateParallax() {
      parallaxSections.forEach(function(section) {
        var factor = parseFloat(section.dataset.parallax) || 0.3;
        var rect = section.getBoundingClientRect();
        var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * factor;
        section.style.setProperty('--py', offset.toFixed(2) + 'px');
      });
      ticking = false;
    }
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  // Delegate [data-audience-open] clicks
  document.addEventListener('click', function(e) {
    var openBtn = e.target.closest('[data-audience-open]');
    if (openBtn) {
      e.preventDefault();
      window.openAudienceModal();
    }
    var closeBtn = e.target.closest('[data-audience-close]');
    if (closeBtn) {
      e.preventDefault();
      window.closeAudienceModal();
    }
  });

});
