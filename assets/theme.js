/* ============================================================
   NANCY VUU — theme.js  v2.0.0
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ── CUSTOM CURSOR ─────────────────────────────────────────
  var cursor     = document.getElementById('cursor');
  var cursorRing = document.getElementById('cursor-ring');

  if (cursor && cursorRing) {
    var mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top  = mouseY + 'px';

      var el = document.elementFromPoint(mouseX, mouseY);
      var isDark = el && el.closest('[data-dark]');
      cursor.classList.toggle('on-dark', !!isDark);
      cursorRing.classList.toggle('on-dark', !!isDark);
    });

    (function animateCursor() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top  = ringY + 'px';
      requestAnimationFrame(animateCursor);
    })();

    document.querySelectorAll('a, button').forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        cursor.classList.add('is-hovering');
        cursorRing.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', function() {
        cursor.classList.remove('is-hovering');
        cursorRing.classList.remove('is-hovering');
      });
    });
  }

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

});
